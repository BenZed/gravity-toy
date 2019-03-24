import { Color, Styler, themes } from '@benzed/react'
import { DEFAULT_RENDERING } from '../simulation/constants'
/******************************************************************************/
// Constants
/******************************************************************************/

const PURPLE = DEFAULT_RENDERING.trailColor
const GREEN = DEFAULT_RENDERING.detailsColor
const ORANGE = `#ff9900`
const BLACK = `black`

/******************************************************************************/
// Theme
/******************************************************************************/

const theme = {

  ...themes.basic,
  bg: new Color(BLACK),
  fg: new Color(PURPLE),

  brand: {
    primary: new Color(PURPLE),
    detail: new Color(GREEN),
    danger: new Color(ORANGE)
  },

  titleSize: 3 // vw
}

const $ = Styler.createInterface(theme)

/******************************************************************************/
// Export
/******************************************************************************/

export default $

export {
  theme, $
}
