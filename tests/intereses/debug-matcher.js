const fs = require('fs');
const path = require('path');
const { sequelize } = require('../../config');

(async () => {
  await sequelize.authenticate();

  const filePath = path.join('docs', 'pruebas_csv', 'Cons CRAVERO MARIA LORENA2026-07-03-024742.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.indexOf('APELLIDO') === -1 && l.indexOf('CODIGO;') === -1);

  const [deudasBD] = await sequelize.query(
    "SELECT Operacion, ANO_CUOTA, NRO_CUOTA, TIPO_BIEN, ID_BIEN, Saldo, Importe FROM dbo.ClientesCtaCte WHERE Codigo = (SELECT Codigo FROM dbo.Clientes WHERE DOCUMENTO = '29308519') AND Saldo > 0"
  );

  console.log('CSV rows:', lines.length, '| BD rows:', deudasBD.length);

  console.log('\n=== Primeras 5 filas CSV SIN match ===');
  let unmatched = 0;
  for (const line of lines) {
    const cols = line.split(';');
    if (cols.length < 13) continue;
    const csvAnio = cols[7].trim();
    const csvCuota = cols[8].trim();
    const csvTipoBien = cols[6].trim();
    const csvOperacion = parseInt(cols[12], 10) || 0;

    let found = null;
    for (const d of deudasBD) {
      if (d.Operacion === csvOperacion || d.Operacion + 100000000 === csvOperacion) { found = d; break; }
    }
    if (found === null) {
      for (const d of deudasBD) {
        if (d.ANO_CUOTA === csvAnio && d.NRO_CUOTA === csvCuota && d.TIPO_BIEN === csvTipoBien) { found = d; break; }
      }
    }

    if (found === null && unmatched < 5) {
      console.log('CSV: anio=' + csvAnio + ' cuota=' + csvCuota + ' tipo=' + csvTipoBien + ' op=' + csvOperacion + ' importe=' + cols[4]);
      unmatched++;
    }
  }

  console.log('\n=== Muestras BD (primeras 5) ===');
  for (let i = 0; i < Math.min(5, deudasBD.length); i++) {
    const d = deudasBD[i];
    console.log('BD: anio=' + d.ANO_CUOTA + ' cuota=' + d.NRO_CUOTA + ' tipo=' + d.TIPO_BIEN + ' op=' + d.Operacion + ' idBien=' + d.ID_BIEN + ' saldo=' + d.Saldo);
  }

  await sequelize.close();
})();
