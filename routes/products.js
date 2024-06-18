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

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - product_id
 *         - product_name
 *       properties:
 *         product_id:
 *           type: string
 *           description: The unique identifier for the product
 *         product_name:
 *           type: string
 *           description: The name of the product
 *         product_origin:
 *           type: string
 *           description: The origin of the product
 *         product_category:
 *           type: string
 *           description: The category of the product
 *         product_composition:
 *           type: string
 *           description: The composition of the product
 *         nutrition_facts:
 *           type: string
 *           description: The nutrition facts of the product
 *         image:
 *           type: string
 *           format: binary
 *           description: The image of the product
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API to manage products
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve a list of all products
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       '404':
 *         description: No products found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: No products found.
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

// GET method to retrieve all products
router.get('/', async (req, res) => {
    try {
        const allProductQuery = 'SELECT * FROM products';
        const [rows] = await connection.execute(allProductQuery);

        // Return all rows
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /products/product/{productId}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product to retrieve
 *     responses:
 *       200:
 *         description: The product description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */

// GET method to retrieve a single product by ID
router.get('/product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const query = 'SELECT * FROM products WHERE product_id = ?;';
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

/**
 * @swagger
 * /products/get-products-categories:
 *   get:
 *     summary: Retrieve all product categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of product categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */

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

/**
 * @swagger
 * /products/post-products:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               productOrigin:
 *                 type: string
 *               productCategory:
 *                 type: string
 *               productComposition:
 *                 type: string
 *               nutritionFacts:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product added successfully
 *       500:
 *         description: Internal Server Error
 */

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

/**
 * @swagger
 * /products/edit-product/{productId}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               productOrigin:
 *                 type: string
 *               productCategory:
 *                 type: string
 *               productComposition:
 *                 type: string
 *               nutritionFacts:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */

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