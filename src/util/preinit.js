if (!window.APP_NAME) {
    window.APP_NAME = () => {
        const [app] = window.location.pathname.split('/').filter(Boolean)
        return app || 'rukn'
    }
}

document.documentElement.lang = 'ar'
document.documentElement.dir = 'rtl'

if (!window._VH_OFFSET) {
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.height = '100vh'
    document.body.appendChild(div)
    window._VH_OFFSET = div.clientHeight - window.innerHeight
    div.remove()
}

window._useragent = window._useragent || {safari: false, ios: false}

function check_tab(e) {
    if (e.key === 'Tab') {
        document.documentElement.classList.add('user-is-tabbing')
        window.removeEventListener('keydown', check_tab)
    }
}
window.addEventListener('keydown', check_tab)
