import * as core from '@actions/core';
import { parse } from "semver";
import { Octokit } from "@octokit/rest";


export async function execute() {
  const mainBranch = core.getInput("main_branch") || "main"
  const authToken = core.getInput("auth_token")!
  const repoPath = core.getInput("repo")!
  const version = parse(core.getInput("version"))!
  const tag = core.getInput("tag")!

  const octokit = new Octokit({ auth: authToken });
  const [owner, repo] = repoPath.split("/")

  const response = await octokit.rest.repos.createRelease({
    owner: owner,
    repo: repo,
    name: `v${version?.toString()}`,
    tag_name: tag,
    body: core.getInput("changelog"),
    target_commitish: mainBranch,
    draft: false,
    make_latest: "true",
  })

  core.setOutput("id", response.data.id)
  core.setOutput("url", response.data.url)
  core.setOutput("upload_url", response.data.upload_url)
}

