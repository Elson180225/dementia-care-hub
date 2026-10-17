import { readFile } from "node:fs/promises";
import { openDatabase } from "../server/database.js";
export async function migrate(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS public.rcbc_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const name of [
    "001_shared_records.sql",
    "002_portal.sql",
    "003_enquiry_deduplication.sql",
  ]) {
    if (
      (
        await db.query(
          "SELECT name FROM public.rcbc_migrations WHERE name=$1",
          [name],
        )
      ).rows.length
    )
      continue;
    if (
      name.startsWith("001") &&
      (await db.query("SELECT to_regclass('rcbc.users') AS existing")).rows[0]
        .existing
    ) {
      console.log("Recognized existing shared-record schema.");
    } else {
      let sql = await readFile(new URL(name, import.meta.url), "utf8");
      if (name.startsWith("001"))
        sql = sql.replaceAll(
          "- 'password_hash' - 'unsubscribe_token_hash'",
          "- 'password_hash' - 'unsubscribe_token_hash' - 'requested_password_hash'",
        );
      await db.exec(sql.replace(/^\uFEFF/, ""));
    }
    // Redact request password hashes for databases initialized with the original draft too.
    if (name.startsWith("002")) {
      const original = await readFile(
        new URL("001_shared_records.sql", import.meta.url),
        "utf8",
      );
      const fn = original
        .slice(
          original.indexOf("CREATE FUNCTION record_change()"),
          original.indexOf("CREATE FUNCTION touch_updated_at()"),
        )
        .replace(
          "CREATE FUNCTION record_change()",
          "CREATE OR REPLACE FUNCTION rcbc.record_change()",
        )
        .replaceAll(
          "- 'password_hash' - 'unsubscribe_token_hash'",
          "- 'password_hash' - 'unsubscribe_token_hash' - 'requested_password_hash'",
        );
      await db.exec(fn);
    }
    await db.query("INSERT INTO public.rcbc_migrations(name) VALUES($1)", [
      name,
    ]);
    console.log("Applied " + name);
  }
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/migrate.mjs")) {
  const db = await openDatabase();
  try {
    await migrate(db);
  } finally {
    await db.end();
  }
}
