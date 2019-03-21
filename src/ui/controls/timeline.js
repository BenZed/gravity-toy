import React, { useState, useRef } from 'react'

import styled from 'styled-components'
import $ from '../theme'

import { useStateTree } from '@benzed/react'
import { clamp, round } from '@benzed/math'

/******************************************************************************/
// Data
/******************************************************************************/

const ERASER_PROGRESS_THRESHOLD = 0.25 // * 100%
const CURRENT_PROGRESS_THRESHOLD = 0.01 // * 100%

/******************************************************************************/
// Components
/******************************************************************************/

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

const CurrentTickSlider = styled(props => {

  const { show, progress, currentProgress, containerRef, gravity, ...rest } = props

  const startRef = useRef()

  return <div
    draggable
    onDragStart={e => {
      startRef.current = {
        x: e.clientX,
        progress,
        simulationState: gravity.simulationState
      }
      gravity.setPaused(true)
    }}
    onDrag={e => {
      if (e.clientX <= 0)
        return

      const bounds = containerRef.current.getBoundingClientRect()
      const sim = startRef.current.simulationState
      const progress = startRef.current.progress

      const lastPossibleTick = round((sim.lastTick - sim.firstTick) / progress)

      const deltaX = e.clientX - startRef.current.x
      const deltaP = deltaX / bounds.width
      const deltaTicks = round(deltaP * lastPossibleTick)

      const targetTick = sim.currentTick + round(deltaTicks)

      gravity.simulation.setCurrentTick(targetTick)
    }}
    onDragEnd={e => {
      startRef.current = null
      gravity.setPaused(false)
    }}
    style={{
      left: `calc(${currentProgress * progress * 100}% - 0.5em)`
    }}
    {...rest}>︱</div>
})`
  position: absolute;
  top: -0.75em;
  left: -0.5em;

  opacity: ${$.ifProp('show').set(1).else.set(0)};

  transition: opacity 500ms;
  cursor: grab;

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
    maxCacheMemory: max,
    running
  } = gravity.simulationState

  const progress = ((used / max) || 0)

  const currentProgress = (current - first) / (last - first)

  const containerRef = useRef()
  const [ eraseProgress, setEraseProgress ] = useState(0)

  const erase = () => {

    if (eraseProgress <= 0)
      return

    const lastPossibleTick = round((last - first) / progress)
    const eraseTick = first + round(eraseProgress * lastPossibleTick)

    gravity.simulation.clearBeforeTick(eraseTick)
    setEraseProgress(0)
    if (!running)
      gravity.simulation.run()
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

      <CurrentTickSlider
        gravity={gravity}
        show={progress > CURRENT_PROGRESS_THRESHOLD && currentProgress < 1}
        currentProgress={currentProgress}
        progress={progress}
        containerRef={containerRef}
      />

      <div className='bar-container'
        ref={containerRef}
        onClick={e => {
          const bounds = containerRef.current.getBoundingClientRect()
          const lastPossibleTick = round((last - first) / progress)

          const deltaP = (e.clientX - bounds.left) / bounds.width
          const targetTick = first + round(deltaP * lastPossibleTick)

          gravity.simulation.setCurrentTick(targetTick)
        }}
      >

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

    > div.bar-container {
      background-color: ${$.theme.fg.fade(0.75).desaturate(0.5)};
      border-radius: 0.25em;
      height: 0.5em;
      overflow: hidden;
      position: relative;
      flex-grow: 1;
      cursor: pointer;

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
