# version management through tags

if you tag your library (ie, semver), you can use this github action to parse
the version from the tag and store it as repo variable so you can use that version
in your build steps.

## inputs

here's a list of all environment variables that you can use to tweak the behavior.
bold names mean the environment variable is **required** and needs to be set by you.

|name|default|description|
|--|--|--|
|format|`v*`|The format of the tags that you use for versioning.|

## outputs

|name|description|
|--|--|
|tag|The name of the tag for the version generated (`v0.0.2`)|
|version|The semVer result for the tag's name (`0.0.2`)|
|commit_end|The commit sha for the tags|
|commit_start|The hash of the commit that points to the previous version, if any|

## usage
