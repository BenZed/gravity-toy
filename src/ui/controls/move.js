import styled from 'styled-components'
import React from 'react'

import $ from '../theme'

import { useKeyCommand } from '../util'

/******************************************************************************/
// Directions
/******************************************************************************/

const WASD = [{
    keys: [ 'w', 'ArrowUp' ],
    axis: 'y',
    sign: -1
}, {
    keys: [ 'd', 'ArrowRight' ],
    axis: 'x',
    sign: 1
}, {
    keys: [ 's', 'ArrowDown' ],
    axis: 'y',
    sign: 1
}, {
    keys: [ 'a', 'ArrowLeft' ],
    axis: 'x',
    sign: -1
}]

const KEYBOARD_MOVE_SPEED = 20

/******************************************************************************/
// Main Components
/******************************************************************************/

const Move = styled(props => {

    const { gravity, ...rest } = props

    const { camera } = gravity.renderer

    for (const { keys, axis, sign } of WASD)
        useKeyCommand({
            keys,
            hold () {
                camera.target.pos[axis] += camera.current.zoom * KEYBOARD_MOVE_SPEED * sign
            }
        })

    return <div {...rest} />
})`
  background-color: ${$.theme.fg.fade(0.5)};

  // width: 2em;
  // height: 2em;
  margin-bottom: 0.5em;

`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Move
