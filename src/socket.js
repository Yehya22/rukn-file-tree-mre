import {writable} from 'svelte/store'

export const socket_connected = writable(true)

export function add_listener() {}
export function remove_listener() {}
export function send() {}
