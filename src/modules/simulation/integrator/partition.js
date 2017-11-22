import { Vector, max, min } from 'math-plus'

/******************************************************************************/
// Spatial Partition
/******************************************************************************/

// This class represents an area of space where bodies need to be checked
// for collision in the narrow phase

/******************************************************************************/
// Class
/******************************************************************************/

class Partition {

  bounds = {
    tl: null,
    br: null
  }

  bodies = []

  constructor (body) {
    this.bounds.tl = body.bounds.tl.copy()
    this.bounds.br = body.bounds.br.copy()
    this.bodies.push(body)
  }

  fits (body) {

    const { bounds } = this

    const overlap = boundsOverlap(body.bounds, bounds)
    if (overlap) {

      this.bodies.push(body)
      body.partition = this

      // 
      bounds.tl.x = min(bounds.tl.x, body.bounds.tl.x)
      bounds.tl.y = min(bounds.tl.y, body.bounds.tl.y)

      bounds.br.x = max(bounds.br.x, body.bounds.br.x)
      bounds.br.y = max(bounds.br.y, body.bounds.br.y)
    }

    return overlap
  }

}

/******************************************************************************/
// Helper
/******************************************************************************/

function boundsOverlap (b1, b2) {

  if (b1.tl.x > b2.br.x || b2.tl.x > b1.br.x)
    return false

  if (b1.tl.y < b2.br.y || b2.tl.y < b1.br.y)
    return false

  return true
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Partition

export { Partition }
