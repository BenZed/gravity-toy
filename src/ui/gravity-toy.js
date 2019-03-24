
import React from 'react'
import styled from 'styled-components'

import { StateTreeContext, GlobalStyle, Write } from '@benzed/react'

import $, { theme } from './theme'
import { Speed, Speedometer, Timeline, Zoom, Move } from './controls'

import Canvas from './canvas'

/******************************************************************************/
// Styled
/******************************************************************************/

const Controls = styled.div`
  position: fixed;
  top: 0.5em;
  left: 0.5em;
  bottom: 0.5em;
  right: 0.5em;

  display: flex;
  &:focus {
    outline: none;
  }
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
`

const BottomRow = styled(Row)`
  margin-top: auto;
  align-items: center;
`

const TopRow = styled(Row)`
  align-items: flex-start;
  flex-grow: 1;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  &:first-child {
    flex-grow: 1;
  }
  height: 100%;
`

const Title = styled.h1.attrs({ children: <Write start=''>Gravity Toy</Write> })`
  text-transform: uppercase;
  font-size: ${$.theme.titleSize}vw;
`

/******************************************************************************/
// Main Component
/******************************************************************************/

const GravityToy = ({ children, gravity, ...props }) =>

  <StateTreeContext.Provider value={gravity}>
    <GlobalStyle theme={theme}>

      <Canvas gravity={gravity}/>

      <Controls>

        <TopRow>

          <Column>
            <Title />
            <div>Body Controls</div>
            <Speedometer gravity={gravity} />
          </Column>

          <Column>
            <Move gravity={gravity} />
            <Zoom gravity={gravity} />
          </Column>

        </TopRow>

        <BottomRow>
          <Speed gravity={gravity} reverse />
          <Speed gravity={gravity} />
          <Timeline gravity={gravity}/>
        </BottomRow>

      </Controls>

    </GlobalStyle>
  </StateTreeContext.Provider>

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
