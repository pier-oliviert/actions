import * as core from '@actions/core';
import { $, Glob, write, type BunFile } from "bun";
import { Octokit } from "@octokit/rest";
import * as yaml from 'js-yaml';
import path from "path";

interface Chart {
  name: string
  description: string
  type: string

  apiVersion: string
  version: string
  appVersion: string
}

interface Manifest {
  apiVersion: string
  generated: string
  entries: Record<string, Entry[]>
}

interface Entry {
  apiVersion: string
  created: string
  description: string
  digest: string
  name: string
  type: string
  urls: string[]
  version: string
}

export async function execute() {
  const authToken = core.getInput("auth_token")!
  const version = core.getInput("version")!
  const chartPath = core.getInput("charts") || "charts/"
  const chartFile = core.getInput("chart_yaml") || "Chart.yaml"
  const helmDestPath = core.getInput("tmp_path") || "/tmp/charts/"
  const uploadURL = core.getInput("release_upload_url")!
  const branch = core.getInput("page_branch") || "gh-pages"
  const indexLocation = "./index.yaml"

  const octokit = new Octokit({ auth: authToken });

  let chart = yaml.load(await Bun.file(`${path.join(chartPath, chartFile)}`).text()) as Chart

  await $`helm package ${chartPath} -d ${helmDestPath} --version ${version}`
  await $`helm repo index ${helmDestPath}`

  let pkgManifest = yaml.load(await Bun.file(`${helmDestPath}/index.yaml`).text()) as Manifest

  if (await branchExists(branch)) {
    console.log("Branch exists, switching and updating")
    await $`git switch ${branch}`
    await $`git pull origin ${branch} --rebase`
  } else {
    console.log("Branch does not exist, creating")
    await $`git switch --orphan ${branch}`
  }


  const index = Bun.file(indexLocation)
  const manifest = await mergeManifests(pkgManifest, index)

  for (const key in manifest.entries[chart.name]) {
    const entry = manifest.entries[chart.name][key]

    for (const urlKey in entry.urls) {
      const name = entry.urls[urlKey]
      const pkg = Bun.file(path.join(helmDestPath, name))
      if (await pkg.exists()) {

        const response = await octokit.request(`POST ${uploadURL}`, {
          name: name,
          data: Bun.file(path.join(helmDestPath, name)),
        })
        entry.urls[urlKey] = response.data.browser_download_url
      }

    }
  }

  console.log("Helm package uploaded")
  console.log("Helm index uploaded")

  const helmEmoji = "☸️"
  const writer = index.writer()
  writer.write(yaml.dump(manifest))
  await writer.end()

  await $`git add ${indexLocation}`
  await $`git commit -m "${helmEmoji} deployed"`
  await $`git push origin ${branch}`
}

async function branchExists(branch: string): Promise<boolean> {
  const { exitCode, stdout } = await $`git ls-remote --heads origin /refs/heads/${branch}`.nothrow().quiet()
  if (exitCode != 0 || stdout.length == 0) {
    return false
  }

  return true
}

async function mergeManifests(release: Manifest, index: BunFile): Promise<Manifest> {
  if (!await index.exists()) {
    return release
  }

  const manifest = yaml.load(await index.text()) as Manifest

  for (const app in release.entries) {
    if (!manifest.entries[app]) {
      manifest.entries[app] = release.entries[app]
    }

    let existingEntries = manifest.entries[app]!

    for (const key in release.entries[app]) {
      const entry = release.entries[app][key]
      const idx = existingEntries.findLastIndex(e => e.name == entry.name && e.type == entry.type && e.apiVersion == entry.apiVersion && e.version == entry.version)
      if (idx == -1) {
        // unshift means prepend, only in JavaScript.
        existingEntries.unshift(entry)
      } else {
        existingEntries[idx] = entry
      }
    }
  }

  return manifest
}
