import Camera from './Camera.js'
import Chunks from './Chunks.js'
import Grass from './Grass.js'
import Noises from './Noises.js'
import Player from './Player.js'
import Renderer from './Renderer.js'
import Sky from './Sky.js'
import Terrains from './Terrains.js'
import Water from './Water.js'
import Theme from './Theme.js'
import Weather from './Weather.js'
import Scenery from './Scenery.js'
import Experience from './Experience.js'
import Studio from './Studio.js'

import * as THREE from 'three'

export default class View
{
    static instance

    static getInstance()
    {
        return View.instance
    }

    constructor()
    {
        if(View.instance)
            return View.instance

        View.instance = this

        this.scene = new THREE.Scene()
        this.theme = new Theme()

        this.camera = new Camera()
        this.renderer = new Renderer()
        this.noises = new Noises()
        this.sky = new Sky()
        this.water = new Water()
        this.terrains = new Terrains()
        this.chunks = new Chunks()
        this.player = new Player()
        this.grass = new Grass()
        this.weather = new Weather()
        this.scenery = new Scenery()
        this.experience = new Experience()
        this.studio = new Studio()
    }

    resize()
    {
        this.camera.resize()
        this.renderer.resize()
        this.sky.resize()
        this.terrains.resize()
    }

    update()
    {
        this.theme.update()
        this.sky.update()
        this.water.update()
        this.terrains.update()
        this.chunks.update()
        this.player.update()
        this.grass.update()
        this.weather.update()
        this.scenery.update()
        this.experience.update()
        this.studio.update()
        this.camera.update()
        this.renderer.update()
    }

    destroy()
    {
    }
}
