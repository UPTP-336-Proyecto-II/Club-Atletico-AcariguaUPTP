const THEME_STORAGE_KEY = 'theme'
const LIGHT_THEME = 'light'
const DARK_THEME = 'dark'

function normalizeTheme(theme) {
  return theme === DARK_THEME ? DARK_THEME : LIGHT_THEME
}

export function getSavedTheme() {
  return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY))
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme)
  document.documentElement.setAttribute('data-theme', normalizedTheme)
  document.documentElement.classList.toggle('dark', normalizedTheme === DARK_THEME)
  return normalizedTheme
}

export function saveTheme(theme) {
  const normalizedTheme = applyTheme(theme)
  localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  return normalizedTheme
}

export function initializeTheme() {
  return applyTheme(getSavedTheme())
}
