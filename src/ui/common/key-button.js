import React, { useState } from 'react'

import styled from 'styled-components'
import { useKeyCommand } from '../util'
import { IconButton, useStateTree } from '@benzed/react'
import { ensure, remove } from '@benzed/array'

import is from 'is-explicit'

/******************************************************************************/
// Main
/******************************************************************************/

const KeyButton = styled(props => {

  const { children,
    keys, down, hold, up, meta, alt, shift,
    ...rest
  } = props

  const [ mouseDown, setMouseDown ] = useState(false)

  useKeyCommand({ keys, down, hold, up, meta, alt, shift })

  const gravity = useStateTree()

  const onMouseDown = e => {
    e.stopPropagation()
    if (is.func(down))
      down(e)

    if (is.func(hold))
      gravity._runOnUpdate::ensure(hold)

    setMouseDown(true)
  }

  const onMouseUp = e => {
    e.stopPropagation()
    if (!mouseDown)
      return

    if (is.func(up))
      up(e)

    if (is.func(hold))
      gravity._runOnUpdate::remove(hold)

    setMouseDown(false)
  }

  return <IconButton
    {...rest}
    data-down={mouseDown}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onMouseLeave={onMouseUp}
  >
    {children}
  </IconButton>
})`
  &:hover {
    opacity: 1;
    transform: scale(1.375, 1.375);
  }

  &[data-down=true] {
    transform: scale(1.75, 1.75);
  }

  display: flex;
  justify-content: center;
  align-items: center;

  &:active {
    opacity: 1;
  }

  transition: transform 250ms, opacity 250ms;
`

/******************************************************************************/
// Exports
/******************************************************************************/

export default KeyButton
