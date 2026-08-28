const STORAGE_KEY = "tarmeez.auth"

function getStorage(storage) {
    if (storage) {
        return storage
    }

    try {
        return window.localStorage
    } catch {
        return null
    }
}

function readPersistedState(storage) {
    if (!storage) {
        return { token: null, user: null }
    }

    try {
        const value = JSON.parse(storage.getItem(STORAGE_KEY))
        return {
            token: typeof value?.token === "string" ? value.token : null,
            user: value?.user && typeof value.user === "object" ? value.user : null
        }
    } catch {
        return { token: null, user: null }
    }
}

export function createAuthStore({ storage } = {}) {
    const persistence = getStorage(storage)
    let state = readPersistedState(persistence)
    const listeners = new Set()

    function notify() {
        listeners.forEach((listener) => listener(getState()))
    }

    function persist() {
        if (!persistence) {
            return
        }

        if (!state.token && !state.user) {
            persistence.removeItem(STORAGE_KEY)
            return
        }

        persistence.setItem(STORAGE_KEY, JSON.stringify(state))
    }

    function update(nextState) {
        state = { ...state, ...nextState }
        persist()
        notify()
    }

    function getState() {
        return { ...state, isAuthenticated: Boolean(state.token) }
    }

    return {
        getState,
        getToken: () => state.token,
        getUser: () => state.user,
        isAuthenticated: () => Boolean(state.token),
        setSession: (token, user = null) => update({ token: token || null, user }),
        setToken: (token) => update({ token: token || null }),
        setUser: (user) => update({ user: user || null }),
        clear: () => update({ token: null, user: null }),
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        }
    }
}

const authStore = createAuthStore()

export { STORAGE_KEY }
export default authStore