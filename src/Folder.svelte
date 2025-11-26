{#if file_tree.children.length}
    <div class="relative">
        {#if selected_ids.size > 1}
            <Badge
                variant="secondary"
                class="absolute end-8 top-2 z-40 border border-gray-300 shadow-lg"
            >
                {ar_nums(selected_ids.size)}
            </Badge>
        {/if}
        <div
            class="flex flex-col"
            use:set_top_offset
            style="height: calc(100vh - var(--top-offset, 120px)); min-height: 400px; max-height: 1400px;"
        >
            <div class="relative h-full w-full rounded-md bg-card text-card-foreground">
                <div
                    class="relative h-full rounded-md"
                    data-drop-destination={drop_destination_node_id === 'tree' ? true : undefined}
                >
                    <FolderContextMenu
                        target={context_menu_target}
                        clipboardIds={clipboard_ids}
                        selected_count={selected_ids.size}
                        can_edit={perms_folder >= ACCESS_LEVELS.EDITOR}
                        on_rename={() => {
                            if (context_menu_target?.node)
                                edit_state = {item_id: context_menu_target.node.id}
                        }}
                        on_copy={() => {
                            if (selected_ids.size > 0) {
                                // Copy all selected items
                                handle_copy()
                            } else if (context_menu_target?.node) {
                                // Copy the right-clicked item
                                handle_copy(context_menu_target.node.id)
                            }
                        }}
                        on_cut={() => {
                            if (selected_ids.size > 0) {
                                // Cut all selected items
                                handle_cut()
                            } else if (context_menu_target?.node) {
                                // Cut the right-clicked item
                                handle_cut(context_menu_target.node.id)
                            }
                        }}
                        on_paste={() => handle_paste(context_menu_target)}
                        on_new_file={() =>
                            handle_new_file(context_menu_target?.node?.id || `folder-${folder_id}`)}
                        on_new_folder={() =>
                            handle_new_folder(
                                context_menu_target?.node?.id || `folder-${folder_id}`,
                            )}
                        on_edit_file={() =>
                            context_menu_target?.node &&
                            handle_edit_item(context_menu_target.node.id)}
                        on_edit_folder={() =>
                            context_menu_target?.node &&
                            handle_edit_item(context_menu_target.node.id)}
                        on_replace={() => on_replace()}
                        on_rename_items={() => on_rename_items()}
                        on_delete={() => {
                            if (context_menu_target?.node) {
                                const order = tree
                                    .getVisibleItems()
                                    .findIndex(v => v.node.id === context_menu_target.node.id)
                                if (order >= 0) {
                                    tree.remove(order)
                                }
                            }
                        }}
                    >
                        <VirtualList
                            bind:this={virtual_list}
                            estimateSize={() => ITEM_HEIGHT}
                            overscan={0}
                            paddingStart={0}
                            paddingEnd={0}
                            rangeExtractor={virtual_list_range_extractor}
                            class="overflow-y-auto"
                            style="height: calc(100vh - var(--top-offset, 60px)); min-height: 400px; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);"
                            {@attach virtual_list_attach}
                        >
                            {#snippet children({treeSize, virtualItems})}
                                <div class="mx-auto max-w-2xl px-0.5">
                                    <Tree
                                        bind:this={tree}
                                        root={file_tree}
                                        selectedIds={selected_ids}
                                        expandedIds={expanded_ids}
                                        clipboardIds={clipboard_ids}
                                        bind:pasteOperation={paste_operation}
                                        copyNode={copy_node}
                                        canRemove={can_remove}
                                        onRemove={on_tree_remove}
                                        isItemDisabled={() => perms_folder < ACCESS_LEVELS.EDITOR}
                                        isItemHidden={node => pending_delete_ids.has(node.id)}
                                        ondragover={drag_and_drop.tree.ondragover}
                                        ondragleave={drag_and_drop.tree.ondragleave}
                                        ondrop={drag_and_drop.tree.ondrop}
                                        oncontextmenu={e => {
                                            if (e.target !== e.currentTarget) {
                                                return
                                            }
                                            e.preventDefault()
                                            context_menu_target = file_tree
                                        }}
                                        class="relative"
                                        style="height: {treeSize}px;"
                                    >
                                        {#each virtualItems as { item, key, order, size, start } (key)}
                                            <FileTreeItem
                                                {item}
                                                {order}
                                                {size}
                                                {start}
                                                {tree}
                                                {has_scrolled}
                                                app_name={APP_NAME()}
                                                expandedIds={expanded_ids}
                                                bind:edit_state
                                                {drop_destination_node_id}
                                                {border_animation_target_id}
                                                sticky_indices={sticky_parents_state.sticky_indices}
                                                deepest_visible_sticky_id={sticky_parents_state.deepest_visible_sticky_id}
                                                {folder_full_paths}
                                                {drag_and_drop}
                                                on_context_menu={target =>
                                                    (context_menu_target = target)}
                                                {confirm_inline_edit}
                                                {handle_edit_item}
                                                {handle_new_file}
                                                {handle_new_folder}
                                                {ensure_children_loaded}
                                                {file_rev_map}
                                                {users_map}
                                                {selected_ids}
                                                on_copy={handle_copy}
                                                on_cut={handle_cut}
                                                on_paste={({item_id, node_type, shiftKey}) => {
                                                    const destination = tree.getItem(item_id)
                                                    const target =
                                                        node_type === 'folder' && !shiftKey
                                                            ? destination
                                                            : destination?.parent
                                                    handle_paste(target)
                                                }}
                                                on_rename={() => on_rename_items()}
                                                on_delete={() => {
                                                    const order = tree
                                                        .getVisibleItems()
                                                        .findIndex(v => v.node.id === item.node.id)
                                                    if (order >= 0) {
                                                        tree.remove(order)
                                                    }
                                                }}
                                                on_cancel_edit={() => {
                                                    edit_state = undefined
                                                    tree.getItemElement(item.node.id)?.focus()
                                                }}
                                                {on_replace}
                                                {can_replace}
                                            />
                                        {/each}
                                    </Tree>
                                </div>
                            {/snippet}
                        </VirtualList>
                    </FolderContextMenu>
                </div>
            </div>
        </div>
    </div>
{:else}
    <li class="flex items-center justify-center p-4 text-muted-foreground">لا مجلدات ولا ملفات</li>
{/if}

<svelte:window
    onkeydown={e => {
        if (dialog_store.is_open) {
            return
        }

        const meta_key = navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey

        if ((meta_key || e.ctrlKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault()
            e.stopPropagation()
            create_new_file(folder_id)
            return
        }
        if ((meta_key || e.ctrlKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault()
            e.stopPropagation()
            create_folder_dialog(folder_id)
            return
        }
    }}
/>

<script>
import {ar_nums, set_top_offset} from '~/util/intl.js'
import * as kv from 'idb-keyval'
import {watch} from 'runed'
import {tick, onDestroy} from 'svelte'
import {SvelteSet} from 'svelte/reactivity'
import {FileNode, FileTree, FolderNode, Tree, VirtualList} from 'svelte-file-tree'
import {toast} from 'svelte-sonner'

import api from '~/api.js'
import {add_listener, remove_listener} from '~/socket.js'
import {StickyParentsState} from '~/util/sticky-parents.svelte.js'
import {create_tree_drag_and_drop} from '~/util/tree-helpers.svelte.js'
import {Badge} from '$ui/badge/index.js'
import {dialog_store} from '$ui/dialog/index.js'

import ConfirmDialog from './editor/editors/ConfirmDialog.svelte'
import FileEditor from './FileEditor.svelte'
import FileTreeItem from './FileTreeItem.svelte'
import FolderContextMenu from './FolderContextMenu.svelte'
import FolderEditor from './FolderEditor.svelte'
import {ACCESS_LEVELS, appdata, get_perm, show_system_files} from './store.js'

let {path = ''} = $props()

const perms_app = get_perm('app')
const perms_folder = get_perm('folder')
const users_map = $appdata.users.map

const expanded_ids = new SvelteSet()
const selected_ids = new SvelteSet()
let clipboard_ids = new SvelteSet()
let pending_delete_ids = new SvelteSet()
let paste_operation = $state()
let edit_state = $state()

let tree = $state()
let virtual_list = $state(null)
let has_scrolled = $state(false)

let context_menu_target = $state(undefined)
let drop_destination_node_id = $state(null)
let border_animation_target_id = $state(null)
let border_animation_timeout = $state(null)
// Track loaded folders to avoid repeated loads
const children_loaded_ids = new Set()

const EXPANDED_IDS_KEY = $derived(`${APP_NAME()}_expanded_ids`)
const ITEM_HEIGHT = 40
const VIRTUAL_LIST_PADDING = 0
// Controls for incremental loading of large folders
const LAZY_LOAD_THRESHOLD = 600
const APPEND_CHUNK_SIZE = 256

const drag_and_drop = create_tree_drag_and_drop({
    get_tree: () => tree,
    get_root_node: () => file_tree,
    get_selected_ids: () => selected_ids,
    can_edit: () => perms_folder >= ACCESS_LEVELS.EDITOR,
    on_move: ({sources, destination}) => {
        perform_bulk_tree_action(sources, destination, 'move')
    },
    on_copy: ({sources, destination}) => {
        perform_bulk_tree_action(sources, destination, 'copy')
    },
    on_highlight: target_id => {
        drop_destination_node_id = target_id
    },
    on_drag_start: () => {
        border_animation_target_id = null
    },
    on_drag_end: () => {
        drop_destination_node_id = null
    },
})

const sticky_parents_state = new StickyParentsState({
    get_tree: () => tree,
    item_height: ITEM_HEIGHT,
    scroll_padding: VIRTUAL_LIST_PADDING,
})

function virtual_list_range_extractor({startIndex, endIndex, overscan, count}) {
    has_scrolled = startIndex > 0
    maybe_append_more(endIndex, count)
    return sticky_parents_state.range_extractor({startIndex, endIndex, overscan, count})
}

function virtual_list_attach(element) {
    return sticky_parents_state.virtual_list_attachment(element)
}

// Lazy append state for large folders (no visible page nodes)
const lazy_children_state = new Map()
const append_inflight_ids = new Set()

let file_tree = new FileTree([])
// Match previous behavior: clear lazy caches when dataset/folder changes
watch(
    [() => $appdata, () => folder_id, () => $show_system_files],
    () => {
        children_loaded_ids.clear()
        lazy_children_state.clear()
        append_inflight_ids.clear()
        const ids = Array.from(expanded_ids)
        queueMicrotask(() => {
            for (const id of ids) ensure_children_loaded(id)
        })
    },
    {lazy: true},
)

// Update the persistent FileTree's children when data or folder changes
watch(
    [
        () => $appdata.files.list,
        () => $appdata.folders.list,
        () => folder_id,
        () => $show_system_files,
    ],
    () => {
        folder_full_paths.clear()
        const files = $appdata.files.list
        const folders = $appdata.folders.list
        tree_indexes = build_indexes(files, folders)
        const parent_path = ''
        file_tree.children = initial_children_for_folder(folder_id, parent_path)
    },
)

// Persist expanded ids to idb
watch(
    () => Array.from(expanded_ids),
    ids => {
        try {
            kv.set(EXPANDED_IDS_KEY, ids)
        } catch (error) {
            console.error('Failed to save expanded ids to idb:', error)
        }
    },
    {lazy: true},
)

function maybe_append_more(endIndex, count) {
    try {
        if (!tree) return
        if (!count) return
        // Only react when scrolled near the end of the current virtual range
        if (endIndex < count - 10) return
        for (const [key, state] of lazy_children_state.entries()) {
            if (state.loaded >= state.total) continue
            if (append_inflight_ids.has(key)) continue
            const item = tree.getItem?.(key)
            if (!item) continue
            append_inflight_ids.add(key)
            const next = Math.min(state.loaded + APPEND_CHUNK_SIZE, state.total)
            const nodes = slice_children_range(state.folderId, state.loaded, next, state.parentPath)
            item.node.children = item.node.children.concat(nodes)
            state.loaded = next
            append_inflight_ids.delete(key)
        }
    } catch {
        console.error('Error in maybe_append_more', {endIndex, count})
    }
}

// Robustly resolve current folder id from route path. Handles both folder and file routes.
const folder_id = $derived.by(() => {
    try {
        const parts = (path || '').split('/').filter(Boolean)
        // If URL contains 'edit/<file_id>', resolve folder via appdata
        const editIdx = parts.lastIndexOf('edit')
        if (editIdx !== -1 && editIdx + 1 < parts.length) {
            const fileId = +parts[editIdx + 1]
            const file = $appdata.files.map[fileId]
            if (file?.folder) return file.folder
        }
        for (let i = parts.length - 1; i >= 0; i--) {
            const n = +parts[i]
            if (Number.isFinite(n)) return n
        }
        return 1
    } catch {
        return 1
    }
})

;(async () => {
    try {
        const stored_expanded_ids = await kv.get(EXPANDED_IDS_KEY)
        if (Array.isArray(stored_expanded_ids)) {
            // Restore exactly what was saved previously
            expanded_ids.clear()
            for (const id of stored_expanded_ids){
                expanded_ids.add(id)
            }
            // Load children for restored expanded folders
            queueMicrotask(() => {
                for (const id of stored_expanded_ids) ensure_children_loaded(id)
            })
        } else {
            expanded_ids.clear()
        }
    } catch (error) {
        console.error('Failed to load expanded nodes from IndexedDB:', error)
    }
    add_listener(on_ws_message)
})()

onDestroy(() => {
    remove_listener(on_ws_message)
})

function on_ws_message(type, msg) {
    if (type === 'publish_status') {
        if (msg.success) toast.success(`نجح التحديث: ${msg.instance.result_msg}`)
        else toast.error('حدث خطأ' + (msg.instance.result_msg || ''))
    }
}

function start_border_animation(target_id) {
    if (border_animation_timeout) {
        clearTimeout(border_animation_timeout)
    }
    border_animation_target_id = target_id
    border_animation_timeout = setTimeout(() => {
        border_animation_target_id = null
        border_animation_timeout = null
    }, 1000)
}

const is_editor = perms_app >= ACCESS_LEVELS.EDITOR

const folder_full_paths = new Map()
const file_nodes_cache = new Map()
const folder_nodes_cache = new Map()

// Build adjacency indexes in O(N) to avoid repeated filters on large datasets
function build_indexes(all_files, all_folders) {
    const files_by_folder = new Map()
    const folders_by_parent = new Map()

    const hide_system_for_user = !is_editor || !$show_system_files
    // Index files, excluding system files when needed
    for (const file of all_files) {
        if (!file) continue
        if (file.metadata?.system && hide_system_for_user) continue
        const key = file.folder ?? null
        const arr = files_by_folder.get(key)
        if (arr) arr.push(file)
        else files_by_folder.set(key, [file])
    }

    // Index folders by parent, excluding system folders when needed
    for (const folder of all_folders) {
        if (!folder) continue
        if (folder.metadata?.system && hide_system_for_user) continue
        const key = folder.parent ?? null
        const arr = folders_by_parent.get(key)
        if (arr) arr.push(folder)
        else folders_by_parent.set(key, [folder])
    }

    return {files_by_folder, folders_by_parent}
}

function make_folder_node(folder, parent_path = '') {
    const id = `folder-${folder.id}`
    const full_path = parent_path ? `${parent_path} / ${folder.name}` : folder.name
    folder_full_paths.set(id, full_path)
    let node = folder_nodes_cache.get(id)
    if (!node) {
        node = new FolderNode({id, name: folder.name, children: []})
        folder_nodes_cache.set(id, node)
    } else {
        node.name = folder.name
    }
    return node
}

function get_file_node(file) {
    const id = `file-${file.id}`
    let node = file_nodes_cache.get(id)
    if (!node) {
        node = new FileNode({id, name: file.name})
        file_nodes_cache.set(id, node)
    } else {
        node.name = file.name
    }
    return node
}

// Non-reactive cache for adjacency indexes; do not declare with $state
let tree_indexes = {files_by_folder: new Map(), folders_by_parent: new Map()}

function initial_children_for_folder(current_folder_id, parent_path = '') {
    const {files_by_folder, folders_by_parent} = tree_indexes

    // For root folder (id=1), include children whose parent is 1 or null, mirroring previous logic
    const direct_children = folders_by_parent.get(+current_folder_id) || []
    const root_extras =
        current_folder_id === 1
            ? [...(folders_by_parent.get(null) || []), ...(folders_by_parent.get(0) || [])]
            : []
    const child_folders = [...direct_children, ...root_extras].filter(
        f => f && f.id !== current_folder_id,
    )

    const sub_folders_nodes = child_folders.map(folder => make_folder_node(folder, parent_path))

    const files = files_by_folder.get(current_folder_id) || []
    const file_nodes = files.map(get_file_node)

    return [...sub_folders_nodes, ...file_nodes]
}

function slice_children_range(folder_id, start_index, end_index, parent_path = '') {
    const {files_by_folder, folders_by_parent} = tree_indexes
    const child_folders = folders_by_parent.get(folder_id) || []
    const files_in_folder = files_by_folder.get(folder_id) || []
    const total_count = child_folders.length + files_in_folder.length
    const clamped_start = Math.max(0, Math.min(start_index, total_count))
    const clamped_end = Math.max(clamped_start, Math.min(end_index, total_count))
    const result = []
    const folder_count = child_folders.length
    if (clamped_start < folder_count) {
        const folders_start = clamped_start
        const folders_end = Math.min(clamped_end, folder_count)
        for (let i = folders_start; i < folders_end; i++) {
            result.push(make_folder_node(child_folders[i], parent_path))
        }
    }
    if (clamped_end > folder_count) {
        const files_start = Math.max(0, clamped_start - folder_count)
        const files_end = clamped_end - folder_count
        for (let j = files_start; j < files_end && j < files_in_folder.length; j++) {
            const file = files_in_folder[j]
            result.push(get_file_node(file))
        }
    }
    return result
}

function ensure_children_loaded(folder_node_id) {
    if (!folder_node_id?.startsWith('folder-')) return

    const id_num = +folder_node_id.substring('folder-'.length)
    if (children_loaded_ids.has(folder_node_id)) return
    const node = folder_nodes_cache.get(folder_node_id)
    if (!node || node.type !== 'folder') return

    const parent_path = folder_full_paths.get(folder_node_id) || ''
    const {files_by_folder, folders_by_parent} = tree_indexes
    const child_folders = folders_by_parent.get(id_num) || []
    const files = files_by_folder.get(id_num) || []
    const total_children = child_folders.length + files.length

    if (total_children === 0) {
        node.children = []
        children_loaded_ids.add(folder_node_id)
        return
    }

    if (total_children > LAZY_LOAD_THRESHOLD) {
        const initial = Math.min(
            total_children,
            Math.max(64, Math.min(APPEND_CHUNK_SIZE, total_children)),
        )
        node.children = slice_children_range(id_num, 0, initial, parent_path)
        lazy_children_state.set(folder_node_id, {
            folderId: id_num,
            total: total_children,
            loaded: initial,
            parentPath: parent_path,
        })
        children_loaded_ids.add(folder_node_id)
    } else {
        const folder_nodes = child_folders.map(folder => make_folder_node(folder, parent_path))
        const file_nodes = files.map(get_file_node)
        node.children = [...folder_nodes, ...file_nodes]
        children_loaded_ids.add(folder_node_id)
    }

    tick().then(() => {
        virtual_list?.measure()
    })
}

let file_rev_map = $state({})
;(async function () {
    const revs_response = await api.GET(['revision', {folder: folder_id, latest: 1, page: -1}])
    if (revs_response && !revs_response.error) {
        file_rev_map = Object.fromEntries(revs_response.results.map(r => [r.rev_of, r]))
    } else {
        // Handle error or empty response appropriately
        console.error('Failed to fetch revisions or no revisions found', revs_response?.error)
        file_rev_map = {}
    }
})()

function copy_node(node) {
    if (node.type === 'file') {
        return new FileNode({
            id: `file-${crypto.randomUUID()}`,
            name: node.name,
        })
    } else {
        return new FolderNode({
            id: `folder-${crypto.randomUUID()}`,
            name: node.name,
            children: node.children.map(copy_node),
        })
    }
}

async function can_remove(args) {
    if (perms_folder < ACCESS_LEVELS.EDITOR) {
        toast.error('ليست لديك صلاحيات')
        return false
    }
    if (!args.removed || args.removed.length === 0) return false

    const confirmed = await new Promise(resolve => {
        dialog_store.data = {
            component: ConfirmDialog,
            props: {
                title: 'هل تريد الحذف؟',
                message: `هل أنت متأكد أنك تريد حذف ${args.removed.length} عنصرًا؟ قد يشمل ذلك مجلدات ومحتوياتها، ولا يمكن التراجع عن هذا الإجراء.`,
                show_close_button: false,
                on_result: result => resolve(result),
            },
        }
    })
    if (!confirmed) return false

    const ids = args.removed.map(r => r.node.id)
    for (const id of ids) {
        pending_delete_ids.add(id)
        selected_ids.delete(id)
        expanded_ids.delete(id)
        clipboard_ids.delete(id)
    }

    ;(async () => {
        const results = await Promise.all(
            ids.map(async id => {
                const [type, nid] = id.split('-')
                try {
                    const res = await api.DELETE(`${type}/${nid}`)
                    return !res?.error
                } catch (e) {
                    console.error(e)
                    return false
                }
            }),
        )

        if (results.every(Boolean)) {
            toast.success('حُذف بنجاح')
        } else {
            toast.error('حدث خطأ')
            ids.forEach((id, i) => {
                if (!results[i]) pending_delete_ids.delete(id)
            })
        }
    })()

    return false
}

async function on_tree_remove(args) {
    if (!args.removed?.length) return

    const promises = args.removed.map(async item => {
        const [type, id] = item.node.id.split('-')
        try {
            const response = await api.DELETE(`${type}/${id}`)
            return !response?.error
        } catch (e) {
            console.error(e)
            return false
        }
    })

    const results = await Promise.all(promises)

    if (results.every(Boolean)) {
        toast.success('حُذف بنجاح')
    } else {
        toast.error('حدث خطأ')
    }
}

async function perform_bulk_tree_action(sources, destination, operation) {
    if (perms_folder < ACCESS_LEVELS.EDITOR) {
        toast.error('ليست لديك صلاحيات')
        return false
    }
    if (!sources?.length) return true

    const is_move = operation === 'move'
    const destination_id = destination?.id?.startsWith('folder-')
        ? +destination.id.substring('folder-'.length)
        : folder_id

    const promises = sources.map(async source_item => {
        const [type, id] = source_item.node.id.split('-')
        const payload = type === 'file' ? {folder: destination_id} : {parent: destination_id}

        const res = await (is_move
            ? api.PATCH(`${type}/${id}/`, payload)
            : api.POST(`${type}/${id}/copy${type === 'folder' ? '/' : ''}`, payload))
        return res?.error ? false : true
    })

    const results = await Promise.all(promises)

    if (results.every(Boolean)) {
        toast.success(is_move ? 'تم نقل العناصر' : 'نسخ بنجاح')
        start_border_animation(destination === file_tree ? null : destination.id)
        return true
    } else {
        toast.error('حدث خطأ')
        return false
    }
}

async function confirm_inline_edit(item_id, new_name) {
    if (!new_name.trim()) {
        toast.error('الاسم لا يمكن أن يكون فارغ')
        return
    }

    const [type, id_str] = item_id.split('-')
    const id = +id_str
    const tree_item_node = tree?.getItem(item_id)?.node
    const appdata_item = (type === 'file' ? $appdata.files : $appdata.folders).list.find(
        f => f.id === id,
    )

    if (!tree_item_node || !appdata_item) {
        toast.error('حدث خطأ')
        return
    }

    const original_name = appdata_item.name
    tree_item_node.name = new_name
    edit_state = undefined
    selected_ids.clear()

    tree.getItemElement(item_id)?.focus()

    try {
        const response = await api.PATCH(`${type}/${id}/`, {name: new_name})
        if (response.error) {
            const error_msg = await response.response.text()
            toast.error(
                error_msg.includes('IntegrityError') || error_msg.includes('duplicate key')
                    ? 'يوجد ملف بهذا الاسم بالفعل'
                    : 'حدث خطأ',
            )
            tree_item_node.name = original_name
            edit_state = {item_id}
            return
        }
        appdata_item.name = new_name
        toast.success('حُفظ')
    } catch (e) {
        tree_item_node.name = original_name
        edit_state = {item_id}
        toast.error('حدث خطأ')
        console.error('Rename API call failed:', e)
    }
}

function handle_copy(item_id) {
    if (!tree) return
    clipboard_ids.clear()
    if (item_id) {
        clipboard_ids.add(item_id)
    } else {
        for (const selected_id of selected_ids) {
            clipboard_ids.add(selected_id)
        }
    }
    if (clipboard_ids.size === 0) return

    paste_operation = 'copy'
    toast.success('نسخ بنجاح')
}

function handle_cut(item_id) {
    if (!tree) return
    clipboard_ids.clear()
    if (item_id) {
        clipboard_ids.add(item_id)
    } else {
        for (const selected_id of selected_ids) {
            clipboard_ids.add(selected_id)
        }
    }
    if (clipboard_ids.size === 0) return
    paste_operation = 'cut'
    toast.success('نقل إلى الحافظة')
}

async function handle_paste(destination) {
    if (!tree || clipboard_ids.size === 0) return

    if (perms_folder < ACCESS_LEVELS.EDITOR) {
        toast.error('ليست لديك صلاحيات')
        return
    }

    const first_selected_id = [...selected_ids][0]
    const item_context =
        destination || (first_selected_id ? tree.getItem(first_selected_id) : undefined)

    let target_state
    if (!item_context || item_context.type === 'tree') {
        target_state = undefined
    } else if (item_context.node.type === 'folder') {
        target_state = item_context
    } else {
        target_state = item_context.parent
    }

    const items = [...clipboard_ids].map(id => tree.getItem(id)).filter(Boolean)

    if (items.length) {
        const operation = paste_operation === 'cut' ? 'move' : 'copy'
        const destination_node = target_state?.node ?? file_tree
        const ok = await perform_bulk_tree_action(items, destination_node, operation)
        if (!ok) {
            await tree.paste(undefined)
            return
        }
    }

    await tree.paste(target_state)
    selected_ids.clear()
    clipboard_ids.clear()
    paste_operation = undefined
}

function create_new_file(folder_id) {
    dialog_store.data = {
        component: FileEditor,
        props: {
            title: 'إنشاء ملف جديد',
            data: {folder: folder_id},
            on_close: () => {
                dialog_store.reset()
                selected_ids.clear()
            },
        },
    }
}

function handle_new_file(item_id) {
    if (!item_id?.startsWith('folder-')) return
    const folder_id = +item_id.substring('folder-'.length)
    create_new_file(folder_id)
}

function create_folder_dialog(parent_folder_id) {
    dialog_store.data = {
        component: FolderEditor,
        props: {
            title: 'إنشاء مجلد جديد',
            data: {parent: parent_folder_id},
            on_close: () => {
                dialog_store.reset()
                selected_ids.clear()
            },
        },
    }
}

function handle_new_folder(item_id) {
    if (!item_id?.startsWith('folder-')) return

    const folder_id_num = +item_id.substring('folder-'.length)
    create_folder_dialog(folder_id_num)
}

async function handle_edit_item(item_id) {
    const [type, id] = item_id.split('-')

    dialog_store.data = {
        component: type === 'file' ? FileEditor : FolderEditor,
        props: {
            title: type === 'file' ? 'تعديل الملف' : 'تعديل المجلد',
            data: await api.GET([`${type}/${id}`, {include: 'metadata'}]),
            callback: updated_item => {
                const tree_item = tree?.getItem(item_id)
                if (tree_item) tree_item.node.name = updated_item.name
            },
            on_close: () => {
                dialog_store.reset()
                selected_ids.clear()
            },
        },
    }
}

function collect_files_for_replace() {
    const files = []

    for (const id of selected_ids) {
        if (id.startsWith('file-')) {
            const file = get_file_by_id(id.substring(5))
            if (file) files.push(file)
        } else if (id.startsWith('folder-')) {
            files.push(...get_all_files_in_folder(+id.substring('folder-'.length)))
        }
    }

    if (files.length === 0 && context_menu_target?.node) {
        const target_id = context_menu_target.node.id
        if (target_id.startsWith('file-')) {
            const file = get_file_by_id(target_id.substring(5))
            if (file) files.push(file)
        } else if (target_id.startsWith('folder-')) {
            files.push(...get_all_files_in_folder(+target_id.substring('folder-'.length)))
        }
    }

    return files
}

function get_file_by_id(file_id) {
    const file = $appdata.files.list.find(f => f.id === +file_id)
    return file ? {id: file.id, name: file.name} : null
}

function can_replace() {
    if (selected_ids.size > 0) {
        return [...selected_ids].some(id => id.startsWith('file-') || id.startsWith('folder-'))
    }

    return (
        context_menu_target?.node &&
        (context_menu_target.node.id.startsWith('file-') ||
            context_menu_target.node.id.startsWith('folder-'))
    )
}

function on_replace() {
    const files = collect_files_for_replace()

    if (files.length) {
        const file_ids = files.map(f => f.id).join(',')
        window.navgo.goto(`/${APP_NAME()}/replace/?files=${file_ids}`)
    }
}

function get_all_files_in_folder(folder_id) {
    const files = []

    $appdata.files.list
        .filter(f => f.folder === folder_id)
        .forEach(file => files.push({id: file.id, name: file.name}))

    const subfolders = $appdata.folders.list.filter(f => f.parent === folder_id)
    for (const subfolder of subfolders) {
        const subfolder_files = get_all_files_in_folder(subfolder.id)
        files.push(...subfolder_files)
    }

    return files
}

function on_rename_items() {
    let selected_files = []
    let selected_folders = []

    if (selected_ids.size) {
        Array.from(selected_ids).forEach(id => {
            if (id.startsWith('folder-')) {
                selected_folders.push(+id.replace('folder-', ''))
            } else if (id.startsWith('file-')) {
                const file_id = +id.substring(5)
                const file = $appdata.files.list.find(f => f.id === file_id)
                if (file) {
                    selected_files.push({id: file_id, name: file.name, parent: file.folder})
                }
            }
        })
    } else if (context_menu_target?.node?.type === 'folder') {
        const folder_id = +context_menu_target.node.id.replace('folder-', '')
        selected_folders = [folder_id]
    }

    const params = new URLSearchParams()
    if (selected_files.length) {
        params.set('files', selected_files.map(f => f.id).join(','))
    }
    if (selected_folders.length) {
        params.set('folders', selected_folders.join(','))
    }

    if (selected_files.length || selected_folders.length) {
        window.navgo.goto(`/${APP_NAME()}/rename/?${params.toString()}`)
    }
}
</script>
