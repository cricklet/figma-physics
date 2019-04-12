const path = require('path');

module.exports = {
  entry: {
    plugin: './plugin.ts',
    sandbox: './sandbox.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'out')
  },
  node: {
    fs: 'empty'
  },
  devtool: 'source-map',
};