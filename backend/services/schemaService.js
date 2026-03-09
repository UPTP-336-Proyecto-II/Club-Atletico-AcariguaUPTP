const pool = require('../config/database');

let tablesCachePromise = null;

const LEGACY_ATHLETE_STATUS = {
  0: 'SUSPENDIDO',
  1: 'ACTIVO',
  2: 'LESIONADO',
  3: 'INACTIVO'
};

const LEGACY_ATTENDANCE_STATUS = {
  0: 'ausente',
  1: 'presente',
  2: 'justificativo'
};

const LEGACY_ACTIVITY_TYPE = {
  0: 'Partido',
  1: 'Entrenamiento',
  2: 'Evento especial'
};

async function getTables() {
  if (!tablesCachePromise) {
    tablesCachePromise = pool.execute('SHOW TABLES')
      .then(([rows]) => new Set(rows.map(row => Object.values(row)[0])))
      .catch(error => {
        tablesCachePromise = null;
        throw error;
      });
  }

  return tablesCachePromise;
}

async function hasTable(tableName) {
  const tables = await getTables();
  return tables.has(tableName);
}

async function isLegacySchema() {
  const tables = await getTables();
  return tables.has('personal') && !tables.has('plantel');
}

function mapLegacyAthleteStatus(value) {
  const numericValue = Number(value);
  return LEGACY_ATHLETE_STATUS[numericValue] || String(value || '').toUpperCase();
}

function mapAthleteStatusToLegacy(value) {
  const normalized = String(value || '').trim().toUpperCase();

  switch (normalized) {
    case 'SUSPENDIDO':
      return 0;
    case 'ACTIVO':
      return 1;
    case 'LESIONADO':
      return 2;
    case 'INACTIVO':
      return 3;
    default:
      return 1;
  }
}

function mapAttendanceStatusToApi(value) {
  if (typeof value === 'number' || /^\d+$/.test(String(value || ''))) {
    return LEGACY_ATTENDANCE_STATUS[Number(value)] || 'presente';
  }

  const normalized = String(value || '').trim().toLowerCase();

  switch (normalized) {
    case 'presente':
      return 'presente';
    case 'ausente':
      return 'ausente';
    case 'justificado':
    case 'justificativo':
      return 'justificativo';
    default:
      return normalized || 'presente';
  }
}

function mapAttendanceStatusToLegacy(value) {
  switch (mapAttendanceStatusToApi(value)) {
    case 'ausente':
      return 0;
    case 'justificativo':
      return 2;
    case 'presente':
    default:
      return 1;
  }
}

function mapAttendanceStatusToNormalized(value) {
  switch (mapAttendanceStatusToApi(value)) {
    case 'ausente':
      return 'Ausente';
    case 'justificativo':
      return 'Justificado';
    case 'presente':
    default:
      return 'Presente';
  }
}

function mapActivityTypeToApi(value) {
  if (typeof value === 'number' || /^\d+$/.test(String(value || ''))) {
    return LEGACY_ACTIVITY_TYPE[Number(value)] || 'Evento especial';
  }

  const normalized = String(value || '').trim().toLowerCase();

  switch (normalized) {
    case 'partido':
      return 'Partido';
    case 'entrenamiento':
      return 'Entrenamiento';
    case 'evento especial':
      return 'Evento especial';
    default:
      return value || 'Entrenamiento';
  }
}

function mapActivityTypeToLegacy(value) {
  switch (mapActivityTypeToApi(value)) {
    case 'Partido':
      return 0;
    case 'Evento especial':
      return 2;
    case 'Entrenamiento':
    default:
      return 1;
  }
}

module.exports = {
  getTables,
  hasTable,
  isLegacySchema,
  mapLegacyAthleteStatus,
  mapAthleteStatusToLegacy,
  mapAttendanceStatusToApi,
  mapAttendanceStatusToLegacy,
  mapAttendanceStatusToNormalized,
  mapActivityTypeToApi,
  mapActivityTypeToLegacy
};
