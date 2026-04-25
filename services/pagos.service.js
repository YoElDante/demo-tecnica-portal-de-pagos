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
 * Verifica si una operación ya fue procesada contablemente (idempotencia)
 * @param {string|string[]} operationRefs - Identificador/es operativos de pago
 * @returns {Promise<boolean>} true si ya existe, false si no
 */
const verificarPagoExistente = async (operationRefs) => {
  const referencias = (Array.isArray(operationRefs) ? operationRefs : [operationRefs])
    .filter(Boolean)
    .map((value) => String(value));

  if (referencias.length === 0) {
    return false;
  }

  const existe = await ClientesCtaCte.findOne({
    where: {
      NRO_OPERACION: { [Op.in]: referencias },
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
const obtenerDeudaPorId = async (idTrans, transaction = null) => {
  return await ClientesCtaCte.findOne({
    where: { IdTrans: idTrans },
    transaction,
    raw: true
  });
};

/**
 * Ejecuta rollback sin ocultar el error original del flujo.
 * @param {Object} transaction - Transacción Sequelize
 * @param {string} contexto - Etiqueta del flujo para logging
 */
const rollbackSeguro = async (transaction, contexto) => {
  if (!transaction || transaction.finished) {
    return;
  }

  try {
    await transaction.rollback();
  } catch (rollbackError) {
    console.warn(`[Pagos] Rollback falló en ${contexto}: ${rollbackError.message}`);
  }
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
 * Genera el número de pago a partir de un identificador operativo.
 * Si no encuentra dígitos en la referencia, usa un fallback temporal.
 * @param {string|number} paymentId - Identificador del pago
 * @returns {number} Número de pago (últimos 9 dígitos)
 */
const generarNumeroPago = (paymentId) => {
  const digitsOnly = String(paymentId || '').replace(/\D/g, '');

  if (digitsOnly.length > 0) {
    return parseInt(digitsOnly.slice(-9), 10);
  }

  return parseInt(String(Date.now()).slice(-9), 10);
};

/**
 * Normaliza el identificador operativo al límite real de la columna
 * dbo.ClientesCtaCte.NRO_OPERACION (varchar(10)).
 * @param {string|number} referencia
 * @returns {string}
 */
const normalizarNroOperacion = (referencia) => {
  const valor = String(referencia || '').trim();
  if (!valor) {
    return '';
  }

  const soloDigitos = valor.replace(/\D/g, '');
  const base = soloDigitos || valor;
  return base.slice(-10);
};

/**
 * Actualiza una deuda como pagada
 * @param {number} idTrans - ID de la transacción a actualizar
 * @param {Object} datosPago - Datos del pago ya normalizados
 * @param {number} numeroPago - Número secuencial de pago
 * @param {Object} transaction - Transacción de Sequelize
 */
const actualizarDeudaComoPagada = async (idTrans, datosPago, numeroPago, transaction) => {
  const fechaPago = sequelize.literal('GETDATE()');
  const ejercicioActual = new Date().getFullYear().toString();
  const nroOperacion = normalizarNroOperacion(datosPago.payment_id);

  if (!nroOperacion) {
    throw new Error('NRO_OPERACION inválido para registrar el pago');
  }

  await ClientesCtaCte.update({
    Saldo: 0,
    EsPago: 1,
    FechaPago: fechaPago,
    NumeroPago: numeroPago,
    NRO_OPERACION: nroOperacion,
    Ejercicio: ejercicioActual
  }, {
    where: { IdTrans: idTrans },
    transaction
  });
};

/**
 * Crea el registro de cobro (contrapartida contable)
 * @param {Object} deudaOriginal - Registro de deuda original
 * @param {Object} datosPago - Datos del pago ya normalizados
 * @param {number} numeroPago - Número secuencial de pago
 * @param {number} montoCobrado - Monto efectivamente cobrado (con intereses)
 * @param {Object} transaction - Transacción de Sequelize
 * @returns {Promise<Object>} Registro de cobro creado
 */
const crearRegistroCobro = async (deudaOriginal, datosPago, numeroPago, montoCobrado, transaction) => {
  const fechaPago = sequelize.literal('GETDATE()');
  const ejercicioActual = new Date().getFullYear().toString();
  const nroOperacion = normalizarNroOperacion(datosPago.payment_id);

  if (!nroOperacion) {
    throw new Error('NRO_OPERACION inválido para registrar cobro');
  }

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
    NRO_OPERACION: nroOperacion,
    TIPO_BIEN: deudaOriginal.TIPO_BIEN,
    ANO_CUOTA: deudaOriginal.ANO_CUOTA,
    NRO_CUOTA: deudaOriginal.NRO_CUOTA,
    ID_BIEN: deudaOriginal.ID_BIEN,
    Ejercicio: ejercicioActual,
    CuentaContable: deudaOriginal.CuentaContable
  }, { transaction });
};

/**
 * Confirma un pago recibido via webhook y actualiza la base de datos
 * @param {Object} datosPago - Datos normalizados recibidos del gateway
 * @param {string} datosPago.payment_id - Identificador operativo del pago
 * @param {string} datosPago.status - Estado del pago (approved, rejected, pending)
 * @param {string} datosPago.external_reference - Referencia externa del ticket
 * @param {number} datosPago.transaction_amount - Monto total de la transacción
 * @param {string} datosPago.date_approved - Fecha de aprobación
 * @param {Object} datosPago.metadata - Metadata con conceptos_ids
 * @returns {Promise<Object>} Resultado de la operación
 */
const confirmarPago = async (datosPago) => {
  if (!datosPago.payment_id) {
    throw new Error('payment_id es requerido');
  }

  if (!datosPago.metadata?.conceptos_ids || !Array.isArray(datosPago.metadata.conceptos_ids)) {
    throw new Error('metadata.conceptos_ids es requerido y debe ser un array');
  }

  const { payment_id, status, metadata, transaction_amount } = datosPago;
  const paymentIdNormalizado = normalizarNroOperacion(payment_id);
  const conceptosIds = metadata.conceptos_ids;

  if (status !== 'approved') {
    console.log(`[Pagos] Pago ${payment_id} con estado ${status}, no se procesa`);
    return {
      received: true,
      processed: false,
      reason: `Estado del pago: ${status}`
    };
  }

  const yaExiste = await verificarPagoExistente(paymentIdNormalizado || payment_id);
  if (yaExiste) {
    console.log(`[Pagos] Pago ${payment_id} ya fue procesado anteriormente`);
    return {
      received: true,
      processed: false,
      already_processed: true,
      reason: 'Pago ya procesado anteriormente'
    };
  }

  const numeroPago = generarNumeroPago(paymentIdNormalizado || payment_id);
  const transaction = await sequelize.transaction();

  try {
    const resultados = [];
    const cantidadConceptos = conceptosIds.length;

    for (const idTrans of conceptosIds) {
      const deuda = await obtenerDeudaPorId(idTrans, transaction);

      if (!deuda) {
        console.warn(`[Pagos] Deuda con IdTrans ${idTrans} no encontrada`);
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda no encontrada'
        });
        continue;
      }

      if (deuda.Saldo === 0 && deuda.EsPago === 1) {
        console.warn(`[Pagos] Deuda ${idTrans} ya está pagada`);
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda ya pagada'
        });
        continue;
      }

      const contextoPago = {
        ...datosPago,
        payment_id: paymentIdNormalizado || payment_id
      };
      const montoCobrado = Number(deuda.Saldo ?? deuda.Importe ?? 0);

      await actualizarDeudaComoPagada(idTrans, contextoPago, numeroPago, transaction);
      await crearRegistroCobro(deuda, contextoPago, numeroPago, montoCobrado, transaction);

      resultados.push({
        IdTrans: idTrans,
        success: true,
        detalle: generarDetallePago(deuda)
      });

      console.log(`[Pagos] Deuda ${idTrans} marcada como pagada - ${generarDetallePago(deuda)}`);
    }

    await transaction.commit();

    const exitosos = resultados.filter((resultado) => resultado.success).length;
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
    await rollbackSeguro(transaction, 'confirmarPago');
    console.error(`[Pagos] Error procesando pago ${payment_id}:`, error);
    throw error;
  }
};

