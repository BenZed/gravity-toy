import React from 'react'
import { string } from 'prop-types'
import styled from 'styled-components'
import Pointer from './Pointer'

import { round } from 'math-plus'

/******************************************************************************/
// Data
/******************************************************************************/

const PURPLE = `#c96af2`

const FONTSIZE = '5vw'
/******************************************************************************/
// Styled Components
/******************************************************************************/

const Title = styled.h1.attrs({
  children: 'gravity toy'
})`
  text-transform: uppercase;

  opacity: 0.5;
  margin: 0;

  font-family: 'Helvetica';
  font-size: ${FONTSIZE};
`

const Zoomer = styled.div.attrs({
  children: props => `${props.zoom::round()}x`
})`
  font-size: ${FONTSIZE};
`

const ControlsContainer = styled.div`
  width: calc(100% - 2.5em);
  height: 3em;

  box-sizing: border-box;
  margin: 0.5em;

  display: flex;
  align-items: baseline;

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

    const { children, ...props } = this.props

    return <ControlsContainer {...props}>
      <Title/>
      <Zoomer zoom={1}/>
      { children }
    </ControlsContainer>
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Controls
