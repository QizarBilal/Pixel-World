uniform vec3 uPlayerPosition;
uniform float uLightnessSmoothness;
uniform float uFresnelOffset;
uniform float uFresnelScale;
uniform float uFresnelPower;
uniform vec3 uSunPosition;
uniform float uGrassDistance;
uniform sampler2D uTexture;
uniform sampler2D uFogTexture;
uniform float uSeason;
uniform vec3 uGroundColor;
uniform vec3 uGroundShadeColor;
uniform vec3 uRockColor;
uniform vec3 uSnowColor;
uniform float uFogIntensity;

varying vec3 vColor;

#include ../partials/inverseLerp.glsl
#include ../partials/remap.glsl
#include ../partials/getSunShade.glsl;
#include ../partials/getSunShadeColor.glsl;
#include ../partials/getSunReflection.glsl;
#include ../partials/getSunReflectionColor.glsl;
#include ../partials/getFogColor.glsl;
#include ../partials/getGrassAttenuation.glsl;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    float depth = - viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;

    // Terrain data
    vec4 terrainData = texture2D(uTexture, uv);
    vec3 normal = terrainData.rgb;

    // Slope
    float slope = 1.0 - abs(dot(vec3(0.0, 1.0, 0.0), normal));

    vec3 viewDirection = normalize(modelPosition.xyz - cameraPosition);
    vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
    vec3 viewNormal = normalize(normalMatrix * normal);

    // Color
    vec3 uGrassDefaultColor = uGroundColor;
    vec3 uGrassShadedColor = uGroundShadeColor;
    
    // Grass distance attenuation
    // Terrain must match the bottom of the grass which is darker
    float grassDistanceAttenuation = getGrassAttenuation(modelPosition.xz);
    float grassSlopeAttenuation = smoothstep(remap(slope, 0.4, 0.5, 1.0, 0.0), 0.0, 1.0);
    float grassAttenuation = grassDistanceAttenuation * grassSlopeAttenuation;
    vec3 grassColor = mix(uGrassShadedColor, uGrassDefaultColor, 1.0 - grassAttenuation);

    float heightMix = smoothstep(28.0, 105.0, modelPosition.y);
    float rockMix = smoothstep(0.22, 0.72, slope);
    float broadNoise = sin(modelPosition.x * 0.031) * cos(modelPosition.z * 0.027);
    float fineNoise = sin(modelPosition.x * 0.41 + modelPosition.z * 0.29) * 0.5 + 0.5;
    float strata = sin(modelPosition.y * 0.48 + broadNoise * 3.0) * 0.5 + 0.5;
    vec3 soilColor = vec3(0.22, 0.16, 0.10);
    vec3 summerColor = mix(grassColor, soilColor, smoothstep(0.28, 0.7, slope) * 0.3);
    summerColor = mix(summerColor, uRockColor * mix(0.72, 1.08, strata), rockMix * 0.84);
    summerColor *= mix(0.82, 1.08, fineNoise) * mix(0.92, 1.04, broadNoise * 0.5 + 0.5);
    summerColor = mix(summerColor, vec3(0.56, 0.61, 0.47), heightMix * 0.12);
    float snowCoverage = smoothstep(0.08, 0.48, slope) * 0.28 + smoothstep(-8.0, 48.0, modelPosition.y);
    snowCoverage = clamp(snowCoverage, 0.0, 1.0);
    vec3 winterColor = mix(uRockColor * mix(0.72, 1.0, strata), uSnowColor * mix(0.82, 1.04, fineNoise), snowCoverage);
    vec3 rainyColor = mix(grassColor * vec3(0.52, 0.7, 0.61), uRockColor * mix(0.45, 0.72, strata), rockMix);
    vec3 color = uSeason < 0.5 ? summerColor : (uSeason < 1.5 ? winterColor : rainyColor);

    // Sun shade
    float sunShade = getSunShade(normal);
    color = getSunShadeColor(color, sunShade);

    // Sun reflection
    float sunReflection = getSunReflection(viewDirection, worldNormal, viewNormal);
    color = getSunReflectionColor(color, sunReflection);

    // Fog
    vec2 screenUv = (gl_Position.xy / gl_Position.w * 0.5) + 0.5;
    color = getFogColor(color, depth, screenUv);

    // vec3 dirtColor = vec3(0.3, 0.2, 0.1);
    // vec3 color = mix(dirtColor, grassColor, terrainData.g);

    // Varyings
    vColor = color;
}
