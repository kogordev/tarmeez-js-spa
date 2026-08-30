function asNumber(value, fallback = 0) {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
}

function asNullableString(value) {
    return typeof value === "string" && value.trim() !== "" ? value : null
}

function normalizeImageUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return null
    }

    try {
        const url = new URL(value.trim())
        if (!["http:", "https:"].includes(url.protocol)) {
            return null
        }

        const hostname = url.hostname.toLowerCase()
        return ["localhost", "127.0.0.1", "::1"].includes(hostname) ? null : value.trim()
    } catch {
        return null
    }
}

export function normalizeUser(value) {
    if (!value || typeof value !== "object") {
        return null
    }

    return {
        id: asNumber(value.id),
        username: typeof value.username === "string" ? value.username : "",
        name: typeof value.name === "string" ? value.name : "",
        email: asNullableString(value.email),
        profileImageUrl: normalizeImageUrl(value.profile_image ?? value.profileImageUrl),
        postsCount: value.posts_count == null ? null : asNumber(value.posts_count),
        commentsCount: value.comments_count == null ? null : asNumber(value.comments_count),
        createdAt: asNullableString(value.created_at ?? value.createdAt),
        updatedAt: asNullableString(value.updated_at ?? value.updatedAt)
    }
}

export function normalizeTag(value) {
    if (!value || typeof value !== "object") {
        return null
    }

    return {
        name: typeof value.name === "string" ? value.name : "",
        arabicName: asNullableString(value.arabic_name ?? value.arabicName),
        description: asNullableString(value.description)
    }
}

export function normalizeComment(value) {
    if (!value || typeof value !== "object") {
        return null
    }

    return {
        id: asNumber(value.id),
        body: typeof value.body === "string" ? value.body : "",
        author: normalizeUser(value.author)
    }
}

export function normalizePost(value) {
    if (!value || typeof value !== "object") {
        return null
    }

    const comments = Array.isArray(value.comments)
        ? value.comments.map(normalizeComment).filter(Boolean)
        : null

    return {
        id: asNumber(value.id),
        title: asNullableString(value.title),
        body: typeof value.body === "string" ? value.body : "",
        author: normalizeUser(value.author),
        imageUrl: normalizeImageUrl(value.image ?? value.image_url ?? value.imageUrl),
        tags: Array.isArray(value.tags) ? value.tags.map(normalizeTag).filter(Boolean) : [],
        createdAt: asNullableString(value.created_at ?? value.createdAt),
        commentsCount: value.comments_count == null ? 0 : asNumber(value.comments_count),
        comments
    }
}

export function normalizePage(data, normalizeItem) {
    const envelope = data && typeof data === "object" && !Array.isArray(data) ? data : {}
    const items = Array.isArray(data) ? data : envelope.data

    return {
        items: Array.isArray(items) ? items.map(normalizeItem).filter(Boolean) : [],
        links: envelope.links && typeof envelope.links === "object" ? envelope.links : {},
        meta: envelope.meta && typeof envelope.meta === "object" ? envelope.meta : {}
    }
}

export function normalizeDataResponse(response, normalize) {
    if (!response.ok) {
        return response
    }

    return { ...response, data: normalize(response.data?.data ?? response.data) }
}

export function appendFormValue(formData, key, value) {
    if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value)
    }
}
