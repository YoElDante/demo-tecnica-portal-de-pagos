/**
 * Portal de Pagos Municipal — Module / Pago Polling
 * @description Verificación periódica del estado de ticket en pantalla de pago pendiente.
 *
 * Exports:
 *   startPolling(ref, token, code)
 */

// ---------------------------------------------------------------------------
// Polling de estado
// ---------------------------------------------------------------------------

/**
 * Inicia polling de estado para un ticket pendiente y redirige en cambios de estado.
 * @param {string} ref - External reference del ticket.
 * @param {string} token - Redirect token opcional.
 * @param {string} code - Redirect code opcional.
 * @returns {void}
 */
export function startPolling(ref, token, code) {
  const intervaloMs = 30000;
  const maxIntentos = 20; // 10 minutos
  let intentos = 0;

  function credencialRedirect() {
    if (code) return `&code=${encodeURIComponent(code)}`;
    if (token) return `&token=${encodeURIComponent(token)}`;
    return '';
  }

  function verificarEstado() {
    if (intentos >= maxIntentos) {
      const pollingStatus = document.getElementById('pollingStatus');
      if (pollingStatus) {
        pollingStatus.textContent = 'Verificación automática detenida. Refrescá la página si querés seguir chequeando.';
      }
      return;
    }

    intentos += 1;

    fetch(`/api/tickets/estado?ref=${encodeURIComponent(ref)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'APROBADO') {
          window.location.href = `/pagos/exitoso?ref=${encodeURIComponent(ref)}${credencialRedirect()}`;
        } else if (data.status === 'RECHAZADO' || data.status === 'EXPIRADO') {
          window.location.href = `/pagos/error?ref=${encodeURIComponent(ref)}${credencialRedirect()}`;
        }
      })
      .catch(() => {
        // Error de red: no interrumpir el polling.
      });
  }

  // Primera verificación a los 15s (el webhook suele llegar en ese lapso)
  setTimeout(verificarEstado, 15000);
  // Luego cada 30s
  setInterval(verificarEstado, intervaloMs);
}
