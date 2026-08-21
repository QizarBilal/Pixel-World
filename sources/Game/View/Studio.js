import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Studio
{
    constructor()
    {
        this.view=View.getInstance();this.state=State.getInstance();this.theme=this.view.theme
        this.started=performance.now();this.distance=0;this.lastPosition=[...this.state.player.position.current];this.photos=[];this.keyframes=[]
        this.restore();this.build();this.bind();this.loading();this.saveTimer=0
    }
    build()
    {
        const el=document.createElement('div');el.className='studio-layer';el.innerHTML=`
        <nav class="main-dock" aria-label="Main navigation"><button data-studio="explore" class="is-active"><i>⌁</i><span>Explore</span></button><button data-suite-link="map"><i>⌖</i><span>Map</span></button><button data-studio="weather"><i>☁</i><span>Weather</span></button><button data-suite-link="photo"><i>◎</i><span>Photo</span></button><button data-studio="journal"><i>✦</i><span>Collection</span><b>1</b></button><button data-action-link="settings"><i>☷</i><span>Settings</span></button></nav>
        <section class="studio-panel world-builder"><div class="studio-head"><span><small>PROCEDURAL ORIGIN</small><strong>Create a new world</strong></span><button data-studio-close>×</button></div><div class="builder-grid"><label>World name<input data-world="name" value="My Infinite World"></label><label>Seed<div><input data-world="seed" value="p"><button data-random>↻</button><button data-copy-seed>⧉</button></div></label><label>Terrain style<select data-world="terrain"><option>Valleys</option><option>Mountains</option><option>Plains</option><option>Islands</option></select></label><label>Climate<select data-world="climate"><option>Temperate</option><option>Alpine</option><option>Coastal</option><option>Wild</option></select></label><label>Water level<input data-world="water" type="range" min="-20" max="20" value="-5"></label><label>Day length<input data-world="day" type="range" min="15" max="180" value="60"></label></div><div class="world-preview"><i></i><span>LIVE WORLD PREVIEW</span></div><div class="studio-actions"><button data-save-profile>Save profile</button><button class="primary" data-create-world>Generate world</button></div></section>
        <section class="studio-panel journal"><div class="studio-head"><span><small>FIELD NOTES</small><strong>Discovery journal</strong></span><button data-studio-close>×</button></div><div class="journal-hero"><span><small>TIME EXPLORED</small><strong data-journal="time">00:00</strong></span><span><small>DISTANCE</small><strong data-journal="distance">0 m</strong></span><span><small>HIGHEST POINT</small><strong data-journal="height">0 m</strong></span><span><small>DISCOVERIES</small><strong data-journal="discoveries">1</strong></span></div><div class="journal-cards"><article><i>△</i><small>BIOME</small><strong>Emerald Highlands</strong><p>Rolling terrain shaped by an endless seed.</p></article><article><i>☀</i><small>WEATHER</small><strong>Season Chaser</strong><p>Experience every face of the living world.</p></article><article><i>⌖</i><small>LANDMARK</small><strong>Beyond the Familiar</strong><p>Travel 250 metres from your origin.</p></article></div><textarea data-notes placeholder="Write a field note…"></textarea></section>
        <section class="studio-panel weather-studio"><div class="studio-head"><span><small>CINEMATIC SEQUENCER</small><strong>Weather composer</strong></span><button data-studio-close>×</button></div><div class="timeline-track"><i></i><b style="left:12%">Dawn</b><b style="left:48%">Storm</b><b style="left:82%">Sunset</b></div><div class="composer-buttons"><button data-keyframe="dawn">＋ Dawn</button><button data-keyframe="storm">＋ Storm</button><button data-keyframe="snow">＋ Snow</button><button data-keyframe="sunset">＋ Sunset</button></div><label>Transition duration <input data-composer-duration type="range" min="2" max="30" value="8"><output>8 sec</output></label><div class="studio-actions"><button data-export-sequence>Export</button><button data-save-sequence>Save</button><button class="primary" data-play-sequence>▶ Preview sequence</button></div></section>
        <section class="studio-panel diagnostics"><div class="studio-head"><span><small>RENDERER HEALTH</small><strong>Diagnostics</strong></span><button data-studio-close>×</button></div><div class="diagnostic-grid"><span><small>FPS</small><strong data-diag="fps">60</strong></span><span><small>DRAW CALLS</small><strong data-diag="calls">0</strong></span><span><small>TRIANGLES</small><strong data-diag="triangles">0</strong></span><span><small>GEOMETRIES</small><strong data-diag="geometry">0</strong></span><span><small>TEXTURES</small><strong data-diag="textures">0</strong></span><span><small>CHUNKS</small><strong data-diag="chunks">0</strong></span></div><canvas width="700" height="130"></canvas><div class="studio-actions"><button data-safe-mode>Safe mode</button><button data-reset>Reset settings</button><button class="primary" data-export-diag>Export report</button></div></section>
        <section class="share-card"><strong>Share this horizon</strong><p data-share-location></p><div><button data-copy-link>Copy location</button><button data-native-share>Share…</button></div></section>
        <div class="loading-screen"><div class="loader-world"><i></i><b></b></div><small>GENERATING YOUR HORIZON</small><strong data-load-status>Preparing shaders</strong><div><i></i></div><p data-load-tip>Every hill exists because you approached it.</p></div>
        <div class="look-pad" aria-label="Look around"></div><button class="diagnostic-trigger" data-studio="diagnostics">FPS</button>`
        document.querySelector('.game').append(el);this.el=el;this.panels=[...el.querySelectorAll('.studio-panel')];this.graph=[]
    }
    bind()
    {
        this.el.querySelectorAll('[data-studio]').forEach(b=>b.onclick=()=>this.open(b.dataset.studio))
        this.el.querySelectorAll('[data-studio-close]').forEach(b=>b.onclick=()=>this.close())
        this.el.querySelectorAll('[data-suite-link]').forEach(b=>b.onclick=()=>this.view.experience.open(b.dataset.suiteLink))
        this.el.querySelector('[data-action-link]').onclick=()=>document.querySelector('.world-panel').classList.toggle('is-open')
        this.el.querySelector('[data-random]').onclick=()=>this.el.querySelector('[data-world="seed"]').value=Math.random().toString(36).slice(2,10)
        this.el.querySelector('[data-copy-seed]').onclick=()=>navigator.clipboard?.writeText(this.el.querySelector('[data-world="seed"]').value)
        this.el.querySelector('[data-create-world]').onclick=()=>this.createWorld()
        this.el.querySelector('[data-save-profile]').onclick=()=>this.saveProfile()
        this.el.querySelectorAll('[data-keyframe]').forEach(b=>b.onclick=()=>{this.keyframes.push(b.dataset.keyframe);this.view.experience.toast(`${b.dataset.keyframe} keyframe added`,'Weather composer')})
        this.el.querySelector('[data-composer-duration]').oninput=e=>e.target.nextElementSibling.textContent=`${e.target.value} sec`
        this.el.querySelector('[data-play-sequence]').onclick=()=>this.playSequence()
        this.el.querySelector('[data-export-sequence]').onclick=()=>this.download('pixel-world-sequence.json',JSON.stringify(this.keyframes,null,2))
        this.el.querySelector('[data-save-sequence]').onclick=()=>localStorage.setItem('pixel-world-sequence',JSON.stringify(this.keyframes))
        this.el.querySelector('[data-copy-link]').onclick=()=>navigator.clipboard?.writeText(this.shareURL())
        this.el.querySelector('[data-native-share]').onclick=()=>navigator.share?.({title:'Pixel World',url:this.shareURL()})
        this.el.querySelector('[data-safe-mode]').onclick=()=>{this.theme.quality='low';this.theme.events.emit('quality','low');this.close()}
        this.el.querySelector('[data-reset]').onclick=()=>{localStorage.clear();location.reload()}
        this.el.querySelector('[data-export-diag]').onclick=()=>this.download('pixel-world-diagnostics.json',JSON.stringify(this.diagnostics(),null,2))
        this.el.querySelector('[data-notes]').oninput=e=>localStorage.setItem('pixel-world-notes',e.target.value);this.el.querySelector('[data-notes]').value=localStorage.getItem('pixel-world-notes')||''
        const look=this.el.querySelector('.look-pad');let last=null;look.onpointerdown=e=>{last={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId)};look.onpointermove=e=>{if(!last)return;this.state.controls.pointer.deltaTemp.x+=e.clientX-last.x;this.state.controls.pointer.deltaTemp.y+=e.clientY-last.y;last={x:e.clientX,y:e.clientY}};look.onpointerup=()=>last=null
        window.addEventListener('beforeunload',()=>this.persist())
    }
    open(name){this.close();if(name==='explore')this.el.querySelector('.world-builder').classList.add('is-open');if(name==='weather')this.el.querySelector('.weather-studio').classList.add('is-open');if(name==='journal')this.el.querySelector('.journal').classList.add('is-open');if(name==='diagnostics')this.el.querySelector('.diagnostics').classList.add('is-open')}
    close(){this.panels.forEach(p=>p.classList.remove('is-open'))}
    createWorld(){const seed=this.el.querySelector('[data-world="seed"]').value;localStorage.setItem('pixel-world-current',JSON.stringify(this.worldConfig()));this.view.experience.toast(`Seed ${seed} prepared`,'New world');location.hash=`world=${encodeURIComponent(seed)}`;location.reload()}
    worldConfig(){return Object.fromEntries([...this.el.querySelectorAll('[data-world]')].map(i=>[i.dataset.world,i.value]))}
    saveProfile(){const profiles=JSON.parse(localStorage.getItem('pixel-world-profiles')||'[]');profiles.push(this.worldConfig());localStorage.setItem('pixel-world-profiles',JSON.stringify(profiles));this.view.experience.toast('World profile saved','Collection')}
    async playSequence(){const frames=this.keyframes.length?this.keyframes:['dawn','storm','snow','sunset'];for(const frame of frames){if(frame==='storm')this.theme.set('rainy');if(frame==='snow')this.theme.set('winter');if(frame==='dawn'||frame==='sunset'){this.theme.set('summer');this.state.day.autoUpdate=false;this.state.day.progress=frame==='dawn'?.24:.77}await new Promise(r=>setTimeout(r,1500))}}
    shareURL(){const p=this.state.player.position.current,u=new URL(location.href);u.searchParams.set('x',Math.round(p[0]));u.searchParams.set('z',Math.round(p[2]));u.searchParams.set('season',this.theme.mode);return u.toString()}
    download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
    restore(){try{const save=JSON.parse(localStorage.getItem('pixel-world-save'));if(save){this.state.player.position.current[0]=save.x;this.state.player.position.current[2]=save.z;if(save.season)this.theme.set(save.season)}}catch(error){console.warn('Save could not be restored',error)}}
    persist(){const p=this.state.player.position.current;localStorage.setItem('pixel-world-save',JSON.stringify({x:p[0],z:p[2],season:this.theme.mode,time:this.state.day.progress,distance:this.distance}))}
    loading(){const screen=this.el.querySelector('.loading-screen'),bar=screen.querySelector('div>i'),status=screen.querySelector('[data-load-status]');let p=0;const timer=setInterval(()=>{p=Math.min(100,p+8+Math.random()*13);bar.style.width=`${p}%`;status.textContent=p<35?'Compiling atmosphere':p<70?'Sculpting terrain':p<95?'Growing the world':'Ready to explore';if(p===100){clearInterval(timer);setTimeout(()=>screen.classList.add('is-hidden'),350)}},120)}
    diagnostics(){const info=this.view.renderer.instance.info;return{fps:this.fps||60,drawCalls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures,chunks:this.state.chunks.allChunks.size,quality:this.theme.quality,userAgent:navigator.userAgent}}
    drawGraph(){const c=this.el.querySelector('.diagnostics canvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.strokeStyle='#74d6b3';x.beginPath();this.graph.forEach((v,i)=>{const px=i/(this.graph.length-1)*c.width,py=c.height-Math.min(v,80)/80*c.height;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
    update()
    {
        const p=this.state.player.position.current,dx=p[0]-this.lastPosition[0],dz=p[2]-this.lastPosition[2];this.distance+=Math.hypot(dx,dz);this.lastPosition=[...p];this.saveTimer+=this.state.time.delta;if(this.saveTimer>5){this.persist();this.saveTimer=0}
        const elapsed=(performance.now()-this.started)/1000;this.el.querySelector('[data-journal="time"]').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;this.el.querySelector('[data-journal="distance"]').textContent=`${Math.round(this.distance)} m`;this.el.querySelector('[data-journal="height"]').textContent=`${Math.max(0,Math.round(p[1]))} m`;this.el.querySelector('[data-share-location]').textContent=`${Math.round(p[0])}, ${Math.round(p[2])} · ${this.theme.mode}`
        this.fps=Math.round(1/Math.max(this.state.time.delta,.001));if(Math.random()<.05){const d=this.diagnostics();for(const[k,v]of Object.entries({fps:d.fps,calls:d.drawCalls,triangles:d.triangles,geometry:d.geometries,textures:d.textures,chunks:d.chunks})){const e=this.el.querySelector(`[data-diag="${k}"]`);if(e)e.textContent=v.toLocaleString()}this.graph.push(d.fps);if(this.graph.length>100)this.graph.shift();this.drawGraph()}
    }
}
