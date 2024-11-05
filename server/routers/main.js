const express = require('express');
const router = express.Router();

//Routers
router.get('', (req, res) => {
    const locals = {
        title: "First Web App",
        description: "Web App Created by Node.js ( express )"
    }


    res.render('index', {locals});
});

router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;