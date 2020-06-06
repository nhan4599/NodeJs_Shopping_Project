var express = require('express');
var parser = require('body-parser');
var session = require('express-session');

var app = express();

app.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(session({ secret: '123456', resave: true, saveUninitialized: true }));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use('/assets', express.static('assets'));

app.use('/', require('./controller/customer'));
app.use('/admin', require('./controller/admin'));