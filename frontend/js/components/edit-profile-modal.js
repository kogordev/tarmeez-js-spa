import authStore from "/js/store/auth-store.js"

export function renderEditProfileModal({ store = authStore, onClose } = {}) {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const close = document.createElement("button")
    const heading = document.createElement("h2")
    const form = document.createElement("form")
    const nameLabel = document.createElement("label")
    const name = document.createElement("input")
    const usernameLabel = document.createElement("label")
    const username = document.createElement("input")
    const passwordLabel = document.createElement("label")
    const password = document.createElement("input")
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

    nameLabel.htmlFor = "edit-profile-name"
    nameLabel.textContent = "Name"
    name.id = "edit-profile-name"
    name.name = "name"
    name.required = true
    name.autocomplete = "name"

    usernameLabel.htmlFor = "edit-profile-username"
    usernameLabel.textContent = "Username"
    username.id = "edit-profile-username"
    username.name = "username"
    username.required = true
    username.autocomplete = "username"

    passwordLabel.htmlFor = "edit-profile-password"
    passwordLabel.textContent = "New Password"
    password.id = "edit-profile-password"
    password.name = "password"
    password.type = "password"
    password.placeholder = "Leave empty to keep current password"
    password.autocomplete = "new-password"

    actions.className = "edit-profile-modal__actions"
    cancel.type = "button"
    cancel.className = "edit-profile-modal__cancel"
    cancel.textContent = "Cancel"
    submit.type = "submit"
    submit.className = "edit-profile-modal__submit"
    submit.textContent = "Save Changes"

    function closeModal() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        form.reset()
        onClose?.()
    }

    function openModal() {
        const currentUser = store.getUser() || {}
        name.value = currentUser.name || currentUser.username || ""
        username.value = currentUser.username || ""
        password.value = ""
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        name.focus()
    }

    close.addEventListener("click", closeModal)
    cancel.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })
    form.addEventListener("submit", (event) => event.preventDefault())

    actions.append(cancel, submit)
    form.append(nameLabel, name, usernameLabel, username, passwordLabel, password, actions)
    panel.append(close, heading, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderEditProfileModal