import { useEffect } from 'react'

import { on, off, useStateTree } from '@benzed/react'
import { wrap, ensure, remove } from '@benzed/array'
import is from 'is-explicit'

/******************************************************************************/
// Data
/******************************************************************************/

// Normally there should not be a global state, but in this particular case it should
// be fine.
const DOWN_KEYS = []

/******************************************************************************/
// Events
/******************************************************************************/

function pressKey (e) {

  const [ gravity, { down, hold, keys: key, meta, shift, alt } ] = this

  const keys = wrap(key)

  const pressValidated = keys.includes(e.key) &&
    !DOWN_KEYS.includes(e.key) &&
    e.metaKey === !!meta &&
    e.shiftKey === !!shift &&
    e.altKey === !!alt

  if (!pressValidated)
    return

  e.preventDefault()
  e.stopPropagation()

  for (const key of keys)
    DOWN_KEYS::ensure(key)

  if (is.func(hold))
    gravity._runOnUpdate::ensure(hold)

  if (is.func(down))
    down(e)

}

function releaseKey (e) {

  const [ gravity, { up, hold, keys: key } ] = this

  const keys = wrap(key)
  if (!keys.includes(e.key) || !DOWN_KEYS.includes(e.key))
    return

  for (const key of keys)
    DOWN_KEYS::remove(key)

  if (is.func(hold))
    gravity._runOnUpdate::remove(hold)

  if (is.func(up))
    up(e)

}

/******************************************************************************/
// Main
/******************************************************************************/

const useKeyCommand = config => {

  const gravity = useStateTree()

  useEffect(() => {

    const onKeyDown = [gravity, config]::pressKey
    const onKeyUp = [gravity, config]::releaseKey

    window::on('keydown', onKeyDown)
    window::on('keyup', onKeyUp)

    return () => {
      window::off('keydown', onKeyDown)
      window::off('keyup', onKeyUp)
    }

  }, [ config.key ])

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default useKeyCommand
