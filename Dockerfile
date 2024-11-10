FROM orhunp/git-cliff:latest AS git-cliff

FROM oven/bun:alpine

WORKDIR /actions
COPY package.json ./
COPY bun.lockb ./
COPY src ./src/
COPY index.ts .

RUN bun install
RUN apk --no-cache --update add git git-lfs helm

COPY --from=git-cliff /usr/local/bin/git-cliff /usr/local/bin

ENTRYPOINT [ "bun" ]
