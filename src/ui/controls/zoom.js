import React from 'react'
import styled from 'styled-components'

import $ from '../theme'
import { KeyButton } from '../common'

import { IconButton, useStateTree } from '@benzed/react'

/******************************************************************************/
// Directions
/******************************************************************************/

const KEYBOARD_ZOOM_SPEED = 0.1

/******************************************************************************/
// Hooks
/******************************************************************************/

const useGrab = () => {
  
}

/******************************************************************************/
// Styles
/******************************************************************************/

const ZoomSlider = styled(({ gravity, camera, ...rest }) => {

  useStateTree.observe(gravity, 'time')

  const zoomFactor = camera.current.zoom / gravity.renderer.options.maxZoom
  // console.log((2 ** zoomFactor) - 1)
  return <KeyButton
    $size={1}
    {...rest}
    style={{
      top: `calc(${zoomFactor * 100}% - 0.25em)`
    }}
  >―</KeyButton>
})`
  position: relative;
  height: 0.5em;
  width: 0.7em;
  transition: top 100ms, opacity 250ms;=
`

const ZoomSliderContainer = styled.div`
  border-right: 1px solid ${$.theme.fg};
  flex-grow: 1;
  margin-right: 0.55em;
`

const ZoomButton = ({ camera, out }) =>
  <KeyButton
    $size={1}
    keys={out ? '-' : '='}
    hold={e => {
      camera.target.zoom +=
        camera.current.zoom *
        KEYBOARD_ZOOM_SPEED *
        (out ? 1 : -1)
    }}
  >{out ? '∨' : '∧'}</KeyButton>

/******************************************************************************/
// Main Components
/******************************************************************************/

const Zoom = styled(props => {

  const { gravity, ...rest } = props
  const { camera } = gravity.renderer

  return <div {...rest}>
    <ZoomButton camera={camera} />
    <ZoomSliderContainer camera={camera}>
      <ZoomSlider gravity={gravity} camera={camera}/>
    </ZoomSliderContainer>
    <ZoomButton camera={camera} out />
  </div>
})`

  flex-grow: 1;
  margin-left: auto;

  display: flex;
  flex-direction: column;

  ${KeyButton} {
    margin-left: auto;
  }


`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Zoom
