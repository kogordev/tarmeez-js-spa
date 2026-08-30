import escapeHtml from "../utils/escape-html.js"
import authStore from "../store/auth-store.js"
import themeController from "../utils/theme.js"

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
    const githubLink = document.createElement("a")
    const githubIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const githubPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const emailLink = document.createElement("a")
    const emailIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const emailPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
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

    githubLink.className = "site-header__external-link"
    githubLink.href = "https://github.com/kogordev"
    githubLink.target = "_blank"
    githubLink.rel = "noopener noreferrer"
    githubLink.setAttribute("aria-label", "GitHub Profile")
    githubLink.setAttribute("title", "GitHub Profile")
    githubIcon.setAttribute("viewBox", "0 0 24 24")
    githubIcon.setAttribute("aria-hidden", "true")
    githubPath.setAttribute("d", "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2.18c-3.2.7-3.88-1.37-3.88-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.7.08-.69.08-.69 1.15.08 1.75 1.17 1.75 1.17 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.75 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z")
    githubIcon.appendChild(githubPath)
    githubLink.appendChild(githubIcon)

    emailLink.className = "site-header__external-link"
    emailLink.href = "mailto:kogordev@gmail.com"
    emailLink.setAttribute("aria-label", "Contact Developer")
    emailLink.setAttribute("title", "Contact Developer")
    emailIcon.setAttribute("viewBox", "0 0 24 24")
    emailIcon.setAttribute("aria-hidden", "true")
    emailPath.setAttribute("d", "M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75Zm2.2-.75 6.8 5.6 6.8-5.6H5.2Zm13.55 2.1-6.3 5.17a1 1 0 0 1-1.3 0L5.25 8.1v9.15c0 .41.34.75.75.75h12c.41 0 .75-.34.75-.75V8.1Z")
    emailIcon.appendChild(emailPath)
    emailLink.appendChild(emailIcon)

    emailLink.addEventListener("click", () => {
        const copyPromise = navigator.clipboard?.writeText("kogordev@gmail.com")
        if (!copyPromise) return

        copyPromise.then(() => {
            const existingToast = document.body.querySelector(".tarmeez-toast")
            if (existingToast) existingToast.remove()

            const toast = document.createElement("div")
            toast.className = "tarmeez-toast"
            toast.textContent = "Email copied to clipboard!"
            toast.style.position = "fixed"
            toast.style.right = "24px"
            toast.style.bottom = "24px"
            toast.style.zIndex = "9999"
            toast.style.padding = "12px 16px"
            toast.style.borderRadius = "999px"
            toast.style.fontSize = "0.9rem"
            document.body.appendChild(toast)
            window.setTimeout(() => toast.remove(), 2200)
        }).catch(() => {})
    })

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
    account.append(themeToggle, githubLink, emailLink, accountLabel, action, registerLink)
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
