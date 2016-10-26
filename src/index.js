import './index.html'
import './styles/main.scss'

import React from 'react'
import { render } from 'react-dom'

import SimulationUI from './components/SimulationUI'

import { generate, randomParams } from './generate'

onload = () => {
  const main = document.querySelector('main')

  render(<SimulationUI simulation={generate(randomParams())} title='Gravity Toy'/>, main)
}