/**
 * Extrae los conceptos persistidos dentro del snapshot del ticket.
 * @param {Object} ticket - Registro de TicketsPago
 * @returns {Array<Object>}
 */
const extraerConceptosDesdeTicket = (ticket) => {
  if (!ticket?.payloadSnapshot) {
    return [];
  }

  try {
    const snapshot = JSON.parse(ticket.payloadSnapshot);
    return Array.isArray(snapshot?.conceptos) ? snapshot.conceptos : [];
  } catch (error) {
    throw new Error('El payload_snapshot del ticket no contiene un JSON válido');
  }
};

/**
 * Extrae los créditos a favor persistidos dentro del snapshot del ticket.
 * @param {Object} ticket - Registro de TicketsPago
 * @returns {Array<Object>}
 */
const extraerCreditosDesdeTicket = (ticket) => {
  if (!ticket?.payloadSnapshot) {
    return [];
  }

  try {
    const snapshot = JSON.parse(ticket.payloadSnapshot);
    return Array.isArray(snapshot?.creditosAplicados) ? snapshot.creditosAplicados : [];
  } catch (error) {
    throw new Error('El payload_snapshot del ticket no contiene un JSON válido');
  }
};

/**
 * Confirma un pago proveniente del API Gateway usando el snapshot del ticket.
 * @param {Object} datosPago - Datos recibidos desde el gateway
 * @param {Object} datosPago.ticket - Registro TicketsPago asociado
 * @param {string} datosPago.externalReference - Referencia del gateway
 * @param {string} datosPago.estado - Estado normalizado (APROBADO, RECHAZADO, etc.)
 * @param {string} [datosPago.idOperacion] - ID operativo de la pasarela
 * @param {number} [datosPago.importe] - Importe informado por el gateway
 * @param {string|Date} [datosPago.fechaOperacion] - Fecha informada por el gateway
 * @returns {Promise<Object>} Resultado de la operación
 */
