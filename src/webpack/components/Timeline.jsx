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

const Pointer = ({ currentTime }) =>
  <svg width='24' height='16' style={{ left: `calc(${currentTime}% - 12px)` }}>
    <g>
      <path
        d='m-0.01851,15.99311c0,0 24.0242,0.01282 24.0242,0.01282c0,0 -12.0121,-15.9734 -12.01923,-15.98029'
        fill='#c96af2'/>
    </g>
  </svg>

/******************************************************************************/
// Main Component
/******************************************************************************/

const Timeline = ({ children, currentTime, ...props }) =>
  <TimelineStyle {...props}>
    { children }
    <Pointer currentTime={currentTime}/>
  </TimelineStyle>

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
