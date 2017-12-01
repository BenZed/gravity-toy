import './global'

import addEventListener from 'add-event-listener'
import React from 'react'
import { render } from 'react-dom'

import GravityToy from './components/GravityToy'
import TestCanvas from './components/TestCanvas'

/******************************************************************************/
// Execute
/******************************************************************************/

addEventListener(window, 'load', () => {

  const mainTag = document.getElementById('gravity-toy')

  render(<GravityToy />, mainTag)

})
