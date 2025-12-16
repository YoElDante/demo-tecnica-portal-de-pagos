/**
 * Servicio de Payment Gateway
 * Maneja la comunicación con el API Gateway de MercadoPago
 * 
 * @author Generado para integración MP
 * @version 1.0
 * @date 2025-12-13
 */

const axios = require('axios');

// Configuración desde variables de entorno
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const MUNICIPIO_ID = process.env.MUNICIPIO_ID || 'manzano';
const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:4000';

// Cargar configuración del municipio
const municipalidadConfig = require('../config/municipalidad.config.manzano');

/**
 * Crea una preferencia de pago en el API Gateway
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
 * @returns {Promise<Object>} Respuesta del API Gateway
 * @returns {string} returns.payment_url - URL de MercadoPago producción
 * @returns {string} returns.sandbox_url - URL de MercadoPago sandbox
 * @returns {string} returns.external_reference - Referencia única del pago
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
      id: String(c.IdTrans),
      descripcion: c.Detalle || c.descripcion || 'Concepto municipal',
      monto: Number(c.Total || c.monto || 0)
    })),
    monto_total: Number(montoTotal),
    callback_url: `${FRONTEND_PUBLIC_URL}/api/pagos/confirmacion`,
    metadata: {
      conceptos_ids: conceptos.map(c => c.IdTrans),
      contribuyente_dni: contribuyente.dni
    }
  };

  console.log('📤 Enviando solicitud de pago al API Gateway:', {
    url: `${API_GATEWAY_URL}/api/pagos`,
    municipio: requestBody.municipio_id,
    contribuyente_dni: requestBody.contribuyente.dni,
    cantidad_conceptos: requestBody.conceptos.length,
    monto_total: requestBody.monto_total
  });

  try {
    const response = await axios.post(
      `${API_GATEWAY_URL}/api/pagos`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos timeout
      }
    );

    if (response.data.success) {
      console.log('✅ Preferencia de pago creada exitosamente:', {
        external_reference: response.data.data.external_reference,
        preference_id: response.data.data.preference_id
      });

      return {
        success: true,
        payment_url: response.data.data.payment_url,
        sandbox_url: response.data.data.sandbox_url,
        external_reference: response.data.data.external_reference,
        preference_id: response.data.data.preference_id
      };
    } else {
      throw new Error(response.data.message || 'Error desconocido del API Gateway');
    }

  } catch (error) {
    // Manejo de errores específicos de axios
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('❌ Error del API Gateway:', {
        status: error.response.status,
        message: error.response.data?.message || error.message
      });
      throw new Error(error.response.data?.message || `Error del servidor: ${error.response.status}`);
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      console.error('❌ No se pudo conectar con el API Gateway:', error.message);
      throw new Error('No se pudo conectar con el servicio de pagos. Intente nuevamente.');
    } else {
      // Error en la configuración de la solicitud
      console.error('❌ Error al preparar la solicitud:', error.message);
      throw error;
    }
  }
}

/**
 * Verifica el estado de un pago por su external_reference
 * (Para uso futuro)
 * 
 * @param {string} externalReference - Referencia externa del pago
 * @returns {Promise<Object>} Estado del pago
 */
async function checkPaymentStatus(externalReference) {
  // TODO: Implementar cuando la API Gateway tenga este endpoint
  console.log('⚠️ checkPaymentStatus no implementado aún');
  return null;
}

module.exports = {
  createPayment,
  checkPaymentStatus,
  // Exportar configuración para debugging
  config: {
    API_GATEWAY_URL,
    MUNICIPIO_ID,
    FRONTEND_PUBLIC_URL
  }
};
