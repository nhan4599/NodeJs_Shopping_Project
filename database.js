var sql = require('mssql');

var constant = require('./constant');
var crypt = require('crypto');

var pool = new sql.ConnectionPool(constant.dbConfig);

module.exports.GetProductList = async () => {
    var conn = await pool.connect();
    var list = await conn.query('select Product.productId, Product.productName, Product.inventory, Product.price, Category.cateName, ProductState.stateName, Segment.segmentName, Manufacturer.manuName from Product, ProductState, Segment, Manufacturer, Category where Product.cateId = Category.cateId and Product.stateId = ProductState.stateId and Product.segmentId = Segment.segmentId and Product.manuId = Manufacturer.manuId');
    return list.recordset;
};



module.exports.GetThumbnailImageList = async (products) => {
    var conn = await pool.connect();
    var list = new Array(products.length);
    for (var i = 0; i < list.length; i++) {
        list[i] = await (await conn.query(`select top 1 imgBase64 from Image where productId = ${products[i].productId}`)).recordset[0].imgBase64;
    }
    return list;
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

module.exports.InsertProduct = async (product) => {
    var conn = await pool.connect();
    var result = await conn.query(`insert into Product(productName, inventory, price, cateId, stateId, segmentId, manuId) values(N'${product.name}', ${product.inventory}, ${product.price}, ${product.category}, ${product.state}, ${product.segment}, ${product.manu})`);
    var insertedId = await conn.query('select @@IDENTITY as temp');
    var id = parseInt(insertedId.recordset[0].temp.toString());
    var subResults = await Promise.all([InsertProductConfig(conn, id, product.config), InsertProductImage(conn, id, product.images)]);
    return [result.rowsAffected[0], subResults[0].rowsAffected[0], subResults[1].rowsAffected[0]];
};

module.exports.InsertManufactures = async (Manufacturer) => {
    var conn = await pool.connect();
    var result = await conn.query(`insert into Manufactureres(manuName, manuAddress) values(N'${Manufacturer.name}', ${Manufacturer.address})`);
    return result.rowsAffected[0];
};

module.exports.GetProductDetail = async (id) => {
    var conn = await pool.connect();
    var result = await conn.query(`select Product.productId, Product.productName, Product.inventory, Product.price, Category.cateName, ProductState.stateName, Segment.segmentName, Manufacturer.manuName from Product, ProductState, Segment, Manufacturer, Category where Product.cateId = Category.cateId and Product.stateId = ProductState.stateId and Product.segmentId = Segment.segmentId and Product.manuId = Manufacturer.manuId and Product.productId = ${id}`);
    result.recordset[0].config = await GetProductConfig(conn, id);
    result.recordset[0].images = await GetProductImage(conn, id);
    return result.recordset[0];
};

async function GetProductConfig(conn, id) {
    var result = await conn.query(`select * from Configuration where productId = ${id}`);
    return result.recordset[0];
}

async function GetProductImage(conn, id) {
    var result = await conn.query(`select * from Image where productId = ${id}`);
    return result.recordset;
}

async function InsertProductConfig(conn, id, config) {
    return await conn.query(`insert into Configuration values(${id}, ${config.ram}, '${config.screen}', '${config.rearCam}', '${config.frontCam}', '${config.os}', ${config.storage}, '${config.sdType}', ${config.sdSize}, ${config.pin})`);
}

async function InsertProductImage(conn, id, images) {
    var str = '';
    var imageList = Object.values(images);
    var length = imageList.length <= 4 ? imageList.length : 4;
    for (var i = 0; i < length; i++) {
        if (i !== length - 1)
            str += `(${id}, '${imageList[i]}'),`;
        else
            str += `(${id}, '${imageList[i]}')`;
    }
    var queryString = `insert into Image(productId, imgBase64) values${str}`;
    return await conn.query(queryString);
}