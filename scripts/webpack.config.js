const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: path.join(__dirname, '../lib/index.js'),
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'dcwebapi.min.js',
    library: 'dcWebapi',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  
  module: {
    rules: [
      {
        test: /.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  
  plugins: [
    new UglifyJsPlugin({
      parallel: true,
      cache: true,
      uglifyOptions: {
        ecma: 8,
        warnings: false,
        parse: {},
        output: {
          comments: false,
          beautify: false
        },
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false
      }
    })
  ]
}