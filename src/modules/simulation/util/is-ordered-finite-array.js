import is from 'is-explicit'

export default function isOrderedFiniteArray (values) {

  if (!is(values, Array))
    return false

  let previous = -Infinity

  for (const value of values) {
    if (!isFinite(value) || previous >= value)
      return false

    previous = value
  }

  return true
}
