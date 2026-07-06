/**
 * Portal de Pagos Municipal — Module / Demo Panel State
 * @description Inicializa el panel demo, controla resultado simulado y lock de BD.
 *
 * Exports:
 *   DEMO_PANEL
 *   initDemoPanel()
 */

/**
 * Estado público del panel demo consumido por flujo de pago.
 * @type {{resultado: string, modificaBD: boolean}}
 */
export const DEMO_PANEL = { resultado: 'real', modificaBD: false };

// ---------------------------------------------------------------------------
// Inicialización del panel
// ---------------------------------------------------------------------------

/**
 * Inicializa UI y handlers del panel demo si existe en la vista.
 * @returns {void}
 */
export function initDemoPanel() {
  const panelBody = document.getElementById('demo-panel-body');
  if (!panelBody) return;

  const panelToggle = document.getElementById('demo-panel-toggle');
  const panelIcon = document.getElementById('demo-panel-toggle-icon');
  const descElement = document.getElementById('demo-panel-desc');
  const lockLabel = document.getElementById('demo-bd-lock');
  const toggleButton = document.getElementById('demo-bd-toggle-btn');
  const passRow = document.getElementById('demo-bd-pass-row');
  const passInput = document.getElementById('demo-bd-pass-input');
  const confirmButton = document.getElementById('demo-bd-confirm-btn');
  const cancelButton = document.getElementById('demo-bd-cancel-btn');
  const passError = document.getElementById('demo-bd-pass-error');

  if (!panelToggle || !panelIcon || !descElement || !lockLabel || !toggleButton || !passRow || !passInput || !confirmButton || !cancelButton || !passError) {
    return;
  }

  const demoPass = '0314';
  const storageKey = 'demo_panel_collapsed';
  window.DEMO_PANEL = DEMO_PANEL;

  const aplicarColapso = (colapsado) => {
    if (colapsado) {
      panelBody.classList.add('demo-panel__body--hidden');
      panelIcon.textContent = '▼';
      panelToggle.title = 'Mostrar panel';
    } else {
      panelBody.classList.remove('demo-panel__body--hidden');
      panelIcon.textContent = '▲';
      panelToggle.title = 'Ocultar panel';
    }
  };

  const mostrarPass = () => {
    passRow.classList.add('visible');
    passInput.value = '';
    passError.classList.remove('visible');
    passInput.focus();
  };

  const ocultarPass = () => {
    passRow.classList.remove('visible');
    passInput.value = '';
    passError.classList.remove('visible');
  };

  const desbloquear = () => {
    DEMO_PANEL.modificaBD = true;
    lockLabel.textContent = '🔓 Modificable';
    lockLabel.classList.add('demo-bd-lock--open');
    toggleButton.textContent = 'Bloquear';
    ocultarPass();
  };

  const bloquear = () => {
    DEMO_PANEL.modificaBD = false;
    lockLabel.textContent = '🔒 Protegida';
    lockLabel.classList.remove('demo-bd-lock--open');
    toggleButton.textContent = 'Desbloquear';
  };

  aplicarColapso(localStorage.getItem(storageKey) === '1');

  panelToggle.addEventListener('click', () => {
    const colapsado = !panelBody.classList.contains('demo-panel__body--hidden');
    localStorage.setItem(storageKey, colapsado ? '1' : '0');
    aplicarColapso(colapsado);
  });

  document.querySelectorAll('.demo-opcion').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.demo-opcion').forEach((option) => {
        option.classList.remove('demo-opcion--active');
      });
      btn.classList.add('demo-opcion--active');
      DEMO_PANEL.resultado = btn.dataset.valor;
      descElement.textContent = btn.dataset.desc;
    });
  });

  toggleButton.addEventListener('click', () => {
    if (DEMO_PANEL.modificaBD) {
      bloquear();
    } else {
      mostrarPass();
    }
  });

  confirmButton.addEventListener('click', () => {
    if (passInput.value === demoPass) {
      desbloquear();
    } else {
      passError.classList.add('visible');
      passInput.value = '';
      passInput.focus();
    }
  });

  passInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') confirmButton.click();
    if (event.key === 'Escape') ocultarPass();
  });

  cancelButton.addEventListener('click', ocultarPass);
}
