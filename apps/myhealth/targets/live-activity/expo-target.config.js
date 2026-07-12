/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "MyHealthWidgets",
  deploymentTarget: "16.2",
  bundleIdentifier: ".widgets",
  frameworks: ["SwiftUI", "ActivityKit", "WidgetKit"],
};
