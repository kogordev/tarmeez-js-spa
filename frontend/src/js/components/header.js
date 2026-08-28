import escapeHtml from "/src/js/utils/escape-html.js"
import authStore from "/src/js/store/auth-store.js"

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

    function update(state = store.getState()) {
        const authenticated = Boolean(state.isAuthenticated)
        accountLabel.hidden = !authenticated
        registerLink.hidden = authenticated
        action.dataset.authenticated = String(authenticated)
        setSafeText(accountLabel, authenticated ? getUserLabel(state.user) : "")
        setSafeText(action, authenticated ? "Log out" : "Log in")
    }

    nav.append(homeLink, account)
    account.append(accountLabel, action, registerLink)
    header.append(nav)
    update()

    const unsubscribe = store.subscribe(update)
    header.destroy = unsubscribe
    return header
}

export default renderHeader
