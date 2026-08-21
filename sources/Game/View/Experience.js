import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Experience
{
    constructor()
    {
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.theme = this.view.theme
        this.trail = []
        this.landmarks = new Set()
        this.frameSamples = []
        this.autoQuality = true
        this.setInterface()
        this.setAdvancedPanel()
        this.setEvents()
        this.setTouch()
        this.setErrors()
    }

    setAdvancedPanel()
    {
        const panel=document.querySelector('.world-panel'), heading=panel.querySelector('.panel-heading')
        const nav=document.createElement('nav');nav.className='panel-tabs';nav.innerHTML='<button data-tab="world" class="is-active">World</button><button data-tab="weather">Weather</button><button data-tab="camera">Camera</button><button data-tab="audio">Audio</button><button data-tab="graphics">Graphics</button>'
        heading.after(nav)
        const sections={};['world','weather','camera','audio','graphics'].forEach((key)=>{const section=document.createElement('div');section.className=`panel-section ${key==='world'?'is-active':''}`;section.dataset.section=key;sections[key]=section;panel.insertBefore(section,panel.querySelector('.panel-hint'))})
        panel.querySelectorAll(':scope > label').forEach((label)=>{const key=label.querySelector('[data-setting]').dataset.setting;sections[key==='weather'||key==='wind'||key==='fog'?'weather':key==='fov'?'camera':'world'].append(label)})
        sections.graphics.append(panel.querySelector('.quality'))
        sections.weather.insertAdjacentHTML('beforeend','<label><span>Cloud coverage <output>65%</output></span><input data-advanced="clouds" type="range" min="0" max="1" step=".01" value=".65"></label><label><span>Storm energy <output>55%</output></span><input data-advanced="storm" type="range" min="0" max="1" step=".01" value=".55"></label>')
        sections.audio.innerHTML='<label><span>Ambient world <output>55%</output></span><input data-advanced="ambience" type="range" min="0" max="1" step=".01" value=".55"></label><label><span>Weather volume <output>70%</output></span><input data-advanced="weatherVolume" type="range" min="0" max="1" step=".01" value=".7"></label><label class="switch-row"><span><strong>Thunder</strong><small>Dynamic spatial thunder</small></span><input data-advanced="thunder" type="checkbox" checked></label>'
        sections.graphics.insertAdjacentHTML('beforeend','<label><span>Resolution scale <output>100%</output></span><input data-advanced="resolution" type="range" min=".5" max="1" step=".05" value="1"></label><label><span>Vegetation <output>100%</output></span><input data-advanced="vegetation" type="range" min=".2" max="1" step=".1" value="1"></label><label><span>Particles <output>100%</output></span><input data-advanced="particles" type="range" min=".2" max="1" step=".1" value="1"></label><label class="switch-row"><span><strong>Automatic performance</strong><small>Adapts detail to frame rate</small></span><input data-advanced="automatic" type="checkbox" checked></label><div class="access-title">ACCESSIBILITY</div><label class="switch-row"><span><strong>Reduce motion</strong></span><input data-advanced="motion" type="checkbox"></label><label class="switch-row"><span><strong>Reduce flashes</strong></span><input data-advanced="flashes" type="checkbox"></label><label class="switch-row"><span><strong>High contrast UI</strong></span><input data-advanced="contrast" type="checkbox"></label><label><span>Interface scale <output>100%</output></span><input data-advanced="uiScale" type="range" min=".8" max="1.3" step=".05" value="1"></label><label>Color vision<select data-advanced="color"><option value="none">Standard</option><option value="protanopia">Red-safe</option><option value="deuteranopia">Green-safe</option><option value="tritanopia">Blue-safe</option></select></label>')
        nav.querySelectorAll('button').forEach((button)=>button.onclick=()=>{nav.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===button));Object.entries(sections).forEach(([key,s])=>s.classList.toggle('is-active',key===button.dataset.tab))})
        panel.querySelectorAll('[data-advanced]').forEach((input)=>input.oninput=()=>this.applyAdvanced(input))
    }

    applyAdvanced(input)
    {
        const key=input.dataset.advanced,value=input.type==='checkbox'?input.checked:input.value
        if(input.nextElementSibling&&input.nextElementSibling.tagName==='OUTPUT') input.nextElementSibling.textContent=value
        const output=input.parentElement.querySelector('output');if(output&&input.type==='range')output.textContent=`${Math.round(parseFloat(value)*100)}%`
        if(key==='resolution')this.view.renderer.instance.setPixelRatio(this.state.viewport.clampedPixelRatio*parseFloat(value))
        if(key==='automatic')this.autoQuality=value
        if(key==='motion')document.documentElement.classList.toggle('reduce-motion',value)
        if(key==='flashes')document.documentElement.classList.toggle('reduce-flashes',value)
        if(key==='contrast')document.documentElement.classList.toggle('is-high-contrast',value)
        if(key==='uiScale')document.documentElement.style.setProperty('--ui-scale',value)
        if(key==='color')document.documentElement.dataset.colorVision=value
        if(key==='particles'||key==='clouds')this.view.weather.applyQuality()
        if(key==='vegetation')this.view.scenery.refresh()
        this.theme.settings[key]=typeof value==='string'?parseFloat(value)||value:value
        this.theme.events.emit('setting',key,this.theme.settings[key])
    }

    setInterface()
    {
        const root = document.createElement('div')
        root.className = 'experience-suite'
        root.innerHTML = `
            <div class="quick-tools"><button data-suite="map" title="World map (M)">⌖</button><button data-suite="photo" title="Photo mode (O)">◎</button><button data-suite="presets" title="Visual presets">◇</button></div>
            <section class="suite-modal map-modal"><div class="suite-head"><span><small>EXPLORATION LOG</small><strong>Infinite atlas</strong></span><button data-close>×</button></div><canvas width="900" height="560"></canvas><div class="map-legend"><span><i class="visited"></i>Visited</span><span><i class="water"></i>Water</span><span><i class="marker"></i>You</span><button data-marker>＋ Place marker</button></div></section>
            <section class="suite-modal photo-modal"><div class="suite-head"><span><small>PRO CAMERA</small><strong>Photo mode</strong></span><button data-close>×</button></div><div class="photo-preview"><div class="focus-frame"></div></div><div class="photo-grid"><label>Exposure<input data-photo="exposure" type="range" min=".55" max="1.8" step=".01" value="1.08"></label><label>Saturation<input data-photo="saturation" type="range" min=".3" max="1.8" step=".01" value="1"></label><label>Focus<input data-photo="focus" type="range" min="0" max="10" step=".1" value="0"></label><label>Format<select data-photo="ratio"><option value="none">Native</option><option value="2.35">Cinema 2.35:1</option><option value="1">Square</option></select></label></div><div class="photo-actions"><label><input data-photo="player" type="checkbox"> Hide explorer</label><button data-capture>Capture PNG</button></div></section>
            <section class="suite-modal preset-modal"><div class="suite-head"><span><small>CURATED ATMOSPHERES</small><strong>Visual journeys</strong></span><button data-close>×</button></div><div class="preset-grid"></div></section>
            <div class="command"><input placeholder="Type a command…" aria-label="Command palette"><div></div></div>
            <div class="toast-stack"></div><div class="season-progress"><i></i></div>
            <div class="touch-pad"><button data-move="forward">▲</button><button data-move="strafeLeft">◀</button><button data-move="backward">▼</button><button data-move="strafeRight">▶</button></div>
            <div class="post-fx"><i></i></div>`
        document.querySelector('.game').append(root)
        this.root = root
        this.map = root.querySelector('.map-modal')
        this.mapCanvas = this.map.querySelector('canvas')
        this.photo = root.querySelector('.photo-modal')
        this.presets = root.querySelector('.preset-modal')
        this.command = root.querySelector('.command')
        this.buildPresets()
    }

    buildPresets()
    {
        this.presetData = [
            [ 'Summer Morning','summer',.38,'#88d5ff' ],[ 'Golden Meadow','summer',.7,'#ffc46b' ],[ 'Winter Dawn','winter',.25,'#dcefff' ],
            [ 'Whiteout','winter',.48,'#f7fdff' ],[ 'Gentle Rain','rainy',.42,'#7598a8' ],[ 'Midnight Storm','rainy',.02,'#172a42' ],[ 'Cinematic Sunset','summer',.78,'#f47d59' ]
        ]
        const grid = this.presets.querySelector('.preset-grid')
        for(const [ name, season, time, color ] of this.presetData)
        {
            const button = document.createElement('button')
            button.innerHTML = `<i style="--preview:${color}"><b></b></i><span><strong>${name}</strong><small>${season}</small></span>`
            button.onclick = () =>
            {
                this.theme.set(season)
                this.state.day.autoUpdate = false
                this.state.day.progress = time
                this.toast(`${name} applied`, 'Atmosphere preset')
                this.closeModals()
            }
            grid.append(button)
        }
    }

    setEvents()
    {
        this.root.querySelectorAll('[data-suite]').forEach((button) => button.onclick = () => this.open(button.dataset.suite))
        this.root.querySelectorAll('[data-close]').forEach((button) => button.onclick = () => this.closeModals())
        this.root.querySelector('[data-marker]').onclick = () => this.addLandmark('Personal marker')
        this.root.querySelector('[data-capture]').onclick = () => this.capture()
        this.root.querySelectorAll('[data-photo]').forEach((input) => input.oninput = () => this.applyPhoto(input))
        this.theme.events.on('change', (mode) =>
        {
            this.toast(`${mode[0].toUpperCase()+mode.slice(1)} arrived`, 'World transformed')
            this.root.querySelector('.season-progress i').classList.remove('run')
            void this.root.offsetWidth
            this.root.querySelector('.season-progress i').classList.add('run')
        })
        window.addEventListener('keydown', (event) =>
        {
            if(event.code === 'KeyM') this.open('map')
            if(event.code === 'KeyO') this.open('photo')
            if(event.key === '/') { event.preventDefault(); this.openCommand() }
            if(event.code === 'Escape') this.closeModals()
        })
        this.setupCommand()
    }

    open(name)
    {
        this.closeModals()
        const modal = name === 'map' ? this.map : name === 'photo' ? this.photo : this.presets
        modal.classList.add('is-open')
        document.documentElement.classList.toggle('is-photo', name === 'photo')
        if(name === 'map') this.drawMap()
    }
    closeModals() { this.root.querySelectorAll('.suite-modal').forEach((item) => item.classList.remove('is-open')); this.command.classList.remove('is-open'); document.documentElement.classList.remove('is-photo') }

    setupCommand()
    {
        const commands = [ ['Summer world',()=>this.theme.set('summer')],['Winter world',()=>this.theme.set('winter')],['Rainy world',()=>this.theme.set('rainy')],['Open map',()=>this.open('map')],['Photo mode',()=>this.open('photo')],['Cinematic mode',()=>document.documentElement.classList.toggle('is-cinematic')],['Toggle sound',()=>this.theme.events.emit('sound',!this.theme.sound)] ]
        const input = this.command.querySelector('input'), results = this.command.querySelector('div')
        const render = () => { results.innerHTML=''; commands.filter(([name])=>name.toLowerCase().includes(input.value.toLowerCase())).forEach(([name,fn])=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{fn();this.closeModals()};results.append(b)}) }
        input.oninput = render
        this.openCommand = () => { this.closeModals(); this.command.classList.add('is-open'); input.value=''; render(); input.focus() }
    }

    applyPhoto(input)
    {
        const value = input.type === 'checkbox' ? input.checked : input.value
        if(input.dataset.photo === 'exposure') this.view.renderer.instance.toneMappingExposure = parseFloat(value)
        if(input.dataset.photo === 'saturation') document.documentElement.style.setProperty('--saturation', value)
        if(input.dataset.photo === 'focus')
        {
            const strength=parseFloat(value)
            this.view.renderer.bokehPass.enabled=strength>0
            this.view.renderer.bokehPass.uniforms.maxblur.value=strength*.0012
        }
        if(input.dataset.photo === 'ratio') document.documentElement.dataset.ratio = value
        if(input.dataset.photo === 'player') this.view.player.group.visible = !value
    }

    capture()
    {
        this.view.renderer.instance.render(this.view.scene, this.view.camera.instance)
        const link = document.createElement('a')
        link.download = `infinite-world-${Date.now()}.png`
        link.href = this.view.renderer.instance.domElement.toDataURL('image/png')
        link.click()
        this.toast('Image saved', 'Photo mode')
    }

    drawMap()
    {
        const ctx = this.mapCanvas.getContext('2d'), w=this.mapCanvas.width, h=this.mapCanvas.height
        ctx.fillStyle='#07151b';ctx.fillRect(0,0,w,h)
        ctx.strokeStyle='rgba(130,210,190,.08)';ctx.lineWidth=1
        for(let x=0;x<w;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
        for(let y=0;y<h;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
        if(!this.trail.length) return
        const current=this.trail[this.trail.length-1], scale=1.4
        ctx.strokeStyle='#75d6b3';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath()
        this.trail.forEach((p,i)=>{const x=w/2+(p.x-current.x)*scale,y=h/2+(p.z-current.z)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()
        ctx.fillStyle='#ffe17a';ctx.beginPath();ctx.arc(w/2,h/2,7,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='rgba(61,129,150,.38)';ctx.beginPath();ctx.arc(w*.2,h*.72,55,0,Math.PI*2);ctx.fill()
    }

    addLandmark(name)
    {
        const p=this.state.player.position.current, key=`${Math.round(p[0])},${Math.round(p[2])}`
        if(this.landmarks.has(key)) return
        this.landmarks.add(key); this.toast(name, 'Landmark discovered'); if(navigator.vibrate) navigator.vibrate(45)
    }

    toast(title, label)
    {
        const item=document.createElement('div');item.className='toast';item.innerHTML=`<i>✦</i><span><small>${label}</small><strong>${title}</strong></span>`;this.root.querySelector('.toast-stack').append(item);setTimeout(()=>item.remove(),4200)
    }

    setTouch()
    {
        this.root.querySelectorAll('[data-move]').forEach((button)=>
        {
            const key=button.dataset.move
            button.onpointerdown=(event)=>{event.preventDefault();this.state.controls.keys.down[key]=true}
            button.onpointerup=button.onpointercancel=()=>this.state.controls.keys.down[key]=false
        })
    }

    setErrors()
    {
        window.addEventListener('error', (event) => { console.error(event.error); this.toast('A visual effect was safely stopped', 'Recovery') })
    }

    update()
    {
        const time=this.state.time, p=this.state.player.position.current
        if(!this.lastTrail || time.elapsed-this.lastTrail>.55){this.lastTrail=time.elapsed;this.trail.push({x:p[0],z:p[2],y:p[1]});if(this.trail.length>1200)this.trail.shift()}
        if(Math.abs(p[0])+Math.abs(p[2])>250&&!this.landmarks.has('wanderer')){this.landmarks.add('wanderer');this.toast('Beyond the familiar','Discovery unlocked')}
        this.frameSamples.push(time.delta);if(this.frameSamples.length>180)this.frameSamples.shift()
        if(this.autoQuality&&this.frameSamples.length===180){const fps=1/(this.frameSamples.reduce((a,b)=>a+b,0)/180);if(fps<38&&this.theme.quality==='high'){this.theme.quality='medium';this.theme.events.emit('quality','medium');this.toast('Balanced quality enabled','Performance assistant');this.frameSamples=[]}}
        const pad=navigator.getGamepads?.()[0]
        if(pad){this.state.controls.keys.down.forward=pad.axes[1]<-.25;this.state.controls.keys.down.backward=pad.axes[1]>.25;this.state.controls.keys.down.strafeLeft=pad.axes[0]<-.25;this.state.controls.keys.down.strafeRight=pad.axes[0]>.25}
        document.documentElement.style.setProperty('--motion-blur',`${Math.min(this.state.player.speed*8,2)}px`)
    }
}
