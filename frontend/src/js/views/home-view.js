import { renderErrorState } from "/src/js/components/error-state.js"
import { renderLoadingState } from "/src/js/components/loading-state.js"
import { renderInfiniteScroll } from "/src/js/components/pagination.js"
import { renderPostList } from "/src/js/components/post-list.js"
import postsService from "/src/js/services/posts-service.js"

function messageFor(response) {
    return response?.error?.message || "Unable to load posts."
}

export function renderHomeView(container, { navigate, service = postsService } = {}) {
    let active = true
    let requestId = 0
    let page = Number(new URLSearchParams(window.location.search).get("page")) || 1
    let hasNextPage = true
    let list
    let infiniteScroll

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
        container.replaceChildren(renderLoadingState("Loading posts..."))
        const response = await service.getPosts(page)
        if (!active || currentRequest !== requestId) return
        if (!response.ok) {
            container.replaceChildren(renderErrorState(messageFor(response), { onRetry: load }))
            return
        }

        const { items, meta, links } = response.data
        hasNextPage = responseHasNextPage(meta, links)
        list = renderPostList(items, { onSelect: (post) => navigate(`/posts/${post.id}`) })
        infiniteScroll = renderInfiniteScroll({ onLoadMore: loadNextPage })
        const content = document.createDocumentFragment()
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
        const nextList = renderPostList(items, { onSelect: (post) => navigate(`/posts/${post.id}`) })
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