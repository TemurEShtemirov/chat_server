import express from "express";
import http from "http";
import cors from "cors";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { Pool } = pkg;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "chat",
  password: "1015",
  port: 5432,
});

const JWT_SECRET = "your_jwt_secret"; // Replace with a strong, random secret

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);
  const port = 8485;

  app.use(express.json());
  app.use(cors());

  app.get("/messages", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM messages");
      res.json(rows);
    } catch (error) {
      console.error("Error fetching messages from PostgreSQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/messages", async (req, res) => {
    const { user_id, content } = req.body;
    const user = await getUserById(user_id);

    try {
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const insertQuery =
        "INSERT INTO messages (user_id, user_first_name, user_last_name, content) VALUES ($1, $2, $3, $4) RETURNING *";
      const values = [user_id, user.first_name, user.last_name, content];
      const result = await pool.query(insertQuery, values);
      res.status(201).json({
        success: true,
        message: "Message posted successfully.",
        result: result.rows,
      });
    } catch (error) {
      console.error("Error posting message to PostgreSQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/messages/:id", async (req, res) => {
    const userId = req.params.id;

    try {
      const { rows } = await pool.query(
        "SELECT * FROM messages WHERE user_id = $1",
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching messages for user from PostgreSQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/messages/:id", async (req, res) => {
    const userId = req.params.id;
    const { content } = req.body;

    try {
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const insertQuery =
        "INSERT INTO messages (user_id, user_first_name, user_last_name, content) VALUES ($1, $2, $3, $4) RETURNING *";
      const values = [userId, "John", "Doe", content]; // Using default names for simplicity
      const result = await pool.query(insertQuery, values);
      res.status(201).json({
        success: true,
        message: "Message posted successfully.",
        result: result.rows,
      });
    } catch (error) {
      console.error("Error posting message to PostgreSQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/users", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users");
      res.json(rows);
    } catch (error) {
      console.error("Error fetching users from PostgreSQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/register", async (req, res) => {
    const { first_name, last_name, nickname, password } = req.body;
    try {
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const query =
        "INSERT INTO users (first_name, last_name, nickname, password) VALUES ($1, $2, $3, $4) RETURNING id";
      const values = [first_name, last_name, nickname, hashedPassword];
      const result = await pool.query(query, values);
      const userId = result.rows[0].id;
      res.status(201).json({ success: true, userId });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  async function getUserById(user_id) {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const { rows } = await pool.query(query, [user_id]);
      return rows[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

bootstrap();
