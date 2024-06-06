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

route.get('/get-allTypes', authenticateToken, async (req, res) => {
    try {
        const commodityTypeQuery = 'SELECT commodityType FROM `agritrack`.`commodity`';
        const [rows] = await connection.query(commodityTypeQuery);

        const commodityList = rows.map(item => item.commodityType);
        res.send(commodityList);
    } catch (error) {
        console.error(error.message);
    }
});

route.post('/predict', authenticateToken, async (req, res) => {
    try {
        const commodityType = req.body.commodityType;
 
        // Connect to machine learning

        res.send("Under development!");
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        res.status(401).json({message: "Token not valid."});
    }
    else {
        jwt.verify(token, secretKey, (error, user) => {
            if (error) {
                res.status(401).json({message: "Token already expired."});
            }
            else {
                req.user = user
                next()
            }
        });
    };
};

export default route;