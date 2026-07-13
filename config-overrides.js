const webpack = require("webpack");

module.exports = config => {
  config.ignoreWarnings = [
    ...(config.ignoreWarnings ?? []),
    /Failed to parse source map/s
  ];
  config.resolve.fallback = {
    ...config.resolve.fallback,
    assert: require.resolve("assert/"),
    crypto: require.resolve("crypto-browserify"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify/browser"),
    stream: require.resolve("stream-browserify"),
    url: require.resolve("url/")
  };
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser.js"
    })
  );
  return config;
};
