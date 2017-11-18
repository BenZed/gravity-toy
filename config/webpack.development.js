const def = require('./webpack.default')
const path = require('path')

module.exports = {
  ...def,

  devServer: {
    contentBase: path.resolve(__dirname, '../src/public'),
    inline: true,
    hot: false,
    port: 4000,
    host: '0.0.0.0',
    historyApiFallback: true,
    stats: {
      warnings: false
    }
  },

  devtool: 'eval-source-map'

}
