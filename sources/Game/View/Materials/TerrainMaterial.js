import * as THREE from 'three'

import vertexShader from './shaders/terrain/vertex.glsl'
import fragmentShader from './shaders/terrain/fragment.glsl'

export default function TerrainMaterial()
{
    const material = new THREE.ShaderMaterial({
        uniforms:
        {
            uPlayerPosition: { value: null },
            uGradientTexture: { value: null },
            uLightnessSmoothness: { value: null },
            uFresnelOffset: { value: null },
            uFresnelScale: { value: null },
            uFresnelPower: { value: null },
            uSunPosition: { value: null },
            uFogTexture: { value: null },
            uGrassDistance: { value: null },
            uTexture: { value: null }
            ,uSeason: { value: 0 }
            ,uGroundColor: { value: new THREE.Color('#5f8f35') }
            ,uGroundShadeColor: { value: new THREE.Color('#244b2e') }
            ,uRockColor: { value: new THREE.Color('#6f7662') }
            ,uSnowColor: { value: new THREE.Color('#f4fbff') }
            ,uFogIntensity: { value: 0.0025 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    })

    return material
}
