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

router.post('/login', async (req, res) => {
    var username = req.body.username;
    var pass = req.body.password;
    var result = await db.AdminLogin(username, pass);
    if (result.message) {
        res.render('/login', { message: 'Unexpected error' });
    }
    else {
        if (result.rowsAffected[0] === 1) {
            req.session.admin = result.recordset[0];
            res.redirect('/home');
        } else {
            res.render('/login', { message: 'Username and/or password is incorrect' });
        }
    }
});

router.post('/logout', (req, res) => {
    delete req.session.admin;
    res.redirect('/home');
});

router.get('/signup', (req, res) => {
    res.render('customer/signup');
});

module.exports = router;