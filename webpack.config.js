const webpack = require("webpack"),
      path = require("path");

const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
};

module.exports = {
  entry: {
    app: PATHS.app,
  },
  output: {
    path: PATHS.build,
    filename: "bundle.js"
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx", ".coffee", ".cjsx"]
  },
  module: {
	  loaders: [
      { test: /\.s?css$/,                             loaders: ["style", "css", "sass"]},
      { test: /\.coffee$/,                            loader: "coffee" },
      { test: /\.cjsx$/,                              loaders: ["coffee", "cjsx"] },
      { test: /\.(coffee\.md|litcoffee)$/,            loaders: ["coffee", "literate"] },
      { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,  loader: 'url?limit=10000&mimetype=application/font-woff'},
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,           loader: 'url?limit=10000&mimetype=application/octet-stream'},
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,           loader: 'file'},
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,           loader: 'url?limit=10000&mimetype=image/svg+xml'},

      { test: /\.jsx?$/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          presets: ['react', 'es2015']
        },
        include: PATHS.app }
	  ]
  },
  devServer: {
    contentBase: PATHS.build,

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
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new webpack.ProvidePlugin({
      React: "react"
    })
  ]
}