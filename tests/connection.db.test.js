// const sequelize = require('../config/database.config.manzano.js');
const sequelize = require('../config/database.config.sanjosedelassalinas.js');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la BD: OK');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error al conectar a la BD:', err.message || err);
    process.exit(1);
  }
})();