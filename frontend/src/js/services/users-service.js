import httpClient from "/src/js/services/http-client.js"
import { normalizeDataResponse, normalizePage, normalizeUser } from "/src/js/utils/api-normalizers.js"

function pagePath(page) {
    const params = new URLSearchParams()
    if (page !== undefined && page !== null) {
        params.set("page", page)
    }
    return params.toString() ? `/users?${params}` : "/users"
}

export async function getUsers(page) {
    const response = await httpClient.get(pagePath(page))
    return response.ok ? { ...response, data: normalizePage(response.data, normalizeUser) } : response
}

export async function getUser(userId) {
    return normalizeDataResponse(await httpClient.get(`/users/${encodeURIComponent(userId)}`), normalizeUser)
}

export const usersService = { getUsers, getUser }
export default usersService
