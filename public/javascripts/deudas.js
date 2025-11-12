/**
 * Gestión de selección de deudas y cálculo de totales
 * @author Dante Marcos Delprato
 * @version 1.1
 */

function actualizarTotal() {
  const checkboxes = document.querySelectorAll('.checkbox-deuda:checked');
  let total = 0;

  checkboxes.forEach(cb => {
    total += parseFloat(cb.dataset.total);
  });

  const totalElement = document.getElementById('total-final');
  if (totalElement) {
    totalElement.textContent = '$ ' + total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Actualizar estado del checkbox "Seleccionar Todo"
  actualizarCheckboxTodos();
}

function actualizarCheckboxTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  const checkboxes = document.querySelectorAll('.checkbox-deuda');
  const checkboxesMarcados = document.querySelectorAll('.checkbox-deuda:checked');

  if (checkboxTodos && checkboxes.length > 0) {
    checkboxTodos.checked = checkboxes.length === checkboxesMarcados.length;
  }
}

function toggleTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  const checkboxes = document.querySelectorAll('.checkbox-deuda');

  checkboxes.forEach(cb => {
    cb.checked = checkboxTodos.checked;
  });

  actualizarTotal();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  actualizarTotal();

  // Agregar listeners a todos los checkboxes de deudas
  const checkboxes = document.querySelectorAll('.checkbox-deuda');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', actualizarTotal);
  });

  // Agregar listener al checkbox "Seleccionar Todo"
  const checkboxTodos = document.getElementById('checkbox-todos');
  if (checkboxTodos) {
    checkboxTodos.addEventListener('change', toggleTodos);
  }
});