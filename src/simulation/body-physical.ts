import { V2 } from '@benzed/math'

import { closestPointOnLine, radiusFromMass } from './util'
import { BodyJson } from './simulation'

/*** Constants ***/

const RELATIVE_VELOCITY_EPSILON = 1

const bySpeed = (a: BodyPhysical, b: BodyPhysical) => {

    const aSqrVel = a.vel.sqrMagnitude
    const bSqrVel = b.vel.sqrMagnitude

    return aSqrVel > bSqrVel
        ? -1
        : aSqrVel < bSqrVel
            ? 1
            : 0
}

/*** Helper ***/

class BodyPhysicalEdge {

    public value = 0

    constructor (
        public readonly body: BodyPhysical,
        public readonly axis: 'x' | 'y',
        public readonly isMin: boolean,

    ) {
        this.value = isMin
            ? -Infinity
            : Infinity
    }

    public valueOf() {
        return this.value
    }

}

/*** Main ***/

class BodyPhysical implements BodyJson {

    // BodyJSON implementation 

    readonly id: number

    public readonly pos: V2
    public readonly vel: V2
    public mass: number

    // Physics

    public psuedoMass = 0

    public readonly force: V2 = V2.ZERO

    public readonly left: BodyPhysicalEdge
    public readonly right: BodyPhysicalEdge
    public readonly top: BodyPhysicalEdge
    public readonly bottom: BodyPhysicalEdge


    public get radius() {
        return radiusFromMass(this)
    }

    public constructor (input: BodyJson) {

        this.id = input.id
        this.pos = V2.from(input.pos)
        this.vel = V2.from(input.vel)
        this.mass = input.mass

        this.left = new BodyPhysicalEdge(this, 'x', true)
        this.right = new BodyPhysicalEdge(this, 'x', false)
        this.top = new BodyPhysicalEdge(this, 'y', true)
        this.bottom = new BodyPhysicalEdge(this, 'y', false)
    }

    /*** Interface ***/

    public isOverlapping(other: BodyPhysical) {

        if (this.left > other.right || other.left > this.right)
            return false

        if (this.top > other.bottom || other.top > this.bottom)
            return false

        return true
    }

    public isColliding(other: BodyPhysical) {

        const [fast, slow] = [this, other].sort(bySpeed)

        const relativeVel = fast.vel.copy().sub(slow.vel)

        let distance: number

        // Due to float point precision errors, we can't use the same linear algebra
        // to determine the position of moving circles if their velocities are very
        // close because we'll get false positives.

        if (relativeVel.sqrMagnitude >= RELATIVE_VELOCITY_EPSILON) {
            const closest = closestPointOnLine(
                fast.pos.copy().sub(relativeVel),
                fast.pos, slow.pos
            )

            distance = closest.copy().sub(slow.pos).magnitude
        } else
            distance = fast.pos.copy().sub(slow.pos).magnitude

        return distance < fast.radius + slow.radius
    }

    public updateBounds() {

        for (const edge of this) {

            const vel = this.vel[edge.axis]
            const pos = this.pos[edge.axis]

            const radius = edge.isMin ? -this.radius : this.radius
            const shift = (edge.isMin && vel > 0 || !edge.isMin && vel < 0)
                ? -vel
                : 0

            edge.value = pos + radius + shift
        }
    }


    /*** Serialize ***/

    public toJSON(): BodyJson {
        return {
            id: this.id,
            pos: this.pos.toJSON(),
            vel: this.vel.toJSON(),
            mass: this.mass
        }
    }

    public *[Symbol.iterator](): Generator<BodyPhysicalEdge> {
        yield this.left
        yield this.right
        yield this.top
        yield this.bottom
    }

    /**
     * So it may be sorted by mass.
     */
    public valueOf() {
        return this.mass
    }
}

/*** Exports ***/

export default BodyPhysical

export {
    BodyPhysical,
    BodyPhysicalEdge,
}