export function renderConfirmModal({
    title = "Delete item?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm = async ({ close }) => close(),
} = {}) {
    const modal = document.createElement("div")
    const panel = document.createElement("section")
    const heading = document.createElement("h2")
    const messageEl = document.createElement("p")
    const actions = document.createElement("div")
    const cancel = document.createElement("button")
    const confirm = document.createElement("button")

    function ensureMounted() {
        if (typeof document === "undefined") {
            return
        }
        if (!document.body) {
            return
        }
        if (modal.parentNode !== document.body) {
            if (modal.parentNode) {
                modal.remove()
            }
            document.body.appendChild(modal)
        }
    }

    modal.className = "ui-confirm"
    modal.hidden = true
    modal.setAttribute("aria-hidden", "true")
    ensureMounted()

    panel.className = "ui-confirm__panel"
    panel.setAttribute("role", "dialog")
    panel.setAttribute("aria-modal", "true")
    panel.setAttribute("aria-labelledby", "ui-confirm-title")

    heading.id = "ui-confirm-title"
    heading.textContent = title
    messageEl.textContent = message

    actions.className = "ui-confirm__actions"

    cancel.type = "button"
    cancel.className = "ui-confirm__cancel"
    cancel.textContent = cancelText

    confirm.type = "button"
    confirm.className = "ui-confirm__confirm"
    confirm.textContent = confirmText

    actions.append(cancel, confirm)
    panel.append(heading, messageEl, actions)
    modal.append(panel)

    function close() {
        modal.hidden = true
        modal.setAttribute("aria-hidden", "true")
        confirm.disabled = false
    }

    function open() {
        ensureMounted()
        modal.hidden = false
        modal.setAttribute("aria-hidden", "false")
        cancel.focus()
    }

    cancel.addEventListener("click", close)

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close()
        }
    })

    confirm.addEventListener("click", async () => {
        confirm.disabled = true
        close()
        try {
            await onConfirm({
                close,
                fail: () => {
                    confirm.disabled = false
                },
            })
        } catch {
        } finally {
            close()
        }
    })

    modal.open = open
    modal.close = close
    modal.setTitle = (nextTitle) => {
        heading.textContent = nextTitle
    }
    modal.setMessage = (nextMessage) => {
        messageEl.textContent = nextMessage
    }
    modal.setConfirmText = (nextText) => {
        confirm.textContent = nextText
    }
    modal.setCancelText = (nextText) => {
        cancel.textContent = nextText
    }

    return modal
}

export default renderConfirmModal
