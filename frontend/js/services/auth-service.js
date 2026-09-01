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

export const authService = { register, login, logout }
export default authService
