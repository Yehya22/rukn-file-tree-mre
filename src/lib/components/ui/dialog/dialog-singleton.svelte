<Dialog.Root
    open={dialog_store.is_open}
    onOpenChange={open => {
        if (!open) title = ''
        dialog_store.is_open = open
    }}
>
    <Dialog.Portal>
        <Dialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/80">
            {#snippet child({props, open})}
                {#if open}
                    <div {...props} transition:fade={{duration: 150}}></div>
                {/if}
            {/snippet}
        </Dialog.Overlay>

        <Dialog.Content
            class="fixed top-[50%] left-[50%] z-50 w-full max-w-[88%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-1 select-none! sm:max-w-[600px]"
            onOpenAutoFocus={e => {
                e.preventDefault()
                setTimeout(() => {
                    const dialog_content = document.querySelector(
                        '.fixed.top-\\[50\\%\\].left-\\[50\\%\\].z-50',
                    )
                    if (!dialog_content) return
                    const form_elements = dialog_content.querySelectorAll(
                        'input:not([type="hidden"]), textarea, select',
                    )
                    const buttons = dialog_content.querySelectorAll(
                        'button:not([data-dialog-close])',
                    )
                    if (form_elements.length) {
                        form_elements[0].focus()
                    } else if (buttons.length) {
                        buttons[buttons.length - 1].focus()
                    }
                }, 10)
            }}
        >
            {#snippet child({props, open})}
                {#if open}
                    <div {...props} transition:fade={{duration: 150}}>
                        <div class="flex items-center justify-between px-2 py-1">
                            <Dialog.Title class="text-md leading-6 font-semibold text-gray-900">
                                {title}
                            </Dialog.Title>
                            {#if show_close_button}
                                <Dialog.Close
                                    class="rounded-md p-0.5 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    aria-label="إغلاق"
                                >
                                    <X class="size-4" />
                                </Dialog.Close>
                            {/if}
                        </div>
                        <div class="relative max-h-[80vh] overflow-y-auto p-1">
                            {#if dialog_store.data}
                                {#if Array.isArray(dialog_store.data.component)}
                                    {#each dialog_store.data?.component as Component}
                                        <Component
                                            set_title={t => (title = t)}
                                            {...dialog_store?.data?.props}
                                        />
                                    {/each}
                                {:else}
                                    <dialog_store.data.component
                                        set_title={t => (title = t)}
                                        {...dialog_store.data?.props}
                                    />
                                {/if}
                            {/if}
                        </div>
                    </div>
                {/if}
            {/snippet}
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<svelte:window
    onpopstate={() => {
        dialog_store.reset()
    }}
/>

<script module>
class DialogStore {
    #is_open = $state(false)
    #data = $state(null)

    get is_open() {
        return this.#is_open
    }

    set is_open(val) {
        this.#is_open = val
    }

    get data() {
        return this.#data
    }

    /**
     * @param {any} val
     */
    set data(val) {
        history.pushState(null, '')
        this.#data = val
        setTimeout(() => {
            this.#is_open = true
        }, 0)
    }

    reset() {
        this.#is_open = false
        this.#data = null
    }
}

export const dialog_store = new DialogStore()
</script>

<script>
import {X} from '@lucide/svelte'
import {Dialog} from 'bits-ui'
import {fade} from 'svelte/transition'

let title = $state('')
let show_close_button = $derived(dialog_store.data?.props?.show_close_button ?? true)

$effect(() => {
    if (!dialog_store.is_open) {
        title = ''
    }
})
</script>
