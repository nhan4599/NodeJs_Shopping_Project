var sql = require('mssql');

var constant = require('./constant');

var crypt = require('./cryptutils');

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

module.exports.AdminLogin = async (username, hash) => {
    try {
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

module.exports.GetProductDetail = async (id) => {
    var conn = await pool.connect();
    var result = await conn.query(`select Product.productId, Product.productName, Product.inventory, Product.price, Category.cateName, ProductState.stateName, Segment.segmentName, Manufacturer.manuName from Product, ProductState, Segment, Manufacturer, Category where Product.cateId = Category.cateId and Product.stateId = ProductState.stateId and Product.segmentId = Segment.segmentId and Product.manuId = Manufacturer.manuId and Product.productId = ${id}`);
    result.recordset[0].config = await GetProductConfig(conn, id);
    result.recordset[0].images = await GetProductImages(conn, id);
    return result.recordset[0];
};

module.exports.UpdateProduct = async (id, product) => {
    var conn = await pool.connect();
    var result = await conn.query(`update Product set productName = '${product.name}', inventory = ${product.inventory}, cateId = ${product.category}, stateId = ${product.state}, segmentId = ${product.segment}, manuId = ${product.manu} where productId = ${id}`);
    var subResults = await Promise.all([UpdateProductConfig(conn, id, product.config), UpdateProductImages(conn, id, product.images)]);
    return [result.rowsAffected[0], subResults[0].rowsAffected[0], subResults[1].rowsAffected[0]];
};

module.exports.GetCategoryById = async (id) => {
    var conn = await pool.connect();
    var result = await conn.query(`select * from Category where cateId = ${id}`);
    return result.recordset[0];
};

module.exports.UpdateCategory = async (id, cateName) => {
    var conn = await pool.connect();
    var result = await conn.query(`update Category set cateName = '${cateName}' where cateId = ${id}`);
    return result.rowsAffected > 0 ? true : false;
};

module.exports.InsertCategory = async (cateName) => {
    var conn = await pool.connect();
    var result = await conn.query(`insert into Category(cateName) values(N'${cateName}')`);
    return result.rowsAffected > 0 ? true : false;
};

module.exports.GetProductListByCateId_Customer = async (cateId) => {
    var conn = await pool.connect();
    var result = await conn.query(`select * from Product where cateId = ${cateId}`);
    for (var i = 0; i < result.recordset.length; i++) {
        result.recordset[i].image = (await GetProductImages(conn, result.recordset[i].productId))[0].imgBase64;
    }
    return result.recordset;
};

module.exports.GetProductList_Customer = async () => {
    var conn = await pool.connect();
    var result = await conn.query('select * from Product');
    for (var i = 0; i < result.recordset.length; i++) {
        result.recordset[i].image = (await GetProductImages(conn, result.recordset[i].productId))[0].imgBase64;
    }
    return result.recordset;
};

module.exports.SignUp = async (user, hash, email, phone) => {
    var conn = await pool.connect();
    await conn.query(`insert into Customer(username, hash, isActivated, email, phoneNumber) values('${user}', '${hash}', 0, '${email}', '${phone}')`);
    return (await conn.query('select @@IDENTITY as temp')).recordset[0].temp;
};

module.exports.ActivateUser = async id => {
    var conn = await pool.connect();
    var result = await conn.query(`update Customer set isActivated = 1 where customerId = ${id}`);
    return result.rowsAffected[0] === 1 ? true : false;
};

module.exports.GetCustomerById = async id => {
    var conn = await pool.connect();
    var result = await conn.query(`select * from Customer where customerId = ${id}`);
    return result.recordset[0];
};

module.exports.CustomerLogin = async (user, hash) => {
    var conn = await pool.connect();
    var result = await conn.query(`select * from Customer where username = '${user}' and hash = '${hash}'`);
    return result.recordset[0];
};

module.exports.InsertBill = async (custId, items) => {
    var conn = await pool.connect();
    var time = new Date().toISOString();
    var result = await conn.query(`insert into Bill(customerId, createdDate, stateId) values(${custId}, '${time}', 4)`);
    var insertedId = parseInt((await conn.query('select @@IDENTITY as temp')).recordset[0].temp.toString());
    var finalResult = await InsertBillDetail(conn, insertedId, items) + result.rowsAffected[0];
    return finalResult >= 2 ? true : false;
};

module.exports.GetBillsByCustId = async custId => {
    var conn = await pool.connect();
    var result = await conn.query(`select Bill.billId, Bill.createdDate, BillState.stateName from Bill, BillState where customerId = ${custId} and Bill.stateId = BillState.stateId`);
    return result.recordset;
};

module.exports.GetBillItem = async billId => {
    var conn = await pool.connect();
    var result = await conn.query(`select BillDetail.productId, BillDetail.quantity from BillDetail where billId = ${billId}`);
    for (var i = 0; i < result.recordset.length; i++) {
        result.recordset[i].product = await this.GetProductDetail(result.recordset[i].productId);
    }
    return result.recordset;
};

async function InsertBillDetail(conn, id, items) {
    var str = '';
    for (var i = 0; i < items.length; i++) {
        if (i !== items.length - 1)
            str += `(${id}, ${items[i].productId}, ${items[i].quantity}),`;
        else
            str += `(${id}, ${items[i].productId}, ${items[i].quantity})`;
    }
    var queryString = `insert into BillDetail(billId, productId, quantity) values${str}`;
    return (await conn.query(queryString)).rowsAffected[0];
}

async function GetProductImages(conn, id,) {
    var result = await conn.query(`select * from Image where productId = ${id}`);
    return result.recordset;
}

async function GetProductConfig(conn, id) {
    var result = await conn.query(`select * from Configuration where productId = ${id}`);
    return result.recordset[0];
}

async function InsertProductConfig(conn, id, config) {
    return await conn.query(`insert into Configuration values(${id}, ${config.ram}, '${config.screen}', '${config.rearCam}', '${config.frontCam}', '${config.os}', ${config.storage}, '${config.sdType}', ${config.sdSize}, ${config.pin})`);
}

async function InsertProductImage(conn, id, images) {
    var str = '';
    var imageList = Object.values(images);
    if (imageList.length === 0) {
        return 0;
    }
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

module.exports.GetAllCustomer = async () => {
    var conn = await pool.connect();
    var result = await conn.query('select * from Customer');
    return result.recordset;
};

module.exports.GetActiveCustomer = async () => {
    var conn = await pool.connect();
    var result = await conn.query('select isActivated from Customer');
    return result.recordset;
};

module.exports.DeactiveAccount = async id => {
    var conn = await pool.connect();
    var rs = await conn.query(`update Customer set isActivated = 0 where customerId =${id}`);
    return rs.rowsAffected[0] == 1 ? true:false
};

module.exports.resetPassword = async id => {
    var conn = await pool.connect();
    var rs = await conn.query(`update Customer set hash = '827ccb0eea8a706c4c34a16891f84e7b' where customerId =${id}`);
    return rs.rowsAffected[0] == 1 ? true:false
};
