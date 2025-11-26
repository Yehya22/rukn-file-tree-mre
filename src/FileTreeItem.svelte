<TreeItem
    {item}
    {order}
    draggable
    data-index={order}
    data-depth={relative_depth}
    data-selected={selected_ids.has(item.node.id) ? 'true' : undefined}
    style="
        height: {size}px;
        position: {sticky ? 'sticky' : 'absolute'};
        top: {sticky ? relative_depth * size : 0}px;
        transform: translateY({sticky ? 0 : start}px);
        z-index: {50 - relative_depth};
    "
    onclick={e => {
        const meta_key = navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey

        if (e.shiftKey && selected_ids.size) {
            const visible_items = tree.getVisibleItems()
            const [a, b] = [
                visible_items.findIndex(
                    v => v.node.id === Array.from(selected_ids)[selected_ids.size - 1],
                ),
                visible_items.findIndex(v => v.node.id === item.node.id),
            ]

            if (a !== -1 && b !== -1) {
                for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
                    selected_ids.add(visible_items[i].node.id)
                }
            }
            e.preventDefault()
            e.stopPropagation()
            return
        } else if (meta_key) {
            selected_ids.has(item.node.id)
                ? selected_ids.delete(item.node.id)
                : selected_ids.add(item.node.id)
            e.preventDefault()
            e.stopPropagation()
            return
        } else {
            selected_ids.clear()
            selected_ids.add(item.node.id)
        }

        if (item.node.type === 'file' && !meta_key && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            if (file_detail) {
                window.navgo.goto(build_file_url(file_detail.folder, original_file_id_str))
            }
        }
    }}
    ondblclick={e => {
        if (item.node.type === 'folder') {
            e.preventDefault()
            e.stopPropagation()
            navigate_to_folder()
        }
    }}
    oncontextmenu={() => on_context_menu(item)}
    ondragstart={e => drag_and_drop.item(item).ondragstart(e)}
    ondragend={drag_and_drop.item(item).ondragend}
    ondragover={e => drag_and_drop.item(item).ondragover(e)}
    ondragleave={e => drag_and_drop.item(item).ondragleave(e)}
    ondrop={e => drag_and_drop.item(item).ondrop(e)}
    onkeydown={e => {
        if (dialog_store.is_open) {
            return
        }

        if (e.target?.closest('input, textarea, [contenteditable]')) return

        const meta_key = navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey
        if (
            e.target !== e.currentTarget &&
            !meta_key &&
            ['c', 'x', 'v'].includes(e.key.toLowerCase())
        ) {
            return
        }

        if (meta_key) {
            const key = e.key.toLowerCase()
            if (key === 'c') {
                e.preventDefault()
                e.stopPropagation()
                on_copy?.(item.node.id)
                return
            }
            if (key === 'x') {
                e.preventDefault()
                e.stopPropagation()
                on_cut?.(item.node.id)
                return
            }
            if (key === 'v') {
                e.preventDefault()
                e.stopPropagation()
                on_paste?.({item_id: item.node.id, shiftKey: e.shiftKey, node_type: item.node.type})
                return
            }
        }
        if (e.key.toLowerCase() === 'r') {
            e.preventDefault()
            e.stopPropagation()
            if (meta_key && e.shiftKey) {
                on_rename?.()
            } else {
                edit_state = {item_id: item.node.id}
            }
            return
        }

        if (e.key === 'Delete') {
            e.preventDefault()
            e.stopPropagation()
            on_delete?.()
            return
        }

        if ((meta_key || e.ctrlKey) && e.key === 'Enter' && item.node.type === 'folder') {
            e.preventDefault()
            e.stopPropagation()
            navigate_to_folder()
        } else if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            if (item.node.type === 'file') {
                if (file_detail) {
                    window.navgo.goto(build_file_url(file_detail.folder, original_file_id_str))
                }
            } else if (item.node.type === 'folder') {
                if (expandedIds.has(item.node.id)) {
                    expandedIds.delete(item.node.id)
                    persist_expanded?.()
                } else {
                    ensure_children_loaded?.(item.node.id)
                    expandedIds.add(item.node.id)
                    persist_expanded?.()
                }
            }
        } else if (meta_key || e.ctrlKey) {
            if (e.key.toLowerCase() === 'e') {
                e.preventDefault()
                e.stopPropagation()
                handle_edit_item(item.node.id)
            } else if (e.key.toLowerCase() === 'f' && item.node.type === 'folder') {
                e.preventDefault()
                e.stopPropagation()
                handle_new_folder(item.node.id)
            } else if (e.key.toLowerCase() === 'n' && item.node.type === 'folder') {
                e.preventDefault()
                e.stopPropagation()
                handle_new_file(item.node.id)
            } else if (e.key.toLowerCase() === 'm' && can_replace()) {
                e.preventDefault()
                e.stopPropagation()
                on_replace()
            }
        }

        if ([KEY_ARROW_UP, KEY_ARROW_DOWN].includes(e.key)) {
            e.preventDefault()
            e.stopPropagation()

            const visible_items = tree.getVisibleItems()
            const current_index = visible_items.findIndex(v => v.node.id === item.node.id)
            if (current_index === -1) return

            if (e.key === KEY_ARROW_UP && current_index > 0) {
                const prev_item = visible_items[current_index - 1]
                const prev_element = tree.getItemElement(prev_item.node.id)
                prev_element?.focus()
                selected_ids.clear()
                selected_ids.add(prev_item.node.id)
            } else if (e.key === KEY_ARROW_DOWN && current_index < visible_items.length - 1) {
                const next_item = visible_items[current_index + 1]
                const next_element = tree.getItemElement(next_item.node.id)
                next_element?.focus()
                selected_ids.clear()
                selected_ids.add(next_item.node.id)
            }
            return
        }
    }}
    class={[
        'group relative grid w-full grid-cols-[minmax(0,5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center bg-background px-1 py-0 select-none before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent after:transition-colors not-aria-selected:not-aria-disabled:hover:bg-accent focus:outline-2 focus:-outline-offset-2 focus:outline-ring not-aria-selected:not-aria-disabled:active:bg-accent/90 aria-disabled:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground data-border-animating:after:border-primary data-border-animating:after:bg-accent/50 data-deepest-visible-sticky:border-b data-deepest-visible-sticky:border-border data-drop-destination:before:border-destructive',
        selected_ids.has(item.node.id) && 'bg-accent text-accent-foreground',
    ]}
    data-drop-destination={item.node.type === 'folder' && item.node.id === drop_destination_node_id
        ? true
        : undefined}
    data-border-animating={item.node.id === border_animation_target_id ? true : undefined}
    data-deepest-visible-sticky={item.node.id === deepest_visible_sticky_id ? true : undefined}
