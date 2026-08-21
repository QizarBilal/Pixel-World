vec3 getFogColor(vec3 baseColor, float depth, vec2 screenUv)
{
    vec3 fogColor = texture2D(uFogTexture, screenUv).rgb;
    
    float fogIntensity = 1.0 - exp(- uFogIntensity * uFogIntensity * depth * depth );
    return mix(baseColor, fogColor, fogIntensity);
}
