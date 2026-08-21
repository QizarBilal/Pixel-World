import * as THREE from 'three'
import View from '@/View/View.js'
import State from '@/State/State.js'

export default class Scenery
{
    constructor()
    {
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.scene = this.view.scene
        this.cell = ''
        this.refreshTimer = 0
        this.setMeshes()
        this.view.theme.events.on('change', () => this.applyTheme())
        this.view.theme.events.on('quality', () => this.applyQuality())
        this.applyTheme()
    }

    setMeshes()
    {
        this.trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .28, 2.2, 5), new THREE.MeshBasicMaterial({ color:'#65482e' }), 55)
        this.trees = new THREE.InstancedMesh(new THREE.ConeGeometry(1.25, 4.4, 7), new THREE.MeshBasicMaterial({ color:'#255b35' }), 55)
        this.rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color:'#687168' }), 90)
        this.flowers = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.09, 0), new THREE.MeshBasicMaterial({ color:'#ffd85c' }), 220)
        for(const mesh of [ this.trunks, this.trees, this.rocks, this.flowers ])
        {
            mesh.frustumCulled = false
            this.scene.add(mesh)
        }
    }

    random(index, salt)
    {
        const value = Math.sin(index * 91.731 + salt * 47.17 + this.baseX * .013 + this.baseZ * .019) * 43758.5453
        return value - Math.floor(value)
    }

    place(mesh, count, kind)
    {
        const dummy = new THREE.Object3D()
        const spatialKind = kind <= 1 ? 0 : kind
        for(let i = 0; i < count; i++)
        {
            const angle = this.random(i, spatialKind + 1) * Math.PI * 2
            const radius = 18 + Math.sqrt(this.random(i, spatialKind + 2)) * 105
            const x = this.baseX + Math.cos(angle) * radius
            const z = this.baseZ + Math.sin(angle) * radius
            const elevation = this.state.chunks.getElevationForPosition(x, z)
            const scale = .55 + this.random(i, spatialKind + 3) * 1.15
            dummy.position.set(x, elevation || -20, z)
            dummy.rotation.set(0, this.random(i, kind + 4) * Math.PI * 2, kind === 3 ? this.random(i, 8) * .35 : 0)
            dummy.scale.setScalar(scale)
            if(kind === 0) dummy.position.y += 1.1 * scale
            if(kind === 1) dummy.position.y += 3.1 * scale
            if(kind === 3) dummy.position.y += .12
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.count = count
        mesh.instanceMatrix.needsUpdate = true
    }

    refresh()
    {
        const player = this.state.player.position.current
        this.baseX = Math.round(player[0] / 32) * 32
        this.baseZ = Math.round(player[2] / 32) * 32
        const quality = this.view.theme.quality
        const ratio = (quality === 'low' ? .35 : quality === 'medium' ? .65 : 1) * (this.view.theme.settings.vegetation ?? 1)
        this.place(this.trunks, Math.floor(55 * ratio), 0)
        this.place(this.trees, Math.floor(55 * ratio), 1)
        this.place(this.rocks, Math.floor(90 * ratio), 2)
        this.place(this.flowers, Math.floor(220 * ratio), 3)
    }

    applyTheme()
    {
        const mode = this.view.theme.mode
        this.trees.material.color.set(mode === 'summer' ? '#245f35' : mode === 'winter' ? '#d8eceb' : '#153f32')
        this.trunks.material.color.set(mode === 'winter' ? '#6f6257' : '#5e422d')
        this.rocks.material.color.set(mode === 'rainy' ? '#39494c' : mode === 'winter' ? '#a7b7b9' : '#747b6e')
        this.flowers.visible = mode === 'summer'
    }

    applyQuality() { this.refresh() }

    update()
    {
        this.refreshTimer -= this.state.time.delta
        const player = this.state.player.position.current
        const cell = `${Math.round(player[0] / 32)},${Math.round(player[2] / 32)}`
        if(cell !== this.cell || this.refreshTimer <= 0)
        {
            this.cell = cell
            this.refreshTimer = 1.5
            this.refresh()
        }
    }
}
