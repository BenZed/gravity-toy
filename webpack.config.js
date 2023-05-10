/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { EnvironmentPlugin } = require('webpack')
const path = require('path')
const fs = require('fs')

//// Constants ////

const WEBPACK_DEV_SERVER_PORT = 3500

const ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    APP_PORT: 3000
}

const LIB = path.resolve(__dirname, 'lib')

if (!fs.existsSync(LIB)) fs.mkdirSync(LIB)

const OUTPUT = path.resolve(LIB, 'public')

/// Config ////

module.exports = {
    mode: ENV.NODE_ENV,

    entry: './src/client/index.tsx',

    output: {
        filename: 'bz-[contenthash].js',
        path: OUTPUT,
        publicPath: '/'
    },

    devServer: {
        compress: true,
        port: WEBPACK_DEV_SERVER_PORT,
        historyApiFallback: true,
        host: '0.0.0.0',
        devMiddleware: {
            writeToDisk: true
        }
    },
    devtool: 'inline-source-map',

    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                loader: 'worker-loader'
            },
            {
                test: /\.tsx?$/i,
                use: {
                    loader: 'ts-loader'
                },
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.(svg|png|jpe?g|gif)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name]@[contenthash].[ext]'
                    }
                }
            }
        ]
    },

    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            util: false,
            path: false,
            child_process: false
        }
    },

    plugins: [
        new CleanWebpackPlugin({
            dangerouslyAllowCleanPatternsOutsideProject: true
        }),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            title: 'Gravity Toy',
            template: './src/client/assets/index.html',
            inject: 'head'
        }),
        new EnvironmentPlugin(ENV)
    ]
}