>
    {#if item.node.type === 'file'}
        {@const file_type =
            file_detail && $appdata.file_types.list.find(ft => ft.id === file_detail.file_type)}
        {@const rev = file_rev_map[original_file_id_str]}
        <Button
            variant="link"
            class="flex h-auto items-center justify-start px-3! py-0! text-black! hover:no-underline focus:no-underline"
            disabled={item.disabled}
            style="margin-inline-start: {item.depth * 1.25 + 0.25}rem;"
            onclick={e => {
                if (edit_state?.item_id === item.node.id) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }}
        >
            <FileText class="ms-3 size-4 shrink-0 text-black" />
            {#if edit_state?.item_id === item.node.id}
                <input
                    type="text"
                    value={item.node.name}
                    autocomplete="off"
                    class="m-0! w-full min-w-0 flex-1 border-0! bg-background p-0! text-foreground focus-visible:outline-2 focus-visible:outline-current"
                    onkeydown={e => {
                        e.stopPropagation()
                        // Prevent keyboard events when dialog is open
                        if (dialog_store.is_open) {
                            return
                        }

                        if (e.key === 'Enter') {
                            e.preventDefault()
                            e.stopPropagation()
                            confirm_inline_edit(item.node.id, e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                            e.preventDefault()
                            on_cancel_edit(item.node.id)
                        }
                    }}
                    onblur={() => on_cancel_edit(item.node.id)}
                    onclick={e => e.stopPropagation()}
                    onmousedown={e => e.stopPropagation()}
                    use:focus_and_select
                />
            {:else}
                <span class="flex w-full items-center gap-1 truncate text-black">
                    <span class="truncate">{item.node.name}</span>
                    {#if Object.values(file_detail.metadata.is_visible || {}).some(Boolean)}
                        <BookCheck class="ms-auto size-3 text-green-600" />
                    {/if}
                </span>
            {/if}
        </Button>
        <div class="truncate text-center text-xs text-muted-foreground">
            {#if file_type}
                {file_type.name}
            {/if}
        </div>
        <div class="truncate text-xs text-muted-foreground">
            {#if rev && users_map[rev.user]}
                {users_map[rev.user].first_name}
            {/if}
        </div>
        <div class="truncate text-xs text-muted-foreground">
            {#if rev}
                <span title={fmt_date(rev.updated_at)}
                    >{prep_num(relative_time(new Date(rev.updated_at || 0), $now))}</span
                >
            {/if}
        </div>
    {:else}
        <div
            class={[
                'flex items-center',
                sticky ? 'relative h-full w-full' : 'col-span-3',
            ]}
            style="margin-inline-start: {item.depth * 1.25 + 0.25}rem;"
        >
            <Button
                aria-label={item.expanded ? 'تجميع المجلد' : 'توسيع المجلد'}
                variant="ghost"
                size="icon"
                disabled={item.disabled}
                class={[
                    'flex h-6 w-6 shrink-0 items-center justify-center transition-transform duration-150 ease-in-out hover:bg-transparent focus:bg-transparent ltr:-rotate-180',
                    item.expanded && '-rotate-90!',
                ]}
                onclick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.currentTarget.focus()
                    if (expandedIds.has(item.node.id)) {
                        expandedIds.delete(item.node.id)
                        persist_expanded?.()
                    } else {
                        // Lazy-load children on expand
                        ensure_children_loaded?.(item.node.id)
                        expandedIds.add(item.node.id)
                        persist_expanded?.()
                        // Bring first child into view so expansion is visible, but only if there are children
                        queueMicrotask(() => {
                            try {
                                if (item.node.children && item.node.children.length) {
                                    tree?.focusItem?.(order + 1)
                                }
                            } catch {}
                        })
                    }
                }}
                ondblclick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                <ChevronLeft class="h-4 w-4 text-black" />
            </Button>
            {#if item.node.id === 'root'}
                <FolderIcon class="h-4 w-4 shrink-0 text-black" />
            {:else if item.expanded}
                <FolderOpenIcon class="h-4 w-4 shrink-0 text-black" />
            {:else}
                <FolderIcon class="h-4 w-4 shrink-0 text-black" />
            {/if}
            {#if edit_state?.item_id === item.node.id}
                <input
                    value={item.node.name}
                    autocomplete="off"
                    class="m-0! ms-2 border-0! bg-background p-0! text-foreground focus-visible:outline-2 focus-visible:outline-current"
                    onkeydown={e => {
                        e.stopPropagation()
                        // Prevent keyboard events when dialog is open
                        if (dialog_store.is_open) {
                            return
                        }

                        if (e.key === 'Enter') {
                            e.preventDefault()
                            confirm_inline_edit(item.node.id, e.currentTarget.value)
                        } else if (e.key === 'Escape') {
                            e.preventDefault()
                            on_cancel_edit(item.node.id)
                        }
                    }}
                    onblur={() => on_cancel_edit(item.node.id)}
                    onclick={e => e.stopPropagation()}
                    onmousedown={e => e.stopPropagation()}
                    use:focus_and_select
                />
            {:else}
                {@const full_path = folder_full_paths?.get(item.node.id)}
                {@const last_segment =
                    full_path && full_path.includes(' / ')
                        ? full_path.slice(full_path.lastIndexOf(' / ') + 3)
                        : full_path}
                <span class="ms-2 truncate text-black">
                    {sticky && item.node.type === 'folder'
                        ? last_segment || item.node.name
                        : item.node.name}
                </span>
            {/if}
        </div>
        {@const counts = $folder_counts.get(
            item.node.id.startsWith('folder-') ? +item.node.id.slice(7) : +item.node.id,
        )}
        {#if counts?.total}
            <span
                class={[
                    'text-xs text-muted-foreground',
                    sticky && 'absolute end-[6%]',
                ]}>{prep_num(counts.total)}</span
            >
        {/if}
    {/if}
</TreeItem>

<script>
import {
    BookCheck,
    ChevronLeft,
    FileText,
    Folder as FolderIcon,
    FolderOpenIcon,
} from '@lucide/svelte'
import {fmt_date} from '~/util/intl.js'
import {watch} from 'runed'
import {tick} from 'svelte'
import {TreeItem} from 'svelte-file-tree'

import {focus_and_select, prep_num} from '~/util/util.js'
import {Button} from '$ui/button/index.js'
import {dialog_store} from '$ui/dialog/index.js'

import {appdata, folder_counts, get_folder_parents, now} from './store.js'
import relative_time from './util/relative_time.js'

let {
    item,
    order,
    size,
    start,
    tree,
    app_name,
    expandedIds,
    edit_state = $bindable(),
    drop_destination_node_id,
    border_animation_target_id,
    deepest_visible_sticky_id,
    sticky_indices = [],
    folder_full_paths,
    confirm_inline_edit,
    on_context_menu,
    handle_edit_item,
    handle_new_file,
    handle_new_folder,
    on_cancel_edit,
    file_rev_map,
    users_map,
    drag_and_drop,
    selected_ids,
    ensure_children_loaded = () => {},
    on_copy = () => {},
    on_cut = () => {},
    on_paste = () => {},
    on_rename = () => {},
    on_delete = () => {},
    can_replace,
    on_replace,
    persist_expanded = () => {},
} = $props()

const sticky = $derived(sticky_indices.includes(order))
const relative_depth = $derived(item.depth)

const original_file_id_str =
    item.node.type === 'file' ? item.node.id.substring('file-'.length) : null
const original_file_id = original_file_id_str ? +original_file_id_str : null
// Use O(1) lookup against the map instead of O(N) find per item render
const file_detail = original_file_id ? $appdata.files.map[original_file_id] : null

// Ensure children are loaded whenever a folder becomes expanded,
watch(
    () => [item.node.type, item.expanded, item.node.id],
    ([type, expanded, id]) => {
        if (type === 'folder' && expanded) {
            ensure_children_loaded?.(id)
        }
    },
    {lazy: true},
)

function build_file_url(folder_id, file_id) {
    const path_arr = [app_name, ...get_folder_parents(folder_id), 'edit', file_id]
    return `/${path_arr.join('/')}/`
}

function build_folder_url(folder_id) {
    const parents = get_folder_parents(folder_id)
    const path_arr = parents.includes(folder_id)
        ? [app_name, ...parents]
        : [app_name, ...parents, folder_id]
    return `/${path_arr.join('/')}/`
}

function navigate_to_folder() {
    const folder_id = item.node.id.substring('folder-'.length)
    window.navgo.goto(build_folder_url(+folder_id))
}

const KEY_ARROW_UP = 'ArrowUp'
const KEY_ARROW_DOWN = 'ArrowDown'
</script>
