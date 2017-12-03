import React from 'react'
import styled from 'styled-components'

/******************************************************************************/
// Sub Components
/******************************************************************************/

const TimelineStyle = styled.div`
  background-color: rgba(255,255,255, 0.25);
  height: 1em;
  width: 100%;
  position: fixed;
  bottom: 0
`

/******************************************************************************/
// Main Component
/******************************************************************************/

const Timeline = ({ children, ...props }) =>
  <TimelineStyle {...props}>
    { children }
  </TimelineStyle>

/******************************************************************************/
// Exports
/******************************************************************************/

export default Timeline
