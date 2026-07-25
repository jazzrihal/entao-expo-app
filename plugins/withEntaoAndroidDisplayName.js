const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

/**
 * Sets Android launcher `app_name` to Então while keeping Expo `name` as ASCII Entao
 * (PRODUCT_NAME / Gradle root / CFBundleName).
 *
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @returns {import('expo/config-plugins').ExpoConfig}
 */
function withEntaoAndroidDisplayName(config) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name" }, _: "Então" }],
      config.modResults,
    );
    return config;
  });
}

module.exports = withEntaoAndroidDisplayName;
