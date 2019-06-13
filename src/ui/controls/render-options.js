import React from 'react'
import styled from 'styled-components'

/******************************************************************************/
// Sub Components
/******************************************************************************/

const RenderOptionsStyle = styled.div`

`

/******************************************************************************/
// Main Component
/******************************************************************************/

const RenderOptions = ({ children, ...props }) =>
  <RenderOptionsStyle {...props}>
     Render Options
  </RenderOptionsStyle>

/******************************************************************************/
// Exports
/******************************************************************************/

export default RenderOptions
