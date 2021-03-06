var express = require('express');
var db = require('../database');
var constant = require('../constant');
var crypt = require('../cryptutils');
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
    var hash = crypt.GetPasswordHash(pass);
    var result = await db.AdminLogin(username, hash);
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
    var page = parseInt(req.query.page || 1);
    var offset = (page - 1) * constant.pageSize;
    var endOffset = (page * constant.pageSize) - 1;
    var list = (await db.GetProductList()).reverse();
    var maxPage = parseInt(list.length / constant.pageSize) + 1;
    var imageList = await db.GetThumbnailImageList(list);
    res.render('admin/listproducts', { products: list.slice(offset, endOffset), images: imageList.slice(offset, (page * constant.pageSize) - 1), maxPage, page });
});

router.get('/listcategories', async (req, res) => {
    var categories = await db.GetCategoryList();
    res.render('admin/listcategories', { categories });
});

router.get('/listmanufacturers', async (req, res) => {
    var list = await db.GetManufacturerList();
    res.render('admin/listmanufacturers', { list });
});

router.get('/addlistmanufacturer', (req, res) => {
    res.render('admin/addlistmanufacturer');
});

router.post('/addlistmanufacturer', async (req, res) => {
    var name = req.body.name;
    var address = req.body.address;
    var results = await db.InsertManufactures(name, address);
    if (results) {
        res.redirect('/admin/listmanufacturers');
    } else {
        res.redirect('/admin/addlistmanufacturer');
    }
});

router.get('/editManufacturer', async (req, res) => {
    var id = parseInt(req.query.id.toString());
    if (!Number.isNaN(id)) {
        req.session.manuId = id;
        var item = await db.GetManuById(id);
        res.render('admin/editManufacturer', { item });
    } else {
        res.redirect('/listmanufacturers');
    }
});

router.post('/editManufacturer', async (req, res) => {
    var id = parseInt(req.session.manuId.toString());
    var result = await db.UpdateManu(id, req.body.manuName, req.body.manuAddress);
    if (result) {
        res.redirect('/admin/listmanufacturers');
    } else {
        res.redirect('/admin/editManufacturer?id=' + id);
    }
});

router.get('/listorders', async (req, res) => {
    var id = req.body.id;
    var Bill = await db.GetBill(id);
    res.render('admin/listorders', { Bill: Bill.reverse() });
});

router.get('/listcustomers', async (req, res) => {
    var Customer = await db.GetAllCustomer();
    res.render('admin/listcustomers', { Customer });
});

router.get('/approve', async (req, res) => {
    var id = req.query.id;
    var result = await db.Approve(id);
    res.redirect('/admin/listorders');
});

router.get('/completed', async (req, res) => {
    var id = req.query.id;
    var result = await db.Complete(id);
    res.redirect('/admin/listorders');
});

router.get('/cancel', async (req, res) => {
    var id = req.query.id;
    var result = await db.Cancel(id);
    res.redirect('/admin/listorders');
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

router.post('/editproduct', async (req, res) => {
    try {
        var results = await db.UpdateProduct(req.session.productTemp.productId, req.session.productInfo);
        var rowsAffectedCount = results[0] + results[1] + results[2];
        delete req.session.productInfo;
        if (rowsAffectedCount >= 3 && rowsAffectedCount <= 6) {
            res.redirect('/admin/listproducts');
        } else {
            res.redirect('/admin/editproduct/' + req.session.productTemp.productId.toString());
        }
    } catch (err) {
        console.log(err);
        res.redirect('/admin/productimages');
    }
});

router.get('/createcategory', (req, res) => {
    res.render('admin/createcategory');
});

router.post('/createcategory', async (req, res) => {
    var name = req.body.name;
    var result = await db.InsertCategory(name);
    if (result) {
        res.redirect('/admin/listcategories');
    } else {
        res.redirect('/admin/createcategory');
    }
});

router.get('/editcategory', async (req, res) => {
    var id = parseInt(req.query.id.toString());
    if (!Number.isNaN(id)) {
        req.session.cateId = id;
        var item = await db.GetCategoryById(id);
        res.render('admin/editcategory', { item });
    } else {
        res.redirect('/listcategories');
    }
});

router.post('/editcategory', async (req, res) => {
    var id = parseInt(req.session.cateId.toString());
    var result = await db.UpdateCategory(id, req.body.name);
    if (result) {
        res.redirect('/admin/listcategories');
    } else {
        res.redirect('/admin/editcategory?id=' + id);
    }
});

router.get('/deactive', async (req, res) => {
    var id = req.query.id;
    var result = await db.DeactiveAccount(id);
    res.redirect('/admin/listcustomers');
});

router.get('/resetPassword', async (req, res) => {
    var id = req.query.id;
    var result = await db.SetPassword(id, '123');
    res.redirect('/admin/listcustomers');
});

module.exports = router;