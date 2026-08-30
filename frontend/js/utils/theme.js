const THEME_STORAGE_KEY = "theme"
const DARK_THEME = "dark"
const LIGHT_THEME = "light"

function isTheme(value) {
    return value === DARK_THEME || value === LIGHT_THEME
}

function systemTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? DARK_THEME : LIGHT_THEME
}

export class ThemeController {
    constructor() {
        this.theme = null
        this.mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)")
    }

    initialize() {
        let savedTheme = null
        try {
            savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
        } catch {
        }
        this.apply(isTheme(savedTheme) ? savedTheme : systemTheme())
        this.mediaQuery?.addEventListener("change", () => {
            if (!this.hasSavedTheme()) this.apply(systemTheme())
        })
        return this
    }

    hasSavedTheme() {
        try {
            return isTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
        } catch {
            return false
        }
    }

    apply(theme) {
        this.theme = theme
        document.documentElement.setAttribute("data-theme", theme)
        document.documentElement.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))
        return theme
    }

    toggle() {
        const nextTheme = this.theme === DARK_THEME ? LIGHT_THEME : DARK_THEME
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
        } catch {
        }
        return this.apply(nextTheme)
    }
}

const themeController = new ThemeController().initialize()

export default themeController