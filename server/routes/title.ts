import { Router } from 'express';
const router: Router = Router();

router.get('/title', (req, res) => {
    res.render("./pages/title.ejs")
});

router.post('/title', (req, res) => {
    const { title } = req.body;
    res.render("./pages/studio.ejs", { title })
});

export { router };