import { z } from "zod";
import { ALL_COMPONENTS, type ConfigPayload } from "./types";

export const configSchema = z.object({
  step2: z.array(z.enum(["ABOUT_ME", "ADDRESS", "BIRTHDATE"])).nonempty(),
  step3: z.array(z.enum(["ABOUT_ME", "ADDRESS", "BIRTHDATE"])).nonempty(),
});

// Each component must appear on exactly one of the two steps
export function isValidPartition(cfg: ConfigPayload) {
  const seen = new Set<string>();
  for (const c of cfg.step2) seen.add(c);
  for (const c of cfg.step3) {
    if (seen.has(c)) return false; // duplicate across steps not allowed
    seen.add(c);
  }
  // Must cover exactly the components that are assigned 
  return seen.size === ALL_COMPONENTS.length;
}

// Provide a sane default
export const DEFAULT_CONFIG: ConfigPayload = {
  step2: ["ABOUT_ME"],
  step3: ["ADDRESS", "BIRTHDATE"],
};
