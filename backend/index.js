// Import required packages
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Initialize dotenv to load .env variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8000;

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- Middleware ---
// Enable CORS for all routes
app.use(cors());
// Enable built-in JSON parsing for request bodies
app.use(express.json());

// --- API Routes ---

// Simple test route
app.get('/api/test', (req, res) =>{
    res.json({ message: 'Hello from the backend API'});
});

// GET all users
// This is an async function because database queries take time
app.get('/api/users', async (req, res) =>{
    try{
    // Use Prisma to find all users in the database
    const users = await prisma.user.findMany();
    // Send the list of users as a JSON response
    res.json(users);
    } catch (error) {
    // If something goes wrong, send a 500 error
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});