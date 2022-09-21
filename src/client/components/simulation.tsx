import React, { ReactElement, useEffect, useRef } from 'react'
import { Simulation as GravityToy } from '../../simulation'

/*** Canvas Component ***/

interface SimulationProps {
    setup: (toy: GravityToy, canvas: HTMLCanvasElement) => void
}

const Simulation = (props: SimulationProps): ReactElement => {
    const { setup, ...rest } = props

    const canvasRef = useGravityToy(setup)

    return <canvas
        ref={canvasRef}
        {...rest}
    />
}

/*** Hooks ***/

const useGravityToy = (withToy: SimulationProps['setup']) => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const toyRef = useRef<GravityToy | null>(null)

    useEffect(() => {
        if (toyRef.current || !canvasRef?.current)
            return

        const canvas = canvasRef.current
        const gravityToy = toyRef.current = {} as GravityToy // new GravityToy()

        withToy(gravityToy, canvas)

        return () => {
            gravityToy.stop()
        }
    }, [canvasRef, toyRef, withToy])



    return canvasRef
}

/*** Exports ***/

export default Simulation

export {
    Simulation,
    SimulationProps
}