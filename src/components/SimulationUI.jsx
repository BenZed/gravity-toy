import React from 'react'

import { Simulation, SimulationCanvasDraw, Vector } from '../modules/simulation'
import { clamp } from '../modules/simulation/helper'

import Mousetrap from 'mousetrap'

import Timeline from './Timeline'

const Speeds = [-1000, -500, -200, -100, -70, -30, -10, -4, -2, -1, 1, 2, 4, 10, 30, 70, 100, 200, 500, 1000]

export default class SimulationUI extends React.Component {

  static propTypes = {
    simulation: React.PropTypes.instanceOf(Simulation).isRequired,
    id: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired
  }

  static defaultProps = {
    get simulation() { return new Simulation() },
    id: 'simulation-ui',
    title: 'Simulation UI'
  }

  state = {
    //bodies: [],
    cached: 0,
    cachedMax: 100,
    playhead: 0

  }

  receiveSimulationData = () => {
    this.setState({
      cached: this.props.simulation.cachedTicks,
      cachedMax: this.props.simulation.maxCacheTicks,
      secondsMax: this.props.simulation.maxCacheSeconds,
      playhead: this.draw.tick
    })
  }

  onWindowResize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  setPlayhead = e => {

    const x = e.clientX - e.currentTarget.offsetLeft
    const xMax = e.currentTarget.offsetWidth

    const simulation = this.props.simulation

    const targetTick = Math.min(x / xMax * simulation.maxCacheTicks, simulation.cachedTicks - 1)

    this.draw.tick = Math.floor(targetTick)
  }

  setSpeed = e => {

    const delta = e.code === 'ArrowRight' ? 1 : -1
    const newIndex = clamp(Speeds.indexOf(this.draw.tickDelta) + delta, 0, Speeds.length - 1)

    this.draw.tickDelta = Speeds[newIndex]

  }

  handleCameraMove = e => {
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    if (e.shiftKey) {
      const scale = Math.min(this.draw.camera.target.scale, 50)
      const zoomSpeed = scale * 0.001
      const sign = delta.y > 0 ? 1 : -1

      this.draw.camera.target.scale += delta.magnitude * zoomSpeed * sign

    } else {

      const translateSpeed = this.draw.camera.target.scale * 0.2
      delta.imult(translateSpeed)

      this.draw.camera.target.pos.iadd(delta)
    }
  }

  componentDidMount() {

    this.createEventHandlers()
    this.createCanvasDraw()
    this.createKeyboardShortcuts()
    this.createTestBodies()

    this.props.simulation.start()

  }

  createEventHandlers() {
    onresize = this.onWindowResize
    onresize()

    const { simulation } = this.props

    simulation.on('interval-complete', this.receiveSimulationData)

    //for testing purposes, we're going to make the largest body the focusBody
    //and we're going to remove any object too far away from the largest body
    //this will only happen on the latest cached frame for now,
    simulation.on('interval-complete', () => {
      const MAX_DISTANCE_SQR = 100000 * 100000
      let largest = null

      simulation.forEachBody(body => {
        if (!body.exists)
          return

        if (largest === null || body.mass > largest.mass)
          largest = body

      })

      // if (this.draw.camera.focusBody != largest)
      //   this.draw.camera.focusBody = largest

      simulation.forEachBody(body => {
        if (body === largest || !body.exists)
          return

        if (body.exists && body.pos.sub(largest.pos).sqrMagnitude > MAX_DISTANCE_SQR)
          body.mass = Math.floor(body.mass * 0.99)
      })

    })

  }

  createCanvasDraw() {
    this.draw = new SimulationCanvasDraw(this.props.simulation, this.canvas)
  }

  createKeyboardShortcuts() {
    Mousetrap.bind(['left', 'right'], this.setSpeed)
  }

