const nodemailer = require('nodemailer');
const constant = require('./constant');
const crypt = require('crypto');
const algorithm = 'aes-192-cbc';
const key = crypt.scryptSync('nhan4599', 'salt', 24);
const transporter = nodemailer.createTransport(constant.mailConfig);

module.exports.SendMailValidateAccount = async (to, token) => {
    var option = {
        from: 'nhan4599',
        to: to,
        html: `<p>hello, you must be activate your account before you can login. by click this link <a href="http://localhost:3000/activate?token=${token}">http://localhost:3000/activate?token=${token}</a> you are activated your account(expire in 1 hour)</p>`
    };
    return await transporter.sendMail(option);
};