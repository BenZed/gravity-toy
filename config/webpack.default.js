const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const { ModuleConcatenationPlugin, CommonsChunkPlugin } = webpack.optimize

const pkg = require('../package.json')

/******************************************************************************/
// Setup
/******************************************************************************/

const APP_NAME = 'gravity-toy'

const MODULES = [ ...Object.keys(pkg.devDependencies), ...Object.keys(pkg.dependencies) ].filter(pkgName =>
  !/eslint|loader|babel|normalize|webpack|nodemon|mocha|chai/.test(pkgName)
)

const VENDOR_PREFIXES = [ 'react', 'styled', 'mobx' ]

const entry = {
  [APP_NAME]: path.resolve(__dirname, '../src/webpack/index.js'),
  // 'simulation': path.resolve(__dirname, '../src/modules/simulation'),
  ...MODULES.reduce((e, mod) => {
    if (VENDOR_PREFIXES.some(prfx => mod.includes(prfx)))
      (e.vendor = e.vendor || []).push(mod)

    return e
  }, {})
}

const CHUNK_NAMES = Object.keys(entry).filter(key => key !== APP_NAME)

/******************************************************************************/
// Exports
/******************************************************************************/

module.exports = {

  entry,

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        use: 'json-loader'
      },
      {
        test: /\.css/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.(ttf|eot|ico|png|gif|mp4|jpg|svg)(\?.+)?$/,
        use: 'file-loader'
      }
    ]
  },

  resolve: {
    extensions: [ '.js', '.jsx', '.json' ],
    modules: [
      'node_modules',
      path.resolve(__dirname, '../src')
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: 'head',
      hash: true,
      template: 'src/public/index.html'
    }),
    new ExtractTextPlugin('styles.css'),
    new ModuleConcatenationPlugin(),
    new CommonsChunkPlugin({
      names: CHUNK_NAMES
    }),
    new UglifyJsPlugin()
  ],

  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../example')
  }
}
