import * as THREE from 'three'
import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Adventures
{
    constructor()
    {
        this.view=View.getInstance();this.state=State.getInstance();this.scene=this.view.scene
        this.score=parseInt(localStorage.getItem('pixel-world-score')||'0');this.streak=0;this.cell='';this.challenge=null
        this.setCollectibles();this.setInterface();this.setEvents();this.refresh()
    }
    setCollectibles()
    {
        const geometry=new THREE.OctahedronGeometry(.38,0)
        const material=new THREE.MeshBasicMaterial({color:'#ffd45b',transparent:true,opacity:.94})
        this.collectibles=[]
        for(let i=0;i<18;i++)
        {
            const core=new THREE.Mesh(geometry,material.clone()),halo=new THREE.Mesh(new THREE.RingGeometry(.62,.7,24),new THREE.MeshBasicMaterial({color:'#fff0a2',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}))
            halo.rotation.x=-Math.PI*.5;core.add(halo);core.userData={index:i,collected:false,baseY:0};this.scene.add(core);this.collectibles.push(core)
        }
        this.gateMaterial=new THREE.MeshBasicMaterial({color:'#74e4c1',transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false})
    }
    setInterface()
    {
        const hud=document.createElement('div');hud.className='adventure-hud';hud.innerHTML=`<div class="quest"><i>✦</i><span><small>WORLD ENERGY</small><strong><b data-energy>${this.score}</b> wisps</strong></span></div><div class="streak"><small>DISCOVERY STREAK</small><strong data-streak>×1</strong></div><button data-trail>Start trail challenge <kbd>R</kbd></button><div class="challenge"><small>HORIZON TRAIL</small><strong><b data-gate>1</b> / 6</strong><time data-timer>00:00</time></div>`
        document.querySelector('.game').append(hud);this.hud=hud
    }
    setEvents()
    {
        this.hud.querySelector('[data-trail]').onclick=()=>this.startChallenge()
        window.addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.target.closest('input,textarea,select,[contenteditable="true"]'))this.startChallenge()})
        this.view.theme.events.on('change',()=>this.applyTheme())
    }
    random(i,s){const v=Math.sin(i*93.17+s*17.31+this.baseX*.019+this.baseZ*.023)*43758.545;return v-Math.floor(v)}
    refresh()
    {
        const p=this.state.player.position.current;this.baseX=Math.round(p[0]/96)*96;this.baseZ=Math.round(p[2]/96)*96
        this.collectibles.forEach((item,i)=>
        {
            const angle=this.random(i,1)*Math.PI*2,radius=12+this.random(i,2)*72,x=this.baseX+Math.cos(angle)*radius,z=this.baseZ+Math.sin(angle)*radius,y=this.state.chunks.getElevationForPosition(x,z)
            item.position.set(x,(y??-30)+1.4,z);item.userData.baseY=item.position.y;item.userData.collected=false;item.visible=Boolean(y!==undefined)
        });this.applyTheme()
    }
    applyTheme()
    {
        const colors={summer:'#ffd45b',winter:'#a9efff',rainy:'#72e6bd'},color=colors[this.view.theme.mode]
        this.collectibles.forEach(item=>{item.material.color.set(color);item.children[0].material.color.set(color)});this.gateMaterial.color.set(color)
    }
    collect(item)
    {
        item.userData.collected=true;item.visible=false;this.score++;this.streak=Math.min(9,this.streak+1);localStorage.setItem('pixel-world-score',this.score)
        this.hud.querySelector('[data-energy]').textContent=this.score;this.hud.querySelector('[data-streak]').textContent=`×${Math.max(1,this.streak)}`;this.hud.classList.remove('is-pulsing');void this.hud.offsetWidth;this.hud.classList.add('is-pulsing')
        this.view.experience.toast(`Wisp ${this.score} collected`,this.streak>2?`${this.streak} discovery streak`:'World energy');if(navigator.vibrate)navigator.vibrate([20,25,35])
        this.view.experience.recordDiscovery('wisp', `World wisp ${this.score}`, 'Energy', { score:this.score })
        if(this.score%5===0){this.view.renderer.bloomPass.strength=.32;setTimeout(()=>this.view.renderer.bloomPass.strength=.09,1200)}
    }
    startChallenge()
    {
        if(this.challenge){this.endChallenge(false);return}
        const p=this.state.player.position.current;this.challenge={index:0,start:this.state.time.elapsed,gates:[]}
        for(let i=0;i<6;i++)
        {
            const angle=i*.72+this.state.player.rotation,radius=14+i*13,x=p[0]-Math.sin(angle)*radius,z=p[2]-Math.cos(angle)*radius,y=this.state.chunks.getElevationForPosition(x,z)??p[1]
            const gate=new THREE.Mesh(new THREE.TorusGeometry(2.1,.12,10,48),this.gateMaterial.clone());gate.position.set(x,y+2.5,z);gate.visible=i===0;this.scene.add(gate);this.challenge.gates.push(gate)
        }
        this.hud.classList.add('has-challenge');this.view.experience.toast('Follow the glowing gates','Horizon trail started')
    }
    endChallenge(success)
    {
        if(!this.challenge)return;this.challenge.gates.forEach(g=>{this.scene.remove(g);g.geometry.dispose();g.material.dispose()});if(success){this.score+=10;localStorage.setItem('pixel-world-score',this.score);this.hud.querySelector('[data-energy]').textContent=this.score;this.view.experience.toast('Trail complete · +10 wisps','Horizon mastered');this.view.experience.recordDiscovery('trail',`Horizon trail ${Date.now()}`,'Journey',{score:10})}this.challenge=null;this.hud.classList.remove('has-challenge')
    }
    updateChallenge()
    {
        if(!this.challenge)return
        const current=this.challenge.gates[this.challenge.index],p=this.state.player.position.current;current.rotation.y+=this.state.time.delta*.8;current.scale.setScalar(1+Math.sin(this.state.time.elapsed*3)*.06)
        if(current.position.distanceTo(new THREE.Vector3(p[0],p[1]+1,p[2]))<3.3){current.visible=false;this.challenge.index++;if(this.challenge.index===6){this.endChallenge(true);return}this.challenge.gates[this.challenge.index].visible=true;this.hud.querySelector('[data-gate]').textContent=this.challenge.index+1}
        const elapsed=this.state.time.elapsed-this.challenge.start;this.hud.querySelector('[data-timer]').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`
    }
    update()
    {
        const time=this.state.time,p=this.state.player.position.current,cell=`${Math.round(p[0]/96)},${Math.round(p[2]/96)}`
        if(cell!==this.cell){this.cell=cell;this.refresh()}
        for(const item of this.collectibles){if(!item.visible||item.userData.collected)continue;item.rotation.y+=time.delta*1.4;item.position.y=item.userData.baseY+Math.sin(time.elapsed*2+item.userData.index)*.35;if(item.position.distanceTo(new THREE.Vector3(p[0],p[1]+1,p[2]))<1.8)this.collect(item)}
        this.updateChallenge()
    }
}
