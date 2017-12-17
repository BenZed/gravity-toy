import React, { cloneElement, Children } from 'react'
import { func } from 'prop-types'

/******************************************************************************/
// Touch Component
/******************************************************************************/

class Touch extends React.Component {

  startClientX = 0
  startClientY = 0

  static propTypes = {
    onPan: func,
    onPanStart: func,
    onPanEnd: func
  }

  state = {}

  get coords () {
    const { startX, startY, deltaX, deltaY, currentX, currentY } = this
    return { startX, startY, deltaX, deltaY, currentX, currentY }
  }

  onTouchStart = e => {

    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
    this.deltaX = 0
    this.deltaY = 0
    this.currentX = 0
    this.currentY = 0

    const { onPanStart } = this.props
    if (onPanStart) {
      const state = onPanStart(this.coords, this.state)
      if (typeof state === 'object')
        this.setState(state)
    }
  }

  onTouchMove = e => {

    const lastCurrentX = this.currentX
    const lastCurrentY = this.currentY

    this.currentX = e.touches[0].clientX - this.startX
    this.currentY = e.touches[0].clientY - this.startY
    this.deltaX = this.currentX - lastCurrentX
    this.deltaY = this.currentY - lastCurrentY

    const { onPan } = this.props
    if (onPan) {
      const state = onPan(this.coords, this.state)
      if (typeof state === 'object')
        this.setState(state)
    }
  }

  onTouchEnd = e => {
    this.deltaX = 0
    this.deltaY = 0

    const { onPanEnd } = this.props
    if (onPanEnd) {
      const state = onPanEnd(this.coords, this.state)
      if (typeof state === 'object')
        this.setState(state)
    }
  }

  render () {
    const { children, ...props } = this.props
    const { onTouchStart, onTouchMove, onTouchEnd } = this
    const child = Children.only(children)

    return cloneElement(child, { ...props, onTouchStart, onTouchMove, onTouchEnd })
  }
}

/******************************************************************************/
// Mutator
/******************************************************************************/

function touchable () {

  const Component = this

  return ({ onPanStart, onPan, onPanEnd, ...props }) =>
    <Touch
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}>

      <Component {...props} />

    </Touch>
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default touchable

export { touchable, Touch }
