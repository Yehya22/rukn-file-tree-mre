<ContextMenuPrimitive.Group bind:ref data-slot="context-menu-group" {...restProps} />

<script lang="ts">
import {ContextMenu as ContextMenuPrimitive} from 'bits-ui'

let {ref = $bindable(null), ...restProps}: ContextMenuPrimitive.GroupProps = $props()
</script>
