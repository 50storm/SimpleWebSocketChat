var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// wsclient.ts (c) 2014 matsuda
///<reference path='../../DefinitelyTyped/socket.io/socket.io.js.d.ts'/>
var WSClient;
(function (WSClient) {
    var Client = /** @class */ (function () {
        function Client(server, port) {
            this.groups = []; // グループのリスト
            this.server = server;
            this.port = port;
        }
        // サーバとの通信開始
        Client.prototype.start = function () {
            for (var i = 0, length = this.groups.length; i < length; i++) {
                var group = this.groups[i];
                var name = group.getName();
                // サーバ名、ポート番号、グループ名をもとにサーバに接続する
                var socket = io.connect('http://' + this.server + ':' + this.port + '/' + name);
                group.setSocket(socket);
            }
        };
        Client.prototype.checkGroupName = function (name) {
            for (var i = 0, length = this.groups.length; i < length; i++) {
                if (this.groups[i].getName() == name)
                    return false;
            }
            return true;
        };
        Client.prototype.addGroup = function (group) { this.groups.push(group); }; // グループを追加する
        return Client;
    }());
    WSClient.Client = Client;
    var Group = /** @class */ (function () {
        function Group(client, name) {
            if (name === void 0) { name = ''; }
            this.socket = null; // サーバと通信するソケット
            this.handlers = []; // イベントハンドラ {event, handler}
            if (!client.checkGroupName(name)) { // 同じグループ名がすでにある場合は false
                console.log('エラー: すでに同じグループ名があります(' + name + ')');
                return;
            }
            this.name = name;
            client.addGroup(this);
        }
        Group.prototype.getName = function () { return this.name; }; // 名前を返す
        Group.prototype.setSocket = function (socket) {
            this.socket = socket;
            for (var i = 0, length = this.handlers.length; i < length; i++) { // socketにイベントハンドラを設定
                var event = this.handlers[i].event;
                var handler = this.handlers[i].handler;
                this.socket.on(event, handler); // イベントハンドラを設定
            }
        };
        // イベント付でデータを送信する
        Group.prototype.emit = function (event, data) { this.socket.emit(event, data); };
        Group.prototype.on = function (event, handler) {
            if (this.socket == null) { // まだsocketが決まっていない場合
                this.handlers.push({ event: event, handler: handler });
            }
            else {
                this.socket.on(event, handler);
            }
        };
        Group.prototype.disconnect = function () { this.socket.disconnect(); }; // サーバとの接続を切る
        return Group;
    }());
    WSClient.Group = Group;
})(WSClient || (WSClient = {}));
// ChatDBClient.ts
/// <reference path="./modules/wsclient.ts" />
var ChatClient = /** @class */ (function (_super) {
    __extends(ChatClient, _super);
    function ChatClient(server, port) {
        var _this = _super.call(this, server, port) || this;
        _this.output = document.getElementById('output'); // メッセージの表示用
        _this.name = ''; // ハンドル名
        var gp = new WSClient.Group(_this); // グループを作成する
        _this.group = gp;
        // グループにイベントハンドラを設定する
        gp.on('connect', function () {
            _this.showMessage('サーバに接続');
            var cnt = 0; //修正:2回キャンセルしたらブラウザをクローズ
            var flgCancel = false;
            do { // ハンドル名を確認する
                //修正：強制的にwindowを閉じる 
                if (cnt == 2) {
                    flgCancel = true;
                    break;
                }
                _this.name = prompt('ハンドル名を入力して下さい。', _this.name);
                cnt++;
            } while (!confirm('「' + _this.name + '」でよろしいですか?'));
            //修正：強制的にwindowを閉じる
            if (flgCancel) {
                window.alert('チャットプログラムを終了します！');
                // window.close(); Chrom / Firefoxで閉じれない
                window.open('about:blank', '_self').close();
            }
            _this.group.emit('check_name', _this.name);
        });
        gp.on('valid_name', function (name) {
            _this.showMessage('ようこそ、' + name + 'さん');
            // 必要なイベントハンドラを設定
            _this.addEventHandlers(gp);
        });
        gp.on('duplicated_name', function (name) {
            do { // ハンドル名を再確認する
                _this.name = prompt('「' + _this.name + '」はすでに使われています。新しいハンドル名を入力して下さい。', _this.name);
            } while (!confirm('「' + _this.name + '」でよろしいですか?'));
            gp.emit('check_name', _this.name);
        });
        //修正：サーバーからのお知らせ
        //gp.on('notice_from_server', (message) => { console.log(message); this.showNoticeMessage(message); });
        gp.on('disconnect', function () { _this.showMessage('サーバから切断'); });
        return _this;
    }
    ChatClient.prototype.sendMessage = function (message) {
        this.group.emit('message', { from: this.name, message: message });
    };
    ChatClient.prototype.sendPrivateMessage = function (to, message) {
        this.group.emit('private_message', { from: this.name, to: to, message: message });
    };
    ChatClient.prototype.getNameList = function () {
        this.group.emit('get_names', 'all');
    };
    ChatClient.prototype.addEventHandlers = function (gp) {
        //サーバーから時刻送られてきたら表示
        var _this = this;
        gp.on('message', function (fromMessage) {
            //修正:idの取り出し
            var id = fromMessage.id;
            var from = fromMessage.from; // ハンドル名の取り出し
            var message = fromMessage.message; // メッセージの取り出し
            //this.showMessage(from + ': ' + message); 
            _this.showMessage('<span style="color: red">' + '[' + id + ']' + '</span>' + '<span style="color: black">' + from + ': ' + message + '</span>');
        });
        gp.on('new_user', function (name) { _this.showMessage(name + 'さんが来ました'); });
        gp.on('private_message', function (fromToMessage) {
            var id = fromToMessage.id;
            var from = fromToMessage.from;
            var message = fromToMessage.message;
            _this.showMessage('<span style="color: red">' + '[' + id + ']' + '[プライベート] ' + from + ': ' + message);
        });
        gp.on('no_user', function (name) {
            _this.showMessage('[エラー] ' + name + 'さんは居ません。');
        });
        gp.on('name_list', function (list) {
            _this.showMessage('[今居るユーザ] ' + list);
        });
        gp.on('log_message', function (fromMessage) {
            //console.log('log_message');
            //console.log(fromMessage);
            //修正:idの取り出し
            var id = fromMessage.id;
            var from = fromMessage.from; // ハンドル名の取り出し
            var message = fromMessage.message; // メッセージの取り出し
            //修正：idの表示
            _this.showMessage('<span style="color: red">' + '[' + id + ']' + '</span>' + '<span style="color: black">' + from + ': ' + message + '</span>');
        });
        gp.on('log_private_message', function (fromToMessage) {
            //修正:idの取り出し
            var id = fromToMessage.id;
            var from = fromToMessage.from;
            var message = fromToMessage.message;
            _this.showMessage('<span style="color: red">' + '[' + id + ']' + '</span>' + '<span style="color: blue">[プライベート] ' + from + ': ' + message + '</span>');
        });
    };
    // メッセージをブラウザに表示する
    ChatClient.prototype.showMessage = function (message) { this.output.innerHTML += message + '<br>'; };
    return ChatClient;
}(WSClient.Client));
var cc;
function sendMessage(obj) {
    var separator = ' >> '; // プライベートメッセージの例: こんにちは >> くんにゃ
    var message = obj.comment.value; // 送信する文字列の取り出し
    var i = message.search(separator); // ' >> 'があるか?
    obj.comment.value = ''; // テキストエリアを空にする
    if (i < 0) { // '>> 'が含まれていない(普通のチャット)
        cc.sendMessage(message); // サーバにメッセージを送信
    }
    else {
        var to = message.substr(i + separator.length); // ' >> '以降が宛先名なので取り出す
        cc.sendPrivateMessage(to, message); // サーバにプライベートメッセージを送信
    }
}
window.onload = function () {
    //cc = new ChatClient(location.hostname, 8888); // ローカルで動いているサーバに接続
    //cc = new ChatClient(location.hostname, 80); // GROOMで動いているサーバに接続
    cc = new ChatClient(location.hostname, 8888); // conoha VPSで動いているサーバに接続
    cc.start();
};
