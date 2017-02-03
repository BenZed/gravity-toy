import Define from 'define-utility'
import { fork } from 'child_process'
import path from 'path'
import is from 'is-explicit'

/******************************************************************************/
// Constants & Symbols
/******************************************************************************/

const PROCESS = Symbol('process')
const MESSAGE = Symbol('message')

//fork process does NOT need a lot of memory, as it doesn't hold the cache
const FORK_MEMORY = { execArgv: ['--max-old-space-size=64'] }
const FORK_PATH = path.join(__dirname, 'child-node.js')

/******************************************************************************/
// Exports
/******************************************************************************/

export default class ParentNodeIntegrator {

  constructor(g, delta) {

    Define(this)
      .const(PROCESS, fork(FORK_PATH, FORK_MEMORY))

    this[PROCESS].on('message', this[MESSAGE])

    this.send('initialize', { g, delta })
  }

  [MESSAGE] = ({name, ...data}) => {
    console.log('received', name, data)
  }

  send(name, data = {}) {

    if (!is(name, String))
      throw new Error('event argument must be a string.')

    if (!is(data, Object))
      throw new Error('data argument must be an object.')

    data.name = name

    this[PROCESS].send(data)

  }

  receive() {

  }

}
