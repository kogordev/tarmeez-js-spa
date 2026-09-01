import authService from "/js/services/auth-service.js"
import authStore from "/js/store/auth-store.js"

function messageFor(response) {
    return response?.error?.message || "Unable to update your profile."
}

export function renderEditProfileModal({ service = authService, store = authStore, onSuccess, onClose } = {}) {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const close = document.createElement("button")
    const form = document.createElement("form")
    const heading = document.createElement("h2")
    const username = document.createElement("input")
    const password = document.createElement("input")
    const error = document.createElement("p")
    const submit = document.createElement("button")

    modal.className = "edit-profile-modal create-post-modal"
    modal.hidden = true
    modal.setAttribute("aria-hidden", "true")
    panel.className = "edit-profile-modal__panel create-post-modal__panel"
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-modal", "true")
    panel.setAttribute("aria-labelledby", "edit-profile-modal-title")
    close.type = "button"
    close.className = "create-post-modal__close"
    close.setAttribute("aria-label", "Close edit profile dialog")
    close.textContent = "X"
    heading.id = "edit-profile-modal-title"
    heading.textContent = "Edit profile"

    username.name = "username"
    username.placeholder = "Username"
    username.required = true
    username.setAttribute("dir", "auto")

    password.name = "password"
    password.type = "password"
    password.placeholder = "New password (optional)"
    password.autocomplete = "new-password"

    error.className = "form-error"
    error.hidden = true

    submit.type = "submit"
    submit.className = "create-post-modal__submit"
    submit.textContent = "Save changes"

    function resetSubmitState(clearError = true) {
        submit.disabled = false
        submit.textContent = "Save changes"
        if (clearError) {
            error.hidden = true
            error.textContent = ""
        }
    }

    function closeModal() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        form.reset()
        error.hidden = true
        error.textContent = ""
        onClose?.()
    }

    function openModal(user = null) {
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        resetSubmitState()
        username.value = user?.username || ""
        password.value = ""
        username.focus()
    }

    close.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })

    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        error.hidden = true

        const currentUser = store.getUser() || {}
        const usernameVal = username.value.trim()
        const passwordVal = password.value.trim()

        const input = {}
        if (usernameVal && usernameVal !== currentUser.username) {
            input.username = usernameVal
        }
        if (passwordVal) {
            input.password = passwordVal
        }

        if (Object.keys(input).length === 0) {
            closeModal()
            return
        }

        submit.disabled = true
        submit.textContent = "Saving..."

        const response = await service.updateProfile(input)
        if (response.ok) {
            closeModal()
            onSuccess?.(response.data)
        } else {
            resetSubmitState(false)
            error.textContent = messageFor(response)
            error.hidden = false
        }
    })

    form.append(username, password, error, submit)
    panel.append(close, heading, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderEditProfileModal
