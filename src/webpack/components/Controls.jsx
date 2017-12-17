import React from 'react'
import { string } from 'prop-types'
import styled from 'styled-components'
import Pointer from './Pointer'

import { round, abs } from 'math-plus'
import { touchable } from './mutators'

/******************************************************************************/
// Data
/******************************************************************************/

const PURPLE = `#c96af2`

const FONTSIZE = 5
/******************************************************************************/
// Styled Components
/******************************************************************************/

const Title = styled.h1.attrs({
  children: 'gravity toy'
})`
  text-transform: uppercase;

  opacity: 0.5;
  margin: 0;

  position: fixed;
  top: 0;
  left: 0.25em;

  font-family: 'Helvetica';
  font-size: ${FONTSIZE}vw;
`

const Button = styled.div`
  font-size: ${FONTSIZE * 0.5}vw;
  margin-left: 0.5em;
  position: relative;
  z-index: 100;
`::touchable()

const Zoomer = styled(Button).attrs({
  children: props => `${props.zoom::round()}x`,
  onPan: ({ addZoom, zoom }) =>
    ({ deltaX, deltaY }) => addZoom(4 * (deltaX + deltaY))
})`
`

const SpeedPointer = styled(Pointer).attrs({
  style: ({ speed }) => Object({
    transform: `translate(0em, -0.125em) rotate(${speed > 0 ? 90 : -90}deg)`
  })
})`
  transition: transform 250ms;
`

const Speeder = styled(Button).attrs({
  children: ({ speed }) => {
    const num = abs(speed)::round(0.01)
    const pointer = <SpeedPointer key='pointer' speed={speed}/>
    return num > 1
      ? [ num, pointer ]
      : pointer
  },
  onPanStart: ({ speed }) => () => Object({ startSpeed: speed }),
  onPan: ({ setSpeed }) =>
    ({ currentX, currentY }, { startSpeed }) => {
      const delta = (currentX + currentY) / 100
      // console.log(delta * )
      setSpeed(startSpeed + delta)
    }
})`
`

const ControlsContainer = styled.div`
  width: calc(100% - 2.5em);
  height: 5em;

  box-sizing: border-box;
  margin: 0.5em;

  display: flex;
  align-items: center;
  justify-content: center;

  color: ${PURPLE};
  fill: ${PURPLE};
`

/******************************************************************************/
// Main Component
/******************************************************************************/

class Controls extends React.Component {

  static defaultProps = {
    status: 'active'
  }

  static propTypes = {
    status: string
  }

  state = {
    currentMenuX: 0
  }

  startMenuX = 0

  render () {

    const { children, zoom, speed, addZoom, setSpeed, ...props } = this.props

    return <ControlsContainer {...props}>
      <Title/>
      <Zoomer zoom={zoom} addZoom={addZoom}/>
      <Speeder speed={speed} setSpeed={setSpeed}/>
      { children }
    </ControlsContainer>
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Controls
