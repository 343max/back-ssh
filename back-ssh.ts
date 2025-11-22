#!/usr/bin/env bun

import { spawn } from "bun"

// Get all arguments except the script name itself
const args = process.argv.slice(2)

// Spawn ssh with all arguments, inheriting stdio for direct interaction
const proc = spawn(["ssh", ...args], {
  stdio: ["inherit", "inherit", "inherit"],
})

// Exit with the same code as ssh
await proc.exited
process.exit(proc.exitCode ?? 0)
