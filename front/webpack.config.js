var pkg = require('./package.json'),
    config = require('../config.json'),
    path = require('path'),
    util = require('util'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin')
    autoprefixer = require('autoprefixer'),
    csswring = require('csswring'),
    postcssCenter = require('postcss-center'),
    postcssShort = require('postcss-short');

var DEBUG = process.env.NODE_ENV === 'development';
var PRODUCTION = process.env.NODE_ENV === 'production';
var RUN_DEV_SERVER = !(process.env.NO_DEV_SERVER === 'true');
var DEV_PORT = 5000;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  DEBUG = true;
}

if (process.env.DEV_PORT) {
  DEV_PORT = process.env.DEV_PORT;
}

/**
 * ENTRY POINT
 */
var entryPoint = [];

if (DEBUG) {
  entryPoint.push('webpack-dev-server/client?http://localhost:' + DEV_PORT);
  entryPoint.push('webpack/hot/only-dev-server');
}

entryPoint.push(
  './application.jsx'
);


/**
 * LOADERS
 */
var jsxLoader = [];
var cssLoader = [];
var stylLoader = [];
var htmlLoader = [
  'file-loader?name=[path][name].[ext]',
  'template-html-loader?' + [
    'raw=true',
    'engine=lodash',
    'version=' + pkg.version,
    'title=' + pkg.name,
    'debug=' + DEBUG
  ].join('&')
];
var fileLoader = ['file-loader?name=[path][name].[ext]'];
var jsonLoader = ['json-loader'];

if (DEBUG) {
  jsxLoader.push('react-hot');
  cssLoader.push('style-loader', 'css-loader?sourceMap', 'postcss-loader');
  stylLoader.push('style-loader', 'css-loader?sourceMap', 'postcss-loader', 'stylus-loader');
  cssLoader = cssLoader.join('!');
  stylLoader = stylLoader.join('!');
}
else {
  stylLoader = ExtractTextPlugin.extract('style-loader',
                ['css-loader', 'postcss-loader', 'stylus-loader'].join('!'));
  cssLoader = ExtractTextPlugin.extract('style-loader',
                ['css-loader', 'postcss-loader'].join('!'));
}

jsxLoader.push('babel-loader?optional=runtime');


/**
 * PLUGINS
 */
var Plugins = [
  new webpack.optimize.OccurenceOrderPlugin()
];

Plugins.push(new webpack.DefinePlugin({
  VERSION: JSON.stringify(pkg.version),
  API_ADDRESS: JSON.stringify((config.api.ssl ? 'https' : 'http') + '://' + config.api.host +
        (((config.api.port == 80 && !config.api.ssl) || (config.api.port == 443 && config.api.ssl)) ? '' : ':' + config.api.port))
}));

switch (process.env.NODE_ENV.toLowerCase()) {
  case 'development':
    Plugins.push(new webpack.HotModuleReplacementPlugin());
    break;
  case 'production':
    Plugins.push(new ExtractTextPlugin( path.join('css', util.format('[name]-%s.css', pkg.version)), {
      allChunks: true
    }));
    Plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }));
    Plugins.push(new webpack.optimize.DedupePlugin());
    Plugins.push(new webpack.NoErrorsPlugin());
    break;
};


/**
 * BASE CONFIG
 */

module.exports = {
  context: path.join(__dirname + '/app'),
  entry: {
    internalizer: entryPoint
  },
  output: {
    path: path.join(__dirname + '/build'),
    filename: 'js/[name]-' + pkg.version + '.js',
    publicPath: '/',
    pathinfo: false
  },
  target: 'web',
  cache: DEBUG,
  debug: DEBUG,
  module: {
    loaders: [
      { test: /\.jsx?$/,    loaders: jsxLoader, exclude: /node_modules/ },
      { test: /\.css$/,     loader: cssLoader },
      { test: /\.styl$/,    loader: stylLoader + '?paths=' + path.join(__dirname, 'app/stylus') },
      { test: /\.html?$/,   loader: htmlLoader.join('!') },
      { test: /\.json?$/,   loader: jsonLoader.join('!') },
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.json'],
    modulesDirectories: ['web_modules', 'node_modules', './app', path.join(__dirname, 'app/components')]
  },
  plugins: Plugins,
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    hot: true,
    noInfo: true,
    inline: true,
    stats: {
      color: true
    },
    historyApiFallback: true
  },
  postcss: function () {
    return [autoprefixer, csswring, postcssCenter, postcssShort]
  }
};
