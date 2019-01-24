// wsclient.ts
///<reference path='../../DefinitelyTyped/socket.io/socket.io.js.d.ts'/>
var WSClient;
(function (WSClient) {
    var Client = (function () {
        function Client(server, port) {
            this.groups = [];
            this.server = server;
            this.port = port;
        }
        // サーバとの通信開始
        Client.prototype.start = function () {
            for (var i = 0; i < this.groups.length; i++) {
                var group = this.groups[i];
                var name = group.getName();

                // サーバ名、ポート番号、グループ名をもとにサーバに接続する
                var socket = io.connect('http://' + this.server + ':' + this.port + '/' + name);
                group.setSocket(socket);
            }
        };

        Client.prototype.checkGroupName = function (name) {
            for (var i = 0; i < this.groups.length; i++) {
                if (this.groups[i].getName() == name)
                    return false;
            }
            return true;
        };

        // グループを追加する
        Client.prototype.addGroup = function (group) {
            this.groups.push(group);
        };
        return Client;
    })();
    WSClient.Client = Client;

    var Group = (function () {
        function Group(client, name) {
            if (typeof name === "undefined") { name = ''; }
            this.handlers = [];
            if (!client.checkGroupName(name)) {
                console.log('エラー: すでに同じグループ名があります(' + name + ')');
            }
            this.name = name;
            client.addGroup(this);
        }
        Group.prototype.getName = function () {
            return this.name;
        };

        Group.prototype.setSocket = function (socket) {
            this.socket = socket;

            for (var i = 0; i < this.handlers.length; i++) {
                var event = this.handlers[i].event;
                var handler = this.handlers[i].handler;
                this.socket.on(event, handler);
            }
        };

        Group.prototype.emit = function (event, data) {
            this.socket.emit(event, data);
        };
        Group.prototype.on = function (event, handler) {
            this.handlers.push({ event: event, handler: handler });
        };
        Group.prototype.disconnect = function () {
            this.socket.disconnect();
        };
        return Group;
    })();
    WSClient.Group = Group;
})(WSClient || (WSClient = {}));
