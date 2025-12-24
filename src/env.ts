import z from "zod";
import { resolvePath } from "./executables";

const envSchema = z.object({
  ON_HOST_INJECTABLES: z
    .string()
    .default(resolvePath("~/.config/on-my-box/inejctables")),
});

export const env = envSchema.parse(process.env);
