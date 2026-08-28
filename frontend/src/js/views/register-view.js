import { renderErrorState } from "/src/js/components/error-state.js"
import authService from "/src/js/services/auth-service.js"

function messageFor(response) { return response?.error?.message || "Unable to register." }

export function renderRegisterView(container, { navigate, service = authService } = {}) {
    const form = document.createElement("form")
    ;["name", "username", "email", "password"].forEach((name) => {
        const input = document.createElement("input")
        input.name = name; input.required = true; input.placeholder = name[0].toUpperCase() + name.slice(1)
        if (name === "email") input.type = "email"
        if (name === "password") input.type = "password"
        form.append(input)
    })
    const submit = document.createElement("button"); submit.type = "submit"; submit.textContent = "Register"
    const loginPrompt = document.createElement("p")
    const loginLink = document.createElement("a")
    loginPrompt.className = "auth-form__prompt"
    loginLink.href = "/login"; loginLink.dataset.link = ""; loginLink.textContent = "Already have an account? Log in"
    loginPrompt.append(loginLink)
    form.append(submit, loginPrompt)
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); submit.disabled = true
        const response = await service.register(Object.fromEntries(new FormData(form)))
        if (response.ok) navigate("/login")
        else { form.append(renderErrorState(messageFor(response))); submit.disabled = false }
    })
    container.replaceChildren(form)
    return () => {}
}

export default renderRegisterView