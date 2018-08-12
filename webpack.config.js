// const { WebpackConfig } = require('@benzed/dev')
const path = require('path')

/******************************************************************************/
// Production
/******************************************************************************/
// const webpackConfig = new WebpackConfig({
//   output: path.resolve(__dirname, '../example')
// })

/******************************************************************************/
// DEV
/******************************************************************************/

// TODO Remove this once @benzed packages are all done
const fs = require('fs')

const BENZED = path.resolve(__dirname, '../benzed-mono')
const BENZED_NM = path.resolve(BENZED, 'node_modules')
const BENZED_PKG = path.resolve(BENZED, 'packages')

const names = fs.readdirSync(BENZED_PKG)

// Create Webpack Config From Dev
const { WebpackConfig } = require(path.join(BENZED_PKG, 'dev'))
const webpackConfig = new WebpackConfig({
  output: path.resolve(__dirname, '../example'),
  html: path.resolve(__dirname, 'src', 'webpack', 'index.html')
})

// Resolve BenZed node_modules
webpackConfig.resolve.modules = [ 'node_modules', BENZED_NM ]
webpackConfig.resolve.alias = {}

// Alias BenZed Packages
for (const name of names)
  webpackConfig.resolve.alias[`@benzed/${name}`] = path.join(BENZED_PKG, name)

/******************************************************************************/
// Exports
/******************************************************************************/

module.exports = webpackConfig
