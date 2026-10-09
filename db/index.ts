import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Create a D1 database and bind it as DB in wrangler.json."
    );
  }

  return drizzle(env.DB, { schema });
}
