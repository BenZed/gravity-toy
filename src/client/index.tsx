import 'normalize.css'
import './assets/gravity-toy.css'

/*** Chunk Loaded Dependencies ***/

const dependencies = [
  import('react'),
  import('react-dom')
] as const

/*** Main ***/

Promise.all(dependencies).then(([
  { default: React },
  { render }
]) => {

  const mainTag = document
    .getElementById('gravity-toy')

  render(<p>Gravity Toy</p>, mainTag)
})
