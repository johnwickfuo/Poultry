import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getMySqlPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must be a MySQL connection URL.");
  }

  pool ??= mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    enableKeepAlive: true,
  });

  return pool;
}
