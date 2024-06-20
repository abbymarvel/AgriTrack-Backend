import express, { Router } from "express";
import mysql from 'mysql2/promise';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();

const route = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

const api = axios.create({
    timeout: 30000
});

/**
 * @swagger
 * /forecast/get-allTypes:
 *   get:
 *     summary: Retrieve all commodity types
 *     tags: [Price Forecasting]
 *     security:
 *       - bearerAuth: authorization
 *     responses:
 *       200:
 *         description: Unauthorized access (requires authentication)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Unauthorized access
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Internal Server Error
 */

route.get('/get-allTypes', authenticateToken, async (req, res) => {
    try {
        const commodityTypeQuery = 'SELECT commodityType FROM `agritrack`.`commodity`';
        const [rows] = await connection.execute(commodityTypeQuery);

        res.status(200).json({ productCategory: rows });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
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
 *                 example: Beras Medium
 *     responses:
 *       200:
 *         description: Success response containing the predicted prices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 predictionData:
 *                   type: array
 *                   description: Array of predicted prices.
 *                   items:
 *                     type: number
 *                     description: Predicted price at a specific point in time.
 *         example:
 *           predictionData:
 *             - 12.989178657531738
 *             - 12.989051818847656
 *             - 12.987473487854004
 *             - 12.985884666442871
 *             - 12.988367080688477
 *             - 12.991575241088867
 *             - 12.990325927734375
 *             - 12.991606712341309
 *             - 12.993823051452637
 *       401:
 *         description: Unauthorized access (requires authentiction)
 *       500:
 *         description: Internal Server Error
 */
route.post('/predict', authenticateToken, async (req, res) => {
    try {
        const commodityType = req.body.commodityType;
        const apiParam = getAPIParamForCommodity(commodityType);

        const apiURL = `https://model-api-tngtr2ferq-et.a.run.app/predictions/predict/${apiParam}`;

        const response = await api.get(apiURL);

        res.status(200).json({ predictionData });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

function getAPIParamForCommodity(commodityType) {
    switch (commodityType) {
        case "Bawang Putih Bonggol":
            return "Bawang%20Putih%20Bonggol";
        case "Beras Medium":
            return "Beras%20Medium";
        case "Beras Premium":
            return "Beras%20Premium";
        case "Daging Ayam Ras":
            return "Daging%20Ayam%20Ras";
        case "Garam Halus Beryodium":
            return "Garam%20Halus%20Beryodium";
        case "Gula Konsumsi":
            return "Gula%20Konsumsi";
        case "Ikan Tongkol":
            return "Ikan%20Tongkol";
        case "Minyak Goreng Curah":
            return "Minyak%20Goreng%20Curah";
        case "Minyak Goreng Kemasan":
            return "Minyak%20Goreng%20Kemasan";
        case "Telur Ayam Ras":
            return "Telur%20Ayam%20Ras";
        case "Tepung Terigu Curah":
            return "Tepung%20Terigu%20Curah";
        case "Tepung Terigu Kemasan":
            return "Tepung%20Terigu%20Kemasan";
        default:
            throw new Error(`Invalid commodity type: ${commodityType}`);
    }
}


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