const HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}

export function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ENTITIES[character])
}

export function autolinkText(text) {
    const value = String(text ?? "")
    if (!value) {
        return ""
    }

    return value
        .split(/(https?:\/\/[^\s<>"']+)/gi)
        .map((part) => {
            if (!/^https?:\/\/[^\s<>"']+$/i.test(part)) {
                return escapeHtml(part)
            }

            const trimmedUrl = part.replace(/[.,!?;:)\]}]+$/g, "")
            const trailing = part.slice(trimmedUrl.length)
            const href = escapeHtml(trimmedUrl)

            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-link">${href}</a>${trailing}`
        })
        .join("")
}

export default escapeHtml