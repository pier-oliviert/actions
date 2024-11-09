import * as core from '@actions/core';
import { $ } from "bun";

export async function execute() {
  const changelogFile = core.getInput("changelog_file") || "CHANGELOG.md"
  const mainBranch = core.getInput("main_branch") || "main"
  const startHash = core.getInput("version_start_hash")!
  const endHash = core.getInput("version_end_hash")

  const file = Bun.file(changelogFile);
  let content

  if (await file.exists()) {
    content = await file.text()
  }

  if (!endHash) {
    console.log("Can't create a changelog as there's no older tag, a changelog will be generated when the next tag is created")
    return
  }

  // Retrieving history up to the start of the release
  await $`git fetch origin ${startHash}`.quiet()
  await $`git reset --hard FETCH_HEAD`.quiet()

  // end -> start as the end is the oldest hash and the newest is the commit that was tagged
  // the new version
  const changelog = await $`git-cliff ${startHash}..${endHash} `.text()

  // Resetting history 
  await $`git reset --hard origin/${mainBranch}`.quiet()

  const writer = file.writer()
  writer.write(changelog)

  if (content) {
    writer.write(content)
  }

  writer.flush()

  // FIXUP: Bun will escape emojis if they aren't provided as input to the shell command.
  // https://github.com/oven-sh/bun/issues/8745
  const emoji = "📌"

  await $`git add -f ${changelogFile} && git commit -m "${emoji} Changelog" && git push origin ${mainBranch}`

  core.setOutput('changelog', changelog)
}
