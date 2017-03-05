import Define from 'define-utility'
import { floor, min } from 'math-plus'

/******************************************************************************/
// Constants
/******************************************************************************/

const ONE_MB = 1048576 //bytes
const NUMBER_SIZE = 8 // bytes
const ALLOCATIONS_PER_MB = ONE_MB / (NUMBER_SIZE * NUM_CACHE_PROPS)

export const NUM_CACHE_PROPS = 6

export const TICK_INDEX = Symbol('tick-index')

export const TICK_INITIAL = Symbol('tick-initial')

export const TICK_END = Symbol('tick-end')

export const CACHE = Symbol('cache')

export default function Cache(maxMemory) {

  Define(this)

    .let('id', 0)
    .let('tick', 0)
    .let('allocations', 0)

    .get('maxTicks', () => {
      const maxAllocations = this.maxMemory * ALLOCATIONS_PER_MB
      const percentUsed = this.allocations / maxAllocations

      return floor(this.tick / percentUsed)
    })

    .const('maxMemory', maxMemory)

    .const('invalidateBefore', tick => {

      if (tick > this.tick || tick < 0)
        throw new Error(`${tick} is out of range 0 - ${this.tick}`)

      this.tick -= tick

      for (const id in this) {
        const body = this[id]

        let newInitial = body[TICK_INITIAL] - tick
        if (newInitial < 0) {

          const count = -newInitial * NUM_CACHE_PROPS
          body[CACHE].splice(0, count)
          newInitial = 0

        }

        body[TICK_INITIAL] = newInitial
      }
    })

    .const('invalidateAfter', tick => {

      if (tick > this.tick || tick < 0)
        throw new Error(`${tick} is out of range 0 - ${this.tick}`)

      this.tick = tick

      for (const id in this) {
        const body = this[id]

        const index = body[TICK_INDEX](tick + 1)
        if (index <= 0) {
          delete this[id]
          continue
        }

        const cache = body[CACHE]

        cache.length = min(index, cache.length)

      }
    })

    .const('read', tick => {

      const output = []

      //the only enumerable properties of
      //a cache object will be bodies

      for (const id in this) {
        const body = this[id]
        const data = body.read(tick, true)
        if (!data)
          continue

        output.push(body.id, ...data)
      }

      return output

    })

    .const('write', data => {

      this.tick++

      let i = 0
      const destroyed = data[i++]

      for (const id of destroyed)
        this[id][TICK_END] = this.tick

      while (i < data.length) {
        const id =   data[i++],
          mass =     data[i++],
          x =        data[i++],
          y =        data[i++],
          vx =       data[i++],
          vy =       data[i++],
          parentId = data[i++]

        this[id][CACHE].push(mass, x, y, vx, vy, parentId)
      }

    })

}
