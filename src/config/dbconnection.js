const mysql = require('mysql');

module.exports = () =>{
    return mysql.createConnection({
        host: 'blog.inverte.do',
        user: 'master_oneauth',
        password: '!JseY7Hrt]*Z',
        database: 'oneauth2019'
    });
}