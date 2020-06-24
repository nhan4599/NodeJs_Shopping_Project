var express = require('express');
var db = require('../database');
var moment = require('moment');
var mailsender = require('../mailsender');
var crypt = require('../cryptutils');
const constant = require('../constant');

var router = express.Router();

router.get(['/', '/home'], async (req, res) => {
    var promises = [db.GetProductList_Customer(), db.GetCategoryList()];
    var values = await Promise.all(promises);
    res.render('home', { products: values[0].slice(0, 8), categories: values[1] });
});

router.get('/products', async (req, res) => {
    var suitablePromise = null;
    if (req.query.cateId) {
        suitablePromise = db.GetProductListByCateId_Customer(parseInt(req.query.cateId.toString()));
    } else {
        suitablePromise = db.GetProductList_Customer();
    }
    var promises = [suitablePromise, db.GetCategoryList()];
    var values = await Promise.all(promises);
    if (req.query.keyword) {
        values[0] = values[0].filter(item => item.productName.toLowerCase().search(req.query.keyword.toString().toLowerCase()) != -1);
    }
    res.render('products', { products: values[0], categories: values[1] });
});

router.get('/productdetail', async (req, res) => {
    var categories = await db.GetCategoryList();
    var id = parseInt(req.query.id.toString());
    var product = await db.GetProductDetail(id);
    res.render('productdetail', { categories, product });
});

router.get('/signup', async (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    var user = req.body.username;
    var pass = req.body.password;
    var rePass = req.body.re_password;
    var email = req.body.email;
    var phone = req.body.phone;
    if (pass != rePass) {
        res.render('signup', { message: 'Password and re-password doesn\'t match' });
    } else if (!validateEmail(email)) {
        res.render('signup', { message: 'Your email is invalid' });
    } else if (!validatePhone(phone)) {
        res.render('signup', { message: 'Your phone is invalid' });
    } else {
        try {
            var hash = crypt.GetPasswordHash(pass);
            var result = await db.SignUp(user, hash, email, phone);
            var id = result;
            var time = new Date().getTime();
            var data = id + ',' + time;
            var token = encodeURIComponent(crypt.EncryptData(data));
            await mailsender.SendMailValidateAccount(email, token);
            res.redirect('/');
        } catch (err) {
            console.log(err);
            res.render('signup', { message: 'Something went wrong' });
        }
    }
});

router.get('/resendmail', async (req, res) => {
    var id = parseInt(req.query.id);
    var cust = await db.GetCustomerById(id);
    var time = new Date().getTime();
    var data = id + ',' + time;
    var token = encodeURIComponent(crypt.EncryptData(data));
    await mailsender.SendMailValidateAccount(cust.email, token);
    res.redirect('/');
});

router.get('/activate', async (req, res) => {
    var url = decodeURIComponent(req.query.token);
    var data = crypt.DecryptData(url).split(',');
    var timeInMiliseconds = parseInt(data[1]);
    var initialTime = moment(timeInMiliseconds);
    var expiredTime = moment(timeInMiliseconds).add(1, 'hour');
    var currentTime = moment();
    if (currentTime.isBetween(initialTime, expiredTime, null, "()")) {
        var result = await db.ActivateUser(data[0]);
        if (result) {
            res.redirect('/login');
        } else {
            res.send('Something went wrong. Try it later');
        }
    } else {
        res.status(404).send(`This token has been expired, try to send new active email by click this link: <a href="${constant.releaseUrl}/resendmail?id=${id}">Resend activate email</a>`);
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    var user = req.body.username;
    var pass = req.body.password;
    var hash = crypt.GetPasswordHash(pass);
    var cust = await db.CustomerLogin(user, hash);
    try {
        if (cust) {
            if (!cust.isActivated) {
                res.render('login', { message: 'Your account is not activated' });
            } else {
                req.session.customer = cust;
                res.redirect('/');
            }
        } else {
            res.render('login', { message: 'Username and/or password is incorrect' });
        }
    } catch (err) {
        res.render('login', { message: 'Something went wrong!' });
    }
});

router.post('/logout', (req, res) => {
    delete req.session.customer;
    res.redirect('/');
});

router.post('/addtocart', async (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    var product = await db.GetProductDetail(req.body.id);
    var quantity = req.body.quantity || 1;
    if (product) {
        var index = req.session.cart.findIndex(item => item.productId == req.body.id);
        if (index == -1) {
            product.quantity = quantity;
            req.session.cart.push(product);
            res.send({ status: 1, message: 'added complete successfully' });
        } else {
            req.session.cart[index].quantity += quantity;
            res.send({ status: 2, message: 'update complete successfully' });
        }
    } else {
        res.send({ status: 0, message: 'add failed' });
    }
});

router.get('/cart', async (req, res) => {
    var categories = await db.GetCategoryList();
    if (req.session.cart && req.session.cart.length > 0) {
        var total = 0;
        for (var item of req.session.cart) {
            total += parseInt(item.price) * parseInt(item.quantity);
        }
        res.render('cart', { categories, total });
    } else {
        res.redirect('/');
    }
});

router.post('/updatecart', (req, res) => {
    for (var item of req.body.list) {
        var index = req.session.cart.findIndex(product => product.productId == item.id);
        req.session.cart[index].quantity = item.quantity;
    }
    res.send({ status: 2, message: 'update cart complete successfully' });
});

router.post('/clearcart', (req, res) => {
    delete req.session.cart;
    res.send({ status: 3, message: 'clear cart complete successfully' });
});

router.post('/remove', (req, res) => {
    var index = req.session.cart.findIndex(item => item.productId == req.body.id);
    if (index != -1) {
        if (index == 0) {
            req.session.cart.shift();
        } else {
            req.session.cart.splice(index, 1);
        }
        res.send({ status: 4, message: 'delete item from cart complete successfully' });
    } else {
        res.send({ status: 0, message: 'delete failed' });
    }
});

router.get('/checkout', async (req, res) => {
    var categories = await db.GetCategoryList();
    if (req.session.cart && req.session.cart.length > 0) {
        var total = 0;
        for (var item of req.session.cart) {
            total += parseInt(item.price) * parseInt(item.quantity);
        }
        res.render('checkout', { categories, total });
    } else {
        res.redirect('/');
    }
});

router.post('/checkout', async (req, res) => {
    if (!req.session.customer) {
        res.redirect('/login');
        res.end();
    }
    var result = await db.InsertBill(req.session.customer.customerId, req.session.cart);
    if (result) {
        delete req.session.cart;
        res.redirect('/');
    } else {
        res.redirect('/checkout');
    }
});

router.get('/myorders', async (req, res) => {
    var categories = await db.GetCategoryList();
    var bills = await (await db.GetBillsByCustId(req.session.customer.customerId)).reverse();
    var items = null;
    if (req.query.id) {
        items = await db.GetBillItem(req.query.id);
    }
    res.render('myorders', { categories, bills, items });
});

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    const re = /0\d{9}/;
    return re.test(String(phone).toLowerCase());
}

module.exports = router;