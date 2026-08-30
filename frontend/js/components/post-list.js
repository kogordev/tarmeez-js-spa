import { renderPostCard } from "/js/components/post-card.js"

export function renderPostList(posts = [], options = {}) {
    const list = document.createElement("section")
    list.className = "post-list"
    list.setAttribute("aria-live", "polite")

    const items = Array.isArray(posts) ? posts : []
    items.forEach((post) => {
        list.append(renderPostCard(post, options))
    })

    return list
}

export default renderPostList
