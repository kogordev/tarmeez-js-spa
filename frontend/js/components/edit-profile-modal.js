export function renderEditProfileModal() {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const header = document.createElement("div")
    const close = document.createElement("button")
    const heading = document.createElement("h3")
    const form = document.createElement("form")
    const nameGroup = document.createElement("div")
    const nameLabel = document.createElement("label")
    const nameInput = document.createElement("input")
    const usernameGroup = document.createElement("div")
    const usernameLabel = document.createElement("label")
    const usernameInput = document.createElement("input")
    const passwordGroup = document.createElement("div")
    const passwordLabel = document.createElement("label")
    const passwordInput = document.createElement("input")
    const actions = document.createElement("div")
    const cancel = document.createElement("button")
    const submit = document.createElement("button")

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
    usernameGroup.className = "form-group"
    usernameLabel.htmlFor = "edit-profile-username"
    usernameLabel.textContent = "Username"
    usernameInput.id = "edit-profile-username"
    usernameInput.className = "form-control"
    usernameInput.name = "username"
    usernameInput.placeholder = "Username"
    passwordGroup.className = "form-group"
    passwordLabel.htmlFor = "edit-profile-password"
    passwordLabel.textContent = "New password (optional)"
    passwordInput.id = "edit-profile-password"
    passwordInput.className = "form-control"
    passwordInput.name = "password"
    passwordInput.type = "password"
    passwordInput.placeholder = "New password (optional)"
    actions.className = "modal-actions"
    cancel.type = "button"
    cancel.className = "btn btn-secondary edit-profile-modal__cancel"
    cancel.textContent = "Cancel"
    submit.type = "submit"
    submit.className = "btn btn-primary edit-profile-modal__submit"
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

    header.append(heading, close)
    actions.append(cancel, submit)
    nameGroup.append(nameLabel, nameInput)
    usernameGroup.append(usernameLabel, usernameInput)
    passwordGroup.append(passwordLabel, passwordInput)
    form.append(nameGroup, usernameGroup, passwordGroup, actions)
    panel.append(header, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderEditProfileModal