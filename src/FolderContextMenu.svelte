<ContextMenu.Root dir="auto">
    <ContextMenu.Trigger>
        {@render children?.()}
    </ContextMenu.Trigger>
    <ContextMenu.Content class="w-44 animate-in ease-in-out fade-in-0 zoom-in-95">
        {#if can_edit}
            {#if target?.type === 'item'}
                {#if selected_count <= 1}
                    <ContextMenu.Item inset onSelect={on_rename}>
                        <span>تغيير الاسم</span>
                        <ContextMenu.Shortcut dir="ltr">⌘R</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                {/if}
                <ContextMenu.Item inset onSelect={on_copy}>
                    <span>نسخ</span>
                    <ContextMenu.Shortcut dir="ltr">⌘C</ContextMenu.Shortcut>
                </ContextMenu.Item>
                <ContextMenu.Item inset onSelect={on_cut}>
                    <span>نقل</span>
                    <ContextMenu.Shortcut dir="ltr">⌘X</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
            {#if enable_paste}
                <ContextMenu.Item inset onSelect={on_paste}>
                    <span>لصق</span>
                    <ContextMenu.Shortcut dir="ltr">⌘V</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
            {#if is_folder}
                <ContextMenu.Item inset onSelect={on_new_file}>
                    <span>إنشاء ملف جديد</span>
                    <ContextMenu.Shortcut dir="ltr">⌘N</ContextMenu.Shortcut>
                </ContextMenu.Item>
                <ContextMenu.Item inset onSelect={on_new_folder}>
                    <span>إنشاء مجلد جديد</span>
                    <ContextMenu.Shortcut dir="ltr">⌘F</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}

            {#if target?.type === 'item' && selected_count <= 1}
                <ContextMenu.Item
                    inset
                    onSelect={target.node.type === 'folder' ? on_edit_folder : on_edit_file}
                >
                    <span>تعديل</span>
                    <ContextMenu.Shortcut dir="ltr">⌘E</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
            {#if target?.type === 'item'}
                <ContextMenu.Item inset onSelect={on_delete}>
                    <span>حذف</span>
                    <ContextMenu.Shortcut dir="ltr">DEL</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
            {#if selected_count > 1 || is_folder || (target?.node?.type === 'file' && selected_count <= 1)}
                <ContextMenu.Item inset onSelect={on_replace}>
                    <span
                        >{selected_count > 1 ||
                        (target?.node?.type === 'folder' && selected_count <= 1)
                            ? 'استبدال متعدد'
                            : 'استبدال'}</span
                    >
                    <ContextMenu.Shortcut dir="ltr">⌘M</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
            {#if selected_count > 1 || is_folder}
                <ContextMenu.Item inset onSelect={on_rename_items}>
                    <span>إعادة تسمية الملفات</span>
                    <ContextMenu.Shortcut dir="ltr">⌘⇧R</ContextMenu.Shortcut>
                </ContextMenu.Item>
            {/if}
        {/if}
    </ContextMenu.Content>
</ContextMenu.Root>

<script>
import {SvelteSet} from 'svelte/reactivity'

import * as ContextMenu from '$ui/context-menu/index.js'

/** @type {{on_rename(event: Event): void,on_copy(event: Event): void, on_cut(event: Event): void, on_paste(event: Event): void, on_new_file(event: Event): void, on_new_folder(event: Event): void, on_edit_file(event: Event): void, on_edit_folder(event: Event): void, on_replace(event: Event): void, on_rename_items(event: Event): void, on_delete(event: Event): void, can_edit: boolean, children, target, clipboardIds, selected_count}} */
let {
    target,
    clipboardIds = new SvelteSet(),
    selected_count = 0,
    on_rename = () => {},
    on_copy = () => {},
    on_cut = () => {},
    on_paste = () => {},
    on_new_file = () => {},
    on_new_folder = () => {},
    on_edit_file = () => {},
    on_edit_folder = () => {},
    on_replace = () => {},
    on_rename_items = () => {},
    on_delete = () => {},
    can_edit = false,
    children,
} = $props()

const is_folder = $derived(target?.node?.type === 'folder' || target?.type === 'tree')
const enable_paste = $derived(clipboardIds.size > 0)
</script>
