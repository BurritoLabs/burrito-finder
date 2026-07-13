const webpack = require("webpack");
const path = require("path");

const axiosPath = path.resolve(__dirname, "node_modules/axios");

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
  config.resolve.alias = {
    ...config.resolve.alias,
    "axios$": path.join(axiosPath, "index.js")
  };
  const moduleScopePlugin = config.resolve.plugins?.find(
    plugin => plugin.constructor?.name === "ModuleScopePlugin"
  );
  if (moduleScopePlugin && !moduleScopePlugin.allowedPaths.includes(axiosPath)) {
    moduleScopePlugin.allowedPaths.push(axiosPath);
  }
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser.js"
    })
  );
  return config;
};
