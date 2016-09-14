const webpack = require('webpack'),
  path = require('path')

const PATHS = {
  src: path.join(__dirname, 'src'),
  app: path.join(__dirname, 'app')
}

module.exports = {
  entry: {
    src: PATHS.src,
  },
  output: {
    path: PATHS.app,
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.s?css$/,                             loaders: ['style', 'css', 'sass']},
      { test: /\.jsx?$/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015']
        },
        include: PATHS.src }
    ]
  },
  devServer: {
    contentBase: PATHS.app,

    // Enable history API fallback so HTML5 History API based
    // routing works. This is a good default that will come
    // in handy in more complicated setups.
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,

    // Display only errors to reduce the amount of output.
    stats: 'errors-only',

    // Parse host and port from env so this is easy to customize.
    //
    // If you use Vagrant or Cloud9, set
    // host: process.env.HOST || '0.0.0.0';
    //
    // 0.0.0.0 is available to all network devices unlike default
    // localhost
    host: process.env.HOST,
    port: process.env.PORT || 3100
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      React: 'react'
    })
  ]
}
