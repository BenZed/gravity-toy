import { BodyDataWithId } from './body'
import { DEFAULT_MAX_MB } from './constants'

import { Simulation, SimulationData } from './simulation'
import { SimulationPhysical } from './simulation-physical'

/* eslint-disable @typescript-eslint/no-var-requires */

//// Constants ////

const IS_NODE = typeof process === 'object'
const IS_BROWSER = !IS_NODE
const IS_CHILD = IS_NODE
    ? typeof process.send === 'function'
    : typeof self === 'object'

//// Override ////

/**
 * Forks the physics integration into a separate child process
 */
abstract class SimulationFork<B extends BodyDataWithId> extends Simulation<B> {
    private _childProcess: any = null

    public override get isRunning(): boolean {
        return !!this._childProcess
    }

    // Override

    public override run() {
        if (this.isRunning) this.stop()

        if (IS_BROWSER) {
            const { default: WebWorker } = require('worker-loader!' +
                __filename)

            this._childProcess = new WebWorker()
            this._childProcess.onmessage = (
                msg: MessageEvent<SimulationData['bodies']>
            ) => this._update(msg.data)
            this._childProcess.postMessage(this.toJSON())
        }

        if (IS_NODE) {
            const { fork } = require('child_process')

            const FORK_PATH = __filename
                .replace('/src/', '/lib/')
                .replace(/\.ts$/, '.js')

            const FORK_MEMORY = {
                execArgv: [`--max-old-space-size=${DEFAULT_MAX_MB}`]
            }

            this._childProcess = fork(FORK_PATH, FORK_MEMORY)
            this._childProcess.on(
                'message',
                (bodies: SimulationData['bodies']) => this._update(bodies)
            )
            this._childProcess.send(this.toJSON())
        }

        return this
    }

    public override stop(): void {
        if (IS_BROWSER) this._childProcess?.terminate()

        if (IS_NODE) this._childProcess?.kill()

        this._childProcess = null
    }
}

//// Execute ////

if (IS_CHILD) {
    const runSimulation = (
        input: SimulationData,
        onTick: (output: SimulationData['bodies']) => void
    ) => {
        const simulation = new SimulationPhysical(input)
        simulation.on('tick', onTick)
        simulation.run()
    }

    if (IS_BROWSER)
        self.onmessage = ({ data: input }: MessageEvent<SimulationData>) =>
            runSimulation(input, output => self.postMessage(output))

    if (IS_NODE)
        process.on('message', input =>
            runSimulation(input, output => process.send?.(output))
        )
}

//// Exports ////

export { SimulationFork }
