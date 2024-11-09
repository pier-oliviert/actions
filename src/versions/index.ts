import * as core from '@actions/core';
import { parse, SemVer } from "semver";
import { Octokit } from "@octokit/core";
import { version } from 'bun';

interface Range {
  older?: Tag
  newer?: Tag
}

interface Tag {
  name: string
  commit: string
  version: SemVer
}

export async function execute() {
  let envName = core.getInput("variable") || "VERSION"
  const authToken = core.getInput("auth_token")!
  const repoPath = core.getInput("repo")!

  // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
  const octokit = new Octokit({ auth: authToken });

  const [owner, repo] = repoPath.split("/")
  const tags = await octokit.request('GET /repos/{owner}/{repo}/tags', {
    owner: owner,
    repo: repo,
    per_page: 4,
  })

  console.log("Getting the most recent versionned tag")
  let bounds: Range = {}

  for (let t of tags.data) {
    const version = parse(t.name)
    if (!version) {
      continue
    }

    if (!bounds.newer) {
      bounds.newer = {
        commit: t.commit.sha,
        name: t.name,
        version: version,
      }
      continue
    }

    if (bounds.newer.version.compare(version) == 1) {
      bounds.older = {
        commit: t.commit.sha,
        name: t.name,
        version: version,
      }
    }
  }

  if (!bounds.newer) {
    core.setFailed("No version found in the last 4 tags on this repo.");
  }

  bounds.newer = bounds.newer!

  const variables = await octokit.request('GET /repos/{owner}/{repo}/actions/variables', {
    owner: owner,
    repo: repo,
  })


  const variable = variables.data.variables.find(v => v.name == envName)

  if (!variable) {
    console.log("Never created a version variable. Creating...")

    await octokit.request('POST /repos/{owner}/{repo}/actions/variables', {
      owner: owner,
      repo: repo,
      name: envName,
      value: `v${bounds.newer.version.toString()}`
    })

    core.setOutput('version', bounds.newer.version.toString())
    core.setOutput('tag', bounds.newer.name)
    core.setOutput('version_start_hash', bounds.newer.commit)
    return
  }

  console.log(`Updating ${version} to ${bounds.newer.version.toString()}`)

  await octokit.request('PATCH /repos/{owner}/{repo}/actions/variables/{name}', {
    owner: owner,
    repo: repo,
    name: envName,
    value: `v${bounds.newer.version.toString()}`
  })

  core.setOutput('tag', bounds.newer.name)
  core.setOutput('version', bounds.newer.version.toString())
  core.setOutput('version_start_hash', bounds.older?.commit)
  core.setOutput('version_end_hash', bounds.newer.commit)

  return
}
