import escapeHtml from "/src/js/utils/escape-html.js"
import authStore from "/src/js/store/auth-store.js"
import themeController from "/src/js/utils/theme.js"

function setSafeText(element, value) {
    element.innerHTML = escapeHtml(value)
}

function getUserLabel(user) {
    return user?.name || user?.username || "Account"
}

export function renderHeader({ store = authStore, onLogin, onLogout, onNavigate } = {}) {
    const header = document.createElement("header")
    const nav = document.createElement("nav")
    const homeLink = document.createElement("a")
    const account = document.createElement("div")
    const accountLabel = document.createElement("span")
    const themeToggle = document.createElement("button")
    const themeIcon = document.createElement("span")
    const action = document.createElement("button")
    const registerLink = document.createElement("a")

    header.className = "site-header"
    nav.className = "site-header__nav"
    homeLink.className = "site-header__home"
    homeLink.href = "/"
    homeLink.dataset.link = ""
    setSafeText(homeLink, "Tarmeez")
    account.className = "site-header__account"
    accountLabel.className = "site-header__user"
    themeToggle.type = "button"
    themeToggle.className = "site-header__theme"
    themeIcon.className = "site-header__theme-icon"
    themeIcon.setAttribute("aria-hidden", "true")
    action.type = "button"
    action.className = "site-header__action"
    registerLink.className = "site-header__action site-header__register"
    registerLink.href = "/register"
    registerLink.dataset.link = ""
    setSafeText(registerLink, "Register")

    homeLink.addEventListener("click", (event) => {
        if (onNavigate) {
            event.preventDefault()
            onNavigate("/")
        }
    })

    action.addEventListener("click", () => {
        const state = store.getState()
        if (state.isAuthenticated) {
            if (onLogout) {
                onLogout()
            } else {
                store.clear()
            }
        } else if (onLogin) {
            onLogin()
        }
    })

    themeToggle.addEventListener("click", () => {
        themeController.toggle()
    })

    function updateTheme() {
        const dark = themeController.theme === "dark"
        themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme")
        themeToggle.setAttribute("title", dark ? "Switch to light theme" : "Switch to dark theme")
        themeToggle.setAttribute("aria-pressed", String(dark))
        themeIcon.textContent = dark ? "☀" : "☾"
        setSafeText(themeToggle, "")
        themeToggle.append(themeIcon, document.createTextNode(dark ? " Light" : " Dark"))
    }

    function update(state = store.getState()) {
        const authenticated = Boolean(state.isAuthenticated)
        accountLabel.hidden = !authenticated
        registerLink.hidden = authenticated
        action.dataset.authenticated = String(authenticated)
        setSafeText(accountLabel, authenticated ? getUserLabel(state.user) : "")
        setSafeText(action, authenticated ? "Log out" : "Log in")
    }

    nav.append(homeLink, account)
    account.append(themeToggle, accountLabel, action, registerLink)
    header.append(nav)
    update()
    updateTheme()

    const unsubscribe = store.subscribe(update)
    const onThemeChange = () => updateTheme()
    document.documentElement.addEventListener("themechange", onThemeChange)
    header.destroy = () => {
        unsubscribe()
        document.documentElement.removeEventListener("themechange", onThemeChange)
    }
    return header
}

export default renderHeader
