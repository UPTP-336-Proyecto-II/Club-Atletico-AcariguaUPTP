function normalizeDateInput(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidExistingDate(dateValue) {
  const value = normalizeDateInput(dateValue);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function validateDateField(value, label, { required = false, notFuture = false } = {}) {
  const normalized = normalizeDateInput(value);

  if (!normalized) {
    return required ? `${label} es obligatoria` : null;
  }

  if (!isValidExistingDate(normalized)) {
    return `${label} no es valida. Debe ser una fecha existente en formato YYYY-MM-DD`;
  }

  if (notFuture && normalized > getTodayLocalDate()) {
    return `${label} no puede ser futura`;
  }

  return null;
}

module.exports = {
  normalizeDateInput,
  isValidExistingDate,
  validateDateField
};
