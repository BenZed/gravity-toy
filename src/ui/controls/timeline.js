import React from 'react'

import styled from 'styled-components'
import $ from '../theme'

import { useStateTree } from '@benzed/react'

/******************************************************************************/
// Main Components
/******************************************************************************/

const Timeline = styled(props => {

  const { gravity, ...rest } = props

  useStateTree.observe(gravity, 'targetSpeed', 'actualSpeed')

  const { targetSpeed, actualSpeed } = gravity

  return <div {...rest} >
    <span>
      {targetSpeed}x</span>

    <span data-match={actualSpeed !== targetSpeed}>
      {actualSpeed.toFixed(2)}x
    </span>
  </div>
})`

  display: flex;
  flex-direction: row;
  flex-grow: 1;
  background-color: ${$.theme.fg.fade(0.75).desaturate(0.5)};

  span:nth-child(2) {
    margin-left: 0.25em;
    color: ${$.theme.brand.danger};
    opacity: 0;
    transition: opacity 1000ms;
    &[data-match=true] {
      opacity: 1;
    }
  }

  border-radius: 0.25em;
  height: 0.5em;
  margin: 0.5em;

`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
