import {SvelteSet} from 'svelte/reactivity'

import {appdata} from '~/store.js'

export function create_tree_drag_and_drop({
    get_tree,
    get_root_node,
    get_selected_ids,
    can_edit,
    on_move,
    on_copy,
    on_highlight,
    on_drag_start,
    on_drag_end,
}) {
    let dragged_id = null
    const TREE_ID = 'tree'

    function tree_drag_over(event) {
        if (!can_edit?.()) return
        if (event.target instanceof Element && event.target.closest('[role="treeitem"]')) return
        event.preventDefault()
        event.dataTransfer.dropEffect = event.metaKey || event.ctrlKey ? 'copy' : 'move'
        on_highlight?.(TREE_ID)
    }

    function tree_drag_leave(event) {
        if (
            event.relatedTarget instanceof Node &&
            event.currentTarget?.contains?.(event.relatedTarget)
        )
            return
        on_highlight?.(null)
    }

    function tree_drop(event) {
        event.preventDefault()
        const tree = get_tree?.()
        if (!tree || !dragged_id) return finish_drag()
        process_drop(tree, {state: undefined, node: get_root_node?.(), id: TREE_ID}, event)
        finish_drag()
    }

    function item_drag_start(item, event) {
        if (!item || item.disabled || !can_edit?.()) {
            event.preventDefault()
            return
        }
        dragged_id = item.node?.id ?? null
        on_drag_start?.()
        const selected = get_selected_ids?.()
        if (selected && dragged_id && !selected.has(dragged_id)) {
            selected.clear()
            selected.add(dragged_id)
        }
        event.dataTransfer.effectAllowed = 'copyMove'
    }

    function item_drag_end() {
        finish_drag()
    }

    function item_drag_over(item, event) {
        if (!can_edit?.()) return
        if (!dragged_id && !event.dataTransfer?.types?.includes?.('Files')) return

        const dest = get_destination(item, get_root_node?.())
        if (dragged_id && !is_valid_drop(dragged_id, dest)) return

        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = event.metaKey || event.ctrlKey ? 'copy' : 'move'
        on_highlight?.(dest.id)
    }

    function item_drag_leave(item, event) {
        if (
            event.relatedTarget instanceof Node &&
            event.currentTarget?.contains?.(event.relatedTarget)
        )
            return
        const dest = get_destination(item, get_root_node?.())
        on_highlight?.(dest.id === TREE_ID ? TREE_ID : null)
    }

    function item_drop(item, event) {
        const tree = get_tree?.()
        if (!tree) return finish_drag()

        const dest = get_destination(item, get_root_node?.())
        if (dragged_id && !is_valid_drop(dragged_id, dest)) {
            finish_drag()
            event.stopPropagation()
            return
        }

        event.preventDefault()
        event.stopPropagation()

        if (dragged_id) process_drop(tree, dest, event)
        finish_drag()
    }

    function get_destination(item, root) {
        if (!item) return {state: undefined, node: root, id: TREE_ID}
        if (item.node?.type === 'folder') return {state: item, node: item.node, id: item.node.id}
        const parent = item.parent
        return parent
            ? {state: parent, node: parent.node, id: parent.node?.id ?? null}
            : {state: undefined, node: root, id: TREE_ID}
    }

    function is_valid_drop(dragged_id, dest) {
        if (!dest.state) return !!dragged_id
        if (!dragged_id || dest.state.node?.type !== 'folder' || dest.state.node?.id === dragged_id)
            return false
        const dragged_item = get_tree?.()?.getItem(dragged_id)
        if (dragged_item?.parent?.node?.id === dest.state.node?.id) return false
        for (let current = dest.state; current; current = current.parent) {
            if (current.node?.id === dragged_id) return false
        }
        return true
    }

    function process_drop(tree, dest, event) {
        const selected = get_selected_ids?.()
        const sources = []
        const ids = new SvelteSet([...(selected || [])])
        if (dragged_id) ids.add(dragged_id)

        for (const id of ids) {
            const item = tree.getItem(id)
            if (item) sources.push(item)
        }
        if (!sources.length) return

        const effect = event.metaKey || event.ctrlKey ? 'copy' : 'move'
        if (effect === 'copy') return on_copy?.({sources, destination: dest.node})

        const movedIds = new SvelteSet(sources.map(s => s.node.id))
        tree.move(movedIds, dest.state).then(ok => {
            if (!ok) return
            on_move?.({sources, destination: dest.node})
        })
    }

    function finish_drag() {
        dragged_id = null
        on_highlight?.(null)
        on_drag_end?.()
    }
    return {
        tree: {ondragover: tree_drag_over, ondragleave: tree_drag_leave, ondrop: tree_drop},
        item: item => ({
            ondragstart: e => item_drag_start(item, e),
            ondragend: item_drag_end,
            ondragover: e => item_drag_over(item, e),
            ondragleave: e => item_drag_leave(item, e),
            ondrop: e => item_drop(item, e),
        }),
    }
}

export function optimistic_add(kind, rec) {
    const temp_id = -Math.floor(Date.now() + Math.random() * 1000)
    const item = {...rec, id: temp_id}
    appdata.update(d => {
        const ds = d[kind]
        ds.list = [item, ...ds.list]
        ds.map[temp_id] = item
        return d
    })
    return temp_id
}

export function optimistic_replace(kind, temp_id, real) {
    appdata.update(d => {
        const ds = d[kind]
        const i = ds.list.findIndex(x => x.id === temp_id)
        if (i !== -1) ds.list[i] = real
        else ds.list = [real, ...ds.list]
        delete ds.map[temp_id]
        ds.map[real.id] = real
        return d
    })
}

export function optimistic_remove(kind, temp_id) {
    appdata.update(d => {
        const ds = d[kind]
        const i = ds.list.findIndex(x => x.id === temp_id)
        if (i !== -1) ds.list.splice(i, 1)
        delete ds.map[temp_id]
        return d
    })
}
