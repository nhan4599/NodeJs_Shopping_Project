var express = require('express');
// var parser = require('body-parser');
// var session = require('express-session');

var app = express();

app.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');

// app.use(parser.urlencoded({ extended: true }));
// app.use(parser.json());
// app.use(session({ secret: '123456' }));
// app.use((req, res, next) => {
//     res.locals.session = req.session;
//     next();
// });

app.get('/assets/css/:fileName', (req, res) => {
    res.sendFile(`${__dirname}/assets/css/${req.params.fileName}`);
});

app.get('/assets/js/:fileName', (req, res) => {
    res.sendFile(`${__dirname}/assets/js/${req.params.fileName}`);
});

app.get('/assets/fonts/:fileName', (req, res) => {
    res.sendFile(`${__dirname}/assets/fonts/${req.params.fileName}`);
});

app.use('/', require('./controller/customer'));
app.use('/admin', require('./controller/admin'));