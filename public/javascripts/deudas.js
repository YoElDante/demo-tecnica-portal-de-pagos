/**
 * Gestión de selección de deudas y cálculo de totales
 * @author Dante Marcos Delprato
 * @version 2.0
 */

// ============================================
// GESTIÓN DE SELECCIÓN Y TOTALES
// ============================================

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
  actualizarContadores();
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

function actualizarContadores() {
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  const totalVisibles = filasVisibles.length;
  let seleccionadasVisibles = 0;
  filasVisibles.forEach(fila => {
    const cb = fila.querySelector('.checkbox-deuda');
    if (cb && cb.checked) seleccionadasVisibles++;
  });
  const totalEl = document.getElementById('contador-deudas-total');
  const selEl = document.getElementById('contador-deudas-seleccionadas');
  if (totalEl) totalEl.textContent = totalVisibles;
  if (selEl) selEl.textContent = seleccionadasVisibles;
}

// ============================================
// GESTIÓN DE TICKETS DE PAGO
// ============================================

/**
 * Recopila los conceptos seleccionados de la tabla
 * @returns {Array} Array de conceptos seleccionados
 */
function recopilarConceptosSeleccionados() {
  const checkboxes = document.querySelectorAll('.checkbox-deuda:checked');
  const conceptos = [];

  checkboxes.forEach(cb => {
    const fila = cb.closest('tr');
    if (fila && fila.style.display !== 'none') {
      const celdas = fila.querySelectorAll('td');

      // Extraer datos de cada celda
      const concepto = {
        fechaVto: celdas[1]?.textContent.trim() || '',
        tipoDescripcion: extraerTextoDetalle(celdas[2]),
        detalle: extraerDetalleAdicional(celdas[2]),
        cuota: celdas[3]?.textContent.trim() || '',
        anio: celdas[4]?.textContent.trim() || '',
        importe: extraerNumero(celdas[5]?.textContent || '0'),
        interes: extraerNumeroConSigno(celdas[6]),
        total: parseFloat(cb.dataset.total || '0')
      };

      conceptos.push(concepto);
    }
  });

  return conceptos;
}

/**
 * Extrae el texto del detalle sin el icono
 * @param {HTMLElement} celda - Celda de la tabla
 * @returns {string} Texto limpio
 */
function extraerTextoDetalle(celda) {
  if (!celda) return '';
  const textoCompleto = celda.textContent.trim();
  // Remover emoji/icono si existe y tomar solo el texto descriptivo
  return textoCompleto.replace(/^[^\w\s]+\s*/, '').split(' - ')[0].trim();
}

/**
 * Extrae el detalle adicional después del guión
 * @param {HTMLElement} celda - Celda de la tabla
 * @returns {string} Detalle adicional
 */
function extraerDetalleAdicional(celda) {
  if (!celda) return '';
  const textoCompleto = celda.textContent.trim();
  const partes = textoCompleto.split(' - ');
  return partes.length > 1 ? partes.slice(1).join(' - ').trim() : '';
}

/**
 * Extrae un número de un texto con formato de moneda
 * @param {string} texto - Texto con formato "$ 1.234,56"
 * @returns {number} Número extraído
 */
