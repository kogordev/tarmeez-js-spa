import { createRouter } from "./router/router.js"
import { renderHeader } from "./components/header.js"
import authService from "./services/auth-service.js"
import authStore from "./store/auth-store.js"
import { renderHomeView } from "./views/home-view.js"
import { renderLoginView } from "./views/login-view.js"
import { renderPostDetailView } from "./views/post-detail-view.js"
import { renderRegisterView } from "./views/register-view.js"
import { renderUserProfileView } from "./views/user-profile-view.js"
import { closeImageModal } from "./components/image-modal.js"

const main = document.createElement("main")
main.id = "app"

let cleanup = () => {}

function renderRoute(route) {
	closeImageModal()
	cleanup()
	cleanup = () => {}
	if (route.protected && !authStore.isAuthenticated()) {
		router.navigate("/login")
		return
	}
	const options = { navigate: router.navigate }
	if (route.view === "home") cleanup = renderHomeView(main, options)
	else if (route.view === "post-detail") cleanup = renderPostDetailView(main, { ...options, postId: route.params.postId })
	else if (route.view === "login") cleanup = renderLoginView(main, options)
	else if (route.view === "register") cleanup = renderRegisterView(main, options)
	else if (route.view === "profile" || route.view === "user-profile") cleanup = renderUserProfileView(main, { ...options, userId: route.params.userId })
	else main.textContent = "Page not found."
}

const router = createRouter({ render: renderRoute })
const header = renderHeader({
	onLogin: () => router.navigate("/login"),
	onLogout: async () => { await authService.logout() },
	onNavigate: (path) => router.navigate(path)
})
document.body.replaceChildren(header, main)
router.start()