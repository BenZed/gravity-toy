
import React, { useRef, useEffect } from 'react'

import styled from 'styled-components'

import { on, off, StateTreeContext, GlobalStyle, Write } from '@benzed/react'

import $, { theme } from './theme'

import { Speed, Timeline, Zoom } from './controls'

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

const useCanvas = (gravity, theme) => {

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
// Styled
/******************************************************************************/

const Canvas = styled.canvas`
  position: fixed;
  background-color: ${$.prop('theme', 'bg')};
  top: 0;
  left: 0;
`

const Controls = styled.div`
  position: fixed;
  top: 0.5em;
  left: 0.5em;
  bottom: 0.5em;
  right: 0.5em;

  display: flex;

`

const Row = styled.div`
  display: flex;
  flex-direction: row;
`

const BottomRow = styled(Row)`
  margin-top: auto;
  align-items: center;
`

const TopRow = styled(Row)`
  align-items: flex-start;
  flex-grow: 1;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
`

const Title = styled.h1.attrs({ children: <Write start=''>Gravity Toy</Write> })`

  text-transform: uppercase;
  font-size: ${$.theme.titleSize}vw;

`

/******************************************************************************/
// Main Component
/******************************************************************************/

const GravityToy = ({ children, gravity, ...props }) => {

  const canvasRef = useCanvas(gravity)

  return <StateTreeContext.Provider value={gravity}>
    <GlobalStyle theme={theme}>

      <Canvas ref={canvasRef} />

      <Controls>

        <TopRow>
          <Column>
            <Title />
            <div>Body Controls</div>
          </Column>
          <Zoom />
        </TopRow>

        <BottomRow>
          <Speed gravity={gravity} reverse />
          <Speed gravity={gravity} forward />
          <Timeline gravity={gravity}/>
        </BottomRow>

      </Controls>

    </GlobalStyle>
  </StateTreeContext.Provider>
}
/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
