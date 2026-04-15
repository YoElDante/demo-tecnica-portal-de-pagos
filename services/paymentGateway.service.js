/**
 * Servicio de Payment Gateway
 * Maneja la comunicación con múltiples pasarelas de pago
 * 
 * Pasarelas soportadas:
 * - siro: SIRO/Red Link via API Gateway (IMPLEMENTADO — activo)
 * - mercadopago: MercadoPago via API Gateway (IMPLEMENTADO — disponible)
 * - pagotic: PagoTic (PENDIENTE)
 * - macropay: Macro Click de Pago (PENDIENTE)
 * 
 * @author Equipo de Desarrollo
 * @version 2.0
 * @date 2026-03-09
 */

const axios = require('axios');

// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { municipalidad: municipalidadConfig, MUNICIPIO } = require('../config');

// ============================================
// CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
// ============================================
if (!process.env.PAYMENT_GATEWAY) {
  console.warn('⚠️  PAYMENT_GATEWAY no configurado — usando SIRO por defecto. Definir en .env para producción.');
}
const PAYMENT_GATEWAY = (process.env.PAYMENT_GATEWAY || 'siro').toLowerCase();
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const MUNICIPIO_ID = process.env.MUNICIPIO || MUNICIPIO;
const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:4000';

// Log de configuración al iniciar
console.log(`💳 Payment Gateway configurado: ${PAYMENT_GATEWAY.toUpperCase()}`);

// ============================================
// GATEWAY: MERCADOPAGO (via API Gateway)
// ============================================
/**
 * Crea un pago usando MercadoPago via el API Gateway
 * @private
 */
async function createMercadoPagoPayment(paymentData) {
  const { contribuyente, conceptos, montoTotal } = paymentData;

  // Construir el body según el contrato de la API
  const requestBody = {
    municipio_id: MUNICIPIO_ID,
    municipio_nombre: municipalidadConfig.nombreCompleto,
    contribuyente: {
      nombre: contribuyente.nombre || 'Contribuyente',
      email: contribuyente.email || '',
      dni: contribuyente.dni,
      telefono: contribuyente.telefono || ''
    },
    conceptos: conceptos.map(c => ({
      id: String(c.IdTrans || c.id),
      descripcion: c.Detalle || c.descripcion || 'Concepto municipal',
      monto: Number(c.Total || c.monto || 0)
    })),
    monto_total: Number(montoTotal),
    callback_url: `${FRONTEND_PUBLIC_URL}/api/pagos/confirmacion`,
    metadata: {
      conceptos_ids: conceptos.map(c => c.IdTrans || c.id),
      contribuyente_dni: contribuyente.dni
    }
  };

  console.log('📤 [MercadoPago] Enviando solicitud al API Gateway:', {
    url: `${API_GATEWAY_URL}/api/pagos`,
    municipio: requestBody.municipio_id,
    contribuyente_dni: requestBody.contribuyente.dni,
    cantidad_conceptos: requestBody.conceptos.length,
    monto_total: requestBody.monto_total
  });

  const response = await axios.post(
    `${API_GATEWAY_URL}/api/pagos`,
    requestBody,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    }
  );

  if (response.data.success) {
    console.log('✅ [MercadoPago] Preferencia creada:', {
      external_reference: response.data.data.external_reference,
      preference_id: response.data.data.preference_id
    });

    return {
      success: true,
      gateway: 'mercadopago',
      payment_url: response.data.data.payment_url,
      sandbox_url: response.data.data.sandbox_url,
      external_reference: response.data.data.external_reference,
      preference_id: response.data.data.preference_id
    };
  }

  throw new Error(response.data.message || 'Error desconocido del API Gateway');
}

// ============================================
// GATEWAY: PAGOTIC (PLACEHOLDER)
// ============================================
/**
 * Crea un pago usando PagoTic
 * @private
 * @todo Implementar cuando se tenga la documentación de PagoTic
 */
async function createPagoTicPayment(paymentData) {
  // TODO: Implementar integración con PagoTic
  // Requiere: API_KEY, MERCHANT_ID, etc.
  console.warn('⚠️ [PagoTic] Gateway no implementado aún');
  throw new Error('Pasarela PagoTic no implementada. Contacte al administrador.');
}

