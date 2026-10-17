import { openDatabase } from "./database.js";
import { createApp } from "./app.js";
const port = Number(process.env.API_PORT || 3001);
try {
  const db = await openDatabase();
  await db.query("SELECT 1 FROM rcbc.users LIMIT 1");
  // Cap sessions created before the five-minute idle policy was introduced.
  await db.query(
    "UPDATE rcbc.sessions SET expires_at=least(expires_at,now()+interval '5 minutes')",
  );
  const server = createApp(db).listen(port, "127.0.0.1", () =>
    console.log(`Dementia Care Hub API: http://localhost:${port} (${db.mode})`),
  );
  const stop = () =>
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} catch (error) {
  console.error(
    "API startup failed:",
    error.message,
    "Run npm run db:migrate and npm run db:seed after configuring .env.",
  );
  process.exitCode = 1;
}
