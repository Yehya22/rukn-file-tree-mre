<div
    dir="ltr"
    class="cm-wrapper"
    use:add_to_dom
    style="--max_height: {max_height === -1 ? '100%' : max_height + 'px'}"
></div>

<script>
import {indentWithTab} from '@codemirror/commands'
import {json} from '@codemirror/lang-json'
import {indentUnit} from '@codemirror/language'
import {EditorState} from '@codemirror/state'
import {keymap} from '@codemirror/view'
import {basicSetup, EditorView} from 'codemirror'

/** @type {{value?: string, max_height?: number, on_input?: Function, indent_with_tab?: boolean}} */
let {value = '', max_height = 500, on_input = () => {}, indent_with_tab = false} = $props()

const extensions = [
    basicSetup,
    json(),
    indentUnit.of('  '),
    ...(indent_with_tab ? [keymap.of([indentWithTab])] : []),
    EditorView.updateListener.of(v => {
        if (v.docChanged) on_input(v.state.doc.toString())
    }),
]
const editor = new EditorView({doc: value, extensions})

export const get_value = () => editor.state.doc.toString()
export function set_value(value) {
    editor.setState(EditorState.create({doc: value, extensions}))
}

const add_to_dom = el => {
    el.append(editor.dom)
}
</script>

<style>
.cm-wrapper {
    max-height: var(--max_height);
    overflow: auto;
    transition: max-height 500ms;
}
.cm-wrapper :global(.cm-editor) {
    padding: 0.1px;
}
.cm-wrapper :global(.cm-editor.cm-focused) {
    outline: none;
}
</style>
