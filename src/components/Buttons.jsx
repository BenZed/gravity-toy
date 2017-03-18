import React from 'react'

const ACTIONS = ['create', 'destroy', 'force', 'select']//, 'protodisc', 'system']

const Button = ({active, children, ...rest}) =>
  <button className={active ? 'active' : null} {...rest}>{children}</button>

export default ({ action, disabled, setAction }) =>
  <div className={`buttons ${disabled ? 'disabled' : ''}`}>
    {ACTIONS.map(a =>
      <Button key={a} active={action === a} onClick={() => setAction(a)} >{a}</Button>
    )}
  </div>
