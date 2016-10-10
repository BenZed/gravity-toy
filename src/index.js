import './index.html'
import './styles/main.scss'

import React from 'react'
import { render } from 'react-dom'

import SimulationUI from './components/SimulationUI'

onload = () => {
  const main = document.querySelector('main')

  render(<SimulationUI title='Gravity Toy'/>, main)
}
