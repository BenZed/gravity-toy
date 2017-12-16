import React from 'react'
import { string } from 'prop-types'
import styled from 'styled-components'
import Pointer from './Pointer'

import { clamp } from 'math-plus'

/******************************************************************************/
// Data
/******************************************************************************/

const PURPLE = `#c96af2`
/******************************************************************************/
// Styled Components
/******************************************************************************/

const Title = styled.h1.attrs({
  children: 'gravity toy'
})`
  position: fixed;
  bottom: 0;
  left: 0;

  text-transform: uppercase;

  opacity: 0.5;

  margin: 0.25em;

  font-family: 'Helvetica';
  font-size: 5vw;
`

const MenuCaret = styled(Pointer)`
  transform: translate(0.4em, 1em) rotate(90deg) scale(1.5, 1.5);

  position: relative;
  z-index: 10;

  cursor: ew-resize;
`

const ControlsContainer = styled.div`
  box-sizing: border-box;
  width: calc(100% - 2.5em);
  height: 3em;

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

  onCaretMove = e => {
    let currentMenuX = e.touches[0].clientX / innerWidth

    currentMenuX = currentMenuX::clamp()
    this.setState({ currentMenuX })
  }

  render () {

    const { children, ...props } = this.props
    const { onCaretMove } = this
    const { currentMenuX } = this.state

    return <ControlsContainer {...props}>
      <Title/>
      <MenuCaret
        style={{ left: `${currentMenuX * 100}%` }}
        onTouchMove={onCaretMove}
        // style={{ left: }}
      />
      { children }
    </ControlsContainer>
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Controls
