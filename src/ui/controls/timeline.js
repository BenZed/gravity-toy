import React, { useState, useRef } from 'react'

import styled from 'styled-components'
import $ from '../theme'

import { useStateTree } from '@benzed/react'
import { clamp, round } from '@benzed/math'

/******************************************************************************/
// Data
/******************************************************************************/

const ERASER_PROGRESS_THRESHOLD = 0.5 // * 100%
const CURRENT_PROGRESS_THRESHOLD = 0.01 // * 100%

/******************************************************************************/
//
/******************************************************************************/

const Speedometer = styled(props => {

  const { gravity, ...rest } = props

  useStateTree.observe(gravity, 'targetSpeed', 'actualSpeed')
  const { targetSpeed, actualSpeed } = gravity

  return <div {...rest} >
    <span>{targetSpeed}x</span>

    <span data-match={actualSpeed !== targetSpeed}>
      {actualSpeed.toFixed(2)}x
    </span>
  </div>
})`
  span:nth-child(2) {
    margin-left: 0.25em;
    color: ${$.theme.brand.danger};
    opacity: 0;
    transition: opacity 1000ms;
    &[data-match=true] {
      opacity: 1;
    }
  }
`

const EraserButton = styled(props => {

  const { show, eraseProgress, setEraseProgress, progress, erase, containerRef, ...rest } = props

  return <button
    draggable

    onClick={e => {
      if (eraseProgress <= 0)
        setEraseProgress(ERASER_PROGRESS_THRESHOLD)
      else
        erase()
    }}

    onDrag={e => {
      const { width, left } = containerRef.current.getBoundingClientRect()
      if (e.clientX <= 0)
        return

      const x = e.clientX - left
      const eraseProgress = clamp(x / width, 0, progress)

      setEraseProgress(eraseProgress)
    }}
    onDragEnd={erase}
    {...rest}>
    ✂
  </button>
})`

  margin-right: 0em;
  width: 0em;
  padding: 0em;

  overflow: hidden;
  transition: width 250ms, margin-right 250ms, color 250ms;

  color: ${$.if((v, p) => p.eraseProgress > 0).theme.brand.danger.else.set('inherit')};

  &:hover {
    color: ${$.theme.brand.danger};
  }

  ${$.ifProp('show').set(`
    width: 1em;
    margin-right: 0.5em;
  `)}

`

/******************************************************************************/
// Main Components
/******************************************************************************/

const Timeline = styled(props => {

  const { gravity, ...rest } = props

  useStateTree.observe(gravity, 'simulationState')

  const {
    currentTick: current,
    firstTick: first,
    lastTick: last,
    usedCacheMemory: used,
    maxCacheMemory: max
  } = gravity.simulationState

  const progress = ((used / max) || 0)

  const currentTick = (current - first) / (last - first)

  const containerRef = useRef()
  const [ eraseProgress, setEraseProgress ] = useState(0)

  const erase = () => {

    if (eraseProgress <= 0)
      return

    const lastPossibleTick = round(last / progress)
    const eraseTick = round(eraseProgress * lastPossibleTick)

    gravity.simulation.clearBeforeTick(eraseTick)
    setEraseProgress(0)
  }

  // console.log((current - first) / (last - first))

  return <div {...rest} >

    <EraserButton
      show={progress > ERASER_PROGRESS_THRESHOLD}
      progress={progress}
      eraseProgress={eraseProgress}
      setEraseProgress={setEraseProgress}
      erase={erase}
      containerRef={containerRef}
    />

    <div className='timeline'>

      <div className='current-handle'
        data-show={progress > CURRENT_PROGRESS_THRESHOLD && currentTick < 1 - CURRENT_PROGRESS_THRESHOLD}
        style={{
          left: `calc(${currentTick * progress * 100}% - 0.5em)`
        }}>︱</div>

      <div className='bar-container' ref={containerRef}>

        <div
          className='progress-bar'
          style={{ width: `${progress * 100}%` }}
        />

        <div
          className='eraser-bar'
          style={{ width: `${eraseProgress * 100}%` }}
        />

      </div>

    </div>
  </div>
})`

  display: flex;
  flex-direction: row;
  align-items: center;

  flex-grow: 1;
  margin: 0em 0.5em 0.225em 0.25em;

  > div.timeline {
    flex-grow: 1;
    position: relative;
    margin-right: 1em;

    > div.current-handle {
      position: absolute;
      top: -0.75em;
      left: -0.5em;

      opacity: 0;
      transition: opacity 500ms;

      &[data-show=true] {
        opacity: 1;
      }
    }

    > div.bar-container {
      background-color: ${$.theme.fg.fade(0.75).desaturate(0.5)};
      border-radius: 0.25em;
      height: 0.5em;
      overflow: hidden;
      position: relative;
      flex-grow: 1;

      > div {
        height: 100%;
        position: absolute;
      }

      > div.progress-bar {
        background-color: ${$.theme.fg};
      }

      > div.eraser-bar {
        background-color: ${$.theme.brand.danger};
      }

    }
  }
`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
