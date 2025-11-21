const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function ar_nums(value) {
    return String(value).replace(/\d/g, digit => AR_DIGITS[Number(digit)] ?? digit)
}

export function fmt_date(value) {
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleString('ar-EG', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function set_top_offset(el, visible = true) {
    function update(flag = visible) {
        if (!flag || !el) return
        requestAnimationFrame(() => {
            const offset = el.getBoundingClientRect().top + 5 + (window._VH_OFFSET || 0)
            el.style.setProperty('--top-offset', `${offset}px`)
        })
    }
    update(visible)
    return {update}
}
