import 'normalize.css'
import './assets/gravity-toy.css'

/******************************************************************************/
// Dynamic
/******************************************************************************/

const dependencies = [
  import('react'),
  import('react-dom'),
  import('../ui')
]

/******************************************************************************/
// Execute
/******************************************************************************/

void async function load () { // eslint-disable-line wrap-iife

  const [

    { default: React },
    { render },
    { GravityToy, GravityToyStateTree }

  ] = await Promise.all(dependencies)

  const mainTag = document
    .getElementById('gravity-toy')

  const gravity = new GravityToyStateTree()

  render(<GravityToy gravity={gravity} />, mainTag)

}()
