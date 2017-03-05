import is from 'is-explicit'
import path from 'path'

/******************************************************************************/
// Setup
/******************************************************************************/

const isBrowser = typeof window === 'object'

const createWorker = isBrowser

  ? do {
    const IntegrationWorker = require('worker-loader!./worker.js');

    () => {
      if (typeof Worker !== 'function')
        throw new Error('WebWorker not supported on this Browser.')

      return new IntegrationWorker()
    }
  }

  : do {
    const { fork } = require('child_process')
    const FORK_PATH = path.resolve(__dirname, 'worker.js')
    const FORK_MEMORY = { execArgv: ['--max-old-space-size=128'] };

    () => fork(FORK_PATH, FORK_MEMORY)
  }

/******************************************************************************/
// Exports
/******************************************************************************/

export default function Integrator(writeFunc) {

  if (!is(writeFunc, Function))
    throw new Error('Integrator requires a function as an argument.')

  const worker = createWorker()

  if (isBrowser)
    worker.onmessage = msg => writeFunc(msg.data)
  else
    worker.on('message', writeFunc)

  return (name, data = []) => {

    if (!is(name, String))
      throw new Error('event argument must be a string.')

    if (!is(data, Array))
      throw new Error('data argument must be an array.')

    if (isBrowser)
      worker.postMessage([name, data])
    else
      worker.send({ name, data })

  }

}
