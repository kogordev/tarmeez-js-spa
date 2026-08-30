import escapeHtml from "../utils/escape-html.js"

export function renderLoadingState(message = "Loading...") {
    const state = document.createElement("div")
    state.className = "loading-state"
    state.setAttribute("role", "status")
    state.setAttribute("aria-live", "polite")
    state.innerHTML = escapeHtml(message)
    return state
}

export default renderLoadingState
