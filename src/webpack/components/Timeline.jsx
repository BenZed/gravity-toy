import React from 'react'
import styled from 'styled-components'
import Pointer from './Pointer'
/******************************************************************************/
// Sub Components
/******************************************************************************/

const TimelineStyle = styled.div.attrs({
  // style: ({ maxTime }) => Object({ width: maxTime === Infinity ? 0 : maxTime })
})`
  height: 1em;
  position: fixed;
  width: 100%;
  bottom: 0;
  border-bottom: 4px solid #c96af2;

  svg {
    position: relative;
    bottom: -4px;
  }

`

/******************************************************************************/
// Main Component
/******************************************************************************/

class Timeline extends React.Component {

  startClientX = 0
  startCurrentTime = 0

  onTouchStart = e => {
    this.startClientX = e.touches[0].clientX
    this.startCurrentTime = this.props.currentTime
  }

  onTouchMove = e => {
    const deltaPixels = e.touches[0].clientX - this.startClientX
    const { setCurrentTime } = this.props

    if (this.startMaxTime === Infinity)
      return

    const deltaFactor = deltaPixels / innerWidth
    const newCurrentTime = this.startCurrentTime + (deltaFactor * 100)

    setCurrentTime(newCurrentTime)

  }

  render () {

    const { children, currentTime, ...props } = this.props
    const { onTouchStart, onTouchMove } = this

    delete props.setCurrentTime
    delete props.setSpeed

    return <TimelineStyle {...props}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove} >
      { children }
      <Pointer style={{ left: `calc(${currentTime}% - 12px)`, cursor: 'col-resize' }}/>
    </TimelineStyle>
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
