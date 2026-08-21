import * as THREE from 'three'

import vertexShader from './shaders/grass/vertex.glsl'
import fragmentShader from './shaders/grass/fragment.glsl'

export default function GrassMaterial()
{
    const material = new THREE.ShaderMaterial({
        uniforms:
        {
            uTime: { value: null },
            uGrassDistance: { value: null },
            uPlayerPosition: { value: null },
            uTerrainSize: { value: null },
            uTerrainTextureSize: { value: null },
            uTerrainATexture: { value: null },
            uTerrainAOffset: { value: null },
            uTerrainBTexture: { value: null },
            uTerrainBOffset: { value: null },
            uTerrainCTexture: { value: null },
            uTerrainCOffset: { value: null },
            uTerrainDTexture: { value: null },
            uTerrainDOffset: { value: null },
            uNoiseTexture: { value: null },
            uFresnelOffset: { value: null },
            uFresnelScale: { value: null },
            uFresnelPower: { value: null },
            uSunPosition: { value: null },
            uSeason: { value: 0 },
            uWindStrength: { value: 1 },
            uGrassColor: { value: new THREE.Color('#71a83c') },
            uGrassShadeColor: { value: new THREE.Color('#315b31') },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    })

    return material
}
