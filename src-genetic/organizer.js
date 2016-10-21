import runner from './runner'
import Queue from 'promise-queue'

export const ParamRanges = {
  radius: [100,2000],
  mass: [100,20000],
  vel: [-20, 20],
  bodies: [100,3000],
  centerDensity: [0,1],
  massFuzzy: [0,2],
  velFuzzy: [-2, 2]
}

function generateParams() {

  const params = {}

  for (const i in ParamRanges)
    params[i] = randomRange(...ParamRanges[i])

  const massRangeLo = ParamRanges.mass[0]
  const massLo = Math.max(randomRange(massRangeLo, params.mass) * 0.1, massRangeLo)
  params.mass = [massLo, params.mass]
  params.generation = 1
  params.iteration = iteration++

  return params
}

function randomRange(lo, hi) {
  return (hi - lo) * Math.random() + lo
}

const queue = new Queue(1, Infinity)

let generation = 1
let iteration = 0
let initial_sims = 1000

while(initial_sims) {
  queue.add(() => {
    return runner(generateParams())
    .then(res => console.log(res.score))
    .catch(err => console.error(err))
  })
  initial_sims --
}
