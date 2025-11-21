<span
    bind:this={ref}
    data-slot="context-menu-shortcut"
    class={cn('text-xs tracking-widest text-muted-foreground', className)}
    {...restProps}
>
    {@render children?.()}
</span>

<script lang="ts">
import type {HTMLAttributes} from 'svelte/elements'

import {cn, type WithElementRef} from '$lib/utils.js'

let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props()
</script>
