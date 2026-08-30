import { renderErrorState } from "../components/error-state.js"
import authService from "../services/auth-service.js"

function messageFor(response) { return response?.error?.message || "Unable to log in." }

export function renderLoginView(container, { navigate, service = authService } = {}) {
    const form = document.createElement("form")
    const username = document.createElement("input")
    const password = document.createElement("input")
    const submit = document.createElement("button")
    const error = document.createElement("p")
    const registerPrompt = document.createElement("p")
    const registerLink = document.createElement("a")
    form.className = "auth-form"
    username.name = "username"; username.required = true; username.placeholder = "Username"
    password.name = "password"; password.required = true; password.type = "password"; password.placeholder = "Password"
    submit.type = "submit"; submit.textContent = "Log in"
    error.className = "form-error"
    registerPrompt.className = "auth-form__prompt"
    registerLink.href = "/register"; registerLink.dataset.link = ""; registerLink.textContent = "Don't have an account? Register here"
    registerPrompt.append(registerLink)
    form.append(username, password, submit, error, registerPrompt)
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); submit.disabled = true; error.textContent = ""
        const response = await service.login({ username: username.value, password: password.value })
        if (response.ok) navigate("/")
        else { error.replaceWith(renderErrorState(messageFor(response))); submit.disabled = false }
    })
    container.replaceChildren(form)
    return () => {}
}

export default renderLoginView