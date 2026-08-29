import { renderErrorState } from "/src/js/components/error-state.js"
import { renderLoadingState } from "/src/js/components/loading-state.js"
import { renderPostList } from "/src/js/components/post-list.js"
import { renderCreatePostModal } from "/src/js/components/create-post-modal.js"
import postsService from "/src/js/services/posts-service.js"
import usersService from "/src/js/services/users-service.js"

function messageFor(response) { return response?.error?.message || "Unable to load this profile." }

export function renderUserProfileView(container, { userId, navigate, userService = usersService, postService = postsService } = {}) {
    let active = true
    const editModal = renderCreatePostModal({
        postService,
        service: postService,
        onSuccess: () => load()
    })
    container.replaceChildren(renderLoadingState("Loading profile..."))
    function load() {
        return Promise.all([userService.getUser(userId), postService.getUserPosts(userId)])
        .then(([userResponse, postsResponse]) => {
            if (!active) return
            if (!userResponse.ok || !postsResponse.ok) {
                const failed = !userResponse.ok ? userResponse : postsResponse
                container.replaceChildren(renderErrorState(messageFor(failed)))
                return
            }
            const user = userResponse.data
            const heading = document.createElement("h1")
            heading.textContent = user.name || user.username || "User profile"
            const details = document.createElement("p")
            details.textContent = `@${user.username} | ${user.postsCount ?? postsResponse.data.items.length} posts`
            container.replaceChildren(
                heading,
                details,
                renderPostList(postsResponse.data.items, {
                    onSelect: (post) => navigate(`/posts/${post.id}`),
                    onEdit: (post) => editModal.open(post)
                }),
                editModal
            )
        })
    }
    load()
    return () => { active = false }
}

export default renderUserProfileView