import defaultAuthService from "/js/services/auth-service.js"
import authStore from "/js/store/auth-store.js"

function messageFor(response) {
    const errors = response?.error?.details?.errors
    if (errors && typeof errors === "object") {
        const firstKey = Object.keys(errors)[0]
        const firstError = firstKey ? errors[firstKey] : null
        const firstMessage = Array.isArray(firstError) ? firstError[0] : firstError
        if (firstMessage) return firstMessage
    }
    return response?.error?.message || "Unable to update your profile."
}

export function renderEditProfileModal({ authService = defaultAuthService } = {}) {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const header = document.createElement("div")
    const close = document.createElement("button")
    const heading = document.createElement("h3")
    const form = document.createElement("form")
    const nameGroup = document.createElement("div")
    const nameLabel = document.createElement("label")
    const nameInput = document.createElement("input")
    const emailGroup = document.createElement("div")
    const emailLabel = document.createElement("label")
    const emailInput = document.createElement("input")
    const passwordGroup = document.createElement("div")
    const passwordLabel = document.createElement("label")
    const passwordInput = document.createElement("input")
    const error = document.createElement("p")
    const actions = document.createElement("div")
    const cancel = document.createElement("button")
    const submit = document.createElement("button")
    let activeUser = null
    let onUpdated = null


    modal.className = "modal-overlay edit-profile-modal"
    modal.hidden = true
    modal.setAttribute("aria-hidden", "true")
    panel.className = "modal-card edit-profile-modal__panel"
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-modal", "true")
    panel.setAttribute("aria-labelledby", "edit-profile-modal-title")
    header.className = "modal-card__header"
    close.type = "button"
    close.className = "btn-close edit-profile-modal__close"
    close.setAttribute("aria-label", "Close edit profile dialog")
    close.textContent = "X"
    heading.id = "edit-profile-modal-title"
    heading.textContent = "Edit Profile"
    nameGroup.className = "form-group"
    nameLabel.htmlFor = "edit-profile-name"
    nameLabel.textContent = "Display name"
    nameInput.id = "edit-profile-name"
    nameInput.className = "form-control"
    nameInput.name = "name"
    nameInput.placeholder = "Display name"
    emailGroup.className = "form-group"
    emailLabel.htmlFor = "edit-profile-email"
    emailLabel.textContent = "Email"
    emailInput.id = "edit-profile-email"
    emailInput.className = "form-control"
    emailInput.name = "email"
    emailInput.type = "email"
    emailInput.placeholder = "Email"
    passwordGroup.className = "form-group"
    passwordLabel.htmlFor = "edit-profile-password"
    passwordLabel.textContent = "New password (optional)"
    passwordInput.id = "edit-profile-password"
    passwordInput.className = "form-control"
    passwordInput.name = "password"
    passwordInput.type = "password"
    passwordInput.placeholder = "New password (optional)"
    error.className = "form-error"
    error.hidden = true
    actions.className = "modal-actions"
    cancel.type = "button"
    cancel.className = "btn btn-secondary edit-profile-modal__cancel"
    cancel.textContent = "Cancel"
    submit.type = "submit"
    submit.className = "btn btn-primary edit-profile-modal__submit"
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
        resetSubmitState()
        activeUser = null
        onUpdated = null
    }

    function openModal(user = {}, onUpdatedCallback) {
        activeUser = user
        onUpdated = onUpdatedCallback || null
        nameInput.value = user.name || ""
        emailInput.value = user.email || ""
        passwordInput.value = ""
        resetSubmitState()
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        nameInput.focus()
    }

    close.addEventListener("click", closeModal)
    cancel.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })
    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        const user = activeUser || {}
        const nameValue = nameInput.value.trim()
        const emailValue = emailInput.value.trim()
        const passwordValue = passwordInput.value.trim()
        const emailChanged = emailValue !== (user.email || "")

        if (nameValue === (user.name || "") && !emailChanged && !passwordValue) {
            closeModal()
            return
        }

        const formData = new FormData()
        formData.append("name", nameValue)
        if (emailChanged) {
            formData.append("email", emailValue)
        }
        if (passwordValue) {
            formData.append("password", passwordValue)
        }
        formData.append("_method", "PUT")

        submit.disabled = true
        submit.textContent = "Saving..."
        error.hidden = true

        const response = await authService.updateProfile(formData)
        if (response.ok) {
            const updatedUser = authStore.getUser() || { ...user, name: nameValue, email: emailValue }
            const callback = onUpdated
            closeModal()
            callback?.(updatedUser)
        } else {
            resetSubmitState(false)
            error.textContent = messageFor(response)
            error.hidden = false
        }
    })

    header.append(heading, close)
    actions.append(cancel, submit)
    nameGroup.append(nameLabel, nameInput)
    emailGroup.append(emailLabel, emailInput)
    passwordGroup.append(passwordLabel, passwordInput)
    form.append(nameGroup, emailGroup, passwordGroup, error, actions)
    panel.append(header, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderEditProfileModal