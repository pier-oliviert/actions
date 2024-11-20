import * as core from '@actions/core';
import { $ } from "bun";

interface CommitRange {
  start?: string
  end: string
}

export async function execute() {
  const commits: CommitRange = {
    start: core.getInput("commit_start"),
    end: core.getInput("commit_end")!
  }

  if (!commits.start) {
    console.log("Can't create a changelog as there's no older tag, a changelog will be generated when the next tag is created")
    return
  }

  // Retrieving history up to the start of the release
  await $`git switch main`
  await $`git pull origin main`

  // end -> start as the end is the oldest hash and the newest is the commit that was tagged
  // the new version
  const changelog = await $`git-cliff ${commits.start}..${commits.end} `.text()

  Bun.write(Bun.stdout, changelog)

  core.setOutput('changelog', changelog)
}
