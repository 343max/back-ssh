#!/usr/bin/env bun

import { spawn } from "bun"
import { randomBytes } from "crypto"

// Generate random token and port
const token = randomBytes(32).toString("hex")
const port = Math.floor(Math.random() * (60000 - 40000 + 1)) + 40000

// Start HTTP server
const server = Bun.serve({
  port,
  async fetch(req) {
    // Check authentication
    const auth = req.headers.get("Authentication")
    if (auth !== token) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Handle /execute route
    const url = new URL(req.url)
    if (url.pathname === "/execute" && req.method === "POST") {
      const json = await req.json()
      console.log("Received JSON:", json)
      return new Response("OK", { status: 200 })
    }

    return new Response("Not Found", { status: 404 })
  },
})

// Get all arguments except the script name itself
const args = process.argv.slice(2)

// Create remote command that sets env vars and starts a shell
const remoteCommand = `BACK_SSH_AUTHENTICATION=${token} BACK_SSH_PORT=${port} exec bash -l`

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
