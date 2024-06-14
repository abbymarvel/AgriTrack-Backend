// const express = require('express');
// const multer = require('multer');
// const router = express.Router();
// const dotenv = require('dotenv');
// dotenv.config();
// const mysql = require('mysql2/promise');
import express, { Router } from "express";
import mysql from 'mysql2/promise';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();
// Database connection setup
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET method to retrieve all products
router.get('/', async (req, res) => {
    try {
        const allProductQuery = 'SELECT * FROM `agritrack`.`products`';
        const [rows] = await connection.execute(allProductQuery);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET method to retrieve a single product by ID
router.get('/product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const query = 'SELECT * FROM products WHERE product_id = ?';
        const [rows] = await connection.execute(query, [productId]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/get-products-categories', async (req, res) => {
  try {
    const query = 'SELECT category_name FROM product_categories';
    const [rows] = await connection.execute(query);

    // Return all rows
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/post-products', upload.single('image'), async (req, res) => {
  try {
    const { productId, productName, productOrigin, productCategory, productComposition, nutritionFacts, } = req.body;
    const imageBuffer = req.file.buffer;
    const insertQuery = 'INSERT INTO products (product_id, product_name, product_origin, product_category, product_composition, nutrition_facts, image) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(insertQuery, [productId, productName, productOrigin, productCategory, productComposition, nutritionFacts, imageBuffer]);

    res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
  } catch(error){

    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Internal Server Error' });

  }
});

router.put('/edit-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { productName, productOrigin, productCategory, productComposition, nutritionFacts } = req.body;

    const updateQuery = `
      UPDATE products 
      SET 
        product_name = ?, 
        product_origin = ?, 
        product_category = ?, 
        product_composition = ?, 
        nutrition_facts = ? 
      WHERE product_id = ?`;
    
    const [result] = await connection.execute(updateQuery, [productName, productOrigin, productCategory, productComposition, nutritionFacts, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;