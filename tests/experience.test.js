import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = async(path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('all three seasonal modes remain available', async() =>
{
    const theme = await source('sources/Game/View/Theme.js')
    for(const season of [ 'summer', 'winter', 'rainy' ])
        assert.match(theme, new RegExp(`['"]${season}['"]`))
})

test('keyboard exploration shortcuts are registered', async() =>
{
    const theme = await source('sources/Game/View/Theme.js')
    const experience = await source('sources/Game/View/Experience.js')
    for(const shortcut of [ 'Digit1', 'Digit2', 'Digit3', 'KeyH' ])
        assert.match(theme, new RegExp(shortcut))
    for(const shortcut of [ 'KeyM', 'KeyO' ])
        assert.match(experience, new RegExp(shortcut))
})

test('terrain-neighbour access is guarded', async() =>
{
    const grass = await source('sources/Game/View/Grass.js')
    assert.match(grass, /bChunkSate && bChunkSate\.neighbours/)
})

test('premium interface surfaces are present', async() =>
{
    const experience = await source('sources/Game/View/Experience.js')
    for(const feature of [ 'map-modal', 'photo-modal', 'preset-modal', 'command', 'touch-pad' ])
        assert.match(experience, new RegExp(feature))
})

test('studio and true post-processing systems are integrated', async() =>
{
    const studio = await source('sources/Game/View/Studio.js')
    const renderer = await source('sources/Game/View/Renderer.js')
    for(const feature of [ 'world-builder', 'journal', 'weather-studio', 'diagnostics', 'main-dock' ])
        assert.match(studio, new RegExp(feature))
    for(const pass of [ 'SSAOPass', 'UnrealBloomPass', 'BokehPass' ])
        assert.match(renderer, new RegExp(pass))
})

test('offline application assets are configured', async() =>
{
    const manifest = JSON.parse(await source('public/manifest.webmanifest'))
    const worker = await source('public/service-worker.js')
    assert.equal(manifest.short_name, 'Pixel World')
    assert.match(worker, /caches\.open/)
})
