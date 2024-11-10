import { parseArgs } from "util";
import { execute as executeVersion } from "./src/versions/index"
import { execute as executeRelease } from "./src/release/index"
import { execute as executeHelm } from "./src/helm/index"
import { execute as executeChangelogs } from "./src/changelogs/index"
import { $ } from "bun"

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

let task
switch (positionals[3]) {
  case "version":
    task = executeVersion
    break
  case "release":
    task = executeRelease
    break
  case "helm":
    task = executeHelm
    break
  case "changelogs":
    task = executeChangelogs
    break
  default:
    console.log(`Unknown action: ${positionals[3]}`)
    process.exit(1)
}

console.log(await $`stat -c "%u:%g" .`.quiet().text())
// Linux permission fixes for the workspace to work with git tools
console.log("Modifying workspace permissions")
await $`chown -R "$(id -u)" .`

await task()
