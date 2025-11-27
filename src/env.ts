import z from "zod"

const envSchema = z.object({
  ON_HOST_INJECTABLES: z.string().default("~/.config/on-my-box/inejctables"),
})

export const env = envSchema.parse(process.env)
