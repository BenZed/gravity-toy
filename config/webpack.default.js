const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { ModuleConcatenationPlugin, CommonsChunkPlugin } = webpack.optimize

module.exports = {

  entry: {
    'gravity-toy': path.resolve(__dirname, '../src/webpack/index.js'),
    'simulation': path.resolve(__dirname, '../src/modules/simulation'),
    'react': [ 'react', 'react-dom' ],
    'styled-components': [ 'styled-components' ]
  },

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
      title: 'Gravity Toy',
      inject: 'head',
      hash: true,
      template: 'src/public/index.html'
    }),
    new ExtractTextPlugin('styles.css'),
    new ModuleConcatenationPlugin(),
    new CommonsChunkPlugin({
      names: [ 'simulation', 'styled-components', 'react' ],
      minChunks: Infinity
    })
  ],

  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../example')
  }
}
