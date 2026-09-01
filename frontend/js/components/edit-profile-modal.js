export function renderEditProfileModal() {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const close = document.createElement("button")
    const heading = document.createElement("h2")
    const form = document.createElement("form")
    const nameInput = document.createElement("input")
    const usernameInput = document.createElement("input")
    const passwordInput = document.createElement("input")
    const actions = document.createElement("div")
    const cancel = document.createElement("button")
    const submit = document.createElement("button")

    modal.className = "edit-profile-modal"
    modal.hidden = true
    modal.setAttribute("aria-hidden", "true")
    panel.className = "edit-profile-modal__panel"
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-modal", "true")
    panel.setAttribute("aria-labelledby", "edit-profile-modal-title")
    close.type = "button"
    close.className = "edit-profile-modal__close"
    close.setAttribute("aria-label", "Close edit profile dialog")
    close.textContent = "X"
    heading.id = "edit-profile-modal-title"
    heading.textContent = "Edit profile"
    nameInput.name = "name"
    nameInput.placeholder = "Display name"
    usernameInput.name = "username"
    usernameInput.placeholder = "Username"
    passwordInput.name = "password"
    passwordInput.type = "password"
    passwordInput.placeholder = "New password (optional)"
    cancel.type = "button"
    cancel.className = "edit-profile-modal__cancel"
    cancel.textContent = "Cancel"
    submit.type = "submit"
    submit.className = "edit-profile-modal__submit"
    submit.textContent = "Save changes"

    function closeModal() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        form.reset()
    }

    function openModal(user = {}) {
        nameInput.value = user.name || ""
        usernameInput.value = user.username || ""
        passwordInput.value = ""
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        nameInput.focus()
    }

    close.addEventListener("click", closeModal)
    cancel.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })
    form.addEventListener("submit", (event) => {
        event.preventDefault()
    })

    actions.append(cancel, submit)
    form.append(nameInput, usernameInput, passwordInput, actions)
    panel.append(close, heading, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderEditProfileModal