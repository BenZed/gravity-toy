import is from '@benzed/is'
import { PhysicsSettings } from '../constants'
import { FromWorkerData, ToWorkerData } from './worker'

/* eslint-disable @typescript-eslint/no-var-requires */
// Helper

interface Worker {

    start(data: ToWorkerData): void

    end(): void

}

const createWorker = (() => {

    const isBrowser = typeof window === 'object'
    if (isBrowser) {

        const { default: WebWorker } = require('worker-loader!./worker.ts')

        return (onTick: (data: FromWorkerData) => void) => {

            const webWorker = new WebWorker()

            webWorker.onmessage = (msg: { data: FromWorkerData }) => onTick(msg.data)
            webWorker.end = webWorker.terminate.bind(webWorker)
            webWorker.start = webWorker.postMessage.bind(webWorker)

            const worker: Worker = {
                start: webWorker.postMessage.bind(webWorker),
                end: webWorker.terminate.bind(webWorker)
            }

            return worker
        }

    } else {

        const { fork } = require('child_process')

        const FORK_PATH = 'lib/integrator/worker.js'
        const FORK_MEMORY = { execArgv: ['--max-old-space-size=128'] }

        return (onTick: (data: FromWorkerData) => void) => {
            const child = fork(FORK_PATH, FORK_MEMORY)

            child.on('message', onTick)

            const worker: Worker = {
                start: child.send.bind(child),
                end: child.kill.bind(child)
            }

            return worker
        }
    }
})()

// Helper

function validateIntegratorSettings(input: unknown): IntegratorSettings {

    if (!is.plainObject(input))
        throw new Error('integrator settings must be an object')

    const settings = input as unknown as IntegratorSettings

    if (!is.function(settings.onTick))
        throw new Error('settings.onTick must be a function')

    if (!is.number(settings.g) || settings.g <= 0)
        throw new Error('settings.g must be above zero')

    if (settings.realBodiesMin === null)
        settings.realBodiesMin = Infinity // Infinity cant be saved to json

    if (!is.number(settings.realBodiesMin) || settings.realBodiesMin < 0)
        throw new Error('settings.realBodiesMin must not be negative')

    if (!is.number(settings.realMassThreshold) || settings.realMassThreshold < 0)
        throw new Error('settings.realMassThreshold must not be negative')

    if (!is.number(settings.physicsSteps) || settings.physicsSteps <= 0)
        throw new Error('settings.physicsSteps must be above zero')

    return settings
}

interface IntegratorSettings extends PhysicsSettings {

    onTick: (data: FromWorkerData) => void

}

/*** Exports ***/

class Integrator {

    public readonly onTick: (data: FromWorkerData) => void
    public readonly physics: PhysicsSettings

    public worker: Worker | null = null

    constructor (props: IntegratorSettings) {

        validateIntegratorSettings(props)

        const { onTick, ...physics } = props

        this.onTick = onTick
        this.physics = physics
    }

    public start(data: number[]) {

        this.stop()

        if (!is.array(data) || data.length <= 1)
            return

        const { onTick, physics } = this

        const worker = this.worker = createWorker(onTick)

        worker.start({ physics, data })
    }

    public stop() {
        if (this.worker)
            this.worker.end()

        this.worker = null
    }

}

/*** Exports ***/

export default Integrator