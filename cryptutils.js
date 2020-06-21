const crypt = require('crypto');
const algorithm = 'aes-192-cbc';
const key = crypt.scryptSync('nhan4599', 'salt', 24);
const iv = Buffer.alloc(16, 0);

module.exports.GetPasswordHash = password => {
    return crypt.createHash('md5').update(password).digest('hex');
};

module.exports.EncryptData = data => {
    var cipher = crypt.createCipheriv(algorithm, key, iv);
    return cipher.update(data, 'ascii', 'hex') + cipher.final('hex');
};

module.exports.DecryptData = encrypted => {
    var decipher = crypt.createDecipheriv(algorithm, key, iv);
    return decipher.update(encrypted, 'hex', 'ascii') + decipher.final('ascii');
};