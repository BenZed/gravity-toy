import React from 'react'
import { render } from 'react-dom'
import { injectGlobal } from 'styled-components'

import SimulationUI from './components'

/******************************************************************************/
// Global Styles
/******************************************************************************/

injectGlobal`
  body {
    margin: 0;
    padding: 0;
  }
`

/******************************************************************************/
// Load Window
/******************************************************************************/

onload = () => render(
  <SimulationUI />,
  document.getElementsByTagName('main')[0]
)
