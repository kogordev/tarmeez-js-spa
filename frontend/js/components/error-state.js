import escapeHtml from "/js/utils/escape-html.js"

export function renderErrorState(message = "Something went wrong.", { onRetry } = {}) {
    const state = document.createElement("div")
    state.className = "error-state"
    state.setAttribute("role", "alert")

    const text = document.createElement("p")
    text.innerHTML = escapeHtml(message)
    state.append(text)

    if (onRetry) {
        const retry = document.createElement("button")
        retry.type = "button"
        retry.className = "error-state__retry"
        retry.innerHTML = escapeHtml("Try again")
        retry.addEventListener("click", onRetry)
        state.append(retry)
    }

    return state
}

export default renderErrorState
