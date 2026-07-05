/* ============================================
   CSRF Token Helper — shared module
   @description Reads the CSRF token from the hidden
                input[name="_csrf"] rendered by the server.
   @since    2026-07-05 (fix-ir-a-pagar-button)
   ============================================ */
function getCsrfToken() {
  const input = document.querySelector('input[name="_csrf"]');
  return input ? input.value : '';
}
