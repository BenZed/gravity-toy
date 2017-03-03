import is from 'is-explicit'
import path from 'path'

/******************************************************************************/
// Setup
/******************************************************************************/

const isBrowser = typeof window === 'object'

const createWorker = isBrowser

  ? () => {
    if (typeof Worker !== 'function')
      throw new Error('WebWorker not supported on this Browser.')

    return new Worker('worker.js')
  }

  : do {
    const { fork } = require('child_process')
    const FORK_PATH = path.resolve(__dirname, 'worker.js')
    const FORK_MEMORY = { execArgv: ['--max-old-space-size=128'] };

    () => fork(FORK_PATH, FORK_MEMORY)
  }

const SEND = isBrowser ? 'postMessage' : 'send'

/******************************************************************************/
// Exports
/******************************************************************************/

export default function Integrator(sendBodies) {

  if (!is(sendBodies, Function))
    throw new Error('Integrator requires a function as an argument.')

  const worker = createWorker()
  worker.on('message', sendBodies)

  return (name, data = {}) => {

    if (!is(name, String))
      throw new Error('event argument must be a string.')

    if (!is(data, Object))
      throw new Error('data argument must be an object.')

    data.name = name

    worker[SEND](data)

  }

}
