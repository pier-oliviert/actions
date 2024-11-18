import * as core from '@actions/core';
import { parse, SemVer } from "semver";
import { $ } from 'bun';

interface Tag {
  name: string
  commits: CommitRange
  version: SemVer
}

interface CommitRange {
  start: string
  end: string
}

export async function execute() {
  const tagFormat = core.getInput("format") || "v*"

  // Fetch the most recent tags
  await $`git fetch origin --tags`
  const output = await $`git for-each-ref --sort "-v:refname" --count=2 --format='%(refname:short) %(objectname)' 'refs/tags/${tagFormat}'`.text()

  const tags = output.split("\n").map(value => {
    return value.split(" ")
  })

  const semVer = parse(tags[0][0])!
  const tag: Tag = {
    name: semVer.raw,
    version: semVer,
    commits: commitRanges(tags)
  }

  core.setOutput('tag', tag.name)
  core.setOutput('version', tag.version.toString())
  core.setOutput('commit_end', tag.commits.end)
  core.setOutput('commit_start', tag.commits.start)

  return
}

function commitRanges(tags: string[][]): CommitRange {
  return {
    start: tags[1][1],
    end: tags[0][1],
  }
}
