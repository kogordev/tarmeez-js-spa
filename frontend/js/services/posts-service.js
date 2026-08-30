import httpClient from "/js/services/http-client.js"
import { appendFormValue, normalizeDataResponse, normalizePage, normalizePost } from "/js/utils/api-normalizers.js"

function pagePath(path, page) {
    const params = new URLSearchParams()
    if (page !== undefined && page !== null) {
        params.set("page", page)
    }
    return params.toString() ? `${path}?${params}` : path
}

function toFormData(input) {
    if (input instanceof FormData) {
        return input
    }

    const formData = new FormData()
    Object.entries(input || {}).forEach(([key, value]) => {
        if (key === "tags" && Array.isArray(value)) {
            value.forEach((tag) => appendFormValue(formData, "tags[]", tag?.name ?? tag))
        } else {
            appendFormValue(formData, key, value)
        }
    })
    return formData
}

export async function getPosts(page) {
    const response = await httpClient.get(pagePath("/posts", page))
    return response.ok ? { ...response, data: normalizePage(response.data, normalizePost) } : response
}

export async function getUserPosts(userId, page) {
    const response = await httpClient.get(pagePath(`/users/${encodeURIComponent(userId)}/posts`, page))
    return response.ok ? { ...response, data: normalizePage(response.data, normalizePost) } : response
}

export async function getPost(postId) {
    return normalizeDataResponse(await httpClient.get(`/posts/${encodeURIComponent(postId)}`), normalizePost)
}

export async function createPost(input) {
    return normalizeDataResponse(await httpClient.post("/posts", toFormData(input)), normalizePost)
}

export async function updatePost(postId, input) {
    const formData = input instanceof FormData ? input : toFormData(input)
    if (!formData.has("_method")) {
        formData.append("_method", "PUT")
    }

    return normalizeDataResponse(
        await httpClient.post(`/posts/${encodeURIComponent(postId)}`, formData),
        normalizePost
    )
}

export async function deletePost(postId) {
    return httpClient.delete(`/posts/${encodeURIComponent(postId)}`)
}

export const postsService = { getPosts, getUserPosts, getPost, createPost, updatePost, deletePost }
export default postsService
