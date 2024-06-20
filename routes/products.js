import express, { Router } from "express";
import mysql from 'mysql2/promise';
import jwt from "jsonwebtoken";
import multer from 'multer';
import dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';
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

const gc = new Storage({
    keyFilename: process.env.GCS_KEYFILE_PATH,
    projectId: process.env.GCS_PROJECT_ID,
  });

const bucket = gc.bucket(process.env.GCS_BUCKET_NAME);


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
 *         user_id:
 *           type: string
 *           description: user's email is considered user_id  
 *         image_url:
 *           type: string
 *           description: The image url of the product stored in a bucket
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API to manage products
 */

/**
 * @swagger
 * /get-user-products:
 *   get:
 *     summary: Retrieve all products owned by the authenticated user
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of products owned by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       '500':
 *         description: Internal server error
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

// GET method to retrieve all products owned by Business Owner
router.get('/get-user-products', async (req, res) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
        const verify = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const email = verify.email;
        const allProductQuery = 'SELECT * FROM products WHERE user_id = ?';
        const [rows] = await connection.execute(allProductQuery, [email]);

        // Return all rows wrapped in an object
        res.status(200).json({ products: rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /get-all-products:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: A list of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       '500':
 *         description: Internal server error
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

// GET method to retrieve all products
router.get('/get-all-products', async (req, res) => {
    try {
        const allProductQuery = 'SELECT * FROM products';
        const [rows] = await connection.execute(allProductQuery);

        // Return all rows wrapped in an object
        res.status(200).json({ products: rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /product/{productId}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       '200':
 *         description: A single product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       '404':
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Product not found
 *       '500':
 *         description: Internal server error
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

/**
 * @swagger
 * /get-products-categories:
 *   get:
 *     summary: Retrieve all product categories
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: A list of product categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_name:
 *                         type: string
 *       '500':
 *         description: Internal server error
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

// GET method to retrieve product categories by ID
router.get('/get-products-categories', async (req, res) => {
  try {
    const query = 'SELECT category_name FROM product_categories';
    const [rows] = await connection.execute(query);

    // Return all rows
    res.status(200).json({ productCategory: rows });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /post-products:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
 *               email:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Product added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: Product added successfully
 *                 productId:
 *                   type: string
 *                   description: ID of the newly created product
 *       '500':
 *         description: Internal server error
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

// POST method to post product informations
router.post('/post-products', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const email = verify.email;
    const { productId, productName, productOrigin, productCategory, productComposition, nutritionFacts } = req.body;

    let imageUrl = '';

    if (req.file) {
        const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype,
          predefinedAcl: 'publicRead', // Make the file publicly accessible
        });
  
        blobStream.on('error', (err) => {
          console.error('Error uploading image:', err);
          return res.status(500).json({ message: 'Error uploading image' });
        });
  
        blobStream.on('finish', () => {
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          console.log('Image URL:', imageUrl);
        });
  
        blobStream.end(req.file.buffer);
      }

    const insertQuery = 'INSERT INTO products (product_id, product_name, product_origin, product_category, product_composition, nutrition_facts, user_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(insertQuery, [productId, productName, productOrigin, productCategory, productComposition, nutritionFacts, email, imageUrl]);

    res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
  } catch(error){

    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Internal Server Error' });

  }
});

/**
 * @swagger
 * /edit-product/{productId}:
 *   put:
 *     summary: Edit a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
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
 *       '200':
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: Product updated successfully
 *       '404':
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Product not found
 *       '500':
 *         description: Internal server error
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

// PUT method to edit product informations
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