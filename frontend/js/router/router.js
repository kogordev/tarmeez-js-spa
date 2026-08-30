import routes from "./routes.js"

function compileRoute(path) {
    const names = []
    const pattern = path.split("/").map((segment) => {
        if (segment.startsWith(":")) {
            names.push(segment.slice(1))
            return "([^/]+)"
        }
        return segment
    }).join("/")

    return { regex: new RegExp(`^${pattern}/?$`), names }
}

function matchRoute(pathname, routeList) {
    for (const route of routeList) {
        const { regex, names } = compileRoute(route.path)
        const match = pathname.match(regex)
        if (match) {
            const params = Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])]))
            return { ...route, params }
        }
    }
    return null
}

export function createRouter({ routeList = routes, render = () => {}, root = document } = {}) {
    function renderLocation() {
        const route = matchRoute(window.location.pathname, routeList) || matchRoute("/404", routeList)
        render(route, root)
        return route
    }

    function navigate(path) {
        window.history.pushState({}, "", path)
        return renderLocation()
    }

    function handleLinkClick(event) {
        const link = event.target.closest?.("a[data-link]")
        if (!link || link.origin !== window.location.origin) {
            return
        }
        event.preventDefault()
        navigate(`${link.pathname}${link.search}${link.hash}`)
    }

    function start() {
        root.addEventListener("click", handleLinkClick)
        window.addEventListener("popstate", renderLocation)
        return renderLocation()
    }

    function stop() {
        root.removeEventListener("click", handleLinkClick)
        window.removeEventListener("popstate", renderLocation)
    }

    return { start, stop, navigate, render: renderLocation, match: (pathname) => matchRoute(pathname, routeList) }
}

const router = createRouter()

export { matchRoute }
export default router