/**
 * Gestión de selección de deudas y cálculo de totales
 * @author Dante Marcos Delprato
 * @version 2.0
 */

// ============================================
// GESTIÓN DE SELECCIÓN Y TOTALES
// ============================================

function actualizarTotal() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox:checked');
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
  const checkboxesVisibles = Array.from(filasVisibles).map(f => f.querySelector('.deudas__checkbox')).filter(Boolean);
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
    const cb = fila.querySelector('.deudas__checkbox');
    if (cb) cb.checked = checkboxTodos.checked;
  });
  actualizarTotal();
}

function actualizarContadores() {
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  const totalVisibles = filasVisibles.length;
  let seleccionadasVisibles = 0;
  filasVisibles.forEach(fila => {
    const cb = fila.querySelector('.deudas__checkbox');
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
 * Convierte una fecha en formato dd/mm/yyyy a objeto Date para comparación
 * @param {string} fechaStr - Fecha en formato dd/mm/yyyy
 * @returns {Date} Objeto Date
 */
function parsearFechaParaOrden(fechaStr) {
  if (!fechaStr) return new Date(0);
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    // dd/mm/yyyy -> yyyy-mm-dd
    return new Date(partes[2], partes[1] - 1, partes[0]);
  }
  return new Date(fechaStr);
}

/**
 * Recopila los conceptos seleccionados de la tabla
 * @returns {Array} Array de conceptos seleccionados ordenados por tipo y fecha descendente
 */
function recopilarConceptosSeleccionados() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox:checked');
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

  // Ordenar por tipo (alfabético) y luego por fecha descendente
  conceptos.sort((a, b) => {
    // Primero por tipo de descripción (alfabético)
    const tipoComparacion = a.tipoDescripcion.localeCompare(b.tipoDescripcion);
    if (tipoComparacion !== 0) return tipoComparacion;

    // Luego por fecha descendente (más reciente primero)
    const fechaA = parsearFechaParaOrden(a.fechaVto);
    const fechaB = parsearFechaParaOrden(b.fechaVto);
    return fechaB - fechaA;
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
  // Si tiene clase BEM de descuento o contiene signo '-', es negativo (descuento)
  const esDescuento = celda.classList.contains('deudas__value--discount') ||
    celda.textContent.includes('-$');
  return esDescuento ? -valor : valor;
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
      container.innerHTML = '<div class=\"ticket--loading\">Generando ticket...</div>';
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
 * Descarga el ticket como PDF vectorial (texto seleccionable, tamaño optimizado)
 */
async function descargarPDF() {
  try {
    const container = document.getElementById('ticket-container');
    if (!container) {
      alert('⚠️ Primero debe generar el ticket');
      return;
    }

    // Mostrar indicador de carga en ambos botones
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    const btnDescargarBottom = document.getElementById('btn-descargar-pdf-bottom');
    const textoOriginal = '💾 Descargar PDF';

    [btnDescargar, btnDescargarBottom].forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Generando PDF...';
      }
    });

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
      format: 'a4',
      compress: true
    });

    // Dimensiones A4 en mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    // Intentar cargar el logo como imagen base64
    let logoData = null;
    const logoImg = document.querySelector('.ticket__logo-img');
    if (logoImg) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = logoImg.naturalWidth || 60;
        canvas.height = logoImg.naturalHeight || 60;
        ctx.drawImage(logoImg, 0, 0);
        logoData = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('No se pudo cargar el logo para el PDF:', e);
      }
    }

    // Intentar cargar el logo de Alcald+IA para el recuadro IMPORTANTE
    let logoAlcaldiaData = null;
    const logoAlcaldiaImg = document.querySelector('.header__icon-img');
    if (logoAlcaldiaImg) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = logoAlcaldiaImg.naturalWidth || 80;
        canvas.height = logoAlcaldiaImg.naturalHeight || 80;
        ctx.drawImage(logoAlcaldiaImg, 0, 0);
        logoAlcaldiaData = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('No se pudo cargar el logo de Alcaldía para el PDF:', e);
      }
    }

    // Obtener todas las páginas del ticket
    const paginas = container.querySelectorAll('.ticket__page');

    for (let i = 0; i < paginas.length; i++) {
      const pagina = paginas[i];

      if (i > 0) {
        pdf.addPage();
      }

      let y = margin;

      // === HEADER CON LOGO ===
      const logoSize = 18; // Tamaño del logo en mm

      // Logo arriba a la izquierda
      if (logoData) {
        pdf.addImage(logoData, 'PNG', margin, y, logoSize, logoSize);
      }

      // Título de la municipalidad (centrado, al lado del logo)
      const titulo = pagina.querySelector('.ticket__title h1')?.textContent?.trim() || 'Municipalidad';
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(titulo, pageWidth / 2, y + 8, { align: 'center' });

      // Fecha de emisión (derecha, una línea debajo del título)
      const fechaEmision = pagina.querySelector('.ticket__fecha-valor')?.textContent?.trim() || '';
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Fecha: ${fechaEmision}`, pageWidth - margin, y + 14, { align: 'right' });

      // Número de ticket (debajo de la fecha)
      pdf.text('Ticket N°: XXXX-XXXXXX', pageWidth - margin, y + 19, { align: 'right' });

      y += logoSize + 10;

      // Línea separadora
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);

      // === DIRECCIÓN DEL MUNICIPIO (CENTRADA VERTICALMENTE) ===
      const direccionItems = pagina.querySelectorAll('.ticket__direccion p');
      pdf.setFontSize(9);
      let direccionTexto = '';
      direccionItems.forEach((p, idx) => {
        direccionTexto += p.textContent.trim() + (idx < direccionItems.length - 1 ? ' | ' : '');
      });
      // Centrar verticalmente entre las dos líneas (espacio total 14mm, texto en el medio)
      pdf.text(direccionTexto, pageWidth / 2, y + 7, { align: 'center', maxWidth: contentWidth });
      y += 14;

      // Línea separadora
      pdf.line(margin, y, pageWidth - margin, y);
      // === DATOS DEL CONTRIBUYENTE (CENTRADOS VERTICALMENTE) ===
      const contribuyenteNombre = pagina.querySelector('.ticket__contribuyente p:first-child')?.textContent?.trim() || '';
      const contribuyenteDni = pagina.querySelector('.ticket__contribuyente p:last-child')?.textContent?.trim() || '';
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      // Centrar ambos datos en una línea, centrado verticalmente entre las líneas
      const contribuyenteTexto = `${contribuyenteNombre}  •  ${contribuyenteDni}`;
      pdf.text(contribuyenteTexto, pageWidth / 2, y + 7, { align: 'center' });
      y += 14;

      // Línea separadora doble
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Resumen de conceptos (solo cantidad, sin número de ticket que ya está arriba)
      const resumen = pagina.querySelector('.ticket__resumen');
      if (resumen) {
        // Extraer solo "Conceptos en ticket: X" sin el número de ticket
        const conceptosSpan = resumen.querySelector('span:first-child');
        const textoConceptos = conceptosSpan ? conceptosSpan.textContent.trim() : '';
        if (textoConceptos) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(textoConceptos, margin, y);
          y += 5;
        }
      }

      // === TABLA ===
      const tabla = pagina.querySelector('.ticket__table');
      if (tabla) {
        // Anchos de columnas (en mm) - ajustados para A4 con más espacio
        const colWidths = [20, 60, 14, 14, 26, 26, 26]; // Total: 186mm
        const colX = [margin];
        for (let c = 0; c < colWidths.length - 1; c++) {
          colX.push(colX[c] + colWidths[c]);
        }

        // Header de la tabla
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y, contentWidth, 7, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');

        const headers = ['Fecha Vto.', 'Detalle', 'Cuota', 'Año', 'Importe', 'Int/Dto', 'Total'];
        headers.forEach((header, idx) => {
          const align = idx >= 4 ? 'right' : (idx === 0 ? 'left' : 'left');
          const xPos = idx >= 4 ? colX[idx] + colWidths[idx] - 1 : colX[idx] + 1;
          pdf.text(header, xPos, y + 5, { align: align === 'right' ? 'right' : 'left' });
        });
        y += 8;

        // Línea bajo header
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 2;

        // Filas de datos
        const filas = tabla.querySelectorAll('tbody tr');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        filas.forEach((fila) => {
          const celdas = fila.querySelectorAll('td');
          if (celdas.length === 0) return;

          const rowData = Array.from(celdas).map(td => td.textContent.trim());

          // Calcular altura de fila basada en el detalle (puede requerir wrap)
          const detalleWidth = colWidths[1] - 2;
          const detalleLines = pdf.splitTextToSize(rowData[1] || '', detalleWidth);
          const rowHeight = Math.max(5, detalleLines.length * 4 + 1);

          // Verificar si necesitamos nueva página
          if (y + rowHeight > pageHeight - 45) {
            // No agregamos página aquí, el ticket ya está paginado
            return;
          }

          // Dibujar celdas
          rowData.forEach((texto, idx) => {
            if (idx === 1) {
              // Detalle con wrap
              pdf.text(detalleLines, colX[idx] + 1, y + 4);
            } else if (idx >= 4) {
              // Columnas numéricas alineadas a la derecha
              pdf.text(texto, colX[idx] + colWidths[idx] - 1, y + 4, { align: 'right' });
            } else {
              pdf.text(texto, colX[idx] + 1, y + 4);
            }
          });

          y += rowHeight;
        });

        // Espacio después de la última fila de datos
        y += 4;

        // Línea sobre footer de tabla
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 2;

        // Footer de tabla (subtotales y total)
        const footerRows = tabla.querySelectorAll('tfoot tr');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);

        footerRows.forEach((fila) => {
          const celdas = fila.querySelectorAll('td');
          if (celdas.length === 1) {
            // Fila de total general (colspan=7) - con más espacio arriba
            y += 6; // Espacio adicional antes del total
            pdf.setFontSize(11);
            pdf.text(celdas[0].textContent.trim(), pageWidth / 2, y + 5, { align: 'center' });
            y += 10;
          } else if (celdas.length >= 3) {
            // Fila de subtotales
            const label = celdas[0].textContent.trim();
            pdf.text(label, colX[3] + colWidths[3], y + 4, { align: 'right' });

            // Subtotal Importe
            pdf.text(celdas[1].textContent.trim(), colX[4] + colWidths[4] - 1, y + 4, { align: 'right' });
            // Subtotal Int/Dto
            pdf.text(celdas[2].textContent.trim(), colX[5] + colWidths[5] - 1, y + 4, { align: 'right' });
            // Subtotal Total
            pdf.text(celdas[3].textContent.trim(), colX[6] + colWidths[6] - 1, y + 4, { align: 'right' });
            y += 6;
          }
        });
      }

      y += 4;

      // === FOOTER ===
      // Mensaje de validez (SIN ICONO) + Nota de conservar comprobante
      const validez = pagina.querySelector('.ticket__validez p');
      const nota = pagina.querySelector('.ticket__nota p');

      if (validez) {
        // Obtener texto sin el emoji/icono y sin "IMPORTANTE:" duplicado
        let validezTexto = validez.textContent.trim();
        // Remover emojis al inicio (⚠️, ⛔, etc.)
        validezTexto = validezTexto.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}⚠️⛔❌✅❗❓🔔📢\s]+/u, '').trim();
        // Remover "IMPORTANTE:" si ya viene en el texto
        validezTexto = validezTexto.replace(/^IMPORTANTE:\s*/i, '').trim();

        // Obtener texto de la nota para incluirla en la caja
        let notaTexto = '';
        if (nota) {
          notaTexto = nota.textContent.trim();
        }

        // Configuración del logo de Alcaldía dentro del rectángulo
        const logoSize = 18; // Tamaño del logo en mm
        const logoMargin = 2; // Margen interno del logo
        const textAreaWidth = logoAlcaldiaData ? contentWidth - logoSize - logoMargin * 3 : contentWidth - 8;

        // Calcular tamaño del contenido con padding reducido
        const padding = 4;
        pdf.setFontSize(8); // Texto más pequeño
        const validezLines = pdf.splitTextToSize(validezTexto, textAreaWidth - (padding * 2));
        pdf.setFontSize(7); // Nota más pequeña
        const notaLines = notaTexto ? pdf.splitTextToSize(notaTexto, textAreaWidth - (padding * 2)) : [];

        // Altura total más compacta: título + validez + nota
        const validezHeight = 8 + (validezLines.length * 3.5) + (notaLines.length > 0 ? notaLines.length * 3 + 2 : 0) + padding * 2;

        // Recuadro para el mensaje importante
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, y, contentWidth, validezHeight);

        // Logo de Alcald+IA a la derecha dentro del rectángulo
        if (logoAlcaldiaData) {
          const logoX = pageWidth - margin - logoSize - logoMargin;
          const logoY = y + (validezHeight - logoSize) / 2; // Centrado verticalmente
          pdf.addImage(logoAlcaldiaData, 'PNG', logoX, logoY, logoSize, logoSize);
        }

        // Título "IMPORTANTE:" en negrita
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('IMPORTANTE:', margin + padding, y + padding + 3);

        // Texto del mensaje de validez
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(validezLines, margin + padding, y + padding + 8);

        // Texto de la nota (conserve este comprobante) dentro de la caja
        if (notaLines.length > 0) {
          const notaY = y + padding + 8 + (validezLines.length * 3.5) + 1;
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.text(notaLines, margin + padding, notaY);
        }

        y += validezHeight + 3;
      }

      // Paginación - siempre al pie de página, fuera de la caja
      const paginacion = pagina.querySelector('.ticket__paginacion p');
      if (paginacion) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(paginacion.textContent.trim(), pageWidth / 2, pageHeight - 8, { align: 'center' });
      }
    }

    // Descargar el PDF
    pdf.save(nombreArchivo);

    // Restaurar botones
    [btnDescargar, btnDescargarBottom].forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    });

    console.log('✅ PDF vectorial descargado correctamente:', nombreArchivo);

  } catch (error) {
    console.error('Error al descargar PDF:', error);
    alert('❌ Error al generar el PDF: ' + error.message);

    // Restaurar botones
    [document.getElementById('btn-descargar-pdf'), document.getElementById('btn-descargar-pdf-bottom')].forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Descargar PDF';
      }
    });
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  actualizarTotal();

  // Agregar listeners a todos los checkboxes de deudas
  const checkboxes = document.querySelectorAll('.deudas__checkbox');
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
