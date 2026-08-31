import authStore from "/js/store/auth-store.js"
import { DEFAULT_AVATAR_FALLBACK, getImageUrl, setImageFallback } from "/js/utils/images.js"

function getUserLabel(user) {
    return user?.name || user?.username || "there"
}

export function renderCreatePostCard({ store = authStore, onOpen } = {}) {
    const state = store.getState()
    const user = state.user || {}
    const card = document.createElement("article")
    const trigger = document.createElement("button")
    const avatar = document.createElement("img")
    const prompt = document.createElement("span")

    card.className = "create-post-card"
    trigger.type = "button"
    trigger.className = "create-post-card__trigger"
    avatar.className = "create-post-card__avatar"
    avatar.alt = `${getUserLabel(user)} profile image`
    avatar.src = getImageUrl(user.profileImageUrl, DEFAULT_AVATAR_FALLBACK)
    avatar.addEventListener("error", (event) => setImageFallback(event, "avatar"))
    prompt.textContent = `What's on your mind, ${getUserLabel(user)}?`

    const open = () => onOpen?.()
    trigger.append(avatar, prompt)
    trigger.addEventListener("click", open)
    card.addEventListener("click", (event) => {
        if (!event.target.closest("button")) open()
    })
    card.append(trigger)
    return card
}

export default renderCreatePostCard