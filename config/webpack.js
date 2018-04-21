const { WebpackConfig } = require('@benzed/react')
const path = require('path')

module.exports = new WebpackConfig({ output: path.resolve(__dirname, '../example') })
