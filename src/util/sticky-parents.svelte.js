import {useEventListener, watch} from 'runed'
import {flushSync, tick} from 'svelte'
import {SvelteSet} from 'svelte/reactivity'

import {raf_throttle} from './util.js'

export class StickyParentsState {
    /** @type {HTMLElement} */
    #scroll_element = null

    #start_index = -1

    #intersecting_index = $state.raw(-1)

    /** @readonly */
    #get_tree

    /** @readonly */
    #item_height

    /** @readonly */
    #scroll_padding

    #sticky_indices = $derived.by(() => {
        if (this.#intersecting_index === -1) {
            return []
        }

        const tree = this.#get_tree()
        if (tree == null) {
            return []
        }
        const visible_items = tree.getVisibleItems()

        const result = []
        for (let i = this.#intersecting_index; i >= 0; i--) {
            const current = visible_items[i]
            if (current == null) {
                continue
            }

            if (current.node.type === 'folder' && current.expanded) {
                result.push(i)
            }
        }
        return result
    })

    /** @readonly */
    deepest_visible_sticky_id = $derived.by(() => {
        if (this.#intersecting_index === -1) {
            return
        }

        const tree = this.#get_tree()
        if (tree == null) {
            return
        }
        const visible_items = tree.getVisibleItems()

        for (
            let current = visible_items[this.#intersecting_index];
            current != null;
            current = current.parent
        ) {
            if (current.node.type === 'folder' && current.expanded) {
                return current.node.id
            }
        }
    })

    /**
     * @param {Object} props
     * @param {() => import('svelte-file-tree').Tree<any, any>} props.get_tree
     * @param {number} props.item_height
     * @param {number} props.scroll_padding
     */
    constructor({get_tree, item_height, scroll_padding}) {
        this.#get_tree = get_tree
        this.#item_height = item_height
        this.#scroll_padding = scroll_padding

        watch(
            () => this.#get_tree()?.getVisibleItems(),
            () => {
                tick().then(this.#update)
            },
            {lazy: true},
        )
    }

    get sticky_indices() {
        return this.#sticky_indices
    }

    #update = () => {
        if (this.#scroll_element == null || this.#start_index === -1) {
            this.#intersecting_index = -1
            return
        }

        const tree = this.#get_tree()
        if (tree == null) {
            this.#intersecting_index = -1
            return
        }
        const visible_items = tree.getVisibleItems()

        // Are the sticky parents still sticky? The distance between each sticky parent
        // and the next item should not be positive.
        let sticky_indicies_start = 0
        for (let i = 0; i < this.#sticky_indices.length; i++) {
            const sticky_index = this.#sticky_indices[i]
            const sticky_item = visible_items[sticky_index]
            if (sticky_item == null) {
                continue
            }

            const sticky_element = tree.getItemElement(sticky_item.node.id)
            if (sticky_element == null) {
                continue
            }

            const next_item = visible_items[sticky_index + 1]
            if (next_item == null) {
                continue
            }

            const next_element = tree.getItemElement(next_item.node.id)
            if (next_element == null) {
                continue
            }

            const sticky_rect = sticky_element.getBoundingClientRect()
            const next_rect = next_element.getBoundingClientRect()
            const distance = next_rect.top - sticky_rect.bottom
            if (distance >= 0.01) {
                sticky_indicies_start = i + 1
                break
            }
        }

        if (sticky_indicies_start !== 0) {
            // Don't `await tick()` because the update cannot happen asynchronously.
            // The `range_extractor` reads the `sticky_indices` property immediately
            // after this method is called.
            flushSync(() => {
                this.#sticky_indices = this.#sticky_indices.slice(sticky_indicies_start)
            })
        }

        const scroll_rect = this.#scroll_element.getBoundingClientRect()
        let intersecting_index = -1
        for (let i = this.#start_index; i < visible_items.length; i++) {
            if (this.#sticky_indices.includes(i)) {
                continue
            }

            const current = visible_items[i]
            if (current == null) {
                continue
            }

            const current_element = tree.getItemElement(current.node.id)
            if (current_element == null) {
                continue
            }

            const current_rect = current_element.getBoundingClientRect()
            const current_depth = Number.parseInt(current_element.dataset.depth)
            const stick_top = scroll_rect.top + current_depth * this.#item_height
            if (current_rect.bottom < stick_top) {
                continue
            }

            if (current_rect.top <= stick_top) {
                intersecting_index = i
            } else {
                // I am not entirely sure why, but this fixes an issue where the
                // sticky parents disappear momentarily when an expanded folder
                // partially covers a sticky parent.
                intersecting_index = i - 1
            }
            break
        }
        this.#intersecting_index = intersecting_index
    }

    /** @param {HTMLElement} element */
    virtual_list_attachment = element => {
        this.#scroll_element = element

        useEventListener(element, 'scroll', raf_throttle(this.#update))

        useEventListener(element, 'focusin', event => {
            const target = event.target
            if (!(target instanceof HTMLElement) || target.role !== 'treeitem') {
                return
            }

            tick().then(() => {
                const item_index = Number.parseInt(target.dataset.index)
                if (this.#sticky_indices.includes(item_index)) {
                    element.scrollTop = item_index * this.#item_height
                    return
                }

                const scroll_rect = element.getBoundingClientRect()
                const item_rect = target.getBoundingClientRect()
                const item_depth = Number.parseInt(target.dataset.depth)

                const sticky_headers_height = item_depth * this.#item_height
                const top_edge = scroll_rect.top + sticky_headers_height + this.#scroll_padding
                if (item_rect.top < top_edge) {
                    element.scrollBy(0, item_rect.top - top_edge)
                    return
                }

                const bottom_edge = scroll_rect.bottom - this.#scroll_padding
                if (item_rect.bottom > bottom_edge) {
                    element.scrollBy(0, item_rect.bottom - bottom_edge)
                    return
                }
            })
        })
    }

    /** @param {import('svelte-file-tree').VirtualListRange} range */
    range_extractor = ({startIndex, endIndex, overscan, count}) => {
        this.#start_index = startIndex
        this.#update()

        const indices = new SvelteSet(this.#sticky_indices)
        const start = Math.max(startIndex - overscan, 0)
        const end = Math.min(endIndex + overscan, count - 1)
        for (let i = start; i <= end; i++) {
            indices.add(i)
        }
        return [...indices].sort((a, b) => a - b)
    }
}
