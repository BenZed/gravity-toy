
import React, { useRef, useEffect } from 'react'
import { ThemeProvider } from 'styled-components'

import { on, off, StateTreeContext } from '@benzed/react'

import { theme } from './theme'

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

/******************************************************************************/
//
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
// Main Component
/******************************************************************************/

const GravityToy = ({ children, gravity, ...props }) => {

  const canvasRef = useCanvas(gravity)

  return <ThemeProvider theme={theme}>
    <StateTreeContext.Provider value={gravity}>
      <canvas key='canvas' ref={canvasRef}/>
    </StateTreeContext.Provider>
  </ThemeProvider>

}
/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
