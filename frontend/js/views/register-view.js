import { renderErrorState } from "/js/components/error-state.js"
import authService from "/js/services/auth-service.js"

function messageFor(response) { return response?.error?.message || "Unable to register." }

export function renderRegisterView(container, { navigate, service = authService } = {}) {
    const form = document.createElement("form")
    const error = document.createElement("p")
    form.className = "auth-form"
    ;["name", "username", "email", "password"].forEach((name) => {
        const input = document.createElement("input")
        input.name = name; input.required = true
        if (name === "name") input.placeholder = "Name"
        if (name === "username") input.placeholder = "Username"
        if (name === "email") { input.type = "email"; input.placeholder = "Email" }
        if (name === "password") { input.type = "password"; input.placeholder = "Password" }
        form.append(input)
    })
    const imageLabel = document.createElement("label")
    const imageInput = document.createElement("input")
    imageLabel.htmlFor = "register-image"
    imageLabel.textContent = "Profile Picture (Optional)"
    imageInput.id = "register-image"
    imageInput.type = "file"
    imageInput.accept = "image/*"
    imageInput.className = "form-control"
    form.append(imageLabel, imageInput)
    const submit = document.createElement("button"); submit.type = "submit"; submit.textContent = "Register"
    const loginPrompt = document.createElement("p")
    const loginLink = document.createElement("a")
    error.className = "form-error"
    loginPrompt.className = "auth-form__prompt"
    loginLink.href = "#/login"; loginLink.dataset.link = ""; loginLink.textContent = "Already have an account? Log in"
    loginPrompt.append(loginLink)
    form.append(submit, error, loginPrompt)
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); submit.disabled = true; error.textContent = ""
        const formData = new FormData(form)
        const file = imageInput.files[0]
        if (file) formData.append("image", file)
        const response = await service.register(formData)
        if (response.ok) navigate("#/login")
        else { error.replaceWith(renderErrorState(messageFor(response))); submit.disabled = false }
    })
    container.replaceChildren(form)
    return () => {}
}

export default renderRegisterView