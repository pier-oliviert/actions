FROM oven/bun:latest

WORKDIR /action
COPY package.json ./
COPY bun.lockb ./
COPY src ./src/
COPY index.ts .

RUN bun install

