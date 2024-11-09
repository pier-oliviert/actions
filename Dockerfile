FROM oven/bun:latest

WORKDIR /actions
COPY package.json ./
COPY bun.lockb ./
COPY src ./src/
COPY index.ts .

RUN bun install

CMD ["bun"]
