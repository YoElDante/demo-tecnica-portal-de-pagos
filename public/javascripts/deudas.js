/**
 * Gestión de selección de deudas y cálculo de totales
 * @author Dante Marcos Delprato
 * @version 1.1
 */

function actualizarTotal() {
  const checkboxes = document.querySelectorAll('.checkbox-deuda:checked');
  let total = 0;

  checkboxes.forEach(cb => {
    // Ignorar filas ocultas
    if (cb.closest('tr') && cb.closest('tr').style.display === 'none') return;
    total += parseFloat(cb.dataset.total);
  });

  const totalElement = document.getElementById('total-final');
  if (totalElement) {
    totalElement.textContent = '$ ' + total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  actualizarCheckboxTodos();
}

function actualizarCheckboxTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  if (!checkboxTodos) return;
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  const checkboxesVisibles = Array.from(filasVisibles).map(f => f.querySelector('.checkbox-deuda')).filter(Boolean);
  const marcadosVisibles = checkboxesVisibles.filter(cb => cb.checked);
  if (checkboxesVisibles.length > 0) {
    checkboxTodos.checked = checkboxesVisibles.length === marcadosVisibles.length;
  } else {
    checkboxTodos.checked = false;
  }
}

function toggleTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  filasVisibles.forEach(fila => {
    const cb = fila.querySelector('.checkbox-deuda');
    if (cb) cb.checked = checkboxTodos.checked;
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

  // Filtrado por tipo de deuda
  const filtroSelect = document.getElementById('filtro-tipo');
  if (filtroSelect) {
    filtroSelect.addEventListener('change', function () {
      const valor = this.value;
      const filas = document.querySelectorAll('tbody tr[data-tipo]');
      filas.forEach(fila => {
        const tipo = fila.getAttribute('data-tipo') || '';
        const visible = !valor || tipo === valor;
        fila.style.display = visible ? '' : 'none';
      });
      // Recalcular total solo con visibles
      actualizarTotal();
    });
  }
});