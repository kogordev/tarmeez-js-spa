import httpClient from "/js/services/http-client.js"
import { normalizePage, normalizeTag } from "/js/utils/api-normalizers.js"

export async function getTags() {
    const response = await httpClient.get("/tags")
    return response.ok ? { ...response, data: normalizePage(response.data, normalizeTag).items } : response
}

export const tagsService = { getTags }
export default tagsService
