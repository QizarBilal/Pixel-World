import EventsEmitter from 'events'
import State from '@/State/State.js'

export default class Theme
{
    constructor()
    {
        this.state = State.getInstance()
        this.events = new EventsEmitter()
        this.modes = [ 'summer', 'winter', 'rainy' ]
        this.mode = localStorage.getItem('infinite-world-season') || 'summer'
        this.previousMode = this.mode
        this.transition = 1
        this.quality = 'high'
        this.sound = true
        this.settings = { weather: 0.7, wind: 0.55, fog: 0.5, fov: 45 }

        if(!this.modes.includes(this.mode))
            this.mode = 'summer'

        this.setInterface()
        this.setKeyboard()
        this.apply()
    }

    setInterface()
    {
        this.buttons = [ ...document.querySelectorAll('[data-season]') ]
        this.panel = document.querySelector('.world-panel')
        this.welcome = document.querySelector('.welcome')

        for(const button of this.buttons)
            button.addEventListener('click', () => this.set(button.dataset.season))

        for(const button of document.querySelectorAll('[data-action="settings"]'))
            button.addEventListener('click', () => this.panel.classList.toggle('is-open'))

        for(const button of document.querySelectorAll('[data-action="cinematic"]'))
            button.addEventListener('click', () => document.documentElement.classList.toggle('is-cinematic'))

        for(const button of document.querySelectorAll('[data-action="sound"]'))
            button.addEventListener('click', () =>
            {
                this.sound = !this.sound
                document.documentElement.classList.toggle('is-muted', !this.sound)
                document.querySelectorAll('[data-action="sound"]').forEach((item) => item.classList.toggle('is-active', this.sound))
                this.events.emit('sound', this.sound)
            })

        document.querySelector('[data-action="enter"]').addEventListener('click', () =>
        {
            this.welcome.classList.add('is-hidden')
            localStorage.setItem('infinite-world-welcomed', 'true')
            this.events.emit('enter')
        })

        if(localStorage.getItem('infinite-world-welcomed') === 'true')
            this.welcome.classList.add('is-hidden')

        for(const input of document.querySelectorAll('[data-setting]'))
        {
            input.addEventListener('input', () => this.handleSetting(input))
            input.addEventListener('change', () => this.handleSetting(input))
        }

        for(const button of document.querySelectorAll('[data-quality]'))
        {
            button.addEventListener('click', () =>
            {
                this.quality = button.dataset.quality
                document.querySelectorAll('[data-quality]').forEach((item) => item.classList.toggle('is-active', item === button))
                this.events.emit('quality', this.quality)
            })
        }
    }

    setKeyboard()
    {
        window.addEventListener('keydown', (event) =>
        {
            if(event.code === 'Digit1') this.set('summer')
            if(event.code === 'Digit2') this.set('winter')
            if(event.code === 'Digit3') this.set('rainy')
            if(event.code === 'KeyH') document.documentElement.classList.toggle('is-cinematic')
        })
    }

    handleSetting(input)
    {
        const key = input.dataset.setting
        if(key === 'auto-day')
            this.state.day.autoUpdate = input.checked
        else if(key === 'time')
        {
            this.state.day.autoUpdate = false
            this.state.day.progress = parseFloat(input.value)
            document.querySelector('[data-setting="auto-day"]').checked = false
        }
        else
            this.settings[key] = parseFloat(input.value)

        const output = document.querySelector(`[data-output="${key}"]`)
        if(output)
        {
            if(key === 'fov') output.textContent = `${input.value}°`
            else if(key === 'time') output.textContent = this.getTimeLabel(parseFloat(input.value))
            else output.textContent = `${Math.round(parseFloat(input.value) * 100)}%`
        }
        this.events.emit('setting', key, this.settings[key])
    }

    getTimeLabel(progress)
    {
        if(progress < 0.12 || progress > 0.88) return 'Midnight'
        if(progress < 0.3) return 'Dawn'
        if(progress < 0.58) return 'Morning'
        if(progress < 0.78) return 'Golden hour'
        return 'Night'
    }

    set(mode)
    {
        if(!this.modes.includes(mode) || mode === this.mode)
            return

        this.previousMode = this.mode
        this.mode = mode
        this.transition = 0
        document.documentElement.classList.remove('is-season-transitioning')
        void document.documentElement.offsetWidth
        document.documentElement.classList.add('is-season-transitioning')
        window.setTimeout(() => document.documentElement.classList.remove('is-season-transitioning'), 1800)
        localStorage.setItem('infinite-world-season', mode)
        this.apply()
        this.events.emit('change', mode, this.previousMode)
    }

    apply()
    {
        document.documentElement.dataset.season = this.mode
        const descriptions = { summer: 'Warm breeze · Clear skies', winter: 'Fresh snow · Still air', rainy: 'Heavy rain · Storm watch' }
        for(const button of this.buttons)
        {
            const active = button.dataset.season === this.mode
            button.classList.toggle('is-active', active)
            button.setAttribute('aria-pressed', active)
        }
        document.querySelector('.season-status b').textContent = this.mode[0].toUpperCase() + this.mode.slice(1)
        document.querySelector('[data-weather="description"]').textContent = descriptions[this.mode]
    }

    update()
    {
        this.transition = Math.min(1, this.transition + this.state.time.delta / 3.5)
        const timeInput = document.querySelector('[data-setting="time"]')
        if(this.state.day.autoUpdate && timeInput)
        {
            timeInput.value = this.state.day.progress
            document.querySelector('[data-output="time"]').textContent = this.getTimeLabel(this.state.day.progress)
        }
        const player = this.state.player
        const angle = ((player.camera.thirdPerson.theta / (Math.PI * 2) * 360) % 360 + 360) % 360
        const headings = [ 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' ]
        document.querySelector('[data-hud="heading"]').textContent = headings[Math.round(angle / 45) % 8]
        document.querySelector('[data-hud="altitude"]').textContent = `${Math.round(player.position.current[1])} m`
        document.querySelector('[data-hud="speed"]').textContent = (player.speed / Math.max(this.state.time.delta, 0.001)).toFixed(1)
        document.querySelector('[data-hud="position"]').textContent = `${Math.round(player.position.current[0])} · ${Math.round(player.position.current[2])}`
    }

    get value() { return this.modes.indexOf(this.mode) }
}
