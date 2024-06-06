import express, { Router } from "express";
import mysql from 'mysql2/promise';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const route = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;
const saltRounds = 10;

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

route.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUserQuery = `SELECT * FROM agritrack.users WHERE email = ?`;
        const existingUser = await connection.query(existingUserQuery, [email]);

        if (existingUser[0].length != 0) {
            return res.status(401).json({ error: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertQuery = `INSERT INTO agritrack.users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        const insertResults = await connection.query(insertQuery, [name, email, hashedPassword, role]);

        const selectQuery = `SELECT * FROM agritrack.users WHERE email = ?`;
        const selectResults = await connection.query(selectQuery, [email]);
        const user = selectResults[0];

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey);

        req.session.userid = user.id;

        res.status(200).json({ token, role: user.role });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

route.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const existingUserQuery = `SELECT * FROM agritrack.users WHERE email = ?`;
        const existingUser = await connection.query(existingUserQuery, [email]);

        if (existingUser[0].length === 0) {
            return res.status(401).json({ error: "User not found." });
        }

        const user = existingUser[0][0]

        const storedPassword = user.password;


        const passwordMatch = await bcrypt.compare(password, storedPassword);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Password incorrect." });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey);

        req.session.userid = user.id;

        res.status(200).json({ token, role: user.role });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

route.get('/logout', (req, res) => {
    req.session.userid = null;
    req.session.destroy();
    res.send("You have been logged out.");
});

export default route;