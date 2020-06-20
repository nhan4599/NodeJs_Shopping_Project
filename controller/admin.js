var express = require('express');
var db = require('../database');
var multer = require('multer');

var router = express.Router();
var upload = multer({});

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

router.post('/logout', (req, res) => {
    delete req.session.admin;
    res.redirect('/admin/login');
});

router.get('/listproducts', async (req, res) => {
    var list = await db.GetProductList();
    var imageList = await db.GetThumbnailImageList(list);
    res.render('admin/listproducts', { products: list, images: imageList });
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

router.get('/listcustomers', async (req, res) => {
    var Customer = await db.GetAllCustomer();
    res.render('admin/listcustomers', { Customer });
});

router.get('/createproduct', (req, res) => {
    var promises = [db.GetCategoryList(), db.GetManufacturerList(), db.GetSegmentList(), db.GetProductStateList()];
    Promise.all(promises).then(values => res.render('admin/createproduct', {
        categories: values[0],
        manufacturers: values[1],
        segments: values[2],
        staties: values[3]
    }));
});

router.post('/temp', (req, res) => {
    res.status(200).send('ok');
});

router.post('/addproductmetadata', (req, res) => {
    var name = req.body.name;
    var inventory = parseInt(req.body.inventory.toString());
    var price = parseFloat(req.body.price.toString());
    var category = parseInt(req.body.category.toString());
    var state = parseInt(req.body.state.toString());
    var segment = parseInt(req.body.segment.toString());
    var manu = parseInt(req.body.manu.toString());
    req.session.productInfo = {
        name, inventory, price, category, state, segment, manu
    };
    res.redirect('/admin/productconfig');
});

router.get('/productconfig', (req, res) => {
    if (!req.session.productInfo) {
        res.status(500).send('Yêu cầu không hợp lệ');
    } else {
        if (req.session.productTemp)
            res.render('admin/editproductconfig', { item: req.session.productTemp });
        else
            res.render('admin/createproductconfig');
    }
});

router.post('/addproductimages', (req, res) => {
    var ram = req.body.ram;
    var screen = req.body.screen;
    var rearCam = req.body.rearCam;
    var frontCam = req.body.frontCam;
    var os = req.body.os;
    var storage = req.body.storage;
    var sdType = req.body.sdType;
    var sdSize = req.body.sdSize;
    var pin = req.body.pin;
    req.session.productInfo.config = {
        ram, screen, rearCam, frontCam, os, storage, sdType, sdSize, pin
    };
    req.session.productInfo.images = {};
    res.redirect('/admin/productimages');
});

router.get('/productimages', (req, res) => {
    if (!req.session.productInfo || !req.session.productInfo.config) {
        res.status(500).send('Yêu cầu không hợp lệ');
    } else {
        if (req.session.productTemp)
            res.render('admin/editproductimages', { item: req.session.productTemp });
        else
            res.render('admin/createproductimages');
    }
});

router.post('/getlistimages', (req, res) => {
    res.send(req.session.productTemp.images);
});

router.post('/addimages', upload.single('file'), (req, res) => {
    console.log('ok');
    req.session.productInfo.images[req.file.originalname] = req.file.buffer.toString('base64');
    res.send('ok');
});

router.post('/removeimages', (req, res) => {
    var key = req.body.filename;
    delete req.session.productInfo.images[key];
    res.send('ok');
});

router.post('/createproduct', async (req, res) => {
    try {
        var results = await db.InsertProduct(req.session.productInfo);
        var rowsAffectedCount = results[0] + results[1] + results[2];
        delete req.session.productInfo;
        if (rowsAffectedCount >= 3 && rowsAffectedCount <= 6) {
            res.redirect('/admin/listproducts');
        } else {
            res.redirect('/admin/createproduct');
        }
    } catch (err) {
        console.log(err);
        res.redirect('/admin/productimages');
    }
});

router.get('/productdetail/:id', async (req, res) => {
    var id = parseInt(req.params.id.toString());
    var product = await db.GetProductDetail(id);
    req.session.productTemp = product;
    res.render('admin/productdetail', { item: product });
});

router.get('/editproduct/:id', async (req, res) => {
    var promises = [db.GetCategoryList(), db.GetManufacturerList(), db.GetSegmentList(), db.GetProductStateList()];
    Promise.all(promises).then(values => res.render('admin/editproduct', {
        categories: values[0],
        manufacturers: values[1],
        segments: values[2],
        staties: values[3],
        item: req.session.productTemp
    }));
});

router.post('/addproductmetadata', (req, res) => {
    var name = req.body.name;
    var inventory = parseInt(req.body.inventory.toString());
    var price = parseFloat(req.body.price.toString());
    var category = parseInt(req.body.category.toString());
    var state = parseInt(req.body.state.toString());
    var segment = parseInt(req.body.segment.toString());
    var manu = parseInt(req.body.manu.toString());
    req.session.productInfo = {
        name, inventory, price, category, state, segment, manu
    };
    res.redirect('/admin/productconfig');
});

module.exports = router;