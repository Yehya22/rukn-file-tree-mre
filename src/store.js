import * as kv from 'idb-keyval'
import {derived, get, readable, writable} from 'svelte/store'

import {file_types, files as initialFiles, folders as initialFolders, revisions, users as initialUsers} from './mocks/data.js'

const toMap = list => Object.fromEntries(list.map(item => [item.id, structuredClone(item)]))

const folders = initialFolders.map(folder => ({...folder}))
const files = initialFiles.map(file => ({...file}))
const users = initialUsers.map(user => ({...user}))

export const ACCESS_LEVELS = {
    NONE: 0,
    BASIC: 1,
    EDITOR: 2,
    ADMIN: 3,
}

const DEFAULT_APP = 'rukn'

export const session = writable({
    csrf_token: 'mock-csrf-token',
    conf: {lang: 'ar'},
    locale: {lang: 'ar', dir: 'rtl'},
    user: {
        email: 'editor@rukn.dev',
        is_staff: true,
        access_levels: {
            [DEFAULT_APP]: {
                app: ACCESS_LEVELS.ADMIN,
                folder: {1: ACCESS_LEVELS.ADMIN},
            },
        },
    },
    apps: [
        {
            name: DEFAULT_APP,
            title: 'مشروع ركن التجريبي',
            config_public: {color: '#2563eb'},
        },
    ],
    loaded: true,
})

export function get_perm() {
    return ACCESS_LEVELS.ADMIN
}

const mapState = () => ({
    list: [],
    map: {},
})

export const appdata = writable({
    app: DEFAULT_APP,
    folders: {list: folders, map: toMap(folders)},
    files: {list: files, map: toMap(files)},
    users: {list: users, map: toMap(users)},
    file_types: {list: file_types, map: toMap(file_types)},
    revisions,
    conf: {},
})

export const show_system_files = writable(false)
const SHOW_SYSTEM_FILES_KEY = 'rukn-file-tree-mre:show-system-files'
kv.get(SHOW_SYSTEM_FILES_KEY).then(value => show_system_files.set(!!value))
show_system_files.subscribe(value => kv.set(SHOW_SYSTEM_FILES_KEY, value))

export const folder_counts = derived(appdata, $appdata => {
    const ROOT_ID = 1
    const children = new Map()
    const counts = new Map([[ROOT_ID, {folders: 0, files: 0, total: 0}]])

    for (const folder of $appdata.folders.list || []) {
        const parent = folder.parent || ROOT_ID
        if (folder.id === ROOT_ID) continue
        if (!children.has(parent)) children.set(parent, [])
        children.get(parent).push(folder.id)
        if (!counts.has(folder.id)) counts.set(folder.id, {folders: 0, files: 0, total: 0})
    }

    for (const file of $appdata.files.list || []) {
        const owner = file.folder || ROOT_ID
        const c = counts.get(owner) || {folders: 0, files: 0, total: 0}
        c.files += 1
        counts.set(owner, c)
    }

    const sum_counts = id => {
        let filesCount = counts.get(id)?.files || 0
        let foldersCount = 0
        for (const child of children.get(id) || []) {
            const r = sum_counts(child)
            filesCount += r.files
            foldersCount += 1 + r.folders
        }
        const res = {files: filesCount, folders: foldersCount, total: filesCount + foldersCount}
        counts.set(id, res)
        return res
    }

    sum_counts(ROOT_ID)
    return counts
})

export const now = readable(new Date(), set => {
    const interval = setInterval(() => set(new Date()), 60_000)
    return () => clearInterval(interval)
})

export function get_folder_parents(folder_id) {
    const folder_map = get(appdata).folders.map
    const parents_ids = []
    let parent_id = folder_id
    while (parent_id && folder_map[parent_id]) {
        parents_ids.push(parent_id)
        parent_id = folder_map[parent_id].parent
    }
    return parents_ids.reverse().slice(1)
}

function nextId(list) {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export function createFolder(data) {
    return updateCollection('folders', collection => {
        const record = {
            id: nextId(collection.list),
            name: data.name,
            parent: data.parent ?? 1,
            metadata: data.metadata ?? {},
        }
        collection.list = [record, ...collection.list]
        collection.map[record.id] = record
        return record
    })
}

export function updateFolder(id, data) {
    return updateCollection('folders', collection => {
        const existing = collection.map[id]
        if (!existing) return existing
        Object.assign(existing, data)
        return existing
    })
}

export function deleteFolder(id) {
    return updateCollection('folders', collection => {
        collection.list = collection.list.filter(folder => folder.id !== id)
        delete collection.map[id]
    })
}

export function createFile(data) {
    return updateCollection('files', collection => {
        const record = {
            id: nextId(collection.list),
            name: data.name,
            folder: data.folder ?? 1,
            file_type: data.file_type ?? file_types[0].id,
            order: data.order ?? 1,
            metadata: data.metadata ?? {},
            updated_at: new Date().toISOString(),
        }
        collection.list = [record, ...collection.list]
        collection.map[record.id] = record
        return record
    })
}

export function updateFile(id, data) {
    return updateCollection('files', collection => {
        const existing = collection.map[id]
        if (!existing) return existing
        Object.assign(existing, data)
        existing.updated_at = new Date().toISOString()
        return existing
    })
}

export function deleteFile(id) {
    return updateCollection('files', collection => {
        collection.list = collection.list.filter(file => file.id !== id)
        delete collection.map[id]
    })
}

export function moveNode({type, id, parent}) {
    if (type === 'file') {
        return updateFile(id, {folder: parent})
    }
    return updateFolder(id, {parent})
}

function updateCollection(kind, mutator) {
    let result
    appdata.update(state => {
        const collection = state[kind] ?? mapState()
        result = mutator(collection)
        state[kind] = {
            list: collection.list,
            map: collection.map,
        }
        return state
    })
    return structuredClone(result)
}

export function createRevisionFor(fileId, userId) {
    appdata.update(state => {
        const rev = {
            id: nextId(state.revisions ?? []),
            rev_of: fileId,
            user: userId,
            updated_at: new Date().toISOString(),
        }
        state.revisions = [rev, ...(state.revisions || [])]
        return state
    })
}

export const file_types_map = file_types.reduce((acc, ft) => {
    acc[ft.id] = ft
    return acc
}, {})
