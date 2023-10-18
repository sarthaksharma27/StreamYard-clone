import { PrismaClient } from '@prisma/client';
import express from 'express';
import path from 'path';

const prisma = new PrismaClient();
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.urlencoded({ extended: true }));


// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Login
app.post('/', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (user && user.password === password) {
        res.sendFile(path.join(__dirname, '../client/home.html'));
    } else {
        res.status(401).send('Unauthorized: Invalid email or password');
    }
});

// Register Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/register.html'));
});

// User Registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    await prisma.user.create({
        data: {
            email,
            password,
        }
    });

    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
