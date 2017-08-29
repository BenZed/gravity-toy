const
  // webpack = require('webpack'),
  path = require('path')

const PORT = 6500
const host = '0.0.0.0'

const PATHS = {
  build: path.join(__dirname, 'web'),
  src: path.join(__dirname, 'src')
}

module.exports = {

  entry: [
    `webpack-dev-server/client?http://${host}:${PORT}`,
    PATHS.src
  ],

  output: {
    path: PATHS.build,
    publicPath: '/',
    filename: 'gravity-toy-web.js'
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      child_process: path.join(PATHS.src, 'modules/core')
    }
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: PATHS.src
      },

      {
        test: /\.json$/,
        loader: 'json-loader',
        include: PATHS.src
      },

      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },

  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },

  devServer: {
    contentBase: PATHS.src,
    port: PORT,
    host
  }
}
