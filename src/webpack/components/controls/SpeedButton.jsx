import React from 'react'
import { string } from 'prop-types'

import styled from 'styled-components'
import Pointer from '../Pointer'

/******************************************************************************/
// Style Funcs
/******************************************************************************/

const fontvw = props => props.theme.fontvw * (props.size || 1)

/******************************************************************************/
// Style Components
/******************************************************************************/

// const Speeder = styled(Button).attrs({
//   children: ({ speed }) => {
//     const num = abs(speed)::round(0.01)
//     const pointer = <SpeedPointer key='pointer' speed={speed}/>
//     return num > 1
//       ? [ num, pointer ]
//       : pointer
//   },
//   onPanStart: ({ speed }) => () => Object({ startSpeed: speed }),
//   onPan: ({ setSpeed }) =>
//     ({ currentX, currentY }, { startSpeed }) => {
//       const delta = (currentX + currentY) / 100
//       // console.log(delta * )
//       setSpeed(startSpeed + delta)
//     }
// })`
// `

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const SpeedPointer = styled(Pointer)`
  transform:
    translate(${props => props.slow ? -0.25 : 0.125}em, 0)
    rotate(${props => props.slow ? '270' : '90'}deg);
`

const Circle = Container.extend`
  height: ${fontvw}vw;
  width: ${fontvw}vw;
  border-radius: 50%;
  background-color: ${props => props.theme.fg};

  color: ${props => props.theme.bg};
  font-size: ${props => props.theme.fontvw * 0.3}vw;

  svg {
    fill: ${props => props.theme.bg};
  }
`

/******************************************************************************/
// Sub Components
/******************************************************************************/

const SlowButton = props =>
  <SpeedPointer slow />

const Display = props =>
  <Circle>
    <SpeedPointer small />
    x{props.speed}
  </Circle>

const FastButton = props =>
  <SpeedPointer />

/******************************************************************************/
// Main Component
/******************************************************************************/

class SpeedButton extends React.Component {

  static defaultProps = {
    status: 'active'
  }

  static propTypes = {
    status: string
  }

  state = { }

  render () {
    const { children, speed, ...props } = this.props

    return <Container {...props}>

      <SlowButton/>
      <Display speed={speed}/>
      <FastButton/>

      { children }
    </Container>
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default SpeedButton
