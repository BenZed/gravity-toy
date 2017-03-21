import is from 'is-explicit'
import path from 'path'

/******************************************************************************/
// Setup
/******************************************************************************/

const isBrowser = typeof window === 'object'

const Worker = isBrowser

  ? do {
    const IntegrationWorker = require('worker-loader!./worker.js')

    write => {

      if (typeof Worker !== 'function')
        throw new Error('WebWorker not supported on this Browser.')

      const worker = new IntegrationWorker()
      worker.onmessage = msg => write(msg.data)
      worker.end = worker.terminate.bind(worker)
      worker.start = worker.postMessage.bind(worker)

      return worker
    }
  }

  : do {

    const { fork } = require('child_process')
    const FORK_PATH = path.resolve(__dirname, 'worker.js')
    const FORK_MEMORY = { execArgv: ['--max-old-space-size=128'] }

    write => {
      const child = fork(FORK_PATH, FORK_MEMORY)

      child.on('message', write)
      child.close = child.kill.bind(child)
      child.open = child.send.bind(child)

      return child
    }
  }

/******************************************************************************/
// Exports
/******************************************************************************/

export default function Integrator(write, ...init) {

  if (!is(write, Function))
    throw new Error('Integrator requires a function as an argument.')

  let worker = null

  return bodies => {

    if (!is(bodies, Array))
      throw new Error('bodies argument must be an array.')

    if (worker)
      worker.end()

    if (bodies.length === 0)
      return

    worker = new Worker(write)

    worker.start({ init, bodies })

  }

}
