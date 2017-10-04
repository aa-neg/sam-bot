const webpack = require("webpack");
const path = require("path");

const config = {
  entry: ["whatwg-fetch", "./index.js"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true
            }
          }
        ]
      }
    ]
  },
  plugins: []
};

if (process.env.NODE_ENV === "production") {
}

if (process.env.NODE_ENV === "devlopment") {
  config.devServer = {
    historyApiFallback: true
  };
}

module.exports = config;
