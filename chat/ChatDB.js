var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
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
// ChatDB.ts
/// <reference path="./MySQL.ts" />
var ChatDB = /** @class */ (function (_super) {
    __extends(ChatDB, _super);
    function ChatDB() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.host = 'localhost'; // DBが動いているホスト名
        _this.user = 'root'; // DBにログインするユーザ名
        //private pass: string = 'hiro1128';          // パスワード
        //private pass: string = 'dbHiro!1981';          // パスワード
        _this.pass = 'in0nFLr5h'; // パスワード
        _this.db = 'chat'; // ログを格納するDB名
        _this.table = 'messages'; // テーブル名
        return _this;
    }
    ChatDB.prototype.connect = function () {
        _super.prototype.connect.call(this, this.host, this.db, this.user, this.pass); // DBにログインする
    };
    ChatDB.prototype.saveMessage = function (from, message, to) {
        if (to === void 0) { to = 'NULL'; }
        if (from === '')
            return; //システムからのメッセージは保存しない
        //修正：IDを自動登録するため
        var sql = 'INSERT INTO ' + this.table + ' ( from_name,to_name,message,time) VALUES '; // SQL文の組み立て
        sql += '(\'' + from + '\', \'' + to + '\', \'' + message + '\', NOW());';
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
            console.log(results);
            func(results[0].id, results[0].from_name, results[0].to_name, results[0].message);
        });
    };
    ChatDB.prototype.getMessage = function (func) {
        var sql = 'SELECT * FROM ' + this.table + ' ORDER BY time;'; // SQL文の組み立て
        this.query(sql, function (err, results) {
            for (var i = 0; i < results.length; i++)
                //修正：idを取得
                // func(results[i].from_name, results[i].to_name, results[i].message);
                func(results[i].id, results[i].from_name, results[i].to_name, results[i].message);
        });
    };
    return ChatDB;
}(MySQL));
