import routes from "/js/router/routes.js"

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

function getHashPath() {
    let hash = window.location.hash.slice(1) || "/"
    if (!hash.startsWith("/")) {
        hash = "/" + hash
    }
    return hash.split("?")[0] || "/"
}

export function createRouter({ routeList = routes, render = () => {}, root = document } = {}) {
    function renderLocation() {
        const path = getHashPath()
        const route = matchRoute(path, routeList) || matchRoute("/404", routeList)
        render(route, root)
        return route
    }

    function navigate(path) {
        const targetHash = path.startsWith("#") ? path : `#${path}`
        if (window.location.hash === targetHash) {
            return renderLocation()
        }
        window.location.hash = targetHash
        return renderLocation()
    }

    function handleLinkClick(event) {
        const link = event.target.closest?.("a[data-link]")
        if (!link) {
            return
        }
        const href = link.getAttribute("href")
        if (!href) {
            return
        }

        if (href.startsWith("#") || href.startsWith("/")) {
            event.preventDefault()
            navigate(href)
        }
    }

    function start() {
        root.addEventListener("click", handleLinkClick)
        window.addEventListener("hashchange", renderLocation)
        window.addEventListener("load", renderLocation)
        return renderLocation()
    }

    function stop() {
        root.removeEventListener("click", handleLinkClick)
        window.removeEventListener("hashchange", renderLocation)
        window.removeEventListener("load", renderLocation)
    }

    return { start, stop, navigate, render: renderLocation, match: (pathname) => matchRoute(pathname, routeList) }
}

const router = createRouter()

export { matchRoute }
export default router