// ============================================
// GATEWAY: SIRO / RED LINK (via API Gateway)
// ============================================
/**
 * Crea una intención de pago en SIRO via el API Gateway.
 *
 * El portal envía el payload según el contrato definido en
 * docs/CONTRACT-PORTAL-GATEWAY.md. El gateway se encarga de:
 * - Autenticarse con SIRO
 * - Formatear el nro_comprobante a 20 chars
 * - Generar la URL de pago y retornarla al portal
 *
 * @param {Object} paymentData
 * @param {Object} paymentData.contribuyente        - Datos del contribuyente
 * @param {string} paymentData.contribuyente.codigo - Código en la BD municipal (SIRO: codigo_contribuyente)
 * @param {string} paymentData.contribuyente.dni    - DNI (fallback si no hay codigo)
 * @param {Array}  paymentData.conceptos            - Conceptos seleccionados
 * @param {number} paymentData.montoTotal           - Suma total de todos los conceptos
 * @param {string} paymentData.ticketNumber         - Número de ticket generado por el portal
 * @returns {Promise<{ payment_url, external_reference, hash }>}
 */
async function createSiroPayment(paymentData) {
  const { contribuyente, conceptos, montoTotal, ticketNumber } = paymentData;

  const limpiarConceptoSiro = (valor) => String(valor || '')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Construir una descripción general para SIRO (campo Concepto, visible al pagador)
  const tiposUnicos = [...new Set(
    conceptos.map(c => limpiarConceptoSiro(c.detalle || c.tipoDescripcion || 'Concepto municipal')).slice(0, 3)
  )];
  const concepto = limpiarConceptoSiro(tiposUnicos.join(' ')).substring(0, 200) || 'Pago municipal';

  const requestBody = {
    municipio_id: MUNICIPIO_ID,
    codigo_contribuyente: contribuyente.codigo || contribuyente.dni,
    importe: Number(montoTotal),
    concepto,
    nro_comprobante: ticketNumber, // El gateway lo formatea a 20 chars para SIRO
    metadata: {
      conceptos: conceptos.map(c => ({
        descripcion: c.detalle || c.tipoDescripcion || 'Concepto municipal',
        importe: Number(c.total || c.importeNumerico || 0)
      })),
      ticket_number: ticketNumber
    }
  };

  console.log('📤 [SIRO] Enviando solicitud al API Gateway:', {
    url: `${API_GATEWAY_URL}/api/pagos`,
    municipio: requestBody.municipio_id,
    importe: requestBody.importe,
    nro_ticket: ticketNumber
  });

  const response = await axios.post(
    `${API_GATEWAY_URL}/api/pagos`,
    requestBody,
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  if (response.data.success) {
    const { payment_url, external_reference, hash } = response.data.data;

    console.log('✅ [SIRO] Intención de pago creada:', {
      external_reference,
      ticket_number: ticketNumber
    });

    return {
      success: true,
      gateway: 'siro',
      payment_url,
      external_reference,
      hash
    };
  }

  throw new Error(response.data.message || 'Error desconocido del API Gateway SIRO');
}

// ============================================
// GATEWAY: MACRO CLICK DE PAGO (PLACEHOLDER)
// ============================================
/**
 * Crea un pago usando Macro Click de Pago
 * @private
 * @todo Implementar cuando se tenga la documentación de Macro
 */
async function createMacroPayment(paymentData) {
  // TODO: Implementar integración con Macro Click de Pago
  console.warn('⚠️ [MacroPay] Gateway no implementado aún');
  throw new Error('Pasarela Macro no implementada. Contacte al administrador.');
}

// ============================================
// REGISTRO DE GATEWAYS DISPONIBLES
// ============================================
const gateways = {
  mercadopago: {
    name: 'MercadoPago',
    createPayment: createMercadoPagoPayment,
    status: 'active',
    requiredEnv: ['API_GATEWAY_URL', 'FRONTEND_PUBLIC_URL']
  },
  pagotic: {
    name: 'PagoTic',
    createPayment: createPagoTicPayment,
    status: 'pending',
    requiredEnv: ['PAGOTIC_API_KEY', 'PAGOTIC_MERCHANT_ID']
  },
  siro: {
    name: 'SIRO / Red Link',
    createPayment: createSiroPayment,
    status: 'active',
    requiredEnv: ['API_GATEWAY_URL', 'MUNICIPIO']
  },
  macropay: {
    name: 'Macro Click de Pago',
    createPayment: createMacroPayment,
    status: 'pending',
    requiredEnv: ['MACRO_MERCHANT_ID', 'MACRO_SECRET']
  }
};

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Crea una preferencia de pago usando el gateway configurado
 * 
 * @param {Object} paymentData - Datos del pago
 * @param {Object} paymentData.contribuyente - Datos del contribuyente
 * @param {string} paymentData.contribuyente.dni - DNI del contribuyente
 * @param {string} paymentData.contribuyente.nombre - Nombre completo
 * @param {string} paymentData.contribuyente.email - Email (opcional)
 * @param {Array} paymentData.conceptos - Conceptos a pagar
 * @param {number} paymentData.conceptos[].IdTrans - ID de la transacción en BD
 * @param {string} paymentData.conceptos[].Detalle - Descripción del concepto
 * @param {number} paymentData.conceptos[].Total - Monto total (con intereses)
 * @param {number} paymentData.montoTotal - Monto total a pagar
 * 
 * @returns {Promise<Object>} Respuesta del gateway
 */
async function createPayment(paymentData) {
  const { contribuyente, conceptos, montoTotal } = paymentData;

  // Validaciones básicas
  if (!contribuyente || !contribuyente.dni) {
    throw new Error('El DNI del contribuyente es requerido');
  }

  if (!conceptos || conceptos.length === 0) {
    throw new Error('Debe seleccionar al menos un concepto para pagar');
  }

  if (!montoTotal || montoTotal <= 0) {
    throw new Error('El monto total debe ser mayor a cero');
  }

  // Obtener el gateway activo
  const gateway = gateways[PAYMENT_GATEWAY];

  if (!gateway) {
    console.error(`❌ Gateway '${PAYMENT_GATEWAY}' no reconocido`);
    console.error(`   Gateways disponibles: ${Object.keys(gateways).join(', ')}`);
    throw new Error(`Pasarela de pago '${PAYMENT_GATEWAY}' no configurada`);
  }

  if (gateway.status !== 'active') {
    console.warn(`⚠️ Gateway '${gateway.name}' está en estado: ${gateway.status}`);
  }

  try {
    // Llamar al método createPayment del gateway correspondiente
    return await gateway.createPayment(paymentData);
  } catch (error) {
    // Manejo de errores específicos de axios
    if (error.response) {
      console.error(`❌ [${gateway.name}] Error del servidor:`, {
        status: error.response.status,
        message: error.response.data?.message || error.message
      });
      throw new Error(error.response.data?.message || `Error del servidor: ${error.response.status}`);
    } else if (error.request) {
      console.error(`❌ [${gateway.name}] Sin respuesta del servidor:`, error.message);
      throw new Error('No se pudo conectar con el servicio de pagos. Intente nuevamente.');
    } else {
      console.error(`❌ [${gateway.name}] Error:`, error.message);
      throw error;
    }
  }
}

/**
 * Verifica el estado de un pago por su external_reference
 * 
 * @param {string} externalReference - Referencia externa del pago
 * @returns {Promise<Object>} Estado del pago
 */
async function checkPaymentStatus(externalReference) {
  // TODO: Implementar cuando los gateways tengan este endpoint
  console.log(`⚠️ checkPaymentStatus no implementado para ${PAYMENT_GATEWAY}`);
  return null;
}

/**
 * Obtiene información sobre los gateways disponibles
 * 
 * @returns {Object} Información de gateways
 */
function getGatewaysInfo() {
  return {
    active: PAYMENT_GATEWAY,
    available: Object.entries(gateways).map(([key, value]) => ({
      id: key,
      name: value.name,
      status: value.status
    }))
  };
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createPayment,
  checkPaymentStatus,
  getGatewaysInfo,

  // Exportar configuración para debugging
  config: {
    PAYMENT_GATEWAY,
    API_GATEWAY_URL,
    MUNICIPIO_ID,
    FRONTEND_PUBLIC_URL
  }
};
