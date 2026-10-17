import pg from "pg";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

export async function openDatabase({
  embedded = process.env.DATABASE_MODE === "embedded",
  url = process.env.DATABASE_URL,
} = {}) {
  if (embedded) {
    const { PGlite } = await import("@electric-sql/pglite");
    const path = resolve(process.env.DATABASE_DIRECTORY || ".local/database");
    await mkdir(path, { recursive: true });
    const db = new PGlite(path);
    // Serialize transactions on the single embedded connection.
    let queue = Promise.resolve();
    return {
      query: (...args) => db.query(...args),
      exec: (sql) => db.exec(sql),
      end: () => db.close(),
      async transaction(fn) {
        const operation = queue.then(async () => {
          await db.exec("BEGIN");
          try {
            const result = await fn(db);
            await db.exec("COMMIT");
            return result;
          } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
          }
        });
        queue = operation.catch(() => {});
        return operation;
      },
      mode: "embedded PostgreSQL (local demo)",
    };
  }
  if (!url)
    throw new Error(
      "Set DATABASE_URL in .env, or run npm run demo for a persistent local demonstration.",
    );
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 5000,
  });
  return {
    query: (...args) => pool.query(...args),
    exec: (sql) => pool.query(sql),
    end: () => pool.end(),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    },
    mode: "PostgreSQL server",
  };
}
export async function withActor(db, actor, fn, comment = "") {
  return db.transaction(async (client) => {
    await client.query(
      "SELECT set_config('search_path','rcbc,public',true), set_config('rcbc.actor_id',$1,true), set_config('rcbc.admin_comment',$2,true)",
      [actor, comment],
    );
    return fn(client);
  });
}
