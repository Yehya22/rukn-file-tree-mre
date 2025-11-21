import {writable} from 'svelte/store'

const DEFAULT_PATH = '/rukn/1/'

function normalize(path) {
    if (!path) return DEFAULT_PATH
    if (!path.startsWith('/')) path = `/${path}`
    return path.endsWith('/') ? path : `${path}/`
}

const initialPath = window.location.pathname === '/' ? DEFAULT_PATH : normalize(window.location.pathname)
if (window.location.pathname !== initialPath) {
    window.history.replaceState({}, '', initialPath)
}

const pathStore = writable(initialPath)

function goto(path) {
    const target = normalize(path)
    window.history.pushState({}, '', target)
    pathStore.set(target)
}

window.addEventListener('popstate', () => {
    pathStore.set(normalize(window.location.pathname))
})

window.navgo = window.navgo || {}
window.navgo.goto = goto

export const currentPath = {subscribe: pathStore.subscribe}
