import { radiusFromMass } from '../util'
import { V2 as V2 } from '@benzed/math'

/*** Types ***/

class Edge {

    public value = 0

    public body: Body
    public isX: boolean
    public isMin: boolean

    constructor (body: Body, isX: boolean, isMin: boolean) {
        this.body = body
        this.isX = isX
        this.isMin = isMin
        this.value = isMin ? -Infinity : Infinity
    }

    public refresh() {
        const { body, isX, isMin } = this

        const vel = isX ? body.vel.x : body.vel.y
        const axis = isX ? body.pos.x : body.pos.y

        const radius = isMin ? -body.radius : body.radius
        const shift = (isMin && vel > 0) || (!isMin && vel < 0) ? -vel : 0

        this.value = axis + radius + shift
    }

    public valueOf() {
        return this.value
    }
}

class Bounds {

    public body: Body
    public l: Edge
    public r: Edge
    public t: Edge
    public b: Edge

    constructor (body: Body) {
        this.body = body
        this.l = new Edge(body, true, true)
        this.r = new Edge(body, true, false)
        this.t = new Edge(body, false, true)
        this.b = new Edge(body, false, false)
    }

    public overlap(other: Bounds) {

        if (this.l > other.r || other.l > this.r)
            return false

        if (this.t > other.b || other.t > this.b)
            return false

        return true
    }

    public toString() {
        return `{ left: ${this.l.value}, right: ${this.r.value}, top: ${this.t.value}, bottom: ${this.b.value} }`
    }

    public refresh() {
        this.l.refresh()
        this.r.refresh()
        this.t.refresh()
        this.b.refresh()
    }

}

/*** Body ***/

class Body {

    public mass = 0
    public massFromPsuedoBodies = 0
    public real = true

    public link: Body | null = null
    public merge: Body | null = null
    public bounds: Bounds

    public pos = V2.ZERO
    public vel = V2.ZERO
    public force = V2.ZERO

    public id: number
    public radius: number

    constructor (id: number, mass: number, pos: V2, vel: V2) {

        this.id = id
        this.mass = mass
        this.pos = pos
        this.vel = vel

        this.radius = radiusFromMass(mass)
        this.bounds = new Bounds(this)
    }

    public valueOf() {
        return this.mass
    }

}

/*** Exports ***/

export default Body

export {
    Body,
    Edge,
    Bounds
}