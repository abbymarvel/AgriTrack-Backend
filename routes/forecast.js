import express, { Router } from "express";
import mysql from 'mysql2/promise';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const route = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

/**
 * @swagger
 * tags:
 *   name: Price Forecasting
 *   description: Price Forcasting API
 * /forecast/get-allTypes:
 *   get:
 *     summary: Get all commodity types
 *     tags: [Price Forecasting]
 *     security:
 *       - bearerAuth: authorization
 *     responses:
 *       200:
 *         description: Used logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               item:
 *                   type: string
 *                   description: Commodity type
 *       404:
 *         description: Unauthorized access (requires authentication)
 *       501:
 *         description: Internal Server Error
 *              
 */
route.get('/get-allTypes', authenticateToken, async (req, res) => {
    try {
        const commodityTypeQuery = 'SELECT commodityType FROM `agritrack`.`commodity`';
        const [rows] = await connection.query(commodityTypeQuery);

        const commodityList = rows.map(item => ({type: item.commodityType}));
        res.send(commodityList);
    } catch (error) {
        console.error(error.message);
    }
});

/**
 * @swagger
 * /forecast/predict:
 *   post:
 *     summary: Predict (under development)
 *     tags: [Price Forecasting]
 *     security:
 *       - bearerAuth: authorization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commodityType:
 *                 type: string
 *                 description: Commodity type for forecasting
 *                 example: Wheat
 *     responses:
 *       200:
 *         description: Placeholder response (API under development)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Still waiting the model
 *       401:
 *         description: Unauthorized access (requires authentiction)
 *       500:
 *         description: Internal Server Error
 */
route.post('/predict', authenticateToken, async (req, res) => {
    try {
        const commodityType = req.body.commodityType;

        // Connect to machine learning

        res.status(200).json({ status: "Model under development!" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        res.status(401).json({ message: "Token not valid." });
    }
    else {
        jwt.verify(token, secretKey, (error, user) => {
            if (error) {
                res.status(401).json({ message: "Token already expired." });
            }
            else {
                req.user = user
                next()
            }
        });
    };
};

export default route;