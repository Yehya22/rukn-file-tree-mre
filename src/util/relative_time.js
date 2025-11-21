import {get} from 'svelte/store'

import {session} from '../store.js'

// prettier-ignore
const units = [
    ['year',   31536000],
    ['month',  2628000],
    ['day',    86400],
    ['hour',   3600],
    ['minute', 60],
    ['second', 1],
]
let rtf
export default function relative_time(d1, d2 = new Date()) {
    const lang = get(session).locale.lang
    if (!rtf)
        rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-SA' : lang, {
            numeric: 'auto',
            style: 'short',
        })
    const elapsed = (d1 - d2) / 1e3
    const elapsed_abs = Math.max(Math.abs(elapsed), 1000) // In case < 1 second
    const [unit, value] = units.find(([_unit, value]) => elapsed_abs >= value)
    let out = rtf.format(Math.round(elapsed / value), unit)
    if (lang === 'ar') out = out.replace(/^\s*خلال\s*/u, 'قبل ')
    return out
}
