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
            this.io = require('socket.io')(this.app); // クライアントからsocket接続を受け付ける
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
            for (var i = 0; i < this.groups.length; i++) {
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
            if (!this.group) {
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
                default:// 上記以外のイベント
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
