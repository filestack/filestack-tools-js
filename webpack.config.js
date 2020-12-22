const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './dist/module/index.js',
  node: { Buffer: false, fs: 'empty', assert: 'empty' },
  watchOptions: {
    ignored: /node_modules/
  },
  output: {
    libraryTarget: 'umd',
    library: 'filestack-tools',
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'filestack-tools.js',
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': 'production',
    }),
    new webpack.NormalModuleReplacementPlugin(/^(.*\/node\/.*\.js|.*\.node\.js)$/,  (result) => {
      if (result.resource) {
        result.resource = result.resource.replace(/node/g, 'browser');
      }
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /^.*\.node\.js|.*\.node\.spec\.js|.*\.browser\.spec\.js|.*\.spec\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: '> 0.25%, not dead, ie 11',
                },
              ],
            ],
          },
        },
      },
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin()],
    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/
        }
      },
      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: false
    }
  }
}
