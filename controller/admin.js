var express = require('express');
var db = require('../database');

var router = express.Router();

router.use((req, res, next) => {
    if (!req.session.admin && req.originalUrl !== '/admin/login')
        res.redirect('/admin/login');
    else
        next();
});

router.get('/login', (req, res) => {
    res.render('admin/login');
});

router.get(['/', '/home'], (req, res) => {
    res.render('admin/home');
});

router.post('/login', async (req, res) => {
    var username = req.body.username;
    var pass = req.body.password;
    var result = await db.AdminLogin(username, pass);
    if (result.message) {
        res.render('admin/login', { message: 'Unexpected error' });
    }
    else {
        if (result.rowsAffected[0] === 1) {
            req.session.admin = result.recordset[0];
            res.redirect('/admin/home');
        } else {
            res.render('admin/login', { message: 'Username and/or password is incorrect' });
        }
    }
});

router.get('/listproducts', (req, res) => {
    res.render('admin/listproducts');
});

router.get('/listcategories', (req, res) => {
    res.render('admin/listcategories');
});

router.get('/listmanufacturers', (req, res) => {
    res.render('admin/listmanufacturers');
});

router.get('/listorders', (req, res) => {
    res.render('admin/listorders');
});

router.get('/listcustomers', (req, res) => {
    res.render('admin/listcustomers');
});

router.get('/createproduct', (req, res) => {
    var promises = [db.GetCategoryList(), db.GetManufacturerList(), db.GetSegmentList(), db.GetProductStateList()];
    Promise.all(promises).then(values => res.render('admin/createproduct', {
                        categories: values[0],
                        manufacturers: values[1],
                        segments: values[2],
                        staties: values[3] }));
});

router.post('/temp', (req, res) => {
    res.status(200).send('ok');
});
module.exports = router;