export const DEFAULT_IMAGE_FALLBACK = "/assets/images/image-placeholder.svg"
export const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%23d1d5db'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%236b7280'/%3E%3Cpath d='M13 56c2-12 10-18 19-18s17 6 19 18' fill='%236b7280'/%3E%3C/svg%3E"

function isSafeImageUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return false
    }

    try {
        const url = new URL(value, window.location.origin)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

export function getImageUrl(value, fallback = DEFAULT_IMAGE_FALLBACK) {
    return isSafeImageUrl(value) ? value.trim() : fallback
}

export function setImageFallback(event, fallbackType = "post") {
    const image = event?.currentTarget || event
    if (!image || image.dataset.fallbackApplied === "true") {
        return
    }

    image.dataset.fallbackApplied = "true"
    if (fallbackType === "avatar") {
        image.src = DEFAULT_AVATAR_FALLBACK
    } else {
        image.style.display = "none"
    }
}

export function hasValidImage(value) {
    return isSafeImageUrl(value)
}

export default getImageUrl