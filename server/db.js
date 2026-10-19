import pg from 'pg';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function transaction(fn, actor = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.actor_id', $1, true)", [actor || '']);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
