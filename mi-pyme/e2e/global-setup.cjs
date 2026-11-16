const { execFileSync } = require("child_process");
const path = require("path");

module.exports = async function globalSetup() {
  const scriptPath = path.resolve(__dirname, "global-setup-impl.ts");
  execFileSync("npx", ["tsx", scriptPath], { stdio: "inherit" });
};
