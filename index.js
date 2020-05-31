var express = require('express');
var parser = require('body-parser');
var session = require('express-session');

var app = express();

app.listen(3000);

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(session({ secret: '123456' }));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use('/', require('./controller/customer'));
app.use('/admin', require('./controller/admin'));