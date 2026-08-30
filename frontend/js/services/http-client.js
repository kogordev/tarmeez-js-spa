import authStore from "../store/auth-store.js"

export const API_BASE_URL = "https://tarmeezacademy.com/api/v1"

function joinUrl(baseUrl, path) {
    return new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`).toString()
}

async function parseResponse(response) {
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null
    }

    const text = await response.text()
    if (!text) {
        return null
    }

    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

function formatError(status, data) {
    const message = data?.message || data?.error || (typeof data === "string" ? data : "Request failed")
    return { status, message, details: data }
}

export function createHttpClient({ baseUrl = API_BASE_URL, store = authStore, fetchImpl = fetch } = {}) {
    return {
        async request(path, { body, headers = {}, ...options } = {}) {
            const requestHeaders = new Headers(headers)
            requestHeaders.set("Accept", "application/json")

            const token = store?.getToken()
            if (token) {
                requestHeaders.set("Authorization", `Bearer ${token}`)
            }

            let requestBody = body
            if (body instanceof FormData) {
                requestHeaders.delete("Content-Type")
            } else if (body !== undefined && body !== null && typeof body === "object") {
                requestHeaders.set("Content-Type", "application/json")
                requestBody = JSON.stringify(body)
            }

            try {
                const response = await fetchImpl(joinUrl(baseUrl, path), {
                    ...options,
                    body: requestBody,
                    headers: requestHeaders
                })
                const data = await parseResponse(response)

                if (response.status === 401) {
                    store?.clear()
                }

                return response.ok
                    ? { ok: true, status: response.status, data, error: null }
                    : { ok: false, status: response.status, data: null, error: formatError(response.status, data) }
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    data: null,
                    error: { status: 0, message: error.message || "Network request failed", details: error }
                }
            }
        },
        get(path, options) {
            return this.request(path, { ...options, method: "GET" })
        },
        post(path, body, options) {
            return this.request(path, { ...options, method: "POST", body })
        },
        put(path, body, options) {
            return this.request(path, { ...options, method: "PUT", body })
        },
        delete(path, options) {
            return this.request(path, { ...options, method: "DELETE" })
        }
    }
}

const httpClient = createHttpClient()

export default httpClient