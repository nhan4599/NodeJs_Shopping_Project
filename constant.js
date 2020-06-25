module.exports = {
    dbConfig: {
        server: 'den1.mssql7.gear.host',
        user: 'nodeproject',
        password: 'Hp6k_XQ87E!v',
        database: 'nodeproject',
        options: {
            enableArithAbort: true
        }
    },
    mailConfig: {
        service: 'gmail',
        auth: {
            user: 'nhan0385790927@gmail.com',
            pass: 'nhan4599'
        },
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    },
    pageSize: 10,
    releaseUrl: 'https://vast-shore-03767.herokuapp.com',
    cacheTimeout: 10,
    tokenTimeout: 1
};