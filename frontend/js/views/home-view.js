import { renderErrorState } from "/js/components/error-state.js"
import { renderCreatePostCard } from "/js/components/create-post-card.js"
import { renderCreatePostModal } from "/js/components/create-post-modal.js"
import { renderLoadingState } from "/js/components/loading-state.js"
import { renderPostCard } from "/js/components/post-card.js"
import { renderInfiniteScroll } from "/js/components/pagination.js"
import { renderPostList } from "/js/components/post-list.js"
import postsService from "/js/services/posts-service.js"
import authStore from "/js/store/auth-store.js"

function messageFor(response) {
    return response?.error?.message || "Unable to load posts."
}

function sortByNewest(posts) {
    return [...posts].sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id))
}

export function renderHomeView(container, { navigate, service = postsService } = {}) {
    let active = true
    let requestId = 0
    let page = Number(new URLSearchParams(window.location.search).get("page")) || 1
    let hasNextPage = true
    let list
    let infiniteScroll
    let createPostCard
    let createPostModal

    if (authStore.isAuthenticated()) {
        createPostModal = renderCreatePostModal({
            service,
            onSuccess: (post) => {
                if (!list || !post) return

                list.prepend(renderPostCard(post, {
                    onSelect: (item) => navigate(`/posts/${item.id}`),
                    onEdit: (item) => createPostModal?.open(item)
                }))
            }
        })
        createPostCard = renderCreatePostCard({ onOpen: () => createPostModal.open() })
    }

    function getPageValue(value) {
        if (typeof value === "number" && Number.isInteger(value)) return value
        if (typeof value !== "string") return null
        try {
            const nextPage = Number(new URL(value, window.location.origin).searchParams.get("page"))
            return Number.isInteger(nextPage) ? nextPage : null
        } catch {
            return null
        }
    }

    function responseHasNextPage(meta = {}, links = {}) {
        const currentPage = Number(meta.current_page ?? meta.currentPage ?? page)
        const lastPage = Number(meta.last_page ?? meta.lastPage ?? currentPage)
        return getPageValue(links.next) !== null || currentPage < lastPage
    }

    async function load() {
        const currentRequest = ++requestId
        const loadingContent = document.createDocumentFragment()
        if (createPostCard) loadingContent.append(createPostCard, createPostModal)
        loadingContent.append(renderLoadingState("Loading posts..."))
        container.replaceChildren(loadingContent)
        const response = await service.getPosts(page)
        if (!active || currentRequest !== requestId) return
        if (!response.ok) {
            const errorContent = document.createDocumentFragment()
            if (createPostCard) errorContent.append(createPostCard, createPostModal)
            errorContent.append(renderErrorState(messageFor(response), { onRetry: load }))
            container.replaceChildren(errorContent)
            return
        }

        const { items, meta, links } = response.data
        hasNextPage = responseHasNextPage(meta, links)
        list = renderPostList(sortByNewest(items), {
            onSelect: (post) => navigate(`/posts/${post.id}`),
            onEdit: (post) => createPostModal?.open(post)
        })
        infiniteScroll = renderInfiniteScroll({ onLoadMore: loadNextPage })
        const content = document.createDocumentFragment()
        if (createPostCard) content.append(createPostCard, createPostModal)
        content.append(list, infiniteScroll)
        container.replaceChildren(content)
    }

    async function loadNextPage() {
        if (!active || !hasNextPage || infiniteScroll?.isLoading) return
        const nextPage = page + 1
        infiniteScroll.setLoading(true)
        const response = await service.getPosts(nextPage)
        if (!active) return
        if (!response.ok) {
            infiniteScroll.setLoading(false)
            return
        }

        const { items, meta, links } = response.data
        const nextList = renderPostList(sortByNewest(items), {
            onSelect: (post) => navigate(`/posts/${post.id}`),
            onEdit: (post) => createPostModal?.open(post)
        })
        list.append(...nextList.children)
        page = nextPage
        hasNextPage = responseHasNextPage(meta, links)
        infiniteScroll.setLoading(false)
        if (!hasNextPage) infiniteScroll.setComplete()
    }

    load()
    return () => {
        active = false
        requestId += 1
        infiniteScroll?.destroy()
    }
}

export default renderHomeView