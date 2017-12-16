import React from 'react'
import styled from 'styled-components'

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

const Pointer = ({ currentTime, ...props }) =>
  <svg width='24' height='16' style={{ left: `calc(${currentTime}% - 12px)` }} {...props}>
    <g>
      <path
        d='m-0.01851,15.99311c0,0 24.0242,0.01282 24.0242,0.01282c0,0 -12.0121,-15.9734 -12.01923,-15.98029'
        fill='#c96af2'/>
    </g>
  </svg>

/******************************************************************************/
// Main Component
/******************************************************************************/

class Timeline extends React.Component {

  startClientX = 0
  startCurrentTime = 0
  startMaxTime = 0

  onTouchStart = e => {
    this.startClientX = e.touches[0].clientX
    this.startCurrentTime = this.props.currentTime
    this.startMaxTime = this.props.maxTime
  }

  onTouchMove = e => {
    const deltaPixels = e.touches[0].clientX - this.startClientX

    const { setCurrentTime } = this.props

    if (this.startMaxTime === Infinity)
      return

    const deltaFactor = deltaPixels / innerWidth

    const newCurrentTime = this.startCurrentTime + (this.startMaxTime * deltaFactor)

    console.log(this.startCurrentTime, newCurrentTime, this.startMaxTime)
    setCurrentTime(newCurrentTime)

  }

  render () {
    const { children, currentTime, ...props } = this.props

    const { onTouchStart, onTouchMove } = this

    delete props.setCurrentTime
    delete props.setSpeed

    return <TimelineStyle {...props}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      { children }
      <Pointer currentTime={currentTime}/>
    </TimelineStyle>
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
