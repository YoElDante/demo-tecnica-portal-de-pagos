/**
 * Script de validación: Portal vs CSV del escritorio
 * 
 * Uso: node tests/intereses/validar-contra-csv.js [dni] [fecha_ref]
 *   Sin argumentos: valida TODOS los CSVs en docs/pruebas_documentos_a_comparar/ con fecha actual
 *   Con DNI: valida solo ese DNI
 *   Con fecha_ref (YYYY-MM-DD): usa esa fecha como "hoy" para el cálculo
 *   Ejemplo: node tests/intereses/validar-contra-csv.js 17720479 2026-07-02
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// ── Cargar credenciales desde .env (sin hardcodear) ──
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

if (!DB_HOST || !DB_NAME) {
  console.error('ERROR: DB_HOST y DB_NAME deben estar definidos en .env');
  console.error('  Ejemplo: DB_HOST=alcaldiasmlqdsmanzano.database.windows.net');
  process.exit(1);
}

// ── Conexión a BD ──
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  dialect: 'mssql',
  dialectOptions: { options: { encrypt: true, trustServerCertificate: false } },
  logging: false,
});

const { calcularMovimiento, calcularDiasMora } = require('../../services/intereses.service');

// ── Configuración global ──
let config = null;

async function cargarConfig() {
  const [dg] = await sequelize.query(
    'SELECT TasaInteres, TasaDescuento, IndiceFinal, FechaDesdeInt FROM dbo.DatosGenerales'
  );
  const row = dg[0];
  config = {
    tasaInteres: Number(row.TasaInteres) || 40,
    tasaDescuento: Number(row.TasaDescuento) || 0,
    indiceFinal: row.IndiceFinal != null ? Number(row.IndiceFinal) : null,
    fechaDesdeIntereses: row.FechaDesdeInt || null,
  };
}

/**
 * Parsea un archivo CSV exportado del escritorio.
 * Retorna array de { anio, cuota, tipoBien, csvImporte, csvSaldo, csvInteres, operacion }
 */
function parsearCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const parsed = [];
  for (const line of lines) {
    // Saltar encabezados
    if (line.startsWith('APELLIDO') || line.startsWith('CODIGO;')) continue;

    const cols = line.split(';');
    if (cols.length < 16) continue;

    const anioCuota = (cols[7] || '').trim();
    const nroCuota = (cols[8] || '').trim();
    const tipoBien = (cols[6] || '').trim();
    const importeStr = (cols[4] || '0').replace(',', '.');
    const saldoStr = (cols[10] || '0').replace(',', '.');
    const recStr = (cols[11] || '0').replace(',', '.');
    const operacion = parseInt(cols[12], 10) || 0;
    // ID_BIEN en CSV: '000003 000000' → extraer primera parte
    const idBienRaw = (cols[5] || '').trim();
    const idBien = idBienRaw.split(' ')[0].trim();

    const csvImporte = parseFloat(importeStr);
    const csvSaldo = parseFloat(saldoStr);
    const csvInteres = parseFloat(recStr);

    if (isNaN(csvImporte)) continue;

    parsed.push({
      anio: anioCuota,
      cuota: nroCuota,
      tipoBien,
      idBien,
      csvImporte,
      csvSaldo,
      csvInteres,
      operacion,
    });
  }

  return parsed;
}

// ── MAPEO EXPLÍCITO: nombre de archivo → DNI ──
const ARCHIVO_A_DNI = {
  'CACERES': '14537335',
  'CRAVERO': '29308519',
  'ILICH': '33083311',
  'LOPEZ': '22372096',
  'MISERENDINO': '16856346',
  'OLMOS': '12212197',
  'PLAINO': '17720479',
  'TICUPIL': '11112222',
  'VALUCH': '35667364',
  'VILCHEZ': '02787812',
};

function detectarDNI(filename) {
  for (const [clave, dni] of Object.entries(ARCHIVO_A_DNI)) {
    if (filename.toUpperCase().includes(clave)) return dni;
  }
  return null;
}

/**
 * Normaliza NRO_CUOTA: quita leading zeros ('001' → '1', '012' → '12', '000' → '0')
 */
function normalizarCuota(nro) {
  const str = (nro || '').toString().trim();
  const num = parseInt(str, 10);
  if (isNaN(num)) return str;
  return String(num);
}

