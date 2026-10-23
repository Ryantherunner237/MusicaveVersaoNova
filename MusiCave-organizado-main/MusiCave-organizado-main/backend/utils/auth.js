const crypto = require("crypto");
const pool = require("../db/pool");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createSession(userId, database = pool) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await database.query(
    "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + INTERVAL '30 days')",
    [tokenHash, userId]
  );

  return token;
}

module.exports = { hashToken, createSession };