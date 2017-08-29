import React from 'react'
import styled from 'styled-components'

/******************************************************************************/
// Data
/******************************************************************************/

const ACTIONS = [ 'create', 'destroy', 'force', 'select' ]

const Button = styled.button`
  border: none;
  background: transparent;
  color: gray;
  cursor: pointer;

  &:hover {
    color: white;
  }

  outline: none;
  transition: color 250ms;
`
/******************************************************************************/
// Exports
/******************************************************************************/

const Buttons = ({ action, setAction }) =>
  <div>
      {ACTIONS.map(a =>
        <Button key={a} active={action === a} onClick={() => setAction(a)} >{a}</Button>
      )}
  </div>

export default Buttons
