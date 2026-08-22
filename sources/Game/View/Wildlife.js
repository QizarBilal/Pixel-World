import * as THREE from 'three'
import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Wildlife
{
    constructor()
    {
        this.view=View.getInstance();this.state=State.getInstance();this.scene=this.view.scene;this.theme=this.view.theme;this.cell='';this.discovered=new Set(JSON.parse(localStorage.getItem('pixel-world-wildlife')||'[]'))
        this.setBirds();this.setAnimals();this.setFish();this.setInsects();this.setInterface();this.theme.events.on('change',()=>this.applyTheme());this.applyTheme();this.refreshAnimals()
    }
    setBirds()
    {
        this.birds=[]
        const wing=new THREE.BufferGeometry();wing.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.75,.08,.16,0,0,.02,0,0,0,.75,.08,.16,0,0,.02],3))
        for(let i=0;i<22;i++)
        {
            const bird=new THREE.Mesh(wing,new THREE.MeshBasicMaterial({color:'#263b3e',side:THREE.DoubleSide}));bird.userData={angle:i/22*Math.PI*2,radius:34+Math.random()*95,speed:.08+Math.random()*.08,height:24+Math.random()*34,phase:Math.random()*6};bird.scale.setScalar(.65+Math.random()*.65);bird.frustumCulled=false;this.scene.add(bird);this.birds.push(bird)
        }
    }
    makeAnimal(index)
    {
        const group=new THREE.Group(),fur=new THREE.MeshBasicMaterial({color:index%3===0?'#8b6440':'#72553b'}),dark=new THREE.MeshBasicMaterial({color:'#3b3026'})
        const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1.15,4,7),fur);body.rotation.z=Math.PI*.5;body.position.y=1.05;group.add(body)
        const neck=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,.75,7),fur);neck.position.set(.7,1.48,0);neck.rotation.z=-.36;group.add(neck)
        const head=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),fur);head.scale.set(1.25,.8,.75);head.position.set(.88,1.85,0);group.add(head)
        for(const z of [-.24,.24])for(const x of [-.52,.52]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.85,5),dark);leg.position.set(x,.48,z);leg.userData.phase=(x+z)*5;group.add(leg)}
        for(const z of [-.17,.17]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.1,.35,5),fur);ear.position.set(.83,2.12,z);ear.rotation.z=-.15;group.add(ear)}
        group.scale.setScalar(.8+Math.random()*.45);group.userData={speed:.35+Math.random()*.35,angle:Math.random()*6,phase:Math.random()*6,baseY:0};this.scene.add(group);return group
    }
    setAnimals(){this.animals=Array.from({length:9},(_,i)=>this.makeAnimal(i))}
    setFish()
    {
        this.fish=[]
        for(let i=0;i<34;i++)
        {
            const group=new THREE.Group(),color=new THREE.Color().setHSL(.48+Math.random()*.12,.55,.38+Math.random()*.22),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78})
            const body=new THREE.Mesh(new THREE.SphereGeometry(.22,8,5),material);body.scale.set(2.2,.7,.8);group.add(body)
            const tail=new THREE.Mesh(new THREE.ConeGeometry(.24,.5,3),material);tail.rotation.z=-Math.PI*.5;tail.position.x=-.55;group.add(tail)
            group.userData={angle:Math.random()*6,radius:5+Math.random()*38,speed:.18+Math.random()*.25,depth:.8+Math.random()*3,phase:Math.random()*6};this.scene.add(group);this.fish.push(group)
        }
    }
    setInsects()
    {
        const count=90,positions=new Float32Array(count*3),colors=new Float32Array(count*3)
        for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*42;positions[i*3+1]=.5+Math.random()*7;positions[i*3+2]=(Math.random()-.5)*42;const c=new THREE.Color(i%3===0?'#fff0a0':'#a9f0d0');colors.set([c.r,c.g,c.b],i*3)}
        this.insects=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3)).setAttribute('color',new THREE.BufferAttribute(colors,3)),new THREE.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:.8,depthWrite:false}));this.insects.frustumCulled=false;this.scene.add(this.insects)
    }
    setInterface()
    {
        const el=document.createElement('div');el.className='wildlife-status';el.innerHTML='<i>⌁</i><span><small>LIVING WORLD</small><strong data-wildlife>Birds nearby</strong></span>';document.querySelector('.game').append(el);this.status=el
    }
    pseudo(i,s){const v=Math.sin(i*42.17+s*73.13+this.baseX*.017+this.baseZ*.021)*17458.33;return v-Math.floor(v)}
    refreshAnimals()
    {
        const p=this.state.player.position.current;this.baseX=Math.round(p[0]/110)*110;this.baseZ=Math.round(p[2]/110)*110
        this.animals.forEach((animal,i)=>{const a=this.pseudo(i,1)*Math.PI*2,r=22+this.pseudo(i,2)*72,x=this.baseX+Math.cos(a)*r,z=this.baseZ+Math.sin(a)*r,y=this.state.chunks.getElevationForPosition(x,z);animal.position.set(x,(y??-30),z);animal.userData.baseY=animal.position.y;animal.userData.habitatVisible=y!==undefined&&y>-3;animal.visible=animal.userData.habitatVisible})
    }
    applyTheme()
    {
        const mode=this.theme.mode;this.birds.forEach(b=>b.material.color.set(mode==='winter'?'#4d5963':mode==='rainy'?'#17262c':'#283f3e'));this.insects.visible=mode==='summer';this.animals.forEach(a=>a.visible=a.userData.habitatVisible&&mode!=='rainy');this.fish.forEach(f=>f.visible=mode!=='winter')
    }
    discover(kind,label)
    {
        if(this.discovered.has(kind))return;this.discovered.add(kind);localStorage.setItem('pixel-world-wildlife',JSON.stringify([...this.discovered]));this.view.experience.toast(label,'Wildlife discovered');this.view.experience.recordDiscovery(`wildlife-${kind}`,label,'Wildlife',{rarity:kind==='birds'?'Common':'Rare'});this.status.querySelector('[data-wildlife]').textContent=label;if(navigator.vibrate)navigator.vibrate(30)
    }
    update()
    {
        const t=this.state.time.elapsed,d=this.state.time.delta,p=this.state.player.position.current,cell=`${Math.round(p[0]/110)},${Math.round(p[2]/110)}`;if(cell!==this.cell){this.cell=cell;this.refreshAnimals();this.applyTheme()}
        this.birds.forEach((bird,i)=>{const u=bird.userData;u.angle+=d*u.speed;bird.position.set(p[0]+Math.cos(u.angle)*u.radius,p[1]+u.height+Math.sin(t*.35+u.phase)*4,p[2]+Math.sin(u.angle)*u.radius);bird.rotation.y=-u.angle;bird.rotation.z=Math.sin(t*5+u.phase)*.12})
        this.animals.forEach((animal,i)=>{if(!animal.visible)return;const u=animal.userData;u.angle+=d*u.speed*.08;animal.position.x+=Math.cos(u.angle)*d*u.speed;animal.position.z+=Math.sin(u.angle)*d*u.speed;animal.rotation.y=-u.angle;animal.position.y=u.baseY+Math.sin(t*3+u.phase)*.025;animal.children.slice(3,7).forEach((leg,j)=>leg.rotation.z=Math.sin(t*3*u.speed+u.phase+j*Math.PI)*.18);if(Math.hypot(animal.position.x-p[0],animal.position.z-p[2])<12)this.discover('grazer','Highland grazer')})
        this.fish.forEach((fish,i)=>{if(!fish.visible)return;const u=fish.userData;u.angle+=d*u.speed;fish.position.set(p[0]+Math.cos(u.angle)*u.radius,-5-u.depth+Math.sin(t+u.phase)*.35,p[2]+Math.sin(u.angle)*u.radius);fish.rotation.y=-u.angle;if(Math.hypot(fish.position.x-p[0],fish.position.z-p[2])<9)this.discover('fish','Silverfin school')})
        const pos=this.insects.geometry.attributes.position.array;for(let i=0;i<pos.length;i+=3){pos[i]+=Math.sin(t*.8+i)*d*.08;pos[i+1]+=Math.sin(t*1.5+i)*d*.035;pos[i+2]+=Math.cos(t*.7+i)*d*.08}this.insects.geometry.attributes.position.needsUpdate=true;this.insects.position.set(p[0],p[1],p[2]);if(t>12)this.discover('birds','Skywing flock')
    }
}