  createTestBodies() {
    const simulation = this.props.simulation

    const center = new Vector(innerWidth, innerHeight).mult(0.5)

    const randVec = (maxR = 1, minR = 0) => {
      const angle = Math.random() * 2 * Math.PI
      let radius
      do {

        radius = minR + Math.random() * maxR

      } while (radius > maxR)

      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)

      return new Vector(x,y)
    }

    const maxRadius = 500
    const maxMass = 5000
    const minMass = 100
    const slopMass = 50
    const maxVel = 6

    for (let i = 0; i <1000; i++) {
      const pos = randVec(maxRadius, maxRadius * Math.random() * 0.2).iadd(center)

      const edgeFactor = pos.sub(center).magnitude / maxRadius

      const massMult = maxMass * (1 - edgeFactor)
      const mass = minMass + Math.random() * (massMult - minMass) + Math.random() * slopMass

      const speed = maxVel * edgeFactor
      const vel = pos.sub(center).normalized().perpendicular(speed).add(randVec(1))

      simulation.createBodyAtTick( this.draw.tick, mass, pos, vel)
    }

  // const ctx = this.draw.context
  //
  // const circle = (x,y,r, style='white') => {
  //   ctx.fillStyle = style
  //   ctx.moveTo(center.x, center.y)
  //   ctx.beginPath()
  //   ctx.arc(x,y,r,0,2*Math.PI)
  //   ctx.fill()
  // }
  //
  // const draw = (body, style = 'white') => {
  //   circle(body.pos.x, body.pos.y, body.radius, style)
  // }

  //   this.draw.camera.target.scale = 1
  //
  //   const body = simulation.createBodyAtTick(this.draw.tick, 10000, center, new Vector(50, 20))
  //   const otherBody = simulation.createBodyAtTick(this.draw.tick, 100, center.add(new Vector(60,-54)))
  //
  // //  draw(body)
  //   draw(otherBody, 'green')
  //
  //   const vcf = body.vel.magnitude / body.collisionRadius
  //   const collisionPoints = [body.pos]
  //
  //   //Fill the positions if necessary
  //   if (vcf > 1) {
  //
  //     //The COLLISION_POINT_VECTOR_FACTOR reduces the number of points
  //     //we need to create by reducing the amount they overlap
  //     const length = vcf * 0.7
  //     const inc = body.vel.div(length)
  //     const pos = body.pos.copy()
  //
  //     while (collisionPoints.length < length)
  //       collisionPoints.push(pos.iadd(inc).copy())
  //
  //   }
  //
  //   console.log('points', collisionPoints.length)
  //
  //   const relative = Vector.zero
  //   const sqrCollisionRadius = body.collisionRadius ** 2
  //   let frame = null
  //
  //   for (let i = 0; i < collisionPoints.length; i++) {
  //     frame = collisionPoints[i]
  //     relative.x = otherBody.pos.x - frame.x
  //     relative.y = otherBody.pos.y - frame.y
  //
  //     const distSqr = relative.sqrMagnitude
  //
  //     circle(frame.x, frame.y, body.collisionRadius, i == 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,0,0,0.5)')
  //
  //     if (sqrCollisionRadius + otherBody.collisionRadius ** 2 > distSqr) {
  //     // if (body.collisionRadius + otherBody.collisionRadius > Math.sqrt(distSqr)) {
  //       console.log('collision!', i)
  //       break
  //     }
  //
  //   }
  //   circle(body.pos.x + body.vel.x, body.pos.y + body.vel.y, body.radius, 'rgba(255,255,255,0.5)')

  }

  render() {

    const { id, title, ...other } = this.props
    const { cached, cachedMax, secondsMax, playhead } = this.state

    delete other.simulation

    return <div id={id} {...other}>
      <Timeline cached={cached} cachedMax={cachedMax} secondsMax={secondsMax} onClick={this.setPlayhead} playhead={playhead}/>
      <h1>{title}</h1>
      <canvas ref={canvas => this.canvas = canvas} onWheel={this.handleCameraMove}/>
    </div>
  }

}
