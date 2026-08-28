import postsService from "/src/js/services/posts-service.js"

function messageFor(response) {
    return response?.error?.message || "Unable to publish your post."
}

export function renderCreatePostModal({ service = postsService, onSuccess, onClose } = {}) {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const close = document.createElement("button")
    const form = document.createElement("form")
    const title = document.createElement("input")
    const body = document.createElement("textarea")
    const imageUrl = document.createElement("input")
    const imageFile = document.createElement("input")
    const error = document.createElement("p")
    const submit = document.createElement("button")

    modal.className = "create-post-modal"
    modal.hidden = true
    modal.setAttribute("aria-hidden", "true")
    panel.className = "create-post-modal__panel"
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-modal", "true")
    panel.setAttribute("aria-labelledby", "create-post-modal-title")
    close.type = "button"
    close.className = "create-post-modal__close"
    close.setAttribute("aria-label", "Close create post dialog")
    close.textContent = "X"
    const heading = document.createElement("h2")
    heading.id = "create-post-modal-title"
    heading.textContent = "Create post"
    title.name = "title"
    title.placeholder = "Title"
    title.required = true
    body.name = "body"
    body.placeholder = "Share something with the community..."
    body.required = true
    imageUrl.name = "imageUrl"
    imageUrl.type = "url"
    imageUrl.placeholder = "Image URL (optional)"
    imageFile.name = "image"
    imageFile.type = "file"
    imageFile.accept = "image/*"
    error.className = "form-error"
    error.hidden = true
    submit.type = "submit"
    submit.className = "create-post-modal__submit"
    submit.textContent = "Post"

    function closeModal() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        form.reset()
        error.hidden = true
        error.textContent = ""
        onClose?.()
    }

    function openModal() {
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        title.focus()
    }

    close.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })
    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        submit.disabled = true
        error.hidden = true
        const selectedFile = imageFile.files[0]
        const response = await service.createPost({
            title: title.value.trim(),
            body: body.value.trim(),
            image: selectedFile || imageUrl.value.trim()
        })
        if (response.ok) {
            onSuccess?.(response.data)
            closeModal()
        } else {
            error.textContent = messageFor(response)
            error.hidden = false
            submit.disabled = false
        }
    })

    form.append(title, body, imageUrl, imageFile, error, submit)
    panel.append(close, heading, form)
    modal.append(panel)
    modal.open = openModal
    modal.close = closeModal
    return modal
}

export default renderCreatePostModal