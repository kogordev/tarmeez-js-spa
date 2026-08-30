import { renderErrorState } from "/src/js/components/error-state.js"
import { renderLoadingState } from "/src/js/components/loading-state.js"
import { renderPostCard } from "/src/js/components/post-card.js"
import { renderCreatePostModal } from "/src/js/components/create-post-modal.js"
import authStore from "/src/js/store/auth-store.js"
import commentsService from "/src/js/services/comments-service.js"
import postsService from "/src/js/services/posts-service.js"
import escapeHtml from "/src/js/utils/escape-html.js"

function messageFor(response) { return response?.error?.message || "Unable to load this post." }

function sameUser(firstUser, secondUser) {
    const firstId = firstUser?.id ?? firstUser?.userId ?? firstUser?._id
    const secondId = secondUser?.id ?? secondUser?.userId ?? secondUser?._id
    return firstId != null && secondId != null && String(firstId) === String(secondId)
}

function renderCommentItem(comment = {}) {
    const item = document.createElement("article")
    const author = comment.author?.name || comment.author?.username || "Anonymous"
    item.className = "comment"
    item.setAttribute("dir", "auto")
    item.innerHTML = `<strong dir="auto">${escapeHtml(author)}</strong><p dir="auto">${escapeHtml(comment.body || "")}</p>`
    return item
}

function renderComments(comments = [], { currentUser } = {}) {
    const section = document.createElement("section")
    section.className = "comments"
    comments.forEach((comment) => {
        section.append(renderCommentItem(comment))
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
        const detailCard = document.createElement("div")
        const commentsSection = document.createElement("div")

        detailCard.className = "post-detail-card"
        commentsSection.className = "post-detail-card__comments"

        detailCard.append(renderPostCard(post, {
            isDetailView: true,
            onEdit: (item) => editModal.open(item),
            onDelete: () => navigate?.("/")
        }))

        commentsSection.append(renderComments(post.comments || [], {
            currentUser: store.getUser()
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
            input.setAttribute("dir", "auto")
            submit.type = "submit"
            submit.textContent = "Comment"
            error.className = "form-error"
            form.append(input, submit, error)
            const showToast = (message) => {
                const existingToast = document.body.querySelector(".tarmeez-toast")
                if (existingToast) existingToast.remove()

                const toast = document.createElement("div")
                toast.className = "tarmeez-toast"
                toast.textContent = message
                toast.style.position = "fixed"
                toast.style.right = "24px"
                toast.style.bottom = "24px"
                toast.style.zIndex = "9999"
                toast.style.background = "#111827"
                toast.style.color = "#fff"
                toast.style.padding = "12px 16px"
                toast.style.borderRadius = "999px"
                toast.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.2)"
                toast.style.fontSize = "0.9rem"
                document.body.appendChild(toast)
                window.setTimeout(() => toast.remove(), 2200)
            }

            form.addEventListener("submit", async (event) => {
                event.preventDefault()
                const body = input.value.trim()

                if (!body) {
                    error.textContent = "Please enter a comment."
                    return
                }

                submit.disabled = true
                submit.textContent = "Posting..."
                error.textContent = ""

                const response = await commentService.createComment(postId, body)
                if (!active) return

                if (!response.ok) {
                    showToast(messageFor(response))
                    error.textContent = messageFor(response)
                    submit.disabled = false
                    submit.textContent = "Comment"
                    return
                }

                const createdComment = response.data || {
                    body,
                    author: store.getUser ? store.getUser() : null
                }
                const commentsList = commentsSection.querySelector(".comments")
                if (commentsList) {
                    commentsList.prepend(renderCommentItem(createdComment))
                }

                post.comments = [createdComment, ...(post.comments || [])]
                const currentCount = Number(post.commentsCount ?? post.comments_count ?? 0)
                const nextCount = currentCount + 1
                post.commentsCount = nextCount

                const counter = detailCard.querySelector(".post-card__comments")
                if (counter) {
                    counter.textContent = `Comments: ${nextCount}`
                }

                input.value = ""
                submit.disabled = false
                submit.textContent = "Comment"
            })
            commentsSection.append(form)
        }

        detailCard.append(commentsSection)
        content.append(detailCard, editModal)
        container.replaceChildren(content)
    }

    load()
    return () => {
        active = false
        requestId += 1
    }
}

export default renderPostDetailView