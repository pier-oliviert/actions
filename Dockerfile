FROM oven/bun:latest

COPY package.json ./
COPY bun.lockb ./
COPY src ./
COPY index.ts .

RUN bun install

