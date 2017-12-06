import './global'

import addEventListener from 'add-event-listener'
import React from 'react'
import { render } from 'react-dom'

import GravityToy from './components/GravityToy'
import TouchEmulator from 'hammer-touchemulator'

/******************************************************************************/
// Execute
/******************************************************************************/

addEventListener(window, 'load', () => {

  const mainTag = document.getElementById('gravity-toy')

  TouchEmulator()

  render(<GravityToy />, mainTag)

})
