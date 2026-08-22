import EventsEmitter from 'events'
import State from '@/State/State.js'
import Game from '@/Game.js'

export default class Theme
{
    constructor()
    {
        this.state = State.getInstance()
        this.game = Game.getInstance()
        this.events = new EventsEmitter()
        this.modes = [ 'summer', 'winter', 'rainy' ]
        const saved = this.readPreferences()
        const climates = { Alpine:'winter', Coastal:'rainy', Wild:'rainy', Temperate:'summer' }
        this.mode = localStorage.getItem('infinite-world-season') || climates[this.game.world.climate] || 'summer'
        this.previousMode = this.mode
        this.transition = 1
        this.quality = saved.quality || (matchMedia('(pointer:coarse)').matches ? 'medium' : 'high')
        this.sound = saved.sound ?? true
        this.settings = { weather:0.7, wind:0.55, fog:0.5, fov:45, ...saved.settings }

        if(!this.modes.includes(this.mode))
            this.mode = 'summer'

        this.setInterface()
        this.setKeyboard()
        this.apply()
        this.applyPreferences(saved)
    }

    setInterface()
    {
        this.buttons = [ ...document.querySelectorAll('[data-season]') ]
        this.panel = document.querySelector('.world-panel')
        this.welcome = document.querySelector('.welcome')
        this.tutorial = document.querySelector('.tutorial')
        this.skipTutorial = false

        document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () =>
        {
            document.querySelectorAll('[data-device]').forEach(item => item.classList.toggle('is-active', item === button))
            document.documentElement.dataset.controls = button.dataset.device
        }))
        document.querySelector('[data-skip-tutorial]').addEventListener('click', () => this.skipTutorial = true)
        document.querySelector('[data-tutorial-skip]').addEventListener('click', () => this.finishTutorial())

        for(const button of this.buttons)
            button.addEventListener('click', () => this.set(button.dataset.season))

        for(const button of document.querySelectorAll('[data-action="settings"]'))
            button.addEventListener('click', () => {this.panel.classList.toggle('is-open');button.setAttribute('aria-expanded',this.panel.classList.contains('is-open'))})

        for(const button of document.querySelectorAll('[data-action="cinematic"]'))
            button.addEventListener('click', () => document.documentElement.classList.toggle('is-cinematic'))

        for(const button of document.querySelectorAll('[data-action="sound"]'))
            button.addEventListener('click', () => this.setSound(!this.sound))

        document.querySelector('[data-action="enter"]').addEventListener('click', () =>
        {
            this.welcome.classList.add('is-hidden')
            localStorage.setItem('infinite-world-welcomed', 'true')
            this.events.emit('enter')
            if(!this.skipTutorial && localStorage.getItem('pixel-world-tutorial') !== 'complete') this.startTutorial()
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
                this.savePreferences()
            })
        }
    }

    startTutorial()
    {
        this.tutorial.classList.add('is-open')
        this.tutorialStep = 0
        this.tutorialOrigin = [...this.state.player.position.current]
    }

    finishTutorial()
    {
        this.tutorial.classList.remove('is-open')
        localStorage.setItem('pixel-world-tutorial', 'complete')
        this.tutorialStep = undefined
    }

    setKeyboard()
    {
        window.addEventListener('keydown', (event) =>
        {
            if(event.target.closest('input,textarea,select,[contenteditable="true"]')) return
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
        this.savePreferences()
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

    setSound(enabled)
    {
        this.sound = Boolean(enabled)
        document.documentElement.classList.toggle('is-muted', !this.sound)
        document.querySelectorAll('[data-action="sound"]').forEach((item) => item.classList.toggle('is-active', this.sound))
        this.events.emit('sound', this.sound)
        this.savePreferences()
    }

    readPreferences()
    {
        try { return JSON.parse(localStorage.getItem('pixel-world-preferences')) || {} }
        catch { return {} }
    }

    savePreferences()
    {
        localStorage.setItem('pixel-world-preferences', JSON.stringify({ quality:this.quality, sound:this.sound, settings:this.settings }))
    }

    applyPreferences(saved)
    {
        this.setSound(this.sound)
        document.querySelectorAll('[data-quality]').forEach(item => item.classList.toggle('is-active', item.dataset.quality === this.quality))
        for(const input of document.querySelectorAll('[data-setting]'))
        {
            const value = saved.settings?.[input.dataset.setting]
            if(value !== undefined && input.type !== 'checkbox') input.value = value
        }
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
        if(this.tutorialStep === 0 && Math.hypot(player.position.current[0]-this.tutorialOrigin[0],player.position.current[2]-this.tutorialOrigin[2]) > 2)
        {
            this.tutorialStep=1;this.tutorial.querySelector('[data-tutorial-title]').textContent='Look around';this.tutorial.querySelector('[data-tutorial-copy]').textContent='Drag the world or move your pointer to look around.';this.tutorial.querySelector('i').style.width='66%';this.tutorialAngle=player.camera.thirdPerson.theta
        }
        if(this.tutorialStep === 1 && Math.abs(player.camera.thirdPerson.theta-this.tutorialAngle) > .25)
        {
            this.tutorialStep=2;this.tutorial.querySelector('[data-tutorial-title]').textContent='Choose your horizon';this.tutorial.querySelector('[data-tutorial-copy]').textContent='Open the map or follow a glowing trail. Press Escape to release the pointer.';this.tutorial.querySelector('i').style.width='100%';setTimeout(()=>this.finishTutorial(),4200)
        }
        const angle = ((player.camera.thirdPerson.theta / (Math.PI * 2) * 360) % 360 + 360) % 360
        const headings = [ 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' ]
        document.querySelector('[data-hud="heading"]').textContent = headings[Math.round(angle / 45) % 8]
        document.querySelector('[data-hud="altitude"]').textContent = `${Math.round(player.position.current[1])} m`
        document.querySelector('[data-hud="speed"]').textContent = (player.speed / Math.max(this.state.time.delta, 0.001)).toFixed(1)
        document.querySelector('[data-hud="position"]').textContent = `${Math.round(player.position.current[0])} · ${Math.round(player.position.current[2])}`
    }

    get value() { return this.modes.indexOf(this.mode) }
}
