let imageModal = null
let closeTimer = null

export function closeImageModal() {
    imageModal?.close()
}

function createImageModal() {
    const overlay = document.createElement("div")
    const image = document.createElement("img")
    const closeButton = document.createElement("button")

    overlay.className = "image-modal"
    overlay.hidden = true
    overlay.setAttribute("aria-hidden", "true")
    image.className = "image-modal__image"
    closeButton.className = "image-modal__close"
    closeButton.type = "button"
    closeButton.setAttribute("aria-label", "Close image preview")
    closeButton.textContent = "×"

    const close = () => {
        if (overlay.hidden) return

        overlay.classList.remove("image-modal--open")
        overlay.setAttribute("aria-hidden", "true")
        window.clearTimeout(closeTimer)
        closeTimer = window.setTimeout(() => {
            overlay.hidden = true
            image.removeAttribute("src")
        }, 220)
    }

    closeButton.addEventListener("click", close)
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close()
    })
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden) close()
    })

    overlay.append(image, closeButton)
    document.body.append(overlay)
    return { overlay, image, closeButton, close }
}

export function openImageModal(src, alt = "") {
    if (!src) return
    imageModal ||= createImageModal()
    window.clearTimeout(closeTimer)
    imageModal.image.src = src
    imageModal.image.alt = alt
    imageModal.overlay.hidden = false
    imageModal.overlay.setAttribute("aria-hidden", "false")
    window.requestAnimationFrame(() => imageModal.overlay.classList.add("image-modal--open"))
    imageModal.closeButton.focus()
}

window.addEventListener("popstate", closeImageModal)