/**
 * Valida un CSV contra la BD productiva y el motor de cálculo.
 */
async function validarCSV(filePath, dni, configRef = null) {
  const cfg = configRef || config;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 Validando: ${path.basename(filePath)}`);
  console.log(`   DNI: ${dni} | Fecha ref: ${cfg.fechaReferencia || 'hoy'}`);
  console.log(`${'='.repeat(70)}`);

  // 1. Parsear CSV
  const csvRows = parsearCSV(filePath);
  console.log(`   Filas CSV: ${csvRows.length}`);

  if (csvRows.length === 0) {
    console.log('   ⚠️  CSV vacío o mal formateado');
    return { ok: 0, fail: 0, skipped: 0 };
  }

  // 2. Buscar cliente en BD
  const [cliente] = await sequelize.query(
    `SELECT Codigo FROM dbo.Clientes WHERE DOCUMENTO = '${dni}'`
  );
  if (cliente.length === 0) {
    console.log(`   ❌ DNI ${dni} no encontrado en la BD`);
    return { ok: 0, fail: 0, skipped: csvRows.length };
  }
  const codigo = cliente[0].Codigo;

  // 3. Obtener deudas de BD — mismo orden que CSV (por FechaVto DESC)
    const [deudasBD] = await sequelize.query(
    `SELECT * FROM dbo.ClientesCtaCte WHERE Codigo = '${codigo}' AND CodMovim = 'H' AND Saldo > 0 ORDER BY FechaVto DESC, IdTrans DESC`
  );

  // 4. Emparejar filas — dos pasadas:
  //    Pasada 1: match exacto con ID_BIEN
  //    Pasada 2 (fallback): match sin ID_BIEN (para CSVs que no traen ID_BIEN)
  const bdDisponibles = [...deudasBD];
  const matches = [];

  for (const csvRow of csvRows) {
    const csvCuotaNorm = normalizarCuota(csvRow.cuota);
    let matchIdx = -1;

    // Pasada 1: con ID_BIEN
    for (let i = 0; i < bdDisponibles.length; i++) {
      const bd = bdDisponibles[i];
      if (
        bd.ANO_CUOTA === csvRow.anio &&
        normalizarCuota(bd.NRO_CUOTA) === csvCuotaNorm &&
        bd.TIPO_BIEN === csvRow.tipoBien &&
        Math.abs(bd.Importe - csvRow.csvImporte) < 0.02 &&
        bd.ID_BIEN === csvRow.idBien
      ) {
        matchIdx = i; break;
      }
    }

    // Pasada 2 (fallback): sin ID_BIEN
    if (matchIdx === -1 && csvRow.idBien === '') {
      for (let i = 0; i < bdDisponibles.length; i++) {
        const bd = bdDisponibles[i];
        if (
          bd.ANO_CUOTA === csvRow.anio &&
          normalizarCuota(bd.NRO_CUOTA) === csvCuotaNorm &&
          bd.TIPO_BIEN === csvRow.tipoBien &&
          Math.abs(bd.Importe - csvRow.csvImporte) < 0.02
        ) {
          matchIdx = i; break;
        }
      }
    }

    if (matchIdx >= 0) {
      const bdRow = bdDisponibles.splice(matchIdx, 1)[0];
      matches.push({ csvRow, bdRow });
    } else {
      matches.push({ csvRow, bdRow: null });
    }
  }

  // 5. Comparar
  let ok = 0, fail = 0, skipped = 0;

  for (const { csvRow, bdRow } of matches) {
    if (!bdRow) {
      skipped++;
      continue;
    }

    const resultado = calcularMovimiento(bdRow, cfg);

    const diffImporte = Math.abs(bdRow.Importe - csvRow.csvImporte);
    const diffSaldo = Math.abs(bdRow.Saldo - csvRow.csvSaldo);
    const diffInteres = Math.abs(resultado.interes - csvRow.csvInteres);

    const tolerancia = 0.1;
    const okImporte = diffImporte <= tolerancia;
    const okSaldo = diffSaldo <= tolerancia;
    const okInteres = diffInteres <= tolerancia;
    const filaOk = okImporte && okSaldo && okInteres;

    if (filaOk) {
      ok++;
    } else {
      fail++;
      const detalles = [];
      if (!okImporte) detalles.push(`Importe: BD=${bdRow.Importe} vs CSV=${csvRow.csvImporte}`);
      if (!okSaldo) detalles.push(`Saldo: BD=${bdRow.Saldo} vs CSV=${csvRow.csvSaldo}`);
      if (!okInteres) detalles.push(`Interés: Portal=${resultado.interes.toFixed(2)} vs CSV=${csvRow.csvInteres.toFixed(2)} (tipo=${resultado.tipo})`);
      console.log(`   ❌ ${csvRow.anio}/${csvRow.cuota} (${csvRow.tipoBien}): ${detalles.join(' | ')}`);
    }
  }

  // 6. Resumen
  const totalComparadas = ok + fail;
  console.log(`   ✅ Coinciden: ${ok}/${totalComparadas}`);
  if (fail > 0) console.log(`   ❌ Diferencias: ${fail}/${totalComparadas}`);
  if (skipped > 0) console.log(`   ⚠️  Sin match BD: ${skipped}`);

  return { ok, fail, skipped };
}

// ── MAIN ──
async function main() {
  const args = process.argv.slice(2);
  const dniFilter = args[0] || null;
  const fechaRef = args[1] || null; // YYYY-MM-DD para testing

  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a BD El Manzano productiva');
    await cargarConfig();
    if (fechaRef) {
      config.fechaReferencia = fechaRef;
      console.log('✅ Fecha referencia:', fechaRef);
    }
    console.log('✅ Configuración:', JSON.stringify({ ...config, fechaReferencia: config.fechaReferencia || 'hoy' }));

    // Encontrar CSVs
    const formulasDir = path.join(__dirname, '..', '..', 'docs', 'pruebas_documentos_a_comparar');
    const files = fs.readdirSync(formulasDir).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
      console.log('⚠️  No se encontraron archivos CSV en docs/pruebas_documentos_a_comparar/');
      return;
    }

    // Excluir PLAINO (AUAU — fuera del scope inicial)
    const archivosValidos = files.filter(f => !f.toUpperCase().includes('PLAINO'));

    // Mapa DNI → archivo (extraer DNI del nombre o buscar en BD)
    const resultados = [];

    for (const file of archivosValidos) {
      const filePath = path.join(formulasDir, file);

      // Detectar fecha del CSV desde el nombre
      let fechaCSV = fechaRef;
      if (!fechaCSV) {
        const fechaMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        if (fechaMatch) fechaCSV = fechaMatch[1];
      }

      // Detectar DNI por mapeo explícito
      const dni = detectarDNI(file);
      if (!dni) {
        console.log(`⚠️  No se pudo determinar DNI para ${file}, salteando...`);
        continue;
      }

      if (dniFilter && dni !== dniFilter) continue;

      const configConFecha = { ...config };
      if (fechaCSV) configConFecha.fechaReferencia = fechaCSV;

      const r = await validarCSV(filePath, dni, configConFecha);
      resultados.push({ file, dni, fechaCSV, ...r });
    }

    // ── RESUMEN FINAL ──
    console.log(`\n${'═'.repeat(70)}`);
    console.log('📊 RESUMEN FINAL');
    console.log(`${'═'.repeat(70)}`);

    let totalOk = 0, totalFail = 0, totalSkipped = 0;
    for (const r of resultados) {
      totalOk += r.ok;
      totalFail += r.fail;
      totalSkipped += r.skipped;
      const icon = r.fail === 0 ? '✅' : '❌';
      console.log(`${icon} ${r.file} (DNI ${r.dni}): ${r.ok} OK, ${r.fail} fallas, ${r.skipped} sin match`);
    }

    console.log(`\n🏁 Total: ${totalOk} coinciden, ${totalFail} diferencias, ${totalSkipped} sin match en BD`);

    if (totalFail === 0 && totalOk > 0) {
      console.log('\n🎉 ¡EL PORTAL REPLICA EXACTAMENTE LOS MONTOS DEL ESCRITORIO!');
    } else if (totalFail > 0) {
      console.log(`\n⚠️  Hay ${totalFail} diferencias que requieren revisión.`);
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await sequelize.close();
  }
}

main();
