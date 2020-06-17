var express = require('express');
var db = require('../database');
var multer = require('multer');

var router = express.Router();
var upload = multer({});

router.get('/login', (req, res) => {
    res.render('customer/login');
});

router.get(['/', '/home'], (req, res) => {
    res.render('customer/home');
});

module.exports = router;