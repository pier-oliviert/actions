import { parseArgs } from "util";
import { execute as executeVersion } from "./src/versions/index"
import { execute as executeRelease } from "./src/release/index"
import { execute as executeHelm } from "./src/helm/index"
import { execute as executeChangelogs } from "./src/changelogs/index"

const { positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
});

if (positionals.length < 4) {
  console.log("Usage: bun run index.tx create (version|release|changelogs|helm) options")
  process.exit(1)
}

if (positionals[2] != "create") {
  console.log(`Unknown action: ${positionals[2]}`)
  process.exit(1)
}

switch (positionals[3]) {
  case "version":
    await executeVersion()
    break
  case "release":
    await executeRelease()
    break
  case "helm":
    await executeHelm()
    break
  case "changelogs":
    await executeChangelogs()
    break
  default:
    console.log(`Unknown action: ${positionals[3]}`)
    process.exit(1)
}
console.log(positionals);