const confirmarPagoGateway = async (datosPago) => {
  const {
    ticket,
    externalReference,
    estado,
    idOperacion,
    importe,
    fechaOperacion
  } = datosPago;

  if (!ticket) {
    throw new Error('ticket es requerido');
  }

  if (estado !== 'APROBADO') {
    return {
      received: true,
      processed: false,
      reason: `Estado del pago: ${estado}`
    };
  }

  // Modo demostración: el pago se procesa en SIRO pero no toca la BD de deudas
  const snapshotRaw = ticket?.payloadSnapshot
    ? (typeof ticket.payloadSnapshot === 'string' ? JSON.parse(ticket.payloadSnapshot) : ticket.payloadSnapshot)
    : {};
  const isDemoMode = snapshotRaw?.isDemo === true &&
    String(ticket?.municipioId || '').toUpperCase() === 'DEMO';

  if (isDemoMode) {
    return {
      received: true,
      processed: false,
      already_processed: false,
      demo_mode: true,
      numero_pago: null,
      conceptos_procesados: 0,
      creditos_limpiados: 0
    };
  }

  const conceptos = extraerConceptosDesdeTicket(ticket);
  const creditosAplicados = extraerCreditosDesdeTicket(ticket);
  if (conceptos.length === 0) {
    throw new Error('El ticket no tiene conceptos asociados para aplicar el cobro');
  }

  const operationReference = normalizarNroOperacion(idOperacion || externalReference);
  const referenciasIdempotencia = [operationReference].filter(Boolean);

  if (!operationReference) {
    throw new Error('No se pudo derivar un NRO_OPERACION válido para registrar el pago');
  }

  const yaExiste = await verificarPagoExistente(referenciasIdempotencia);
  if (yaExiste) {
    return {
      received: true,
      processed: false,
      already_processed: true,
      reason: 'Pago ya procesado anteriormente'
    };
  }

  const numeroPago = generarNumeroPago(operationReference);
  const transaction = await sequelize.transaction();

  try {
    const resultados = [];
    const resultadosCreditos = [];
    const cantidadConceptos = conceptos.length;
    const montoTotal = Number(importe || ticket.amountTotal || 0);
    const montoPorConcepto = cantidadConceptos > 0 ? montoTotal / cantidadConceptos : 0;

    for (const concepto of conceptos) {
      const idTrans = Number(concepto.IdTrans || concepto.id);

      if (!Number.isInteger(idTrans) || idTrans <= 0) {
        resultados.push({
          IdTrans: concepto.IdTrans || concepto.id || null,
          success: false,
          error: 'Concepto sin IdTrans válido en el snapshot del ticket'
        });
        continue;
      }

      const deuda = await obtenerDeudaPorId(idTrans, transaction);

      if (!deuda) {
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda no encontrada'
        });
        continue;
      }

      if (deuda.Saldo === 0 && deuda.EsPago === 1) {
        resultados.push({
          IdTrans: idTrans,
          success: false,
          error: 'Deuda ya pagada'
        });
        continue;
      }

      const montoCobrado = Number(
        concepto.Total || concepto.total || concepto.importeNumerico || concepto.importe || montoPorConcepto
      );

      const contextoPago = {
        payment_id: operationReference,
        date_approved: fechaOperacion
      };

      await actualizarDeudaComoPagada(idTrans, contextoPago, numeroPago, transaction);
      await crearRegistroCobro(deuda, contextoPago, numeroPago, montoCobrado, transaction);

      resultados.push({
        IdTrans: idTrans,
        success: true,
        detalle: generarDetallePago(deuda)
      });
    }

    for (const credito of creditosAplicados) {
      const idTransCredito = Number(credito?.IdTrans || credito?.id);

      if (!Number.isInteger(idTransCredito) || idTransCredito <= 0) {
        resultadosCreditos.push({
          IdTrans: credito?.IdTrans || credito?.id || null,
          success: false,
          error: 'Crédito sin IdTrans válido en el snapshot del ticket'
        });
        continue;
      }

      const deudaCredito = await obtenerDeudaPorId(idTransCredito, transaction);

      if (!deudaCredito) {
        resultadosCreditos.push({
          IdTrans: idTransCredito,
          success: false,
          error: 'Crédito no encontrado'
        });
        continue;
      }

      if (deudaCredito.Saldo === 0 && deudaCredito.EsPago === 1) {
        resultadosCreditos.push({
          IdTrans: idTransCredito,
          success: false,
          error: 'Crédito ya conciliado'
        });
        continue;
      }

      const saldoCredito = Number(deudaCredito.Saldo || deudaCredito.Importe || 0);
      if (!(saldoCredito < 0)) {
        resultadosCreditos.push({
          IdTrans: idTransCredito,
          success: false,
          error: 'El movimiento no corresponde a crédito a favor'
        });
        continue;
      }

      await actualizarDeudaComoPagada(idTransCredito, {
        payment_id: operationReference,
        date_approved: fechaOperacion
      }, numeroPago, transaction);

      resultadosCreditos.push({
        IdTrans: idTransCredito,
        success: true,
        detalle: deudaCredito.Detalle || 'Crédito a favor conciliado'
      });
    }

    await transaction.commit();

    const exitosos = resultados.filter((resultado) => resultado.success).length;
    const creditosLimpiados = resultadosCreditos.filter((resultado) => resultado.success).length;

    return {
      received: true,
      processed: true,
      external_reference: externalReference,
      numero_pago: numeroPago,
      conceptos_procesados: exitosos,
      conceptos_total: cantidadConceptos,
      creditos_limpiados: creditosLimpiados,
      creditos_total: creditosAplicados.length,
      resultados,
      resultados_creditos: resultadosCreditos
    };
  } catch (error) {
    await rollbackSeguro(transaction, 'confirmarPagoGateway');
    console.error('[Pagos] Error en confirmarPagoGateway:', {
      externalReference,
      idOperacion: idOperacion || null,
      detalle: error.message
    });
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
      CodMovim: 'D',
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
  confirmarPagoGateway,
  confirmarPago,
  verificarPagoExistente,
  obtenerDeudaPorId,
  obtenerHistorialPagos,
  generarDetallePago,
  generarNumeroPago
};
