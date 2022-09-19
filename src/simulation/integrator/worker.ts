import { DEFAULT_PHYSICS, NO_LINK, Physics } from '../constants'
import { V2 as Vector } from '@benzed/math'

import Body from './body'
import BodyManager from './body-manager'

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

/*** Types ***/

interface StreamData {

    nextAssignId: number
    destroyed: { mergeId: number, id: number }[]
    created: number[]
    stream: number[]
}


/*** Helper ***/

const destroyedIds = (body: Body): StreamData['destroyed'][number] => ({
    id: body.id,
    mergeId: (body.merge as Body).id
})

const idOfBody = (body: Body) => body.id

/*** Worker ***/

const isWebWorker = typeof self === 'object'
const isNodeFork = !isWebWorker && typeof process === 'object' && 'send' in process

if (isWebWorker)
    self.onmessage = msg => receiveStream(msg.data)

else if (isNodeFork)
    process.on('message', receiveStream)

const sendToParent = isWebWorker
    ? self.postMessage.bind(self)
    : isNodeFork
        ? process.send?.bind(process)
        : null


/*** Data ***/

const NEXT_TICK_DELAY = 0

const physics: Physics = {
    ...DEFAULT_PHYSICS
}

const bodies = new BodyManager()

/*** I/O ***/

function receiveStream(data: { physics: Physics, stream: number[] }) {

    for (const key in data.physics) {
        const k = key as keyof Physics
        physics[k] = data.physics[k]
    }

    const created = []

    let i = 0

    bodies.nextAssignId = data.stream[i++] // First item in stream is last assigned id

    while (i < data.stream.length) {
        const id = data.stream[i++]
        const mass = data.stream[i++]
        const posX = data.stream[i++]
        const posY = data.stream[i++]
        const velX = data.stream[i++]
        const velY = data.stream[i++]

        const pos = new Vector(posX, posY)
        const vel = new Vector(velX, velY)

        created.push(new Body(id, mass, pos, vel))
    }

    if (created.length > 0) {
        bodies.setBodies(created, physics)
        tick()
    }
}

function sendStream() {

    if (++bodies.sendInterval < physics.physicsSteps)
        return

    bodies.sendInterval = 0

    if (!sendToParent)
        return

    const { living, destroyed, created, nextAssignId } = bodies

    const data: StreamData = {
        nextAssignId,
        destroyed: [...destroyed.map(destroyedIds)],
        created: [...created.map(idOfBody)],
        stream: []
    }

    destroyed.length = 0
    created.length = 0

    for (const body of living)
        data.stream.push(
            body.id,
            body.mass,
            body.pos.x, body.pos.y,
            body.vel.x, body.vel.y,
            body.link ? body.link.id : NO_LINK
        )

    sendToParent(data)
}

/*** Tick ***/

function tick(queueNextTick = true) {

    // broad phase
    bodies.updateOverlaps()

    // narrow phase
    bodies.checkCollisions(physics)

    bodies.calculateForces(physics)
    bodies.applyForces(physics)

    sendStream()

    if (queueNextTick)
        setTimeout(tick, NEXT_TICK_DELAY)

}


/*** Exports ***/

export { physics, bodies, tick }

export {
    StreamData
}