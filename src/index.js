import './index.html'
import './styles/main.scss'

import React from 'react'
import { render } from 'react-dom'

import SimulationUI from './components/SimulationUI'
import Simulation from './modules/simulation'
import Vector from './modules/simulation/vector'
import colorLerp from 'color-interpolate'

import { generate } from './modules/generator'
import { randomRange, randomVec, orbitalVelocity } from './modules/simulation/helper'

function createPlanets(star, sim, [minRange, maxRange], [minMass, maxMass], [countLo, countHi]) {
  const { round, floor } = Math

  //rocky planets
  let planets = round(randomRange(countLo, countHi))
  while (planets) {
    planets--
    const pos = randomVec(maxRange, minRange)
    const planet = sim.createBody({
      mass: randomRange(minMass, maxMass),
      pos,
      vel: orbitalVelocity(pos, star, sim.g)
    })

    let moons = floor(randomRange(0, planet.mass / 1500))

    while (moons) {
      moons--
      const pos = planet.pos.add(randomVec(planet.radius * 20 * (Math.random() < 0.8 ? 1 : 5), planet.radius * 2))
      const props = {
        mass: randomRange(planet.mass * 0.001, planet.mass * 0.005),
        pos,
        vel: planet.vel.add(orbitalVelocity(pos, planet, sim.g))
      }

      if (props.mass < 5)
        continue

      sim.createBody(props)
    }
  }
}

onload = () => {

  const main = document.querySelector('main')

  const sim = new Simulation({
    g: 2,
    radiusBase: 0.5,
    radiusFactor: 0.5
  })

  let bodies = 1500

  while (bodies) {

    const prop = {
      mass: Math.random() > 0.975 ? randomRange(500,5000) : randomRange(50,500),
      pos: randomVec(2500),
      vel: randomVec(4)
    }

    sim.createBody(prop)
    bodies--

  }

  // const star = sim.createBody({
  //   mass: randomRange(400000, 800000) * (Math.random() > 0.9 ? 1 : 10),
  //   pos: Vector.zero,
  //   vel: Vector.zero
  // })
  //
  // const inner = randomRange(400,500), outer = inner + randomRange(800, 1000), end = 1500
  //
  //
  // //rocky
  // createPlanets(star, sim, [star.radius, inner], [250, 7000], [1,20])
  //
  // //icy
  // createPlanets(star, sim, [star.radius, end], [200, 10000], [1,10])
  //
  // //giant
  // createPlanets(star, sim, [outer, end], [10000, 100000],[1,5])
  //
  // const { round } = Math
  // let asteroids = round(randomRange(10, 100))
  // while (asteroids) {
  //   asteroids--
  //
  //   const pos = randomVec(outer - 250, inner + 250)
  //   const vel = orbitalVelocity(pos, star, sim.g)
  //   const prop = {
  //     mass: randomRange(5, 80),
  //     pos,
  //     vel: vel.iadd(randomVec(vel.magnitude * 0.05))
  //   }
  //
  //   sim.createBody(prop)
  // }

  render(<SimulationUI simulation={sim} title={null}/>, main)
}
