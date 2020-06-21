const nodemailer = require('nodemailer');
const constant = require('./constant');
const transporter = nodemailer.createTransport(constant.mailConfig);

module.exports.SendMailValidateAccount = async (to, token) => {
    var option = {
        from: 'nhan4599',
        to: to,
        html: `<p>hello, you must be activate your account before you can login. by click this link <a href="https://vast-shore-03767.herokuapp.com/activate?token=${token}">https://vast-shore-03767.herokuapp.com/activate?token=${token}</a> you are activated your account</p>`
    };
    return await transporter.sendMail(option);
};