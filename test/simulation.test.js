import { assert, expect } from 'chai'
import Simulation from '../lib'
import { Vector } from 'math-plus'

/* global describe it before */

let sim

describe('Simulation', () => {

  before(() => { sim = new Simulation() })

  it('Must be instanced.', () => {

    expect(() => new Simulation()).to.not.throw(Error)
    expect(() => Simulation()).to.throw(Error)

  })

  it('Allows bodies to be added to the simulation through .createBodyAtTick', () => {

    const props = { mass: 1000 }

    const body = sim.createBodyAtTick(props)
    assert(body)

  })

  it('Can be started with .start', () => {

    expect(sim.start).to.not.throw(Error)
    sim.stop()

  })

  it('Detects collisions')
})
