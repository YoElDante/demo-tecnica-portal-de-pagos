'use strict';

/* ============================================
   DEMO INFO CARD — Toggle colapsable
   ============================================ */
(function () {
  const body = document.getElementById('demo-info-body');
  if (!body) return;

  const STORAGE_KEY = 'demo_info_collapsed';
  const toggle = document.getElementById('demo-info-toggle');
  const icon = document.getElementById('demo-info-toggle-icon');

  function aplicarEstado(colapsado) {
    if (colapsado) {
      body.classList.add('demo-info__body--hidden');
      icon.textContent = '▼';
      toggle.title = 'Mostrar información';
    } else {
      body.classList.remove('demo-info__body--hidden');
      icon.textContent = '▲';
      toggle.title = 'Ocultar información';
    }
  }

  const colapsadoInicial = localStorage.getItem(STORAGE_KEY) === '1';
  aplicarEstado(colapsadoInicial);

  toggle.addEventListener('click', function () {
    const ahora = body.classList.contains('demo-info__body--hidden');
    localStorage.setItem(STORAGE_KEY, ahora ? '0' : '1');
    aplicarEstado(!ahora);
  });
})();

/* ============================================
   CONTRIBUYENTE — Selección rápida (demo)
   ============================================ */
function seleccionarContribuyente(dni) {
  document.getElementById('dni').value = dni;
  document.getElementById('form-buscar').submit();
}

/* ============================================
   DEUDAS — Recopilación de selección
   ============================================ */
function recopilarIdTransSeleccionados() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox[data-idtrans]:checked');
  const ids = [];

  checkboxes.forEach(cb => {
    const fila = cb.closest('tr');
    if (fila && fila.style.display !== 'none') {
      const totalFila = parseFloat(cb.dataset.total || '0');
      if (!(totalFila > 0)) return;

      const idTrans = parseInt(cb.dataset.idtrans);
      if (idTrans) ids.push(idTrans);
    }
  });

  return ids;
}

function recopilarCreditosFavorVisibles() {
  const filas = document.querySelectorAll('tbody tr[data-total-deuda]:not([style*="display: none"])');
  const creditos = [];

  filas.forEach(fila => {
    const totalFila = parseFloat(fila.getAttribute('data-total-deuda') || '0');
    if (totalFila >= 0) return;

    const idTrans = parseInt(fila.getAttribute('data-idtrans') || '0');
    if (!idTrans) return;

    const celdas = fila.querySelectorAll('td');
    creditos.push({
      id: idTrans,
      descripcion: (celdas[2]?.textContent || '').trim(),
      monto: totalFila
    });
  });

  return creditos;
}

function recopilarConceptosParaPago() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox[data-idtrans]:checked');
  const conceptos = [];

  checkboxes.forEach(cb => {
    const fila = cb.closest('tr');
    if (fila && fila.style.display !== 'none') {
      const celdas = fila.querySelectorAll('td');
      const idTrans = parseInt(cb.dataset.idtrans);
      const total = parseFloat(cb.dataset.total || '0');

      if (!(total > 0)) return;

      const detalleCell = celdas[2];
      const descripcion = detalleCell ? detalleCell.textContent.trim() : 'Concepto';

      conceptos.push({ id: idTrans, descripcion, monto: total });
    }
  });

  return conceptos;
}

/* ============================================
   PAGO — Inicio del proceso
   ============================================ */
async function iniciarPago() {
  const botonesIds = ['btn-ir-a-pagar', 'btn-ir-a-pagar-bottom'];
  const loadingContainer = document.getElementById('qr-container');
  const loadingMsg = document.getElementById('pago-loading');

  const conceptosIds = recopilarIdTransSeleccionados();
  if (conceptosIds.length === 0) {
    alert('Por favor, seleccione al menos un concepto de deuda para pagar.');
    return;
  }

  const creditosAplicados = recopilarCreditosFavorVisibles();

  const totalElement = document.getElementById('total-final');
  const montoTotal = extraerNumero(totalElement?.textContent || '0');

  if (montoTotal <= 0) {
    alert('El total neto a pagar es menor o igual a cero. Existe saldo a favor del contribuyente.');
    return;
  }

  const conceptos = recopilarConceptosParaPago();

  botonesIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Procesando...';
    }
  });
  loadingContainer.style.display = 'flex';
  loadingMsg.style.display = 'block';
  setTimeout(() => loadingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);

  const demoResultado = (window.DEMO_PANEL && window.DEMO_PANEL.resultado) || 'real';
  const isDemoMode = window.DEMO_PANEL ? !window.DEMO_PANEL.modificaBD : false;

  try {
    const response = await fetch('/pago/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contribuyente: contribuyenteData,
        conceptos,
        montoTotal,
        creditosAplicados,
        is_demo: isDemoMode,
        demo_resultado: demoResultado
      })
    });

    const data = await response.json();

    if (data.success && data.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      throw new Error(data.message || 'Error al iniciar el pago');
    }
  } catch (error) {
    console.error('Error al iniciar pago:', error);
    alert('Error al procesar el pago: ' + error.message);

    botonesIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '💳 Ir a Pagar';
      }
    });
    loadingContainer.style.display = 'none';
  }
}

/* ============================================
   UI — Scroll al tope
   ============================================ */
function volverArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
