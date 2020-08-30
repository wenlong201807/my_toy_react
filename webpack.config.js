module.exports = {
  entry: {
    main: './main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],//环境适配
            plugins: [['@babel/plugin-transform-react-jsx', {
              pragma:'createElement' // 也可以使用 'longReact'//
            }],] // react支持jsx语法，并自定义标签名
          }
        }
      }
    ]
  },
  mode: 'development',
  optimization: {
    minimize: false
  }
}