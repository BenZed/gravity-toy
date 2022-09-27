import React, { ReactElement, useEffect, useRef } from 'react'

import { Renderer as GravityToyRenderer } from '../../renderer'
import { GravityToy } from '../../simulation'

/*** Canvas Component ***/

interface SimulationProps {
    setup: (toy: GravityToy, renderer: GravityToyRenderer) => void
}

const Simulation = (props: SimulationProps): ReactElement => {
    const { setup, ...rest } = props

    const canvasRef = useGravityToy(setup)

    return <canvas
        ref={canvasRef}
        {...rest}
    />
}

/*** Helper ***/

function startGravityToyRenderer(toy: GravityToy, renderer: GravityToyRenderer) {

    const render = () => {
        // Resize
        renderer.canvas.width = document.body.clientWidth
        renderer.canvas.height = document.body.clientHeight

        if (toy.lastTick > toy.currentTick)
            toy.tick++

        // Update
        renderer.render(toy)

        // Queue
        if (toy.isRunning)
            requestAnimationFrame(render)
    }
    requestAnimationFrame(render)

}

/*** Hooks ***/

const useGravityToy = (setupGravityToy: SimulationProps['setup']) => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const toyRef = useRef<GravityToy | null>(null)

    useEffect(() => {
        if (toyRef.current || !canvasRef?.current)
            return

        const canvas = canvasRef.current

        const toy = toyRef.current = new GravityToy()
        const renderer = new GravityToyRenderer({}, canvas)

        setupGravityToy(toy, renderer)
        toy.start()

        startGravityToyRenderer(toy, renderer)

        return () => {
            toy.stop()
        }
    }, [canvasRef, toyRef, setupGravityToy])


    return canvasRef
}

/*** Exports ***/

export default Simulation

export {
    Simulation,
    SimulationProps
}