function extraerNumero(texto) {
  return parseFloat(
    texto.replace(/\$/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .trim()
  ) || 0;
}

/**
 * Extrae un número considerando si es negativo por clase CSS
 * @param {HTMLElement} celda - Celda de la tabla
 * @returns {number} Número con signo correcto
 */
function extraerNumeroConSigno(celda) {
  if (!celda) return 0;
  const valor = extraerNumero(celda.textContent);
  const esNegativo = celda.classList.contains('interes-negativo');
  return esNegativo ? valor : -valor;
}

/**
 * Obtiene los datos del contribuyente del formulario
 * @returns {Object} Datos del contribuyente
 */
function obtenerDatosContribuyente() {
  const dniInput = document.getElementById('dni');
  const nombreInput = document.getElementById('nombre');

  return {
    dni: dniInput?.value.trim() || '',
    nombreCompleto: nombreInput?.value.trim() || ''
  };
}

/**
 * Genera el ticket y lo muestra en el contenedor
 */
async function generarTicket() {
  try {
    // Validar que haya conceptos seleccionados
    const conceptos = recopilarConceptosSeleccionados();
    if (conceptos.length === 0) {
      alert('⚠️ Debe seleccionar al menos un concepto para generar el ticket');
      return;
    }

    // Obtener datos del contribuyente
    const contribuyente = obtenerDatosContribuyente();
    if (!contribuyente.dni || !contribuyente.nombreCompleto) {
      alert('⚠️ Faltan datos del contribuyente');
      return;
    }

    // Mostrar indicador de carga
    const container = document.getElementById('ticket-preview-container');
    if (container) {
      container.innerHTML = '<div class="ticket-loading">Generando ticket...</div>';
      container.style.display = 'block';
    }

    // Hacer petición al backend
    const response = await fetch('/generar-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conceptos,
        contribuyente
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error al generar el ticket');
    }

    // Mostrar el HTML del ticket
    if (container) {
      container.innerHTML = data.html;
      container.style.display = 'block';

      // Habilitar botón de descarga PDF (superior)
      const btnDescargar = document.getElementById('btn-descargar-pdf');
      if (btnDescargar) {
        btnDescargar.disabled = false;
      }

      // Mostrar y habilitar botones inferiores
      const botonesInferiores = document.getElementById('ticket-actions-bottom');
      if (botonesInferiores) {
        botonesInferiores.style.display = 'flex';
      }
      const btnDescargarBottom = document.getElementById('btn-descargar-pdf-bottom');
      if (btnDescargarBottom) {
        btnDescargarBottom.disabled = false;
      }

      // Scroll suave al ticket
      setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

  } catch (error) {
    console.error('Error al generar ticket:', error);
    alert('❌ Error al generar el ticket: ' + error.message);

    const container = document.getElementById('ticket-preview-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }
}

/**
 * Descarga el ticket como PDF
 */
async function descargarPDF() {
  try {
    const container = document.getElementById('ticket-container');
    if (!container) {
      alert('⚠️ Primero debe generar el ticket');
      return;
    }

    // Mostrar indicador de carga
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    const textoOriginal = btnDescargar?.textContent || 'Descargar PDF';
    if (btnDescargar) {
      btnDescargar.disabled = true;
      btnDescargar.textContent = '⏳ Generando PDF...';
    }

    // Obtener datos para el nombre del archivo
    const contribuyente = obtenerDatosContribuyente();
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `ticket-pago-${contribuyente.dni}-${fecha}.pdf`;

    // Configuración para jsPDF
    const { jsPDF } = window.jspdf;

    // Crear instancia de jsPDF en formato A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Activar modo PDF: fuerza fuente pequeña y evita expansiones
    container.classList.add('pdf-mode');

    // Obtener todas las páginas del ticket
    const paginas = container.querySelectorAll('.ticket-page');

    for (let i = 0; i < paginas.length; i++) {
      const pagina = paginas[i];

      // Convertir la página a canvas con html2canvas
      const canvas = await html2canvas(pagina, {
        // Reducir escala para evitar imágenes gigantes y PDFs pesados
        // Mantener 1x o el mínimo entre 1 y el devicePixelRatio
        scale: Math.min(1, window.devicePixelRatio || 1),
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Convertir canvas a imagen JPEG con calidad controlada
      // Usar JPEG en vez de PNG reduce drásticamente el tamaño
      const imgData = canvas.toDataURL('image/jpeg', 0.65);

      // Calcular dimensiones para ajustar a A4
      const imgWidth = 210; // A4 width en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Si no es la primera página, agregar nueva página
      if (i > 0) {
        pdf.addPage();
      }

      // Agregar imagen al PDF con compresión
      // Usamos 'JPEG' y compresión 'FAST' para tamaño menor
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    }

    // Descargar el PDF
    pdf.save(nombreArchivo);

    // Desactivar modo PDF
    container.classList.remove('pdf-mode');

    // Restaurar botón
    if (btnDescargar) {
      btnDescargar.disabled = false;
      btnDescargar.textContent = textoOriginal;
    }

    // Mostrar mensaje de éxito
    console.log('✅ PDF descargado correctamente:', nombreArchivo);

  } catch (error) {
    console.error('Error al descargar PDF:', error);
    alert('❌ Error al generar el PDF: ' + error.message);

    // Restaurar botón
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    if (btnDescargar) {
      btnDescargar.disabled = false;
      btnDescargar.textContent = 'Descargar PDF';
    }
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

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

  // Botón generar ticket
  const btnGenerarTicket = document.getElementById('btn-generar-ticket');
  if (btnGenerarTicket) {
    btnGenerarTicket.addEventListener('click', generarTicket);
  }

  // Botón descargar PDF (superior)
  const btnDescargarPDF = document.getElementById('btn-descargar-pdf');
  if (btnDescargarPDF) {
    btnDescargarPDF.addEventListener('click', descargarPDF);
  }

  // Botón descargar PDF (inferior)
  const btnDescargarPDFBottom = document.getElementById('btn-descargar-pdf-bottom');
  if (btnDescargarPDFBottom) {
    btnDescargarPDFBottom.addEventListener('click', descargarPDF);
  }
});
