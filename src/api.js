import {get, writable} from 'svelte/store'

import {
    appdata,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    file_types_map,
    moveNode,
    updateFile,
    updateFolder,
} from './store.js'

export const IS_FETCHING = writable(false)

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function parseUrl(input) {
    let params = {}
    let url = input
    if (Array.isArray(input)) {
        ;[url, params] = input
    }
    url = url.replace(/^\/+|\/+$/g, '')
    const [resource = '', id, action] = url.split('/')
    return {resource, id: id ? Number(id) : null, action, params}
}

function ensureTrailingSlash(path) {
    return path.endsWith('/') ? path : `${path}/`
}

async function simulateFetch() {
    IS_FETCHING.set(true)
    await delay(60)
    IS_FETCHING.set(false)
}

function clone(value) {
    return structuredClone(value)
}

function collectDescendantFileIds(folderId, foldersMap, filesList) {
    const stack = [folderId]
    const ids = new Set()
    while (stack.length) {
        const current = stack.pop()
        for (const file of filesList) {
            if (file.folder === current) ids.add(file.id)
        }
        for (const folder of Object.values(foldersMap)) {
            if (folder.parent === current) stack.push(folder.id)
        }
    }
    return ids
}

export async function api_call(urlInput, method = 'GET', data) {
    const target = parseUrl(urlInput)
    await simulateFetch()

    switch (method) {
        case 'GET':
            return handleGet(target)
        case 'POST':
            return handlePost(target, data)
        case 'PATCH':
            return handlePatch(target, data)
        case 'DELETE':
            return handleDelete(target)
        default:
            return {}
    }
}

function handleGet({resource, id, params}) {
    const state = get(appdata)
    if (resource === 'revision') {
        const folderId = Number(params?.folder)
        let results = state.revisions || []
        if (folderId) {
            const fileIds = collectDescendantFileIds(folderId, state.folders.map, state.files.list)
            results = results.filter(rev => fileIds.has(rev.rev_of))
        }
        return {results}
    }
    if (resource === 'file_types') {
        return {results: state.file_types.list}
    }
    if (!id) return {}
    if (resource === 'file') {
        return clone(state.files.map[id])
    }
    if (resource === 'folder') {
        return clone(state.folders.map[id])
    }
    return {}
}

function handlePost({resource, id, action}, payload = {}) {
    if (resource === 'file' && action === 'copy') {
        return clone(copyFile(id, payload.folder ?? payload.parent ?? 1))
    }
    if (resource === 'folder' && action === 'copy') {
        return clone(copyFolder(id, payload.parent ?? 1))
    }
    if (resource === 'file') {
        return clone(createFile(payload))
    }
    if (resource === 'folder') {
        return clone(createFolder(payload))
    }
    return {}
}

function handlePatch({resource, id}, payload = {}) {
    if (!id) return {}
    if (resource === 'file') {
        return clone(updateFile(id, payload))
    }
    if (resource === 'folder') {
        return clone(updateFolder(id, payload))
    }
    return {}
}

function handleDelete({resource, id}) {
    if (!id) return {ok: true}
    if (resource === 'file') {
        deleteFile(id)
        return {ok: true}
    }
    if (resource === 'folder') {
        deleteFolder(id)
        return {ok: true}
    }
    return {ok: true}
}

function copyFile(sourceId, destinationFolderId) {
    const state = get(appdata)
    const source = state.files.map[sourceId]
    if (!source) return null
    const name = `${source.name} (منسوخ)`
    return createFile({
        name,
        file_type: source.file_type,
        folder: destinationFolderId ?? source.folder,
        metadata: clone(source.metadata || {}),
        order: source.order,
    })
}

function copyFolder(sourceId, destinationParent) {
    const state = get(appdata)
    const source = state.folders.map[sourceId]
    if (!source) return null
    const baseName = `${source.name} (منسوخ)`
    const created = createFolder({parent: destinationParent ?? source.parent, name: baseName})
    const childFiles = state.files.list.filter(file => file.folder === source.id)
    for (const file of childFiles) {
        copyFile(file.id, created.id)
    }
    const childFolders = state.folders.list.filter(folder => folder.parent === source.id)
    for (const folder of childFolders) {
        copyFolder(folder.id, created.id)
    }
    return created
}

export default {
    GET: (url, options) => api_call(url, 'GET', null, options),
    POST: (url, data) => api_call(url, 'POST', data),
    PATCH: (url, data) => api_call(url, 'PATCH', data),
    DELETE: url => api_call(url, 'DELETE'),
}
