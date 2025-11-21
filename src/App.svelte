<svelte:head>
    <title>ركن — ملف الشجرة</title>
</svelte:head>

<div class="min-h-screen bg-slate-50" dir="rtl">
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div>
                <p class="text-xs text-slate-500">التنقل الحالي</p>
                <p class="font-semibold text-slate-900">{$currentPath}</p>
            </div>
            <div class="text-sm text-slate-500">
                نسخة تجريبية من مكون الملفات في ركن
            </div>
        </div>
    </header>
    <main class="mx-auto max-w-5xl px-2 py-4">
        <Folder path={$currentPath} />
    </main>
</div>

<DialogSingleton />
<Toaster richColors position="top-left" />
<div class="request-indicator" class:active={$IS_FETCHING}></div>

<script>
import Folder from './Folder.svelte'
import {currentPath} from './router.js'
import {DialogSingleton} from '$ui/dialog/index.js'
import {Toaster} from 'svelte-sonner'

import {IS_FETCHING} from './api.js'
</script>
