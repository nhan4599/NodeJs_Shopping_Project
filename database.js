var sql = require('mssql');
var constant = require('./constant');
var crypt = require('crypto');

var pool = new sql.ConnectionPool(constant.dbConfig);

module.exports.GetProductList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select * from Product');
    return list.recordset;
};

module.exports.AdminLogin = async (username, password) => {
    try {
        var hash = crypt.createHash('md5').update(password).digest('hex');
        var conn = await pool.connect();
        var user = await conn.query(`select * from Admin where username = '${username}' and hash = '${hash}'`);
        return user;
    } catch (e) {
        return { message: e };
    }
};

module.exports.GetCategoryList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select * from Category');
    return list.recordset;
};

module.exports.GetProductStateList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select * from ProductState');
    return list.recordset;
};

module.exports.GetSegmentList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select * from Segment');
    return list.recordset;
};

module.exports.GetManufacturerList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select * from Manufacturer');
    return list.recordset;
};