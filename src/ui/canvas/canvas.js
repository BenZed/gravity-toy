import React, { useRef, useEffect } from 'react'

import styled from 'styled-components'
import { $ } from '../theme'

import { on, off } from '@benzed/react'
import { Vector } from '@benzed/math'
import { ensure, remove } from '@benzed/array'

/******************************************************************************/
// Helper
/******************************************************************************/

function resize () {

  const canvas = this

  // setting a canvas dimension clears its content, even if it's the same value.
  // so we check that it's necessary first
  if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
    canvas.width = innerWidth
    canvas.height = innerHeight
  }

}

function onMouseDown (e) {

}

// TODO Temp change reference frame
function onMouseUp (e) {

  const gravity = this
  const { clientX, clientY } = e

  const canvasPoint = new Vector(clientX, clientY)

  const { camera } = gravity.renderer

  const CLICK_RADIUS = 15
  for (const body of gravity.simulation.livingBodies()) {
    if (body === camera.referenceFrame)
      continue

    const bodyCanvasPoint = camera.worldToCanvas(body.pos)
    const distance = canvasPoint.sub(bodyCanvasPoint).magnitude
    if (distance < body.radius + CLICK_RADIUS) {
      camera.referenceFrame = body
      break
    }
  }
}

const useMouseAction = gravity => {

  useEffect(() => {

    const down = gravity::onMouseDown
    const up = gravity::onMouseUp

    window::on('mousedown', down)
    window::on('mouseup', up)

    return () => {
      window::off('mousedown', down)
      window::off('mouseup', up)
    }

  }, [])

}

/******************************************************************************/
// Hooks
/******************************************************************************/

const useCanvas = gravity => {

  const canvasRef = useRef()

  useEffect(() => {

    const canvas = canvasRef.current

    const resizeCanvas = canvas::resize
    resizeCanvas()

    window::on('resize', resizeCanvas)
    window::on('deviceorientation', resizeCanvas)

    gravity.renderer.canvas = canvas
    gravity.start()

    return () => {
      window::off('resize', resizeCanvas)
      window::off('deviceorientation', resizeCanvas)
    }

  }, [])

  return canvasRef

}

/******************************************************************************/
// Main
/******************************************************************************/

const Canvas = styled(props => {

  const { gravity, ...rest } = props

  const canvasRef = useCanvas(gravity)
  useMouseAction(gravity)

  return <canvas
    ref={canvasRef}
    onMouseDown={gravity::onMouseDown}
    onMouseUp={gravity::onMouseUp}
    {...rest}
  />
})`
  position: fixed;
  background-color: ${$.prop('theme', 'bg')};
  top: 0;
  left: 0;
`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Canvas
