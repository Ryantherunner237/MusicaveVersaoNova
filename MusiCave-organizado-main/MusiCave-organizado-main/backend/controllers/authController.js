const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const { createSession } = require("../utils/auth");

async function register(req, res) {
  const name = String(req.body.name || req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || req.body.senha || "");

  if (!name || !email || password.length < 8) {
    return res.status(400).json({ message: "Informe nome, email e senha com pelo menos 8 caracteres." });
  }

  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, avatar",
      [name, email, passwordHash]
    );
    const user = result.rows[0];
    const token = await createSession(user.id, client);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Cadastro realizado com sucesso.",
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(400).json({ message: "Este email ja esta cadastrado." });
    }

    console.error("Erro no cadastro:", error);
    res.status(500).json({ message: "Nao foi possivel realizar o cadastro." });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || req.body.senha || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios." });
  }

  try {
    const result = await pool.query("SELECT id, name, email, avatar, password_hash FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const token = await createSession(user.id);

    return res.json({
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Nao foi possivel realizar o login." });
  }
}

function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

async function updateCurrentUser(req, res) {
  const name = String(req.body.name || "").trim();
  const avatar = req.body.avatar == null ? req.user.avatar : String(req.body.avatar);

  if (!name) {
    return res.status(400).json({ message: "Informe seu nome." });
  }

  if (avatar && (!avatar.startsWith("data:image/") || avatar.length > 3_000_000)) {
    return res.status(400).json({ message: "A foto deve ser uma imagem de até 2 MB." });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, avatar = $2 WHERE id = $3 RETURNING id, name, email, avatar",
      [name, avatar || null, req.user.id]
    );
    const user = result.rows[0];

    return res.json({ user: { ...user, id: String(user.id) } });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ message: "Nao foi possivel atualizar o perfil." });
  }
}

async function logout(req, res) {
  try {
    await pool.query("DELETE FROM auth_sessions WHERE token_hash = $1", [req.authTokenHash]);
    return res.json({ message: "Sessao encerrada." });
  } catch (error) {
    console.error("Erro ao encerrar sessao:", error);
    return res.status(500).json({ message: "Nao foi possivel encerrar a sessao." });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  logout,
};
