import is from 'is-explicit'

/******************************************************************************/
// Helper
/******************************************************************************/

const createWorker = (() => {

  const isBrowser = typeof window === 'object'
  if (isBrowser) {

    // eslint-disable-next-line import/no-webpack-loader-syntax
    const WebWorker = require('worker-loader!./worker.js')

    return onTick => {
      const worker = new WebWorker()

      worker.onmessage = msg => onTick(msg.data)
      worker.end = ::worker.terminate
      worker.start = ::worker.postMessage

      return worker
    }

  } else {

    const { fork } = require('child_process')
    const path = require('path')

    const FORK_PATH = path.resolve(__dirname, 'worker.js')
    const FORK_MEMORY = { execArgv: ['--max-old-space-size=128'] }

    return onTick => {
      const child = fork(FORK_PATH, FORK_MEMORY)

      child.on('message', onTick)
      child.end = ::child.kill
      child.start = ::child.send

      return child
    }

  }
})()

/******************************************************************************/
// Helper
/******************************************************************************/

function validateProps (props) {

  if (!is.func(props.onTick))
    throw new Error('props.onTick must be a function')

  if (!is.number(props.g) || props.g <= 0)
    throw new Error('props.g must be above zero')

  if (props.realBodiesMin === null)
    props.realBodiesMin = Infinity // Infinity cant be saved to json

  if (!is.number(props.realBodiesMin) || props.realBodiesMin < 0)
    throw new Error('props.realBodiesMin must not be negative')

  if (!is.number(props.realMassThreshold) || props.realMassThreshold < 0)
    throw new Error('props.realMassThreshold must not be negative')

  if (!is.number(props.physicsSteps) || props.physicsSteps <= 0)
    throw new Error('props.physicsSteps must be above zero')
}

/******************************************************************************/
// Exports
/******************************************************************************/

class Integrator {

  constructor (props) {

    validateProps(props)

    const { onTick, ...init } = props

    this.onTick = onTick
    this.init = init
    this.worker = null
  }

  start (stream) {
    this.stop()

    if (!is.array(stream) || stream.length <= 1)
      return

    const { onTick, init } = this

    this.worker = createWorker(onTick)
    this.worker.start({ init, stream })
  }

  stop () {
    if (this.worker)
      this.worker.end()

    this.worker = null
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Integrator
