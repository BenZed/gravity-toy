import { useRef, useEffect } from 'react'
import { on, off } from '@benzed/react'

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
// Exports
/******************************************************************************/

export default useCanvas
