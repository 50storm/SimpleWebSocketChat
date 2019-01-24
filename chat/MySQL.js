// MySQL.ts
/// <reference path='../DefinitelyTyped/mysql/mysql.d.ts'/>
/// <reference path='../DefinitelyTyped/node/node.d.ts'/>
var MySQL = /** @class */ (function () {
    function MySQL() {
        this.mysql = require('mysql');
    } // MySQLモジュールのロード
    // データベースにログイン(接続)する
    MySQL.prototype.connect = function (host, db, user, pass) {
        this.connection = this.mysql.createConnection({
            host: host,
            database: db,
            user: user,
            password: pass
        });
    };
    //細かいバグを修正
    MySQL.prototype.query = function (sql, func) {
        this.connection.query(sql, function (err, results) {
            if (typeof err !== 'undefined')
                func(err, results);
        });
    };
    MySQL.prototype.close = function () { this.connection.end(); }; // MySQLとの接続を切断
    return MySQL;
}());
