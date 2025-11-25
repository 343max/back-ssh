import { readdir, stat } from "fs/promises"
import { join, resolve } from "path"
import { homedir } from "os"

export const resolvePath = (path: string): string => {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2))
  }
  return resolve(path)
}

// Find executable files in directory
export const findExecutables = async (dir: string): Promise<string[]> => {
  try {
    const files = await readdir(dir)
    const executables: string[] = []

    for (const file of files) {
      const filePath = join(dir, file)
      const stats = await stat(filePath)

      // Check if it's a file (not directory) and executable
      if (stats.isFile() && (stats.mode & 0o111) !== 0) {
        executables.push(file)
      }
    }

    return executables
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
    return []
  }
}
