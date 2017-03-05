import './styles/main.scss'

import React from 'react'
import { render } from 'react-dom'

import { SimulationUI } from './components'

onload = () => render(<SimulationUI/>, document.getElementsByTagName('main')[0])
