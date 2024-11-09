import * as core from '@actions/core';
import { parse, SemVer } from "semver";
import { Octokit } from "@octokit/core";
import { $ } from "bun";

interface Range {
  older?: Tag
  newer?: Tag
}

interface Tag {
  commit: string
  version: SemVer
}

export async function execute() {
  const authToken = core.getInput("auth_token")!
  let envName = core.getInput("variable") || "VERSION"
  const changelogFile = core.getInput("changelog_file") || "CHANGELOG.md"
  const mainBranch = core.getInput("main_branch") || "main"
  const owner = core.getInput("owner")!
  const repo = core.getInput("repo")!

  // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
  const octokit = new Octokit({ auth: authToken });

  const variables = await octokit.request('GET /repos/{owner}/{repo}/actions/variables', {
    owner: owner,
    repo: repo,
  })


  let current = parse(variables.data.variables.find(v => v.name == envName)?.value)

  const tags = await octokit.request('GET /repos/{owner}/{repo}/tags', {
    owner: owner,
    repo: repo,
    per_page: 4,
  })

  console.log("Finding range for changelog")
  let bounds: Range = {}

  for (let t of tags.data) {
    const version = parse(t.name)
    if (!version) {
      continue
    }

    if (!bounds.newer) {
      bounds.newer = {
        commit: t.commit.sha,
        version: version,
      }
      continue
    }

    if (bounds.newer.version.compare(version) == 1) {
      bounds.older = {
        commit: t.commit.sha,
        version: version,
      }
    }
  }

  if (current == null) {
    console.log("No version present in repository variables, creating one.")
    octokit.request('POST /repos/{owner}/{repo}/actions/variables', {
      owner: owner,
      repo: repo,
      name: envName,
      value: `v${bounds.newer?.version.toString()}`
    })
  }


  if (!bounds.older) {
    console.log("Can't create a changelog as there's no older tag, a changelog will be generated when the next tag is created")
  }

  const file = Bun.file(changelogFile);
  let content

  if (await file.exists()) {
    content = await file.text()
  }

  const changelog = await $`git-cliff ${bounds.older?.commit}..${bounds.newer?.commit}`.text()

  const writer = file.writer()
  writer.write(changelog)

  if (content) {
    writer.write(content)
  }

  writer.flush()

  // FIXUP: Bun will escape emojis if they aren't provided as input to the shell command.
  // https://github.com/oven-sh/bun/issues/8745
  const emoji = "📌"

  await $`git add -f ${changelogFile} && git commit -m "${emoji} Changelog for ${bounds.newer?.version}" && git push origin ${mainBranch}`

  core.setOutput('previousVersion', bounds.older?.version);
  core.setOutput('releaseHash', bounds.newer?.commit);
  core.setOutput('changelog', changelog)
}
