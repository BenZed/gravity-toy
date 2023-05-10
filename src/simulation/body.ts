import { V2, V2Json } from '@benzed/math'

import { closestPointOnLine, radiusFromMass, bySpeed } from './util'
import { RELATIVE_VELOCITY_EPSILON } from './constants'

//// Types ////

interface BodyData {
    readonly pos: V2Json
    readonly vel: V2Json
    mass: number
}

interface BodyDataWithId extends BodyData {
    readonly id: number
}

//// Helper Classes ////

class BodyEdge {
    value = 0

    constructor(
        readonly body: Body,
        readonly axis: 'x' | 'y',
        readonly isMin: boolean
    ) {
        this.value = isMin ? -Infinity : Infinity
    }

    valueOf() {
        return this.value
    }
}

//// Main ////

class Body implements BodyDataWithId, Iterable<BodyEdge> {
    // BodyJSON implementation

    readonly id: number

    readonly pos: V2
    readonly vel: V2
    mass: number

    // Physics

    pseudoMass = 0

    readonly force: V2 = V2.ZERO

    readonly left: BodyEdge
    readonly right: BodyEdge
    readonly top: BodyEdge
    readonly bottom: BodyEdge

    get radius() {
        return radiusFromMass(this)
    }

    constructor(input: BodyDataWithId) {
        this.id = input.id
        this.pos = V2.from(input.pos)
        this.vel = V2.from(input.vel)
        this.mass = input.mass

        this.left = new BodyEdge(this, 'x', true)
        this.right = new BodyEdge(this, 'x', false)
        this.top = new BodyEdge(this, 'y', true)
        this.bottom = new BodyEdge(this, 'y', false)
    }

    //// Interface ////

    isOverlapping(other: Body) {
        if (this.left > other.right || other.left > this.right) return false

        if (this.top > other.bottom || other.top > this.bottom) return false

        return true
    }

    isColliding(other: Body) {
        const [fast, slow] = [this, other].sort(bySpeed)

        const relativeVel = fast.vel.copy().sub(slow.vel)

        let distance: number

        // Due to float point precision errors, we can't use the same linear algebra
        // to determine the position of moving circles if their velocities are very
        // close because we'll get false positives.

        if (relativeVel.sqrMagnitude >= RELATIVE_VELOCITY_EPSILON) {
            const closest = closestPointOnLine(
                fast.pos.copy().sub(relativeVel),
                fast.pos,
                slow.pos
            )
            distance = closest.copy().sub(slow.pos).magnitude
        } else distance = fast.pos.copy().sub(slow.pos).magnitude

        return distance < fast.radius + slow.radius
    }

    updateBounds() {
        for (const edge of this) {
            const vel = this.vel[edge.axis]
            const pos = this.pos[edge.axis]

            const radius = edge.isMin ? -this.radius : this.radius
            const shift =
                (edge.isMin && vel > 0) || (!edge.isMin && vel < 0) ? -vel : 0

            edge.value = pos + radius + shift
        }
    }

    //// Object Overloads ////

    /**
     * So it may be sorted by mass.
     */
    valueOf() {
        return this.mass
    }

    toJSON(): BodyDataWithId {
        return {
            id: this.id,
            pos: this.pos.toJSON(),
            vel: this.vel.toJSON(),
            mass: this.mass
        }
    }

    //// Iterable Implementation ////

    *[Symbol.iterator](): Generator<BodyEdge> {
        yield this.left
        yield this.right
        yield this.top
        yield this.bottom
    }
}

//// Exports ////

export { Body, BodyData, BodyDataWithId, BodyEdge }
