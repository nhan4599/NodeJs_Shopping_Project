var express = require('express');

var router = express.Router();

router.get('/', (req, res) => {
    res.send('test');
});

router.get('/products', (req, res) => {
    res.render('admin/product');
});

module.exports = router;