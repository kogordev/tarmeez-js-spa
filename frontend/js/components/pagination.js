import escapeHtml from "../utils/escape-html.js"
import { renderLoadingState } from "./loading-state.js"

function setSafeText(element, value) {
    element.innerHTML = escapeHtml(value)
}

function getPageValue(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
        return value
    }

    if (typeof value === "string") {
        const page = Number(new URLSearchParams(value.split("?")[1] || "").get("page"))
        return Number.isInteger(page) ? page : null
    }

    return null
}

export function renderPagination({ meta = {}, links = {}, onPageChange } = {}) {
    const nav = document.createElement("nav")
    const list = document.createElement("div")
    const currentPage = Number(meta.current_page ?? meta.currentPage ?? 1)
    const lastPage = Number(meta.last_page ?? meta.lastPage ?? 1)
    const previousPage = getPageValue(links.prev ?? links.previous)
    const nextPage = getPageValue(links.next)

    nav.className = "pagination"
    nav.setAttribute("aria-label", "Pagination")
    list.className = "pagination__list"

    function addButton(label, page, disabled = false) {
        const button = document.createElement("button")
        button.type = "button"
        button.className = "pagination__button"
        button.disabled = disabled || !onPageChange
        button.dataset.page = page == null ? "" : String(page)
        setSafeText(button, label)
        if (page != null && !button.disabled) {
            button.addEventListener("click", () => onPageChange(page))
        }
        list.append(button)
    }

    addButton("Previous", previousPage ?? (currentPage > 1 ? currentPage - 1 : null), previousPage === null && currentPage <= 1)
    for (let page = 1; page <= lastPage; page += 1) {
        const button = document.createElement("button")
        button.type = "button"
        button.className = "pagination__button"
        button.dataset.page = String(page)
        button.setAttribute("aria-current", page === currentPage ? "page" : "false")
        button.disabled = page === currentPage || !onPageChange
        setSafeText(button, page)
        if (!button.disabled) {
            button.addEventListener("click", () => onPageChange(page))
        }
        list.append(button)
    }
    addButton("Next", nextPage ?? (currentPage < lastPage ? currentPage + 1 : null), nextPage === null && currentPage >= lastPage)

    nav.append(list)
    return nav
}

export function renderInfiniteScroll({ onLoadMore } = {}) {
    const wrapper = document.createElement("div")
    const sentinel = document.createElement("div")
    const loading = renderLoadingState("Loading more posts...")
    let observer
    let isLoading = false

    wrapper.className = "infinite-scroll"
    sentinel.className = "infinite-scroll__sentinel"
    sentinel.setAttribute("aria-hidden", "true")
    loading.classList.add("loading-state--inline")
    loading.hidden = true
    wrapper.append(loading, sentinel)

    wrapper.setLoading = (value) => {
        isLoading = value
        wrapper.isLoading = value
        loading.hidden = !value
    }
    wrapper.setComplete = () => {
        observer?.disconnect()
        sentinel.remove()
    }
    wrapper.destroy = () => observer?.disconnect()
    wrapper.isLoading = false

    if (typeof IntersectionObserver === "function" && onLoadMore) {
        observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !isLoading) onLoadMore()
        }, { rootMargin: "480px 0px" })
        observer.observe(sentinel)
    }

    return wrapper
}

export default renderPagination
