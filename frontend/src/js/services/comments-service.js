import httpClient from "/src/js/services/http-client.js"
import { normalizeComment, normalizeDataResponse } from "/src/js/utils/api-normalizers.js"

export async function createComment(postId, body) {
    const payload = typeof body === "string" ? { body } : body
    return normalizeDataResponse(
        await httpClient.post(`/posts/${encodeURIComponent(postId)}/comments`, payload),
        normalizeComment
    )
}

export async function deleteComment(postId, commentId) {
    if (!postId) {
        const fallbackResponse = await httpClient.delete(`/comments/${encodeURIComponent(commentId)}`)
        console.log("DELETE /comments fallback response", { status: fallbackResponse.status, data: fallbackResponse.data })
        return fallbackResponse
    }

    const response = await httpClient.delete(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`)
    console.log("DELETE /posts/:postId/comments/:commentId response", { status: response.status, data: response.data })
    return response
}

export const commentsService = { createComment, deleteComment }
export default commentsService
