var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// MySQL.ts
/// <reference path='../DefinitelyTyped/mysql/mysql.d.ts'/>
/// <reference path='../DefinitelyTyped/node/node.d.ts'/>
var MySQL = /** @class */ (function () {
    function MySQL() {
        this.mysql = require('mysql');
    } // MySQLモジュールのロード
    // データベースにログイン(接続)する
    MySQL.prototype.connect = function (host, db, user, pass, port) {
        this.connection = this.mysql.createConnection({
            host: host,
            database: db,
            user: user,
            password: pass,
            port: port
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
// ChatDB.ts
/// <reference path="./MySQL.ts" />
var ChatDB = /** @class */ (function (_super) {
    __extends(ChatDB, _super);
    function ChatDB() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.host = 'localhost'; // DBが動いているホスト名
        _this.user = 'chatadmin'; // DBにログインするユーザ名
        _this.pass = 'chat!"#$!QAZ1234'; // パスワード
        _this.db = 'chat'; // ログを格納するDB名
        _this.table = 'messages'; // テーブル名
        // private port: number = 3306;
        _this.port = 8889; // MAMP
        return _this;
    }
    ChatDB.prototype.connect = function () {
        _super.prototype.connect.call(this, this.host, this.db, this.user, this.pass, this.port); // DBにログインする
    };
    ChatDB.prototype.saveMessage = function (from, message, to) {
        if (to === void 0) { to = 'NULL'; }
        if (from === '')
            return; //システムからのメッセージは保存しない
        //修正：IDを自動登録するため
        var sql = 'INSERT INTO ' + this.table + ' ( from_name,to_name,message,time) VALUES '; // SQL文の組み立て
        sql += '(\'' + from + '\', \'' + to + '\', \'' + message + '\', NOW());';
        console.log(sql);
        this.query(sql, 
        //修正:ログを出力しておく
        function (err, results) {
            console.log("////[LOG]ChatDB:saveMessage////");
            console.log("error=>" + err);
            console.log("results=>" + results);
        }); // SQL文を発行しログを保存する
    };
    //追加：最終行のメッセージを取り出す
    ChatDB.prototype.getLastMessage = function (func) {
        var sql = 'SELECT * FROM ' + this.table + ' ORDER BY id desc limit 1;'; // SQL文の組み立て
        this.query(sql, function (err, results) {
            //ログ出力
            console.log("最後のデータ");
            console.log(sql);
            console.log(results);
            if (results != null) {
                func(results[0].id, results[0].from_name, results[0].to_name, results[0].message);
            }
        });
    };
    ChatDB.prototype.getMessage = function (func) {
        var sql = 'SELECT * FROM ' + this.table + ' ORDER BY time;'; // SQL文の組み立て
        this.query(sql, function (err, results) {
            if (results != null) {
                for (var i = 0; i < results.length; i++) {
                    func(results[i].id, results[i].from_name, results[i].to_name, results[i].message);
                }
            }
        });
    };
    return ChatDB;
}(MySQL));
