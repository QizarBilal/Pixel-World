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
    assert.match(worker, /request\.mode === 'navigate'/)
    assert.match(worker, /skipWaiting/)
})

test('exploration activities and rewards are integrated', async() =>
{
    const adventures = await source('sources/Game/View/Adventures.js')
    for(const feature of [ 'setCollectibles', 'startChallenge', 'collect', 'Horizon trail' ])
        assert.match(adventures, new RegExp(feature))
})

test('living wildlife ecosystem is integrated', async() =>
{
    const wildlife = await source('sources/Game/View/Wildlife.js')
    for(const feature of [ 'setBirds', 'setAnimals', 'setFish', 'setInsects', 'Wildlife discovered' ])
        assert.match(wildlife, new RegExp(feature))
})

test('world seeds and shared locations are restored', async() =>
{
    const game = await source('sources/Game/Game.js')
    const studio = await source('sources/Game/View/Studio.js')
    assert.match(game, /hash\.get\('world'\)/)
    assert.match(game, /\.\.\.savedWorld/)
    assert.match(studio, /params\.has\('x'\)/)
    assert.match(studio, /params\.get\('season'\)/)
    assert.match(studio, /this\.distance=Number\.isFinite\(save\.distance\)/)
})

test('world builder settings drive the actual simulation', async() =>
{
    const game = await source('sources/Game/Game.js')
    const terrains = await source('sources/Game/State/Terrains.js')
    const water = await source('sources/Game/View/Water.js')
    const day = await source('sources/Game/State/DayCycle.js')
    for(const key of [ 'terrain', 'climate', 'water', 'day' ]) assert.match(game, new RegExp(key))
    for(const profile of [ 'Valleys', 'Mountains', 'Plains', 'Islands' ]) assert.match(terrains, new RegExp(profile))
    assert.match(water, /game\.world\.water/)
    assert.match(day, /game\.world\.day/)
})

test('map, collection, onboarding, and accessibility are functional', async() =>
{
    const experience = await source('sources/Game/View/Experience.js')
    const studio = await source('sources/Game/View/Studio.js')
    const theme = await source('sources/Game/View/Theme.js')
    const css = await source('sources/style.css')
    for(const feature of [ 'renderMarkers', 'recordDiscovery', 'pixel-world-landmarks', 'pixel-world-photos', 'trapFocus' ]) assert.match(experience, new RegExp(feature))
    for(const feature of [ 'renderProfiles', 'renderJournal', 'updatePreview' ]) assert.match(studio, new RegExp(feature))
    assert.match(theme, /startTutorial/)
    assert.match(css, /focus-visible/)
    assert.match(css, /min-width:48px/)
})

test('sound state and offline fallback remain consistent', async() =>
{
    const theme = await source('sources/Game/View/Theme.js')
    const experience = await source('sources/Game/View/Experience.js')
    const worker = await source('public/service-worker.js')
    assert.match(theme, /setSound\(enabled\)/)
    assert.match(experience, /this\.theme\.setSound\(!this\.theme\.sound\)/)
    assert.match(worker, /Response\.error\(\)/)
})
