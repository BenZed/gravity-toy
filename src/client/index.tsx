import 'normalize.css'
import './assets/gravity-toy.css'

/*** Chunk Loaded Dependencies ***/

const dependencies = [
    import('react'),
    import('react-dom/client'),
    import('./components/simulation'),
    import('./setup-gravity-toy')
] as const

const mainTag = document.getElementById('gravity-toy')

/*** Main ***/

Promise.all(dependencies).then(([
    { default: React },
    { createRoot },
    { Simulation },
    { setupGravityToy }
]) => {

    if (!mainTag)
        throw new Error('No <main id="gravity-toy"/> tag.')

    createRoot(mainTag).render(<Simulation setup={setupGravityToy} />)
})
