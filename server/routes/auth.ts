import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const prisma = new PrismaClient();
const router: Router = Router();

// Homepage
router.get('/', (req, res) => {
    res.render("./pages/login.ejs")
});

// Login
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (user && user.password === password) {
        res.render("./pages/index.ejs")
    } else {
        res.status(401).send('Unauthorized: Invalid email or password');
    }
});

// Register Page
router.get('/register', (req, res) => {
    res.render("./pages/register.ejs")
});

// User Registration
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    await prisma.user.create({
        data: {
            email,
            password,
        }
    });

    res.redirect("/")
});

export { router };