import {ar_nums} from './intl.js'

export const LANGUAGE_REGION = Object.freeze({
    ar: 'ar-SA',
    en: 'en-US',
})

export function prep_num(n, simple = true) {
    const lang = document?.documentElement?.lang === 'en' ? 'en' : 'ar'
    return simple
        ? lang === 'ar'
            ? ar_nums(n)
            : n
        : new Intl.NumberFormat(LANGUAGE_REGION[lang]).format(Number(n))
}

export function focus_and_select(input) {
    setTimeout(() => {
        input?.focus()
        input?.select?.()
    }, 50)
}
export function raf_throttle(callback) {
    let throttled = false
    return () => {
        if (throttled) return
        throttled = true
        window.requestAnimationFrame(() => {
            callback()
            throttled = false
        })
    }
}