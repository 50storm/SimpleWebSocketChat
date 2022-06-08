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
// wsserver.ts (c) 2014 matsuda
///<reference path='../../DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../DefinitelyTyped/socket.io/socket.io.d.ts'/>
var WSServer;
(function (WSServer) {
    var Server = /** @class */ (function () {
        function Server(port) {
            var _this = this;
            this.groups = []; // グループを管理する
            this.port = port;
            this.app = require('http').createServer(// httpサーバを作成する
            function (req, res) { _this.file.serve(req, res); } // 接続要求が来た時の処理
            );
            // クライアントからsocket接続を受け付ける
            this.io = require('socket.io')(this.app, {
                cors: {
                    origin: "http://localhost:80",
                    methods: ["GET", "POST"]
                }
            }); // クライアントからsocket接続を受け付ける
            this.ns = require('node-static'); // node-staticモジュールの読み込み
            this.file = new this.ns.Server('./'); // ファイルサーバを作成する
        }
        // クライアントからの接続を待つ
        Server.prototype.start = function () {
            var _this = this;
            if (!this.handler) {
                this.app.listen(this.port);
            }
            else {
                this.app.listen(this.port, function () { _this.handler.handler(_this.port); });
            }
        };
        // サーバにイベントハンドラを設定する
        Server.prototype.on = function (event, handler) {
            if (event === 'listen') {
                this.handler = { event: event, handler: handler };
            }
            else {
                console.log('エラー: ' + event + 'はサポートされていません');
            }
        };
        // このサーバに接続している全員に data を送信する
        Server.prototype.emit = function (event, data) { this.io.sockets.emit(event, data); };
        // 内部グループを作成する
        Server.prototype.createInnerGroup = function (name) {
            for (var i = 0; i < this.groups.length; i++) { // 同じグループ名があったら、nullを返す
                var gp = this.groups[i];
                if (gp.getName() === name)
                    return null;
            }
            return this.io.of('/' + name);
        };
        // グループを追加する
        Server.prototype.addGroup = function (group) { this.groups.push(group); };
        return Server;
    }());
    WSServer.Server = Server;
    var Group = /** @class */ (function () {
        function Group(server, name) {
            if (name === void 0) { name = ''; }
            var _this = this;
            this.handlers = []; // グループが持つイベントハンドラ
            this.group = server.createInnerGroup(name); // グループ管理用の内部グループを作成
            if (!this.group) { // 同じグループ名がすでにある場合は null
                console.log('エラー: すでに同じグループ名があります(' + name + ')');
                return;
            }
            this.name = name;
            // connection時のイベントハンドラを設定
            this.group.on('connection', function (socket) { _this.onConnect(socket); });
            server.addGroup(this);
        }
        Group.prototype.onConnect = function (socket) {
            for (var i = 0; i < this.handlers.length; i++) {
                var event = this.handlers[i].event; // イベント
                var handler = this.handlers[i].handler; // イベントハンドラ
                this.addEventHandler(socket, event, handler);
            }
        };
        Group.prototype.addEventHandler = function (socket, event, handler) {
            switch (event) {
                case 'connect':
                    handler(socket);
                    break;
                case 'disconnect':
                    socket.on(event, function () { handler(socket); });
                    break;
                default: // 上記以外のイベント
                    socket.on(event, function (data) { handler(socket, data); });
            }
        };
        // グループ名を取り出す
        Group.prototype.getName = function () { return this.name; };
        Group.prototype.emit = function (arg1, arg2, arg3) {
            if (typeof arg1 == 'string') {
                this.group.emit(arg1, arg2);
            } // emit(event, data)の場合
            else {
                arg1.broadcast.emit(arg2, arg3);
            } // emit(socket, event, data)の場合
        };
        // 指定したクライアント(socket)にイベントハンドラを設定する
        Group.prototype.on = function (event, handler) {
            // すでに存在するsocketにイベントハンドラを設定する
            for (var id in this.group.connected) {
                var socket = this.group.connected[id];
                this.addEventHandler(socket, event, handler);
            }
            this.handlers.push({ event: event, handler: handler });
        };
        return Group;
    }());
    WSServer.Group = Group;
})(WSServer || (WSServer = {}));
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
// ChatDBServer.ts
/// <reference path="./modules/wsserver.ts" />
/// <reference path="./ChatDB.ts" />
var ChatDBServer = /** @class */ (function (_super) {
    __extends(ChatDBServer, _super);
    function ChatDBServer(port) {
        var _this = _super.call(this, port) || this;
        _this.names = []; // ハンドル名の連想配列 { name : socket }
        _this.on('listen', function (port) { console.log('サーバ起動: ' + port); });
        _this.db = new ChatDB(); //ChatDBクラスのインスタンス生成
        var gp = new WSServer.Group(_this); // デフォルトのグループを作成する
        // イベントハンドラの設定
        gp.on('connect', function (socket) {
            console.log('クライアントが接続[Socket通信中]');
        });
        gp.on('message', function (socket, message) {
            console.log(message);
            //修正：DB保存してから返信
            //gp.emit('message', message); // グループに接続する全員に返信
            _this.db.saveMessage(message.from, message.message); // DBに保存
            console.log('=======DB保存しました。=====');
            //修正：DB保存してから返信
            _this.db.getLastMessage(function (id, from, to, message) {
                console.log('=====DEBUG========');
                console.log('id' + id);
                console.log('from' + from);
                console.log('to' + to);
                console.log('message' + message);
                gp.emit('message', { id: id, from: from, message: message }); // グループに接続する全員に返信
            });
        });
        gp.on('private_message', function (socket, fromToMessage) {
            console.log('private_message:fromToMessage:' + fromToMessage);
            console.log('fromToMessage.to:' + fromToMessage.to);
            console.log('fromToMessage.message:' + fromToMessage.message);
            var to = fromToMessage.to; // 宛名を取り出す
            var toSocket = _this.names[to]; // 宛名に対応するsocketを取り出す
            // 指定されたユーザがいるか？
            if (_this.names[to] === undefined) {
                socket.emit('no_user', to); // クライアントにいないことを伝える
                return;
            }
            var message = fromToMessage.message; // メッセージを取り出す
            //修正：DB保存してから、送信する
            // toSocket.emit('private_message', message); // 相手に送る
            // socket.emit('private_message', message); // 自分に送る
            // this.db.saveMessage(fromToMessage.from, message, to); // DBに保存
            //修正：DB保存してから、送信する
            _this.db.saveMessage(fromToMessage.from, message, to); // DBに保存
            _this.db.getLastMessage(function (id, from, to, message) {
                toSocket.emit('private_message', { id: id, from: from, message: message }); // 相手に送る
                socket.emit('private_message', { id: id, from: from, message: message }); // 自分に送る
            });
        });
        gp.on('get_names', function (socket, data) {
            var names = '';
            for (var name in _this.names) {
                names += name + ' ';
            }
            socket.emit('name_list', names);
        });
        gp.on('check_name', function (socket, name) {
            if (_this.names[name] === undefined) {
                _this.names[name] = socket; // ハンドル名を連想リストに追加
                socket.name = name; // socketにハンドル名を覚えておく
                socket.emit('valid_name', name); // ハンドル名が重複していないことを送信
                gp.emit(socket, 'new_user', name); // 他の人に知らせる
                console.log('ハンドル名の確認完了: ' + name);
                _this.db.getMessage(function (id, from, to, message) {
                    if (to === 'NULL') { // 全員宛のメッセージ
                        socket.emit('log_message', { id: id, from: from, message: message });
                        return;
                    } // プライベートメッセージ
                    if (to === name || from === name) // 自分宛、自分からのメッセージ
                        socket.emit('log_private_message', { id: id, from: from, to: to, message: message });
                });
            }
            else {
                socket.emit('duplicated_name', name); // ハンドル名が重複している
                console.log('ハンドル名が重複: ' + name);
            }
        });
        gp.on('disconnect', function (socket) {
            var name = socket.name;
            delete _this.names[name]; // ハンドル名の連想配列を削除する
            console.log('クライアントが切断: ' + name);
        });
        return _this;
    }
    ChatDBServer.prototype.start = function () {
        _super.prototype.start.call(this);
        this.db.connect(); // データベースに接続する
    };
    return ChatDBServer;
}(WSServer.Server));
// var cs = new ChatDBServer(8888); // サーバを作成し、起動する(local)
var cs = new ChatDBServer(80); // サーバを作成し、起動する(groom)
cs.start();
