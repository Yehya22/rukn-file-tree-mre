<div class="space-y-3 p-2">
    <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="folder-name">اسم المجلد</label>
        <input
            id="folder-name"
            class="h-9 rounded-md border border-gray-200 px-2 text-sm focus:outline-2 focus:outline-primary"
            bind:value={data.name}
            type="text"
        />
    </div>
    <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="folder-parent">المجلد الأب</label>
        <select
            id="folder-parent"
            class="h-9 rounded-md border border-gray-200 px-2 text-sm"
            bind:value={data.parent}
        >
            {#each $appdata.folders.list as folder}
                <option value={folder.id}>{folder.name}</option>
            {/each}
        </select>
    </div>
    <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="folder-metadata">البيانات الوصفية</label>
        <textarea
            id="folder-metadata"
            class="min-h-24 rounded-md border border-gray-200 p-2 text-sm font-mono"
            bind:value={metadata_text}
        ></textarea>
    </div>
    <div class="flex items-center justify-end gap-2">
        {#if !is_new}
            <button class="h-8 rounded-md border px-3 text-sm" onclick={remove_folder} disabled={is_saving}>
                حذف
            </button>
        {/if}
        <button
            class="h-8 rounded-md bg-primary px-4 text-sm text-white"
            onclick={save}
            disabled={is_saving}
        >
            {#if is_saving}جارٍ الحفظ…{:else}حفظ{/if}
        </button>
    </div>
</div>

<script>
import {get} from 'svelte/store'
import {toast} from 'svelte-sonner'

import api from '~/api.js'
import {appdata} from '~/store.js'

let {data = $bindable(), callback = () => {}, on_close = () => {}, set_title, title} = $props()

const initialState = get(appdata)
const template = {
    id: null,
    name: '',
    parent: initialState.folders.list.find(folder => folder.id !== 1)?.id ?? 1,
    metadata: {},
}

data = {...template, ...structuredClone(data)}
let metadata_text = $state(JSON.stringify(data.metadata ?? {}, null, 2))
let is_saving = $state(false)
const initial_is_new = !data.id

if (set_title) {
    set_title(title ?? (initial_is_new ? 'إنشاء مجلد' : 'تعديل المجلد'))
}

async function save() {
    try {
        is_saving = true
        let metadata
        try {
            metadata = metadata_text ? JSON.parse(metadata_text) : {}
        } catch (error) {
            toast.error('صيغة JSON غير صالحة')
            is_saving = false
            return
        }
        const payload = {...data, metadata, parent: Number(data.parent) || 1}
        let response
        if (!data.id) {
            response = await api.POST('folder', payload)
        } else {
            response = await api.PATCH(`folder/${data.id}/`, payload)
        }
        if (!response || response.error) {
            toast.error('حدث خطأ أثناء الحفظ')
            return
        }
        callback(response)
        toast.success('حُفظ')
        on_close()
    } finally {
        is_saving = false
    }
}

async function remove_folder() {
    if (!data.id) return
    if (!window.confirm('هل تريد حذف المجلد؟')) return
    await api.DELETE(`folder/${data.id}/`)
    toast.success('حُذف المجلد')
    on_close()
}
</script>
