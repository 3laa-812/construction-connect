module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"]
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
      ["@babel/plugin-transform-class-static-block"],
      "react-native-reanimated/plugin",
    ],
  };
};
