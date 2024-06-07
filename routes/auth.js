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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 * /auth/signup:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *                 example: Alexander K. Dewdney
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 example: alexander.dewdney@gmail.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: Password
 *               role:
 *                 type: string
 *                 description: User's role
 *                 example: Business Owner
 *     responses:
 *       '200':
 *         description: Registration success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       '401':
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: User already exists.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: Internal Server Error
 */
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

        res.status(200).json({ token });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 example: alexander.dewdney@gmail.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: Password
 *     responses:
 *       '200':
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 role:
 *                   type: string
 *                   description: User's role
 *       '401':
 *         description: User credentials invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: User credentials invalid.
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: Internal Server Error
 */
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

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Used logged out successfully
 *       404:
 *         description: User not logged in
 *       501:
 *         description: Internal Server Error
 *              
 */
route.get('/logout', (req, res) => {
    req.session.userid = null;
    req.session.destroy();
    res.send("You have been logged out.");
});

export default route;