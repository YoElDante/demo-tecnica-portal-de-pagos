/**
 * Portal de Pagos Municipal — API Contribuyente Controller
 * @description Retorna datos personales del contribuyente solo si la sesión firmada coincide con el código solicitado.
 *
 * Key Variables:
 *   clientesService — Servicio de consulta de clientes por código.
 *
 * Exports:
 *   obtenerContribuyente(req, res) — Valida cookie firmada y responde JSON con datos del contribuyente.
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const clientesService = require('../../services/clientes.service');

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------
async function obtenerContribuyente(req, res) {
  try {
    const codigoParam = String(req.params?.codigo || '').trim();
    const codigoCookie = String(req.signedCookies?.ccodigo || '').trim();

    if (!codigoCookie) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (codigoCookie !== codigoParam) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const cliente = await clientesService.obtenerPorCodigo(codigoParam);

    if (!cliente) {
      return res.status(404).json({ error: 'Contribuyente no encontrado' });
    }

    return res.json({
      codigo: cliente.Codigo?.trim() || '',
      dni: cliente.DOCUMENTO?.trim() || '',
      nombre: cliente.Nombre?.trim() || '',
      apellido: cliente.Apellido?.trim() || '',
      email: cliente.Email?.trim() || ''
    });
  } catch (error) {
    console.error('[Contribuyente API] Error obteniendo datos:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  obtenerContribuyente
};
