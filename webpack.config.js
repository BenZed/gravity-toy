const
  //webpack = require('webpack'),
  path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')

const PORT = 5000

const PATHS = {
  build: path.join(__dirname, 'web'),
  src: path.join(__dirname, 'src')
}

module.exports = {

  entry: [
    'webpack-dev-server/client?http://0.0.0.0:' + PORT,
    PATHS.src,
  ],

  output: {
    path: PATHS.build,
    publicPath: '/',
    filename: 'gravity-toy-web.js'
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx'],
    alias: {
      child_process: path.join(PATHS.src, 'modules/core')
    }
  },

  module: {
    loaders: [
      {
        test: /\.s?css$/,
        loaders: ['style', 'css', 'sass']
      },
      // { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,  loader: 'url?limit=10000&mimetype=application/font-woff'},
      // { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,           loader: 'url?limit=10000&mimetype=application/octet-stream'},
      // { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,           loader: 'file'},
      // { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,           loader: 'url?limit=10000&mimetype=image/svg+xml'},

      {
        test: /\.jsx?$/,
        loader: 'babel',
        include: PATHS.src
      },

      {
        test: /\.json$/,
        loader: 'json',
        include: PATHS.src
      },


      {
        test: /\.html$/,
        loader: 'html'
      }
    ]
  },

  externals: {
    // 'react' : 'React',
    // 'react-dom' : 'ReactDOM',
    // 'mousetrap' : 'Mousetrap'
  },

  devServer: {
    contentBase: PATHS.src,
    port: PORT
  },

  plugins: [
    new ExtractTextPlugin('styles.css')
  ]

}
