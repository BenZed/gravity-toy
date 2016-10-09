const
  //webpack = require('webpack'),
  path = require('path')

const PATHS = {
  build: path.join(__dirname, 'web'),
  src: path.join(__dirname, 'src')
}

module.exports = {

  entry: {
    src: PATHS.src,
  },

  output: {
    path: PATHS.build,
    filename: 'gravity-toy-web.js'
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
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
        query: {
          cacheDirectory: true,
          presets: ['es2015','react']
        },
        include: PATHS.src
      }
    ]
  },

  externals: {
    'react' : 'React'
  },

  devServer: {
    contentBase: PATHS.app,

    historyApiFallback: true,
    inline: true,
    progress: true,

    stats: 'errors-only',

    host: process.env.HOST,
    port: process.env.PORT || 3100
  }

}
