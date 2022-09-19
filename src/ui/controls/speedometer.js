import React from 'react'

import styled from 'styled-components'
import { useStateTree } from '@benzed/react'
import { $ } from '../theme'

/******************************************************************************/
// Component
/******************************************************************************/

const Speedometer = styled(props => {

    const { gravity, ...rest } = props

    useStateTree.observe(gravity, 'targetSpeed', 'actualSpeed')

    const { targetSpeed, actualSpeed } = gravity

    return <div {...rest} >
        <span>{targetSpeed}<sub>x</sub></span>

        <span data-match={actualSpeed !== targetSpeed}>
            {actualSpeed.toFixed(2)}<sub>x</sub>
        </span>
    </div>
})`

  margin: auto 0em 0.5em 0.25em;
  font-size: 0.8em;

  span:nth-child(2) {
    margin-left: 0.25em;
    color: ${$.theme.brand.danger};
    opacity: 0;
    transition: opacity 1000ms;
    &[data-match=true] {
      opacity: 1;
    }
  }
`

/******************************************************************************/
// Exports
/******************************************************************************/

export default Speedometer
