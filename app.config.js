// Dynamic config on top of app.json: CI passes the build number (GitHub run number) as EXPO_PUBLIC_APP_BUILD so
// every APK has a higher Android versionCode than the last; the same variable is inlined into the JS bundle, where
// src/update/updater.ts compares it with the published latest.json.
const build = Number(process.env.EXPO_PUBLIC_APP_BUILD || process.env.APP_BUILD) || 1;

module.exports = ({ config }) => ({
  ...config,
  version: `1.0.${build}`,
  android: {
    ...config.android,
    versionCode: build,
    permissions: [...(config.android?.permissions ?? []), 'android.permission.REQUEST_INSTALL_PACKAGES'],
  },
});
