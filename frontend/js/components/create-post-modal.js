import postsService from "/js/services/posts-service.js"

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
    let editingPost = null

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
    title.setAttribute("dir", "auto")
    body.name = "body"
    body.placeholder = "Share something with the community..."
    body.required = true
    body.setAttribute("dir", "auto")
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
    submit.textContent = "Create"

    function resetSubmitState(clearError = true) {
        submit.disabled = false
        submit.classList.remove("loading", "is-loading")
        submit.textContent = editingPost ? "Save changes" : "Create"
        if (clearError) {
            error.hidden = true
            error.textContent = ""
        }
    }

    function showToast(message) {
        const toast = document.createElement("div")
        toast.className = "tarmeez-toast"
        toast.textContent = message
        toast.style.position = "fixed"
        toast.style.right = "24px"
        toast.style.bottom = "24px"
        toast.style.zIndex = "9999"
        toast.style.padding = "12px 16px"
        toast.style.borderRadius = "999px"
        toast.style.fontSize = "0.9rem"
        document.body.appendChild(toast)
        window.setTimeout(() => toast.remove(), 2200)
    }

    function closeModal() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        form.reset()
        error.hidden = true
        error.textContent = ""
        imageFile.value = ""
        editingPost = null
        onClose?.()
    }

    function openModal(post = null) {
        editingPost = post
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        heading.textContent = editingPost ? "Edit post" : "Create post"
        resetSubmitState()
        title.value = editingPost?.title || ""
        body.value = editingPost?.body || ""
        imageUrl.value = editingPost?.imageUrl || ""
        imageUrl.hidden = Boolean(editingPost)
        imageFile.value = ""
        title.focus()
    }

    close.addEventListener("click", closeModal)
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal()
    })
    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        submit.disabled = true
        submit.textContent = editingPost ? "Saving..." : "Creating..."
        error.hidden = true
        const selectedFile = imageFile.files?.[0]
        const input = {
            title: title.value.trim(),
            body: body.value.trim()
        }

        if (editingPost) {
            if (selectedFile) {
                input.image = selectedFile
            }
        } else {
            input.image = selectedFile || imageUrl.value.trim()
        }

        try {
            const response = editingPost
                ? await service.updatePost(editingPost.id, input)
                : await service.createPost(input)
            if (response.ok) {
                const wasEditing = Boolean(editingPost)
                closeModal()
                showToast(wasEditing ? "Post updated successfully." : "Post published successfully.")
                onSuccess?.(response.data)
            } else {
                resetSubmitState(false)
                error.textContent = messageFor(response)
                error.hidden = false
                showToast(messageFor(response))
            }
        } catch (requestError) {
            resetSubmitState(false)
            error.textContent = requestError?.message || "Unable to publish your post."
            error.hidden = false
            showToast(error.textContent)
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