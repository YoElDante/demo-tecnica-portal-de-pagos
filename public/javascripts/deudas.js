/**
 * Gestión de selección de deudas y cálculo de totales
 * @author Dante Marcos Delprato
 * @version 1.0
 */

function actualizarTotal() {
  const checkboxes = document.querySelectorAll('.checkbox-deuda:checked');
  let total = 0;

  checkboxes.forEach(cb => {
    total += parseFloat(cb.dataset.total);
  });

  const totalElement = document.getElementById('total-final');
  if (totalElement) {
    totalElement.textContent = '$ ' + total.toFixed(2);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  actualizarTotal();

  // Agregar listeners a todos los checkboxes
  const checkboxes = document.querySelectorAll('.checkbox-deuda');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', actualizarTotal);
  });
});