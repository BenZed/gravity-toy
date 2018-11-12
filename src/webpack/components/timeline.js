import React from 'react'
import styled from 'styled-components'
import Pointer from './pointer'
import { touchable } from '../util'
import { round, min, floor, clamp } from '@benzed/math'

/******************************************************************************/
// Data
/******************************************************************************/

const FPS = 60 // I feel like I could be getting this from the simulation module, or something

// Number of cached ticks required for the timeline to stretch all the way
// across the screen.
const WIDTH_TICKS = FPS * 60 // 60 fps * 60 seconds

// Number of cached ticks required before the pointer shows up on the screen.
const POINTER_TICKS = FPS * 1 // 60 fps * 1 seconds

/******************************************************************************/
// Sub Components
/******************************************************************************/

const TimeTag = styled.div.attrs({
  children: ({ tick }) => {

    const total = round(tick / FPS) // in seconds

    const SEC = 60
    const MIN = 60
    const HOUR = SEC * MIN

    const seconds = total % SEC
    const minutes = floor(total / SEC) % MIN
    const hours = floor(total / HOUR) % 24
    const days = floor(total / (HOUR * 24))

    const h = hours > 0 ? `${hours}h` : ''
    const m = minutes > 0 && days === 0 ? `${minutes}m` : ''
    const s = hours + days === 0 ? `${seconds}s` : ''
    const d = days > 0 ? `${days}d` : ''

    return d + h + m + s

  }
})`
  position: absolute;
  font-family: monospace;
  font-size: 0.75em;
  color: ${props => props.theme.fg};
  white-space: nowrap;
  z-index: 1;
`

const TimelinePointer = styled(Pointer).attrs({
  style: ({ progress }) => {
    return { left: `calc(${progress * 100}% - 12px)` }
  }
})`
  cursor: col-resize;
  position: relative;
  display: inline-flex;
  justify-content: center;
  z-index: 20;
  fill: ${props => props.theme[props.color]};

`

const CacheEraser = styled.div.attrs({
  style: ({ progress }) => {
    return { width: progress === 0 ? '1em' : `calc(${progress * 100}% - 12px)` }
  }
})`

  height: 1em;
  position: absolute;
  z-index: 10;
  left: 0%;
  cursor: ${props => props.progress > 0 ? 'grabbing' : 'grab'};

  ${TimeTag} {
    display: ${props => props.progress === 0 ? 'none' : 'initial'};
    color: ${props => props.theme.error};
  }

  border-bottom: solid ${props => props.theme.error};
  border-width: ${props => props.progress > 0 ? '4px' : '0px'};

`::touchable()

const TimelineStyle = styled.div.attrs({
  style: ({ width }) => {

    return {
      width: `${width * 100}%`
    }
  }
})`
  height: 1em;
  position: fixed;
  bottom: 0;
  border-bottom: 4px solid ${props => props.theme.fg};

  &:not(:hover) {
    ${TimelinePointer} > ${TimeTag} {
      display: none;
    }
  }

  svg {
    position: relative;
    bottom: -4px;
  }
`::touchable()

/******************************************************************************/
// Main Component
/******************************************************************************/

class Timeline extends React.Component {

  startCurrentTick = 0

  state = {
    eraseTicks: 0
  }

  onEraseStart = () => {
    const { setScrubbing } = this.props
    setScrubbing(true)
  }

  onErase = ({ currentX }) => {
    const { lastTick, firstTick } = this.props

    const width = this.widthOnScreen * innerWidth
    const finalTick = lastTick - firstTick

    const factor = currentX / width
    const eraseTicks = min(round(factor * finalTick), finalTick)

    this.setState({ eraseTicks })
  }

  onEraseEnd = () => {

    const { eraseTicks } = this.state
    const { clearBeforeTick, setScrubbing, firstTick } = this.props

    clearBeforeTick(firstTick + eraseTicks)
    setScrubbing(false)

    this.setState({ eraseTicks: 0 })
  }

  onScrubTimeStart = () => {
    const { firstTick, currentTick, setScrubbing } = this.props
    this.startVisualTick = currentTick - firstTick
    setScrubbing(true)
  }

  onScrubTime = ({ currentX }) => {
    const { setCurrentTick, lastTick, firstTick } = this.props

    const width = this.widthOnScreen * innerWidth
    const finalTick = lastTick - firstTick

    const deltaFactor = currentX / width
    const deltaTicks = round(deltaFactor * finalTick)

    const visualTick = this.startVisualTick + deltaTicks

    setCurrentTick(firstTick + visualTick)
  }

  onScrubTimeEnd = () => {
    const { setScrubbing } = this.props

    setScrubbing(false)
  }

  get widthOnScreen () {

    const { lastTick, firstTick } = this.props

    return clamp(lastTick - firstTick, 0, WIDTH_TICKS) / WIDTH_TICKS
  }

  render () {

    const {
      children, currentTick, firstTick, lastTick, cacheSize, ...props
    } = this.props
    const {
      onScrubTimeStart, onScrubTime, onScrubTimeEnd,
      onEraseStart, onErase, onEraseEnd, widthOnScreen
    } = this
    const { eraseTicks } = this.state

    delete props.setCurrentTick
    delete props.setScrubbing
    delete props.clearBeforeTick
    delete props.setSpeed

    const finalTick = lastTick - firstTick
    const visualTick = currentTick - firstTick

    const cacheIsFull = cacheSize === 1
    const eraseProgress = eraseTicks / finalTick
    const pointerProgress = visualTick / finalTick
    const pointerColor = eraseTicks > visualTick || cacheIsFull
      ? 'error' : 'fg'

    const showPointer = lastTick >= POINTER_TICKS

    return <TimelineStyle
      onPanStart={onScrubTimeStart}
      onPan={onScrubTime}
      onPanEnd={onScrubTimeEnd}

      width={widthOnScreen}
      {...props}
    >
      { children }

      <CacheEraser
        progress={eraseProgress}
        onPanStart={onEraseStart}
        onPan={onErase}
        onPanEnd={onEraseEnd}
      >
        <TimeTag tick={eraseTicks} style={{ right: '0%', top: '-0.5em' }}/>
      </CacheEraser>

      <TimeTag tick={finalTick} style={{ right: '0%', bottom: '0em' }}/>

      { showPointer
        ? <TimelinePointer
          progress={pointerProgress}
          color={pointerColor}
        >
          <TimeTag tick={visualTick} style={{ top: '-0.5em' }}/>
        </TimelinePointer>
        : null
      }

    </TimelineStyle>
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
