const
  //webpack = require('webpack'),
  path = require('path')

const PATHS = {
  app: path.join(__dirname, 'web'),
  build: path.join(__dirname, 'src')
}

module.exports = {

  entry: {
    app: PATHS.app,
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
          presets: ['react', 'es2015']
        },
        include: PATHS.app
      }
    ]
  },

  externals: {
    'react' : 'React'
  },

  devServer: {
    contentBase: PATHS.build,

    historyApiFallback: true,
    inline: true,
    progress: true,

    stats: 'errors-only',

    host: process.env.HOST,
    port: process.env.PORT || 3100
  }

}
