import Game from '@/Game.js'

let game
try { game = new Game() }
catch(error)
{
    console.error(error)
    const fallback=document.createElement('main');fallback.className='webgl-fallback';fallback.innerHTML='<strong>This world could not start</strong><p>Pixel World needs WebGL and hardware acceleration. Update your browser or enable graphics acceleration, then try again.</p><button>Try again</button>';fallback.querySelector('button').onclick=()=>location.reload();document.body.append(fallback)
}

if(game?.view)
    document.querySelector('.game').append(game.view.renderer.instance.domElement)

if('serviceWorker' in navigator && import.meta.env.PROD)
{
    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then((registration) =>
    {
        registration.update()
        registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)game?.view?.experience?.toast('Refresh when ready for the latest version','Update available')})})
    }).catch(()=>game?.view?.experience?.toast('Offline mode could not be prepared','Application'))
    navigator.serviceWorker.addEventListener('controllerchange', () =>
    {
        if(sessionStorage.getItem('pixel-world-worker-refresh') !== 'true')
        {
            sessionStorage.setItem('pixel-world-worker-refresh', 'true')
            location.reload()
        }
    })
}

const connection=document.createElement('div');connection.className='connection-status';connection.setAttribute('role','status');document.querySelector('.game')?.append(connection)
const updateConnection=()=>{connection.textContent=navigator.onLine?'Back online':'Offline · Your current world remains available';connection.classList.toggle('is-visible',!navigator.onLine);if(navigator.onLine){connection.classList.add('is-visible');setTimeout(()=>connection.classList.remove('is-visible'),1800)}}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);if(!navigator.onLine)updateConnection()
let installPrompt
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;const button=document.createElement('button');button.className='install-app';button.textContent='Install Pixel World';button.onclick=async()=>{await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')button.remove();else game?.view?.experience?.toast('You can install later from your browser menu','Install')};setTimeout(()=>document.querySelector('.game')?.append(button),30000)})
