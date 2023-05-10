import 'normalize.css'
import './assets/gravity-toy.css'

//// Chunk Loaded Dependencies ////

const dependencies = [import('react'), import('react-dom/client')] as const

//// Main ////

Promise.all(dependencies).then(
    ([{ default: React, StrictMode }, { createRoot }]) => {
        const mainTag = document.getElementById('gravity-toy')
        if (!mainTag) throw new Error('No <main id="gravity-toy"/> tag.')

        createRoot(mainTag).render(
            <StrictMode>
                <h1>Gravity Toy</h1>
            </StrictMode>
        )
    }
)
