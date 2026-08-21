import * as THREE from 'three'
import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Water
{
    constructor()
    {
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.material = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false,
            uniforms: { uTime:{ value:0 }, uSeason:{ value:0 }, uRain:{ value:0 } },
            vertexShader: `varying vec3 vWorld; uniform float uTime; void main(){vec3 p=position;p.z+=sin(p.x*.055+uTime)*.22+cos(p.y*.047+uTime*.7)*.18;vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
            fragmentShader: `varying vec3 vWorld;uniform float uTime;uniform float uSeason;uniform float uRain;void main(){float r=sin(length(vWorld.xz)*.32-uTime*3.)*.5+.5;vec3 a=mix(vec3(.035,.24,.3),vec3(.12,.54,.58),r*.12);vec3 b=mix(vec3(.55,.76,.82),vec3(.86,.96,1.),r*.18);vec3 d=mix(vec3(.025,.11,.15),vec3(.12,.27,.3),r*.1);vec3 c=uSeason<.5?a:(uSeason<1.5?b:d);float foam=smoothstep(.78,1.,r)*.14;gl_FragColor=vec4(c+foam,uSeason>.5&&uSeason<1.5?.76:.58+uRain*.12);}`
        })
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 100, 100), this.material)
        this.mesh.geometry.rotateX(-Math.PI*.5)
        this.mesh.position.y = -5
        this.view.scene.add(this.mesh)
        this.view.theme.events.on('change', () => this.applyTheme())
        this.applyTheme()
    }
    applyTheme() { this.material.uniforms.uSeason.value = this.view.theme.value }
    update()
    {
        const player = this.state.player.position.current
        this.mesh.position.x = player[0]
        this.mesh.position.z = player[2]
        this.material.uniforms.uTime.value = this.state.time.elapsed
        this.material.uniforms.uRain.value = this.view.theme.mode === 'rainy' ? this.view.theme.settings.weather : 0
    }
}
