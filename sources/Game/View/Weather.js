import * as THREE from 'three'

import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Weather
{
    constructor()
    {
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.scene = this.view.scene
        this.theme = this.view.theme
        this.rainCount = 2200
        this.radius = 55
        this.height = 42
        this.lightningTimer = 2

        this.setRain()
        this.setParticles()
        this.setClouds()
        this.setLightning()
        this.setAudio()
        this.theme.events.on('change', () => this.applyTheme())
        this.theme.events.on('setting', () => this.applySettings())
        this.theme.events.on('quality', () => this.applyQuality())
        this.theme.events.on('sound', (active) => this.setMuted(!active))
        this.applyTheme()
        this.applyQuality()
    }

    setParticles()
    {
        const make = (count, color, size, opacity) =>
        {
            const positions = new Float32Array(count * 3)
            for(let i = 0; i < count; i++)
            {
                positions[i * 3] = (Math.random() - .5) * this.radius * 2
                positions[i * 3 + 1] = Math.random() * this.height
                positions[i * 3 + 2] = (Math.random() - .5) * this.radius * 2
            }
            const points = new THREE.Points(
                new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
                new THREE.PointsMaterial({ color, size, transparent:true, opacity, depthWrite:false, sizeAttenuation:true })
            )
            points.frustumCulled = false
            this.scene.add(points)
            return points
        }
        this.snow = make(1700, '#ffffff', .18, .78)
        this.pollen = make(420, '#fff0a0', .08, .48)
    }

    setClouds()
    {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 128
        const context = canvas.getContext('2d')
        const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 62)
        gradient.addColorStop(0, 'rgba(255,255,255,.82)')
        gradient.addColorStop(.45, 'rgba(255,255,255,.34)')
        gradient.addColorStop(1, 'rgba(255,255,255,0)')
        context.fillStyle = gradient
        context.fillRect(0, 0, 128, 128)
        const texture = new THREE.CanvasTexture(canvas)
        this.clouds = new THREE.Group()
        for(let i = 0; i < 34; i++)
        {
            const material = new THREE.SpriteMaterial({ map:texture, color:'#ffffff', transparent:true, opacity:.22, depthWrite:false })
            const cloud = new THREE.Sprite(material)
            const angle = Math.random() * Math.PI * 2
            const radius = 100 + Math.random() * 330
            cloud.position.set(Math.cos(angle) * radius, 45 + Math.random() * 55, Math.sin(angle) * radius)
            cloud.scale.set(90 + Math.random() * 120, 24 + Math.random() * 26, 1)
            cloud.userData.speed = .25 + Math.random() * .45
            this.clouds.add(cloud)
        }
        this.scene.add(this.clouds)

        this.mist = new THREE.Mesh(
            new THREE.CylinderGeometry(68, 68, 16, 32, 1, true),
            new THREE.MeshBasicMaterial({ color:'#b8ced1', transparent:true, opacity:.055, side:THREE.DoubleSide, depthWrite:false })
        )
        this.scene.add(this.mist)
    }

    setRain()
    {
        const positions = new Float32Array(this.rainCount * 2 * 3)

        for(let i = 0; i < this.rainCount; i++)
            this.resetDrop(positions, i, true)

        this.rain = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
            new THREE.LineBasicMaterial({ color: '#b9dcff', transparent: true, opacity: 0.42, depthWrite: false })
        )
        this.rain.frustumCulled = false
        this.scene.add(this.rain)
    }

    resetDrop(positions, index, initial = false)
    {
        const stride = index * 6
        const angle = Math.random() * Math.PI * 2
        const distance = Math.sqrt(Math.random()) * this.radius
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        const y = initial ? Math.random() * this.height : this.height + Math.random() * 12
        const length = 0.8 + Math.random() * 1.8

        positions[stride] = x
        positions[stride + 1] = y
        positions[stride + 2] = z
        positions[stride + 3] = x + 0.35
        positions[stride + 4] = y - length
        positions[stride + 5] = z + 0.12
    }

    setLightning()
    {
        this.flash = document.createElement('div')
        this.flash.className = 'lightning-flash'
        document.querySelector('.game').append(this.flash)
    }

    setAudio()
    {
        this.audio = { context: null, rainGain: null }
        document.addEventListener('pointerdown', () =>
        {
            this.startAudio()
        }, { once: false })
    }

    startAudio()
    {
        if(this.audio.context)
        {
            this.audio.context.resume()
            this.audio.rainGain.gain.setTargetAtTime(0.045, this.audio.context.currentTime, 0.5)
            return
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext
        if(!AudioContext)
            return

        const context = new AudioContext()
        const seconds = 3
        const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
        const data = buffer.getChannelData(0)
        let last = 0

        for(let i = 0; i < data.length; i++)
        {
            const white = Math.random() * 2 - 1
            last = last * 0.985 + white * 0.015
            data[i] = white * 0.28 + last * 1.8
        }

        const source = context.createBufferSource()
        const filter = context.createBiquadFilter()
        const gain = context.createGain()
        source.buffer = buffer
        source.loop = true
        filter.type = 'lowpass'
        filter.frequency.value = 3200
        gain.gain.value = 0.045
        source.connect(filter).connect(gain).connect(context.destination)
        source.start()

        this.audio = { context, source, rainGain: gain, filter }
        this.applyAudioTheme()
    }

    setMuted(muted)
    {
        if(this.audio.context)
            this.audio.rainGain.gain.setTargetAtTime(!muted ? (this.theme.mode === 'rainy' ? 0.05 : 0.018) : 0.0001, this.audio.context.currentTime, 0.4)
    }

    applyAudioTheme()
    {
        if(!this.audio.context) return
        const rainy = this.theme.mode === 'rainy'
        const winter = this.theme.mode === 'winter'
        this.audio.filter.frequency.setTargetAtTime(rainy ? 3200 : winter ? 700 : 1500, this.audio.context.currentTime, .8)
        this.audio.rainGain.gain.setTargetAtTime(this.theme.sound ? (rainy ? .05 : .018) : .0001, this.audio.context.currentTime, .8)
    }

    thunder()
    {
        if(this.theme.settings.thunder === false)
            return
        this.flash.classList.remove('is-active')
        void this.flash.offsetWidth
        if(!document.documentElement.classList.contains('reduce-flashes'))
            this.flash.classList.add('is-active')

        if(!this.audio.context)
            return

        const context = this.audio.context
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const filter = context.createBiquadFilter()
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(72, context.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(28, context.currentTime + 1.8)
        filter.type = 'lowpass'
        filter.frequency.value = 180
        gain.gain.setValueAtTime(0.0001, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.2)
        oscillator.connect(filter).connect(gain).connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + 2.3)
    }

    applyTheme()
    {
        const rainy = this.theme.mode === 'rainy'
        this.rain.visible = rainy
        this.snow.visible = this.theme.mode === 'winter'
        this.pollen.visible = this.theme.mode === 'summer'
        this.mist.visible = rainy || this.theme.mode === 'summer'
        this.mist.material.color.set(rainy ? '#829aa5' : '#deefe1')
        this.mist.material.opacity = rainy ? .1 : .035
        this.clouds.children.forEach((cloud) =>
        {
            cloud.material.color.set(rainy ? '#526573' : this.theme.mode === 'winter' ? '#d8e5e9' : '#fff7e4')
            cloud.material.opacity = rainy ? .48 : this.theme.mode === 'winter' ? .32 : .18
        })
        this.lightningTimer = 1.5 + Math.random() * 5

        if(rainy)
            this.startAudio()

        if(this.audio.context)
            this.applyAudioTheme()
        this.applySettings()
    }

    applySettings()
    {
        const settings = this.theme.settings
        this.rain.material.opacity = .15 + settings.weather * .48
        this.snow.material.opacity = .35 + settings.weather * .6
        this.mist.material.opacity = (this.theme.mode === 'rainy' ? .1 : .035) * (.45 + settings.fog)
        const cloudCoverage = settings.clouds ?? .65
        this.clouds.children.forEach((cloud, index) => cloud.visible = index < Math.floor(34 * cloudCoverage))
        if(this.audio.context)
            this.audio.rainGain.gain.setTargetAtTime(this.theme.sound ? (this.theme.mode === 'rainy' ? .065 * (settings.weatherVolume ?? .7) : .025 * (settings.ambience ?? .55)) : .0001, this.audio.context.currentTime, .5)
    }

    applyQuality()
    {
        const ratios = { low:.3, medium:.62, high:1 }
        const ratio = ratios[this.theme.quality] * (this.theme.settings.particles ?? 1)
        this.rain.geometry.setDrawRange(0, Math.floor(this.rainCount * 2 * ratio))
        this.snow.geometry.setDrawRange(0, Math.floor(1700 * ratio))
        this.pollen.geometry.setDrawRange(0, Math.floor(420 * ratio))
        this.clouds.children.forEach((cloud, index) => cloud.visible = index < Math.floor(34 * ratio))
    }

    updatePoints(points, fallSpeed, drift)
    {
        if(!points.visible) return
        const delta = this.state.time.delta
        const positions = points.geometry.attributes.position.array
        for(let i = 0; i < positions.length; i += 3)
        {
            positions[i] += delta * drift
            positions[i + 1] -= delta * fallSpeed
            if(positions[i + 1] < -3)
            {
                positions[i] = (Math.random() - .5) * this.radius * 2
                positions[i + 1] = this.height
                positions[i + 2] = (Math.random() - .5) * this.radius * 2
            }
        }
        points.geometry.attributes.position.needsUpdate = true
        const player = this.state.player.position.current
        points.position.set(player[0], player[1], player[2])
    }

    update()
    {
        const delta = this.state.time.delta
        const player = this.state.player.position.current
        this.clouds.position.set(player[0], player[1], player[2])
        this.mist.position.set(player[0], player[1] + 2, player[2])
        const wind = .2 + this.theme.settings.wind * 2.8
        for(const cloud of this.clouds.children)
        {
            cloud.position.x += delta * cloud.userData.speed * wind
            if(cloud.position.x > 420) cloud.position.x = -420
        }
        this.updatePoints(this.snow, 3 + this.theme.settings.weather * 4, wind)
        this.updatePoints(this.pollen, -.08, wind * .18)

        document.querySelector('.camera-drops').classList.toggle('is-active', this.rain.visible)

        if(!this.rain.visible)
            return

        const positions = this.rain.geometry.attributes.position.array

        for(let i = 0; i < this.rainCount; i++)
        {
            const stride = i * 6
            positions[stride] += delta * 7 * wind
            positions[stride + 3] += delta * 7 * wind
            positions[stride + 1] -= delta * (24 + this.theme.settings.weather * 25)
            positions[stride + 4] -= delta * (24 + this.theme.settings.weather * 25)

            if(positions[stride + 1] < - 4)
                this.resetDrop(positions, i)
        }

        this.rain.geometry.attributes.position.needsUpdate = true
        this.rain.position.set(player[0], player[1], player[2])

        this.lightningTimer -= delta
        if(this.lightningTimer <= 0)
        {
            this.thunder()
            const storm = this.theme.settings.storm ?? .55
            this.lightningTimer = 3 + Math.random() * (13 - storm * 8)
        }
    }
}
