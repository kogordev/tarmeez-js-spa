import { renderErrorState } from "/src/js/components/error-state.js"
import { renderLoadingState } from "/src/js/components/loading-state.js"
import { renderPostCard } from "/src/js/components/post-card.js"
import { renderCreatePostModal } from "/src/js/components/create-post-modal.js"
import { renderConfirmModal } from "/src/js/components/confirm-modal.js"
import authStore from "/src/js/store/auth-store.js"
import commentsService from "/src/js/services/comments-service.js"
import postsService from "/src/js/services/posts-service.js"
import escapeHtml from "/src/js/utils/escape-html.js"

function messageFor(response) { return response?.error?.message || "Unable to load this post." }

function showToast(message) {
    const toast = document.createElement("div")
    toast.textContent = message
    toast.setAttribute("role", "alert")
    toast.style.position = "fixed"
    toast.style.right = "24px"
    toast.style.bottom = "24px"
    toast.style.zIndex = "9999"
    toast.style.background = "#111827"
    toast.style.color = "#fff"
    toast.style.padding = "12px 16px"
    toast.style.borderRadius = "8px"
    toast.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.2)"
    document.body.appendChild(toast)
    window.setTimeout(() => toast.remove(), 3000)
}

function isSuccessful(response) {
    return response?.ok === true || [200, 204].includes(response?.status)
}

function sameUser(firstUser, secondUser) {
    const firstId = firstUser?.id ?? firstUser?.userId ?? firstUser?._id
    const secondId = secondUser?.id ?? secondUser?.userId ?? secondUser?._id
    return firstId != null && secondId != null && String(firstId) === String(secondId)
}

function renderComments(comments = [], { currentUser, onDelete } = {}) {
    const section = document.createElement("section")
    section.className = "comments"
    const heading = document.createElement("h2")
    let commentCount = comments.length
    heading.textContent = `Comments (${commentCount})`
    section.append(heading)
    comments.forEach((comment) => {
        const item = document.createElement("article")
        item.className = "comment"
        const author = comment.author?.name || comment.author?.username || "Anonymous"
        item.innerHTML = `<strong>${escapeHtml(author)}</strong><p>${escapeHtml(comment.body)}</p>`
        if (sameUser(comment.author, currentUser)) {
            const deleteButton = document.createElement("button")
            deleteButton.type = "button"
            deleteButton.className = "comment__delete"
            deleteButton.textContent = "Delete"
            deleteButton.addEventListener("click", () => onDelete?.({ comment, item, decrement: () => {
                commentCount = Math.max(0, commentCount - 1)
                heading.textContent = `Comments (${commentCount})`
            } }))
            item.append(deleteButton)
        }
        section.append(item)
    })
    return section
}

export function renderPostDetailView(container, { postId, service = postsService, commentService = commentsService, store = authStore, navigate } = {}) {
    let active = true
    let requestId = 0
    let post
    const editModal = renderCreatePostModal({
        service,
        onSuccess: () => load()
    })
    const confirmModal = renderConfirmModal({
        onConfirm: async ({ close, fail }) => {
            let response
            try {
                response = await commentService.deleteComment(postId, confirmModal.commentId)
            } catch (error) {
                fail()
                showToast(error.message || "Unable to delete comment.")
                return
            }
            if (!isSuccessful(response)) {
                fail()
                showToast(response?.error?.message || `Unable to delete comment${response?.status ? ` (${response.status})` : "."}`)
                return
            }
            confirmModal.commentItem.remove()
            confirmModal.decrement()
            close()
        }
    })

    async function load() {
        const currentRequest = ++requestId
        container.replaceChildren(renderLoadingState("Loading post..."))
        const response = await service.getPost(postId)
        if (!active || currentRequest !== requestId) return
        if (!response.ok) {
            container.replaceChildren(renderErrorState(messageFor(response), { onRetry: load }))
            return
        }
        post = response.data
        render()
    }

    function render() {
        const content = document.createDocumentFragment()
        content.append(renderPostCard(post, {
            isDetailView: true,
            onEdit: (item) => editModal.open(item),
            onDelete: () => navigate?.("/")
        }), editModal)
        content.append(renderComments(post.comments || [], {
            currentUser: store.getUser(),
            onDelete: ({ comment, item, decrement }) => {
                confirmModal.commentId = comment.id
                confirmModal.commentItem = item
                confirmModal.decrement = decrement
                confirmModal.open()
            }
        }))
        if (store.isAuthenticated()) {
            const form = document.createElement("form")
            const input = document.createElement("textarea")
            const submit = document.createElement("button")
            const error = document.createElement("p")
            form.className = "comment-form"
            input.name = "body"
            input.required = true
            input.placeholder = "Write a comment"
            submit.type = "submit"
            submit.textContent = "Comment"
            error.className = "form-error"
            form.append(input, submit, error)
            form.addEventListener("submit", async (event) => {
                event.preventDefault()
                submit.disabled = true
                error.textContent = ""
                const response = await commentService.createComment(postId, input.value)
                if (!active) return
                if (!response.ok) {
                    error.textContent = messageFor(response)
                    submit.disabled = false
                    return
                }
                input.value = ""
                await load()
            })
            content.append(form)
        }
        container.replaceChildren(content)
    }

    load()
    return () => {
        active = false
        requestId += 1
        confirmModal.remove()
    }
}

export default renderPostDetailView