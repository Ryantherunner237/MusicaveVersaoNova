const pool = require("./db/pool");
const { hashToken } = require("./utils/auth");

async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({ message: "Faça login para continuar." });
  }

  try {
    const tokenHash = hashToken(token);
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [tokenHash]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ message: "Sua sessao expirou. Entre novamente." });
    }

    req.user = { ...result.rows[0], id: String(result.rows[0].id) };
    req.authTokenHash = tokenHash;
    return next();
  } catch (error) {
    console.error("Erro ao validar sessao:", error);
    return res.status(500).json({ message: "Nao foi possivel validar sua sessao." });
  }
}

module.exports = requireAuth;