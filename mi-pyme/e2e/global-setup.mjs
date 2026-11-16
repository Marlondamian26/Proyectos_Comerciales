import { execFileSync } from "child_process";
import path from "path";

const scriptPath = path.resolve(
  import.meta.dirname,
  "global-setup-impl.ts"
);

execFileSync("npx", ["tsx", scriptPath], { stdio: "inherit" });
