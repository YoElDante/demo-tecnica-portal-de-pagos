/**
 * Servicio de Pagos
 * Gestiona la confirmación de pagos y actualización de deudas
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-12-16
 */

const { ClientesCtaCte, sequelize } = require('../models/model.index');
const { Op } = require('sequelize');

/**
 * Verifica si un pago ya fue procesado (idempotencia)
 * @param {string} paymentId - ID del pago de MercadoPago
 * @returns {Promise<boolean>} true si ya existe, false si no
 */
const verificarPagoExistente = async (paymentId) => {
  const existe = await ClientesCtaCte.findOne({
    where: {
      NRO_OPERACION: paymentId.toString(),
      CodMovim: 'D' // Buscar en registros de cobro
    },
    raw: true
  });
  return !!existe;
};

/**
 * Obtiene una deuda por su IdTrans
 * @param {number} idTrans - ID de la transacción
 * @returns {Promise<Object|null>} Registro de la deuda
 */
const obtenerDeudaPorId = async (idTrans) => {
  return await ClientesCtaCte.findOne({
    where: { IdTrans: idTrans },
    raw: true
  });
};

/**
 * Genera el detalle del pago en formato estándar
 * @param {Object} deuda - Registro de deuda original
 * @returns {string} Detalle formateado "PAGO YYYY CCC XXXX"
 */
const generarDetallePago = (deuda) => {
  const anio = deuda.ANO_CUOTA || '0000';
  const cuota = String(deuda.NRO_CUOTA || 0).padStart(3, '0');
  const tipo = deuda.TIPO_BIEN || 'xxxx';
  return `PAGO ${anio} ${cuota} ${tipo}`;
};

/**
 * Genera el número de pago basado en payment_id de MercadoPago
 * @param {string|number} paymentId - ID del pago de MercadoPago
 * @returns {number} Número de pago (últimos 9 dígitos)
 */
const generarNumeroPago = (paymentId) => {
  const paymentStr = paymentId.toString();
  // Usar los últimos 9 dígitos para evitar overflow de INT
  return parseInt(paymentStr.slice(-9)) || parseInt(paymentStr);
};

/**
 * Actualiza una deuda como pagada
 * @param {number} idTrans - ID de la transacción a actualizar
 * @param {Object} datosPago - Datos del pago de MercadoPago
 * @param {number} numeroPago - Número secuencial de pago
 * @param {Object} transaction - Transacción de Sequelize
 */
const actualizarDeudaComoPagada = async (idTrans, datosPago, numeroPago, transaction) => {
  const fechaPago = datosPago.date_approved ? new Date(datosPago.date_approved) : new Date();
  const ejercicioActual = new Date().getFullYear().toString();

  await ClientesCtaCte.update({
    Saldo: 0,
    EsPago: 1,
    FechaPago: fechaPago,
    NumeroPago: numeroPago,
    NRO_OPERACION: datosPago.payment_id.toString(),
    Ejercicio: ejercicioActual
  }, {
    where: { IdTrans: idTrans },
    transaction
  });
};

/**
 * Crea el registro de cobro (contrapartida contable)
 * @param {Object} deudaOriginal - Registro de deuda original
 * @param {Object} datosPago - Datos del pago de MercadoPago
 * @param {number} numeroPago - Número secuencial de pago
 * @param {number} montoCobrado - Monto efectivamente cobrado (con intereses)
 * @param {Object} transaction - Transacción de Sequelize
 * @returns {Promise<Object>} Registro de cobro creado
 */
const crearRegistroCobro = async (deudaOriginal, datosPago, numeroPago, montoCobrado, transaction) => {
  const fechaPago = datosPago.date_approved ? new Date(datosPago.date_approved) : new Date();
  const ejercicioActual = new Date().getFullYear().toString();

  return await ClientesCtaCte.create({
    Codigo: deudaOriginal.Codigo,
    Fecha: fechaPago,
    CodMovim: 'D', // DEBE = Cobro
    Detalle: generarDetallePago(deudaOriginal),
    Importe: montoCobrado,
    Saldo: 0,
    TipoMovim: 'RR', // Recibo/Recaudación
    FechaPago: fechaPago,
    EsPago: 1,
    NumeroPago: numeroPago,
    NRO_OPERACION: datosPago.payment_id.toString(),
    TIPO_BIEN: deudaOriginal.TIPO_BIEN,
    ANO_CUOTA: deudaOriginal.ANO_CUOTA,
    NRO_CUOTA: deudaOriginal.NRO_CUOTA,
    ID_BIEN: deudaOriginal.ID_BIEN,
    Ejercicio: ejercicioActual,
    CuentaContable: deudaOriginal.CuentaContable || '1101'
  }, { transaction });
};

