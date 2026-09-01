import httpClient from "/js/services/http-client.js"
import authStore from "/js/store/auth-store.js"
import { appendFormValue, normalizeUser } from "/js/utils/api-normalizers.js"

function toFormData(input) {
    if (input instanceof FormData) {
        return input
    }

    const formData = new FormData()
    Object.entries(input || {}).forEach(([key, value]) => appendFormValue(formData, key, value))
    return formData
}

function getAuthData(data) {
    const value = data?.data && typeof data.data === "object" ? data.data : data || {}
    return {
        token: value.token || value.access_token || value.accessToken || data?.token || data?.access_token || null,
        user: normalizeUser(value.user || data?.user)
    }
}

function extractUpdatedUser(data) {
    // Response shape varies across endpoints: { data: { user } }, { data: user }, { user }, or the user object itself.
    const outer = data?.data && typeof data.data === "object" ? data.data : data
    const candidate = outer?.user && typeof outer.user === "object" ? outer.user : outer
    return normalizeUser(candidate)
}

export async function register(input) {
    return httpClient.post("/register", toFormData(input))
}

export async function login(credentials) {
    const response = await httpClient.post("/login", credentials)
    if (response.ok) {
        const { token, user } = getAuthData(response.data)
        if (token) {
            authStore.setSession(token, user)
        }
        return { ...response, data: { token, user } }
    }
    return response
}

export async function logout() {
    const response = await httpClient.post("/logout")
    // Clear local auth state regardless of server response so the UI never
    // keeps showing an authenticated session with a dead/invalid token.
    authStore.clear()
    return response
}

export async function updateProfile(input) {
    const response = await httpClient.put("/updatePorfile", input)
    if (response.ok) {
        const previousUser = authStore.getUser() || {}
        const parsedUser = extractUpdatedUser(response.data)
        // Some backends echo only a success message with no user payload; fall back to
        // merging the submitted fields so the UI still reflects what was just saved.
        const updatedUser = parsedUser || { ...previousUser, ...input }
        authStore.setUser({ ...previousUser, ...updatedUser })
        return { ...response, data: { user: authStore.getUser() } }
    }
    return response
}

export const authService = { register, login, logout, updateProfile }
export default authService
