/**
 * Portal de Pagos Municipal — Module / Ticket PDF
 * @description Generación y descarga de ticket PDF vectorial usando jsPDF UMD.
 *
 * Exports:
 *   descargarPDF()
 */

import { obtenerDatosContribuyente } from './generator.js';

// ---------------------------------------------------------------------------
// Generación PDF
// ---------------------------------------------------------------------------

/**
 * Descarga el ticket como PDF vectorial (texto seleccionable, tamaño optimizado).
 * @returns {Promise<void>}
 */
export async function descargarPDF() {
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

    [btnDescargar, btnDescargarBottom].forEach((btn) => {
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Generando PDF...';
      }
    });

    // Obtener datos para el nombre del archivo
    const contribuyente = obtenerDatosContribuyente();
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, '0');
    const dd = String(ahora.getDate()).padStart(2, '0');
    const fecha = `${yyyy}-${mm}-${dd}`;
    const nombreArchivo = `ticket-pago-${contribuyente.dni}-${fecha}.pdf`;

    // Configuración para jsPDF (UMD global)
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
        const colWidths = [18, 52, 20, 12, 12, 24, 24, 24]; // Total: 186mm
        const colX = [margin];
        for (let c = 0; c < colWidths.length - 1; c++) {
          colX.push(colX[c] + colWidths[c]);
        }

        // Header de la tabla
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y, contentWidth, 7, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');

        const headers = ['Fecha Vto.', 'Detalle', 'ID_BIEN', 'Cuota', 'Año', 'Importe', 'Int/Dto', 'Total'];
        headers.forEach((header, idx) => {
          const align = idx >= 5 ? 'right' : 'left';
          const xPos = idx >= 5 ? colX[idx] + colWidths[idx] - 1 : colX[idx] + 1;
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

          const rowData = Array.from(celdas).map((td) => td.textContent.trim());

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
            } else if (idx >= 5) {
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
            pdf.text(label, colX[4] + colWidths[4], y + 4, { align: 'right' });

            // Subtotal Importe
            pdf.text(celdas[1].textContent.trim(), colX[5] + colWidths[5] - 1, y + 4, { align: 'right' });
            // Subtotal Int/Dto
            pdf.text(celdas[2].textContent.trim(), colX[6] + colWidths[6] - 1, y + 4, { align: 'right' });
            // Subtotal Total
            pdf.text(celdas[3].textContent.trim(), colX[7] + colWidths[7] - 1, y + 4, { align: 'right' });
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
    [btnDescargar, btnDescargarBottom].forEach((btn) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    });

    console.log('✅ PDF vectorial descargado correctamente:', nombreArchivo);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    alert(`❌ Error al generar el PDF: ${error.message}`);

    // Restaurar botones
    [document.getElementById('btn-descargar-pdf'), document.getElementById('btn-descargar-pdf-bottom')].forEach((btn) => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Descargar PDF';
      }
    });
  }
}
