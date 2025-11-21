<div class="space-y-3 p-2">
    <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="file-name">الاسم</label>
        <input
            id="file-name"
            class="h-9 rounded-md border border-gray-200 px-2 text-sm focus:outline-2 focus:outline-primary"
            bind:value={data.name}
            type="text"
        />
    </div>
    <div class="grid grid-cols-2 gap-2">
        <label class="text-sm">
            <span class="mb-1 block">النوع</span>
            <select
                class="h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                bind:value={data.file_type}
            >
                {#each $appdata.file_types.list as type}
                    <option value={type.id}>{type.name}</option>
                {/each}
            </select>
        </label>
        <label class="text-sm">
            <span class="mb-1 block">الترتيب</span>
            <input
                class="h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
                bind:value={data.order}
                type="number"
                min="1"
            />
        </label>
    </div>
    <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="file-metadata">البيانات الوصفية (JSON)</label>
        <textarea
            id="file-metadata"
            class="min-h-32 rounded-md border border-gray-200 p-2 text-sm font-mono"
            bind:value={metadata_text}
        ></textarea>
    </div>
    <div class="flex items-center justify-end gap-2">
        {#if !is_new}
            <button class="h-8 rounded-md border px-3 text-sm" onclick={remove_file} disabled={is_saving}>
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

const initialAppdata = get(appdata)
const template = {
    id: null,
    name: '',
    file_type: initialAppdata.file_types.list[0]?.id ?? 1,
    folder: null,
    order: 1,
    metadata: {},
}

data = {...template, ...structuredClone(data)}
let metadata_text = $state(JSON.stringify(data.metadata ?? {}, null, 2))
let is_saving = $state(false)
const initial_is_new = !data.id

if (set_title) {
    set_title(title ?? (initial_is_new ? 'إنشاء ملف' : 'تعديل الملف'))
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

        const payload = {...data, metadata}
        payload.file_type = Number(payload.file_type)
        payload.order = Number(payload.order) || 1
        let response
        if (!data.id) {
            response = await api.POST('file', payload)
        } else {
            response = await api.PATCH(`file/${data.id}/`, payload)
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

async function remove_file() {
    if (!data.id) return
    if (!window.confirm('هل تريد حذف الملف؟')) return
    await api.DELETE(`file/${data.id}/`)
    toast.success('حُذف الملف')
    on_close()
}
</script>
