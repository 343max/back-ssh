#!/usr/bin/env bun

import { spawn } from "bun"
import { randomBytes } from "crypto"
import z from "zod"
import { readFile } from "fs/promises"
import { join } from "path"
// @ts-ignore
import clientScriptFish from "./on-my-box.fn.fish" with { type: "text" }
// @ts-ignore
import setupDocumentation from "./SETUP.md" with { type: "text" }
import { env } from "./src/env"
import { findExecutables, resolvePath } from "./src/executables"

const injectables = await findExecutables(env.ON_HOST_INJECTABLES)

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
    const url = new URL(req.url)
    const auth = req.headers.get("Authorization")

    if (url.pathname === "/" && req.method === "GET") {
      return new Response(setupDocumentation, { status: 200, headers: { "Content-Type": "text/markdown" } })
    }

    if (auth !== token) {
      return new Response("Unauthorized", { status: 401 })
    }

    if (url.pathname === "/execute" && req.method === "POST") {
      const input = executeInputSchema.parse(await req.json())

      try {
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
      } catch (error) {
        return new Response(
          JSON.stringify({
            stdout: "",
            stderr: (error as Error).message,
            exitCode: 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (url.pathname === "/activate/fish" && req.method === "GET") {
      const aliases = injectables.map(
        (injectable) =>
          `alias ${injectable}='curl -fsSL -H "Authorization: $ON_MY_BOX_AUTHORIZATION" $ON_MY_BOX_ENDPOINT/injectable/${injectable} | fish'`
      )
      const clientScript = [clientScriptFish, ...aliases].join("\n")

      return new Response(clientScript, { status: 200, headers: { "Content-Type": "text/plain" } })
    }

    if (url.pathname.startsWith("/injectable/") && req.method === "GET") {
      const injectableName = url.pathname.slice("/injectable/".length)

      // Verify the injectable exists in our list (security check)
      if (!injectables.includes(injectableName)) {
        return new Response("Not Found", { status: 404 })
      }

      try {
        const injectablePath = join(resolvePath(env.ON_HOST_INJECTABLES), injectableName)
        const source = await readFile(injectablePath, "utf-8")
        return new Response(source, { status: 200, headers: { "Content-Type": "text/plain" } })
      } catch (error) {
        return new Response("Error reading injectable", { status: 500 })
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

// Get all arguments except the script name itself
const args = process.argv.slice(2)

// Create remote command that sets env vars and starts a shell
const remoteCommand = `ON_MY_BOX_AUTHORIZATION=${token} ON_MY_BOX_ENDPOINT=http://localhost:${port} exec bash -l`

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
