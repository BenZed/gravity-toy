import React from 'react'
import styled from 'styled-components'

import { IconButton, useStateTree } from '@benzed/react'

import { MAX_SPEED } from '../constants'

/******************************************************************************/
// Main Component
/******************************************************************************/

const Speed = styled(({ forward, reverse, gravity, ...props }) => {

  useStateTree.observe(gravity, 'targetSpeed', 'simulationState')

  const { targetSpeed } = gravity
  const { currentTick, firstTick, lastTick } = gravity.simulationState

  const disabled = forward
    ? targetSpeed === MAX_SPEED || currentTick === lastTick
    : targetSpeed === -MAX_SPEED || currentTick === firstTick

  return <IconButton
    $size={1}
    {...props}
    onClick={e => gravity.incrementTargetSpeed(reverse)}
    disabled={disabled}
  >
    { forward ? '▶' : '◀' }
  </IconButton>
})`
  &:hover {
    opacity: 1;
    transform: scale(1.5, 1.5);
  }

  transition: transform 250ms, opacity 250ms;
`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Speed
