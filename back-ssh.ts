#!/usr/bin/env bun

import { spawn } from "bun"
import { randomBytes } from "crypto"
import z from "zod"

// Generate random token and port
const token = randomBytes(32).toString("hex")
const port = Math.floor(Math.random() * (60000 - 40000 + 1)) + 40000

const executeInputSchema = z.object({
  args: z.array(z.string()),
  stdin: z.string().optional().nullable(),
})

// Start HTTP server
const server = Bun.serve({
  port,
  async fetch(req) {
    const auth = req.headers.get("Authorization")
    if (auth !== token) {
      return new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    if (url.pathname === "/execute" && req.method === "POST") {
      const input = executeInputSchema.parse(await req.json())

      const proc = spawn(input.args, {
        stdin: input.stdin ? "pipe" : null,
        stdout: "pipe",
        stderr: "pipe",
      })

      if (input.stdin) {
        const stdinData = Buffer.from(input.stdin, "base64")
        proc.stdin?.write(stdinData)
      }
      proc.stdin?.end()

      await proc.exited

      return new Response(
        JSON.stringify({
          stdout: await proc.stdout?.text(),
          stderr: await proc.stderr?.text(),
          exitCode: proc.exitCode,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (url.pathname === "/activate/fish" && req.method === "GET") {
      const script = Bun.file("./on-client.fish")
      return new Response(script, { status: 200, headers: { "Content-Type": "text/plain" } })
    }

    return new Response("Not Found", { status: 404 })
  },
})

// Get all arguments except the script name itself
const args = process.argv.slice(2)

// Create remote command that sets env vars and starts a shell
const remoteCommand = `BACK_SSH_AUTHORIZATION=${token} BACK_SSH_ENDPOINT=http://localhost:${port} exec bash -l`

// Add reverse tunnel argument and remote command
const sshArgs = ["-R", `${port}:localhost:${port}`, "-t", "-o", `RemoteCommand=${remoteCommand}`, ...args]

// Spawn ssh with all arguments, inheriting stdio for direct interaction
const proc = spawn(["ssh", ...sshArgs], {
  stdio: ["inherit", "inherit", "inherit"],
})

// Exit with the same code as ssh
await proc.exited
server.stop()
process.exit(proc.exitCode ?? 0)
