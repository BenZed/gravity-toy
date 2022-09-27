import { DEFAULT_MAX_MB } from './constants'

import { BodyJson, Simulation, SimulationJson } from './simulation'
import { SimulationPhysical } from './simulation-physical'

/* eslint-disable @typescript-eslint/no-var-requires */

/*** Constants ***/

const IS_NODE = typeof process === 'object'
const IS_BROWSER = !IS_NODE
const IS_PARENT = IS_NODE ? process.send === undefined : typeof self !== 'object'
const IS_CHILD = !IS_PARENT

/*** Override ***/

/**
 * Forks the physics integration into a seperate child process
 */
class SimulationFork extends Simulation<BodyJson> {

    private _childProcess: any = null

    public override get isRunning(): boolean {
        return !!this._childProcess
    }

    public override start() {

        if (this._childProcess)
            this.stop()

        if (IS_BROWSER) {

            const { default: WebWorker } = require('worker-loader!' + __filename)

            this._childProcess = new WebWorker()
            this._childProcess.onmessage = (msg: { data: SimulationJson['bodies'] }) => this._onChildProcess(msg.data)
            this._childProcess.postMessage(this.toJSON())
        }

        if (IS_NODE) {

            const { fork } = require('child_process')
            const FORK_PATH = __filename
                .replace('/src/', '/lib/')
                .replace(/\.ts$/, '.js')
            const FORK_MEMORY = { execArgv: [`--max-old-space-size=${DEFAULT_MAX_MB}`] }

            this._childProcess = fork(FORK_PATH, FORK_MEMORY)
            this._childProcess.on('message', (bodies: SimulationJson['bodies']) => this._onChildProcess(bodies))
            this._childProcess.send(this.toJSON())
        }

        return this
    }

    public override stop(): void {

        if (IS_BROWSER)
            this._childProcess?.terminate()

        if (IS_NODE)
            this._childProcess?.kill()

        this._childProcess = null
    }

    protected _onChildProcess(state: SimulationJson['bodies']): void {
        this._applyBodyJson(state)
    }

    protected _createBody(json: BodyJson): BodyJson {
        return json
    }

}

/*** Execute ***/

if (IS_CHILD) {

    /**
     * This class only ever exists on a forked process. 
     */
    class SimulationChildProcess extends SimulationPhysical {

        protected override _update() {
            super._update()

            if (IS_BROWSER)
                self.postMessage(this.bodies)

            if (IS_NODE)
                process.send?.(this.bodies)
        }

    }

    if (IS_BROWSER)
        self.onmessage = ({ data }: MessageEvent<SimulationJson>) =>
            new SimulationChildProcess(data).start()

    if (IS_NODE)
        process.on('message', (data: SimulationJson) =>
            new SimulationChildProcess(data).start()
        )

}

/*** Exports ***/

export default SimulationFork

export {
    SimulationFork
}