/**
 * Confirma un pago de MercadoPago y actualiza la base de datos
 * @param {Object} datosPago - Datos recibidos del webhook
 * @param {string} datosPago.payment_id - ID del pago en MercadoPago
 * @param {string} datosPago.status - Estado del pago (approved, rejected, pending)
 * @param {string} datosPago.external_reference - Referencia externa
 * @param {number} datosPago.transaction_amount - Monto total de la transacción
 * @param {string} datosPago.date_approved - Fecha de aprobación
 * @param {Object} datosPago.metadata - Metadata con conceptos_ids
 * @returns {Promise<Object>} Resultado de la operación
 */
const confirmarPago = async (datosPago) => {
  // Validar datos requeridos
  if (!datosPago.payment_id) {
    throw new Error('payment_id es requerido');
  }

  if (!datosPago.metadata?.conceptos_ids || !Array.isArray(datosPago.metadata.conceptos_ids)) {
    throw new Error('metadata.conceptos_ids es requerido y debe ser un array');
  }

  const { payment_id, status, metadata, transaction_amount } = datosPago;
  const conceptosIds = metadata.conceptos_ids;

  // Solo procesar pagos aprobados
  if (status !== 'approved') {
    console.log(`[Pagos] Pago ${payment_id} con estado ${status}, no se procesa`);
    return {
      received: true,
      processed: false,
      reason: `Estado del pago: ${status}`
    };
  }

  // Verificar idempotencia
  const yaExiste = await verificarPagoExistente(payment_id);
  if (yaExiste) {
    console.log(`[Pagos] Pago ${payment_id} ya fue procesado anteriormente`);
    return {
      received: true,
      processed: false,
      already_processed: true,
      reason: 'Pago ya procesado anteriormente'
    };
  }

  // Generar número de pago único
  const numeroPago = generarNumeroPago(payment_id);

  // Procesar en transacción
  const transaction = await sequelize.transaction();

  try {
    const resultados = [];
    const cantidadConceptos = conceptosIds.length;
    
    // Calcular monto por concepto (dividir equitativamente si hay varios)
    // Nota: En producción, cada concepto debería tener su monto específico
    const montoPorConcepto = transaction_amount / cantidadConceptos;

    for (const idTrans of conceptosIds) {
      // Obtener deuda original
      const deuda = await obtenerDeudaPorId(idTrans);
      
      if (!deuda) {
        console.warn(`[Pagos] Deuda con IdTrans ${idTrans} no encontrada`);
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda no encontrada'
        });
        continue;
      }

      // Verificar que la deuda no esté ya pagada
      if (deuda.Saldo === 0 && deuda.EsPago === 1) {
        console.warn(`[Pagos] Deuda ${idTrans} ya está pagada`);
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda ya pagada'
        });
        continue;
      }

      // 1. Actualizar deuda como pagada
      await actualizarDeudaComoPagada(idTrans, datosPago, numeroPago, transaction);

      // 2. Crear registro de cobro
      await crearRegistroCobro(deuda, datosPago, numeroPago, montoPorConcepto, transaction);

      resultados.push({
        IdTrans: idTrans,
        success: true,
        detalle: generarDetallePago(deuda)
      });

      console.log(`[Pagos] Deuda ${idTrans} marcada como pagada - ${generarDetallePago(deuda)}`);
    }

    await transaction.commit();

    const exitosos = resultados.filter(r => r.success).length;
    console.log(`[Pagos] Pago ${payment_id} procesado: ${exitosos}/${cantidadConceptos} conceptos actualizados`);

    return {
      received: true,
      processed: true,
      payment_id: payment_id,
      numero_pago: numeroPago,
      conceptos_procesados: exitosos,
      conceptos_total: cantidadConceptos,
      resultados
    };

  } catch (error) {
    await transaction.rollback();
    console.error(`[Pagos] Error procesando pago ${payment_id}:`, error);
    throw error;
  }
};

/**
 * Obtiene el historial de pagos de un cliente
 * @param {string} codigo - Código del cliente
 * @returns {Promise<Array>} Array de pagos realizados
 */
const obtenerHistorialPagos = async (codigo) => {
  return await ClientesCtaCte.findAll({
    where: {
      Codigo: codigo.trim(),
      CodMovim: 'D', // Solo cobros
      EsPago: 1
    },
    attributes: [
      'IdTrans',
      'Fecha',
      'Detalle',
      'Importe',
      'NumeroPago',
      'NRO_OPERACION',
      'FechaPago',
      'TIPO_BIEN',
      'ANO_CUOTA',
      'NRO_CUOTA'
    ],
    order: [['FechaPago', 'DESC']],
    raw: true
  });
};

module.exports = {
  confirmarPago,
  verificarPagoExistente,
  obtenerDeudaPorId,
  obtenerHistorialPagos,
  generarDetallePago,
  generarNumeroPago
};
