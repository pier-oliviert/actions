import * as core from '@actions/core';
import { parse } from "semver";
import { Octokit } from "@octokit/core";

export async function execute() {
  let envName = core.getInput("variable") || "VERSION"
  const authToken = core.getInput("auth_token")!
  const repoPath = core.getInput("repo")!

  // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
  const octokit = new Octokit({ auth: authToken });

  const [owner, repo] = repoPath.split("/")
  const tags = await octokit.request('GET /repos/{repo}/tags', {
    repo: repo,
    per_page: 4,
  })

  console.log("Getting the most recent versionned tag")
  let tag
  let version

  for (let t of tags.data) {
    tag = t
    version = parse(t.name)
    if (!version) {
      continue
    }
    break
  }

  if (!version) {
    core.setFailed("No version found in the last 4 tags on this repo.");
  }

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
      value: `v${version?.toString()}`
    })
    core.setOutput('version', version)
    core.setOutput('tag', tag?.name)
    process.exit(0)
  }

  if (version?.compare(parse(variable?.value) || "") == 1) {
    console.log(`Updating version variable to ${version?.toString()}`)

    await octokit.request('PATCH /repos/{owner}/{repo}/actions/variables/{name}', {
      owner: owner,
      repo: repo,
      name: envName,
      value: `v${version?.toString()}`
    })

    core.setOutput('version', version.toString())
    core.setOutput('tag', tag?.name)
    process.exit(0)
  }

  core.setFailed(`Version is not newer than what is already set version variable to ${variable?.value}`)

}
