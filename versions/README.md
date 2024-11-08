# version management through tags

if you tag your library (ie, semver), you can use this github action to parse
the version from the tag and store it as repo variable so you can use that version
in your build steps.

## inputs

here's a list of all environment variables that you can use to tweak the behavior.
bold names mean the environment variable is **required** and needs to be set by you.

|name|default|description|
|--|--|--|
|**auth_token**| |filename of where you want to have the changelogs committed.|
|**owner**| |owner of the repo (user or organization)|
|**repo**| |name of the repository you want to create the changelogs|
|variable|`version`|the name of the repo variable you want to use.|

## outputs

|name|description|
|--|--|
|previousVersion|The name of the previous version that was tagged (`v0.0.1`)|
|nextVersion|The name of the version that triggered this action (`v0.0.2`)|
|releaseHash|The hash of the commit that points to the nextVersion tag|
|changelog|The generated changelog, to be used by other actions|

## usage
