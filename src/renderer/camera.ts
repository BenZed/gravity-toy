import { V2, clamp, lerp, v2 } from '@benzed/math'

import { TICK_DURATION } from '../simulation/constants'

import { Body } from '../simulation/body'
import Renderer from './renderer'
import { Simulation } from '../simulation'

/*** Helper ***/

function canvasCenter(canvas: HTMLCanvasElement): V2 {
    const { width, height } = canvas

    return v2(width, height).mult(0.5)
}

/*** Coords ***/

class Coords {

    public pos = v2(960, 540)

    public constructor (public camera: Camera) { }

    private _zoom = 1
    public get zoom() {
        return this._zoom
    }
    public set zoom(value) {
        const { minZoom, maxZoom } = this.camera.renderer.options

        this._zoom = clamp(value, minZoom, maxZoom)
    }

    public get relPos(): V2 {
        const { referenceFrame } = this.camera

        const pos = this.pos.copy()
        if (referenceFrame?.exists)
            pos.add(referenceFrame.pos)

        return pos
    }
}

/*** Main ***/

class Camera {

    public renderer: Renderer
    public target: Coords = new Coords(this)
    public current: Coords = new Coords(this)

    private _ref: Body | null = null
    private _refLastPos = V2.ZERO

    get referenceFrame(): Body | null {
        return this._ref
    }

    public set referenceFrame(body: Body | null) {

        const prev = this._ref

        this._ref = body

        const { target, current } = this

        if (prev) {
            target.pos.add(this._refLastPos)
            current.pos.add(this._refLastPos)
        }

        if (body) {
            this._refLastPos = body.pos.copy()
            target.pos.sub(body.pos)
            current.pos.sub(body.pos)
        }

    }

    constructor (renderer: Renderer) {

        this.renderer = renderer

    }

    public worldToCanvas(point: V2, canvas = this.renderer.canvas) {
        return point
            .copy()
            .sub(this.current.relPos)
            .div(this.current.zoom)
            .add(canvasCenter(canvas))
    }

    public canvasToWorld(point: V2, canvas = this.renderer.canvas) {
        return point
            .copy()
            .sub(canvasCenter(canvas))
            .mult(this.current.zoom)
            .add(this.current.relPos)
    }

    public update = (sim: Simulation): void => {

        const { target, current, renderer } = this
        const { speed } = renderer

        const delta = TICK_DURATION * speed

        while (this.referenceFrame && !this.referenceFrame.exists)
            this.referenceFrame = sim.body(this.referenceFrame.mergeId)

        if (this.referenceFrame)
            this._refLastPos.set(this.referenceFrame.pos)

        current.zoom = lerp(current.zoom, target.zoom, delta)
        current.pos.lerp(target.pos, delta)
    }

}


/*** Exports ***/

export default Camera

export {
    Camera
}