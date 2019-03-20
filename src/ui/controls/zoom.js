import React, { useRef } from 'react'
import styled from 'styled-components'

import $ from '../theme'
import { KeyButton } from '../common'

import { IconButton, useStateTree } from '@benzed/react'
import { pow, clamp, log } from '@benzed/math'
import is from 'is-explicit'

/******************************************************************************/
// Directions
/******************************************************************************/

const KEYBOARD_ZOOM_SPEED = 0.5

/******************************************************************************/
// Hooks
/******************************************************************************/

const getZoomFactor = (zoom, maxZoom) => log(zoom) / log(maxZoom)

const getZoomTarget = (factor, maxZoom) =>
  pow(maxZoom, factor)

/******************************************************************************/
// Styles
/******************************************************************************/

const ZoomMarkers = styled(({ gravity, className, ...rest }) => {

  const { maxZoom } = gravity.renderer.options

  const markers = []

  for (let i = 1, powers = 0; i <= maxZoom; i *= 10, powers++) {
    const marker = <span
      key={i}
      className={className}
      style={{
        top: `calc(${getZoomFactor(i, maxZoom) * 100}% - 0.6em)`
      }}>
      {powers === 0 ? 1 : 10}
      {powers > 1 ? <sup>{powers}</sup> : null}
      <em>x</em>
    </span>

    markers.push(marker)
  }

  return markers
})`
  position: absolute;
  font-size: calc(1em - 0.5em);
  opacity: 0.5;
  right: 0.125em;
`

const ZoomSlider = styled(({ gravity, zoomRef, ...rest }) => {

  useStateTree.observe(gravity, 'time')

  const { maxZoom } = gravity.renderer.options
  const { camera } = gravity.renderer
  const { zoom } = camera.target

  const grab = useRef()

  return <IconButton
    $size={1}
    {...rest}
    style={{
      top: `calc(${getZoomFactor(zoom, maxZoom) * 100}% - 0.25em)`
    }}
    draggable
    onDragStart={e => {
      grab.current = {
        start: e.clientY,
        zoomFactor: getZoomFactor(camera.target.zoom, maxZoom)
      }
    }}
    onDrag={e => {
      if (!grab.current || !e.clientY)
        return

      const bounds = zoomRef.current.getBoundingClientRect()
      const deltaFactor = clamp((e.clientY - grab.current.start) / bounds.height, -1, 1)

      camera.target.zoom = getZoomTarget(clamp(deltaFactor + grab.current.zoomFactor), maxZoom)
    }}
    onDragEnd={e => { grab.current = null }}
  >―</IconButton>
})`
  position: relative;
  cursor: grab;
  height: 0.5em;
  width: 0.7em;
`

const ZoomSliderContainer = styled(props => {

  const { gravity, zoomRef, ...rest } = props

  const { maxZoom } = gravity.renderer.options
  const { camera } = gravity.renderer

  // const { zoom } = camera.target

  return <div
    {...rest}
    ref={zoomRef}
    onClick={e => {
      const bounds = zoomRef.current.getBoundingClientRect()
      const factor = clamp(e.clientY - bounds.top, 1, bounds.height) / bounds.height
      camera.target.zoom = getZoomTarget(factor, maxZoom)
    }}
  />
})`
  border-right: 1px solid ${$.theme.fg};
  flex-grow: 1;
  margin-right: 0.55em;
  position: relative;
  cursor: pointer;
`

const ZoomButton = ({ gravity, out }) =>
  <KeyButton
    $size={1}
    keys={out ? '-' : '='}
    style={{
      position: 'relative',
      top: out ? '0.25em' : '0em'
    }}
    hold={e => {
      const { maxZoom } = gravity.renderer.options
      const { camera } = gravity.renderer
      const { zoom } = camera.target

      const sign = out ? 1 : -1
      const keyDelta = KEYBOARD_ZOOM_SPEED * sign
      const zoomDelta = maxZoom - getZoomFactor(maxZoom - (zoom + keyDelta), maxZoom) * maxZoom

      const nextZoom = is.nan(zoomDelta)
        ? maxZoom
        : zoom + zoomDelta * sign

      camera.target.zoom = clamp(nextZoom, 1, maxZoom - 1)
    }}
  >{out ? '▼' : '▲'}</KeyButton>

/******************************************************************************/
// Main Components
/******************************************************************************/

const Zoom = styled(props => {

  const { gravity, ...rest } = props
  const zoomRef = useRef()

  return <div {...rest}>
    <ZoomButton gravity={gravity} />
    <ZoomSliderContainer gravity={gravity} zoomRef={zoomRef} >
      <ZoomMarkers gravity={gravity} />
      <ZoomSlider gravity={gravity} zoomRef={zoomRef}/>
    </ZoomSliderContainer>
    <ZoomButton gravity={gravity} out />
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
