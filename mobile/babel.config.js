module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["@babel/plugin-transform-typescript", { isTSX: true, allExtensions: true, allowDeclareFields: true }],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "react-native-reanimated/plugin",
    ],
  };
};
