import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'

import Game from '@/Game.js'
import View from '@/View/View.js'
import Debug from '@/Debug/Debug.js'
import State from '@/State/State.js'

export default class Renderer
{
    constructor(_options = {})
    {
        this.game = Game.getInstance()
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.debug = Debug.getInstance()

        this.scene = this.view.scene
        this.domElement = this.game.domElement
        this.viewport = this.state.viewport
        this.time = this.state.time
        this.camera = this.view.camera

        this.setInstance()
        this.setPostProcessing()
    }

    setPostProcessing()
    {
        const size = new THREE.Vector2(this.viewport.width, this.viewport.height)
        this.composer = new EffectComposer(this.instance)
        this.renderPass = new RenderPass(this.scene, this.camera.instance)
        this.ssaoPass = new SSAOPass(this.scene, this.camera.instance, size.x, size.y)
        this.ssaoPass.kernelRadius = 7
        this.ssaoPass.minDistance = 0.002
        this.ssaoPass.maxDistance = 0.12
        this.bloomPass = new UnrealBloomPass(size, 0.22, 0.55, 0.84)
        this.bokehPass = new BokehPass(this.scene, this.camera.instance, { focus: 18, aperture: 0.00001, maxblur: 0.004, width:size.x, height:size.y })
        this.bokehPass.enabled = false
        this.composer.addPass(this.renderPass)
        this.composer.addPass(this.ssaoPass)
        this.composer.addPass(this.bloomPass)
        this.composer.addPass(this.bokehPass)
    }

    setInstance()
    {
        this.clearColor = '#222222'

        // Renderer
        this.instance = new THREE.WebGLRenderer({
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: true
        })
        
        this.instance.sortObjects = false
        this.instance.domElement.style.position = 'absolute'
        this.instance.domElement.style.top = 0
        this.instance.domElement.style.left = 0
        this.instance.domElement.style.width = '100%'
        this.instance.domElement.style.height = '100%'

        // this.instance.setClearColor(0x414141, 1)
        this.instance.setClearColor(this.clearColor, 1)
        this.instance.setSize(this.viewport.width, this.viewport.height)
        this.instance.setPixelRatio(this.viewport.clampedPixelRatio)
        this.composer.setSize(this.viewport.width, this.viewport.height)
        this.instance.outputEncoding = THREE.sRGBEncoding
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = 1.08

        // this.instance.physicallyCorrectLights = true
        // this.instance.gammaOutPut = true
        // this.instance.outputEncoding = THREE.sRGBEncoding
        // this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        // this.instance.shadowMap.enabled = false
        // this.instance.toneMapping = THREE.ReinhardToneMapping
        // this.instance.toneMapping = THREE.ReinhardToneMapping
        // this.instance.toneMappingExposure = 1.3

        this.context = this.instance.getContext()

        // Add stats panel
        if(this.debug.stats)
        {
            this.debug.stats.setRenderPanel(this.context)
        }
    }

    resize()
    {
        // Instance
        this.instance.setSize(this.viewport.width, this.viewport.height)
        this.instance.setPixelRatio(this.viewport.clampedPixelRatio)
    }

    update()
    {
        if(this.debug.stats)
            this.debug.stats.beforeRender()

        this.composer.render()

        if(this.debug.stats)
            this.debug.stats.afterRender()
    }

    destroy()
    {
        this.instance.renderLists.dispose()
        this.instance.dispose()
        this.renderTarget.dispose()
    }
}
