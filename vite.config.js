import {svelte} from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [svelte(), tailwindcss()],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('./src', import.meta.url)),
            '$lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
            '$ui': fileURLToPath(new URL('./src/lib/components/ui', import.meta.url)),
        },
    },
})
