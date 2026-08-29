import httpClient from "/src/js/services/http-client.js"
import { normalizeComment, normalizeDataResponse } from "/src/js/utils/api-normalizers.js"

export async function createComment(postId, body) {
    const payload = typeof body === "string" ? { body } : body
    return normalizeDataResponse(
        await httpClient.post(`/posts/${encodeURIComponent(postId)}/comments`, payload),
        normalizeComment
    )
}

export async function deleteComment(commentId) {
    const response = await httpClient.delete(`/comments/${encodeURIComponent(commentId)}`)
    console.log("DELETE /comments response", { status: response.status, data: response.data })
    return response
}

export const commentsService = { createComment, deleteComment }
export default commentsService
