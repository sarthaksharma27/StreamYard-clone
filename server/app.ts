import express, { Application } from 'express';
import path from 'path';

const app: Application = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


import { router as authRouter } from './routes/auth';
import { router as titleRouter } from './routes/title';

app.use(authRouter);
app.use(titleRouter);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

