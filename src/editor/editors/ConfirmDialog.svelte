<div class="flex flex-col p-1">
    <p class="text-md">{message}</p>
    <div class="flex items-center justify-end gap-2">
        <Button
            variant="outline"
            onclick={() => {
                dialog_store.reset()
            }}
            size="sm"
            class="cursor-pointer"
        >
            {show_confirm ? 'لا' : cancel_text}
        </Button>
        <Button
            onclick={() => {
                on_result(true)
                dialog_store.reset()
            }}
            size="sm"
            class="cursor-pointer"
        >
            {show_confirm ? 'نعم' : action_text}
        </Button>
    </div>
</div>

<script>
import {dialog_store} from '~/lib/components/ui/dialog/dialog-singleton.svelte'
import {Button} from '$ui/button/index.js'

let {
    message,
    on_result = () => {},
    show_confirm = true,
    action_text,
    cancel_text,
    title = null,
    set_title,
} = $props()
set_title(title ?? 'هل تريد الحذف؟')
</script>
