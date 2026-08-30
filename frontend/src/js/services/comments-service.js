import httpClient from "/src/js/services/http-client.js"
import { normalizeComment, normalizeDataResponse } from "/src/js/utils/api-normalizers.js"

const commentApiLimitationMessage = "The Tarmeez API does not support comment updates or deletions. Comments can only be created through POST /posts/:postId/comments."

export async function createComment(postId, body) {
    const payload = typeof body === "string" ? { body } : body
    return normalizeDataResponse(
        await httpClient.post(`/posts/${encodeURIComponent(postId)}/comments`, payload),
        normalizeComment
    )
}

export async function updateComment() {
    throw new Error(commentApiLimitationMessage)
}

export async function deleteComment() {
    throw new Error(commentApiLimitationMessage)
}

export const commentsService = { createComment, updateComment, deleteComment }
export default commentsService
