import Game from '@/Game.js'

const game = new Game()

if(game.view)
    document.querySelector('.game').append(game.view.renderer.instance.domElement)

if('serviceWorker' in navigator && import.meta.env.PROD)
    navigator.serviceWorker.register('./service-worker.js')
