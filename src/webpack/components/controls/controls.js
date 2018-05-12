import React from 'react'
import { string } from 'prop-types'
import styled from 'styled-components'

/******************************************************************************/
// Styled Components
/******************************************************************************/

const Title = styled.h1.attrs({
  children: 'gravity toy'
})`
  text-transform: uppercase;

  margin: 0;
  margin-right: auto;

  font-family: 'Helvetica';
  font-size: ${props => props.theme.fontvw}vw;

`

const ControlsContainer = styled.div`
  width: calc(100% - 2.5em);

  box-sizing: border-box;
  margin: 0.5em;

  display: flex;
  align-items: center;
  justify-content: center;

  fill: ${props => props.theme.fg};
  color: ${props => props.theme.fg};

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
      { children }
    </ControlsContainer>
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Controls
