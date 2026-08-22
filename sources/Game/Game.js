import Debug from '@/Debug/Debug.js'
import State from '@/State/State.js'
import View from '@/View/View.js'

export default class Game
{
    static instance

    static getInstance()
    {
        return Game.instance
    }

    constructor()
    {
        if(Game.instance)
            return Game.instance

        Game.instance = this

        const hash = new URLSearchParams(location.hash.replace(/^#/, ''))
        let savedWorld = null
        try { savedWorld = JSON.parse(localStorage.getItem('pixel-world-current')) }
        catch { localStorage.removeItem('pixel-world-current') }
        this.world = { name:'My Infinite World', seed:'p', terrain:'Valleys', climate:'Temperate', water:-5, day:60, ...savedWorld }
        this.world.seed = hash.get('world') || this.world.seed || 'p'
        this.world.water = Number(this.world.water)
        this.world.day = Number(this.world.day)
        this.seed = this.world.seed
        this.domElement = document.querySelector('.game')
        this.debug = new Debug()
        this.state = new State()
        this.view = new View()
        
        window.addEventListener('resize', () =>
        {
            this.resize()
        })

        this.update()
    }

    update()
    {
        if(!document.hidden)
        {
            this.state.update()
            this.view.update()
        }

        window.requestAnimationFrame(() =>
        {
            this.update()
        })
    }

    resize()
    {
        this.state.resize()
        this.view.resize()
    }

    destroy()
    {
        
    }
}
