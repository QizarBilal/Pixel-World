import * as THREE from 'three'

import Game from '@/Game.js'
import View from '@/View/View.js'
import State from '@/State/State.js'
import Terrain from './Terrain.js'
import TerrainGradient from './TerrainGradient.js'
import TerrainMaterial from './Materials/TerrainMaterial.js'

export default class Terrains
{
    constructor()
    {
        this.game = Game.getInstance()
        this.state = State.getInstance()
        this.view = View.getInstance()
        this.debug = View.getInstance()

        this.viewport = this.state.viewport
        this.sky =  this.view.sky

        this.setGradient()
        this.setMaterial()
        this.setDebug()

        this.state.terrains.events.on('create', (engineTerrain) =>
        {
            const terrain = new Terrain(this, engineTerrain)

            engineTerrain.events.on('destroy', () =>
            {
                terrain.destroy()
            })
        })
    }

    setGradient()
    {
        this.gradient = new TerrainGradient()
    }

    setMaterial()
    {
        this.material = new TerrainMaterial()
        this.material.uniforms.uPlayerPosition.value = new THREE.Vector3()
        this.material.uniforms.uGradientTexture.value = this.gradient.texture
        this.material.uniforms.uLightnessSmoothness.value = 0.25
        this.material.uniforms.uFresnelOffset.value = 0
        this.material.uniforms.uFresnelScale.value = 0.5
        this.material.uniforms.uFresnelPower.value = 2
        this.material.uniforms.uSunPosition.value = new THREE.Vector3(- 0.5, - 0.5, - 0.5)
        this.material.uniforms.uFogTexture.value = this.sky.customRender.texture
        this.material.uniforms.uGrassDistance.value = this.state.chunks.minSize
        this.applyTheme()
        this.view.theme.events.on('change', () => this.applyTheme())

        this.material.onBeforeRender = (renderer, scene, camera, geometry, mesh) =>
        {
            this.material.uniforms.uTexture.value = mesh.userData.texture
            this.material.uniformsNeedUpdate = true
        }

        // this.material.wireframe = true

        // const dummy = new THREE.Mesh(
        //     new THREE.SphereGeometry(30, 64, 32),
        //     this.material
        // )
        // dummy.position.y = 50
        // this.scene.add(dummy)
    }

    applyTheme()
    {
        const mode = this.view.theme.mode
        const palettes = {
            summer: { ground: '#69a63c', shade: '#2b5832', rock: '#727764', snow: '#f4fbff', fog: 0.0018 },
            winter: { ground: '#b6c9ca', shade: '#60757a', rock: '#68757b', snow: '#ffffff', fog: 0.0032 },
            rainy: { ground: '#3e7048', shade: '#183b31', rock: '#48565a', snow: '#dae4e8', fog: 0.0048 }
        }
        const palette = palettes[mode]
        this.material.uniforms.uSeason.value = this.view.theme.value
        this.material.uniforms.uGroundColor.value.set(palette.ground)
        this.material.uniforms.uGroundShadeColor.value.set(palette.shade)
        this.material.uniforms.uRockColor.value.set(palette.rock)
        this.material.uniforms.uSnowColor.value.set(palette.snow)
        this.material.uniforms.uFogIntensity.value = palette.fog
    }

    setDebug()
    {
        if(!this.debug.active)
            return

        const folder = debug.ui.getFolder('view/terrains')

        folder
            .add(this.material, 'wireframe')

        folder
            .add(this.material.uniforms.uLightnessSmoothness, 'value')
            .min(0)
            .max(1)
            .step(0.001)
            .name('uLightnessSmoothness')
        
        folder
            .add(this.material.uniforms.uFresnelOffset, 'value')
            .min(- 1)
            .max(1)
            .step(0.001)
            .name('uFresnelOffset')
        
        folder
            .add(this.material.uniforms.uFresnelScale, 'value')
            .min(0)
            .max(2)
            .step(0.001)
            .name('uFresnelScale')
        
        folder
            .add(this.material.uniforms.uFresnelPower, 'value')
            .min(1)
            .max(10)
            .step(1)
            .name('uFresnelPower')
    }

    update()
    {
        const playerState = this.state.player
        const playerPosition = playerState.position.current
        const sunState = this.state.sun

        this.material.uniforms.uPlayerPosition.value.set(playerPosition[0], playerPosition[1], playerPosition[2])
        this.material.uniforms.uSunPosition.value.set(sunState.position.x, sunState.position.y, sunState.position.z)
        const baseFog = this.view.theme.mode === 'rainy' ? 0.0034 : this.view.theme.mode === 'winter' ? 0.0024 : 0.0013
        this.material.uniforms.uFogIntensity.value = baseFog * (0.55 + this.view.theme.settings.fog)
    }

    resize()
    {
    }
}
