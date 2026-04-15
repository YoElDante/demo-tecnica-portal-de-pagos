/**
 * Runner de mantenimiento de tickets de pago.
 * Ejecuta procedimientos SQL de expiracion y purga en la BD de cada portal.
 */

const { sequelize } = require('../config');

let started = false;

const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
};

const toInt = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const extractFirstCount = (queryResult, key) => {
  // MSSQL + Sequelize puede devolver distintos formatos según el statement.
  const rows = Array.isArray(queryResult) ? queryResult[0] : queryResult;
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  if (!firstRow || typeof firstRow !== 'object') {
    return null;
  }

  const value = firstRow[key];
  return typeof value === 'number' ? value : null;
};

const runExpire = async () => {
  try {
    const result = await sequelize.query('EXEC dbo.sp_TicketsPago_MarcarExpirados');
    const expired = extractFirstCount(result, 'tickets_expirados');
    console.log(`[tickets-maintenance] Expiracion operativa ejecutada (tickets_expirados=${expired ?? 'n/a'})`);
  } catch (error) {
    console.warn(`[tickets-maintenance] No se pudo ejecutar expiracion: ${error.message}`);
  }
};

const runPurge = async (retentionDays, dryRun) => {
  try {
    const dryRunBit = dryRun ? 1 : 0;
    const result = await sequelize.query(
      `EXEC dbo.sp_TicketsPago_PurgarNoPagados @DiasRetencionNoPagados = ${retentionDays}, @DryRun = ${dryRunBit}`
    );

    const candidates = extractFirstCount(result, 'candidate_tickets');
    const deleted = extractFirstCount(result, 'deleted_tickets');

    console.log(
      `[tickets-maintenance] Purga de no pagados ejecutada (dias=${retentionDays}, dryRun=${dryRun}, candidate_tickets=${candidates ?? 'n/a'}, deleted_tickets=${deleted ?? 'n/a'})`
    );
  } catch (error) {
    console.warn(`[tickets-maintenance] No se pudo ejecutar purga: ${error.message}`);
  }
};

const startTicketsMaintenance = () => {
  if (started) {
    return;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  const enabledByDefault = !isDevelopment && !isTest;
  const enabled = toBool(process.env.TICKETS_MAINTENANCE_ENABLED, enabledByDefault);

  if (!enabled || isTest) {
    return;
  }

  const expireIntervalMinutes = toInt(process.env.TICKETS_EXPIRE_INTERVAL_MINUTES, 15);
  const purgeIntervalHours = toInt(process.env.TICKETS_PURGE_INTERVAL_HOURS, 24);
  const retentionDays = toInt(process.env.TICKETS_PURGE_RETENTION_DAYS, 45);
  const dryRun = toBool(process.env.TICKETS_PURGE_DRY_RUN, true);

  // Primera ejecucion al iniciar el proceso
  runExpire();
  runPurge(retentionDays, dryRun);

  setInterval(() => {
    runExpire();
  }, expireIntervalMinutes * 60 * 1000);

  setInterval(() => {
    runPurge(retentionDays, dryRun);
  }, purgeIntervalHours * 60 * 60 * 1000);

  started = true;

  console.log('[tickets-maintenance] Runner iniciado', {
    expireIntervalMinutes,
    purgeIntervalHours,
    retentionDays,
    dryRun
  });
};

module.exports = {
  startTicketsMaintenance
};
