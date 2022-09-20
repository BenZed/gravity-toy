import { clearCanvas, drawBodies } from './drawing'
import { Simulation } from '../simulation'
import Camera from './camera'

/*** Options ***/

export const DEFAULT_RENDERING_OPTIONS: RendererOptions = {

    bodyColorBy: 'doppler', // or 'mass'

    minZoom: 1,
    maxZoom: 100000,

    grid: true,
    relations: false,

    // length of trail showing where body has been, in ticks.
    // 0 - off
    // positive values for future trails, negative values for past trails
    trailLength: -200,
    trailStep: 3,
    trailColor: '#c96af2',

    // Color of detail elements, such as grids, relations, reference circle
    detailsColor: 'rgba(81, 214, 83, 0.5)',
    detailsDash: [3, 3],
    detailsPad: 3 // pixels

}

/*** Types ***/

interface RendererOptions {

    readonly bodyColorBy: 'doppler' | 'mass'

    readonly minZoom: number,
    readonly maxZoom: number

    readonly grid: boolean,
    readonly relations: boolean,

    // length of trail showing where body has been, in ticks.
    // 0 - off
    // positive values for future trails, negative values for past trails
    readonly trailLength: number,
    readonly trailStep: number,
    readonly trailColor: `#${string}` | `rgb(${number},${number},${number})` | `rgba(${number},${number},${number},${number})`

    // Color of detail elements, such as grids, relations, reference circle
    readonly detailsColor: `#${string}` | `rgb(${number},${number},${number})` | `rgba(${number},${number},${number},${number})`
    readonly detailsDash: number[],
    readonly detailsPad: number

}

/*** Main ***/

class Renderer {

    public readonly options: RendererOptions
    public readonly canvas: HTMLCanvasElement
    public readonly camera: Camera

    public speed = 1

    constructor (options: Partial<RendererOptions>, canvas: HTMLCanvasElement) {

        this.canvas = canvas
        this.options = {
            ...DEFAULT_RENDERING_OPTIONS,
            ...options
        }

        this.camera = new Camera(this)

    }

    public render(simulation: Simulation): void {

        const ctx = this.canvas.getContext('2d')
        if (!ctx)
            throw new Error('Need canvas rendering context')
        this.camera.update(simulation)

        clearCanvas(ctx, this)
        drawBodies(ctx, this, simulation)
    }

}

/*** Exports ***/

export default Renderer

export {
    Renderer,
    RendererOptions
}