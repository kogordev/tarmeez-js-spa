export const routes = [
    { path: "/", view: "home" },
    { path: "/post/:postId", view: "post-detail" },
    { path: "/posts/:postId", view: "post-detail" },
    { path: "/users", view: "users" },
    { path: "/users/:userId", view: "profile" },
    { path: "/tags", view: "tags" },
    { path: "/login", view: "login" },
    { path: "/register", view: "register" },
    { path: "/settings", view: "settings", protected: true },
    { path: "/404", view: "not-found" }
]

export default routes