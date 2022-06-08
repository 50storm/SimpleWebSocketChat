// wsserver.ts (c) 2014 matsuda
///<reference path='../../DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../DefinitelyTyped/socket.io/socket.io.d.ts'/>

module WSServer { 
  export class Server {
    private port: number; // クライアントと通信する際のポート番号
    private app;  // httpサーバ
    private io;   // socketを管理するManager
    private ns;   // node-staticモジュール
    private file; // ファイルサーバ
    private groups: WSServer.Group[] = []; // グループを管理する
    private handler; // listen用のイベントハンドラ
  
    constructor(port: number) {
      this.port = port;
      this.app = require('http').createServer(       // httpサーバを作成する
        (req, res) => { this.file.serve(req, res); } // 接続要求が来た時の処理
      );
      // クライアントからsocket接続を受け付ける
      this.io = require('socket.io')(this.app,{
        cors: {
          origin: "http://localhost:80",
          methods: ["GET", "POST"]
        }
      }); // クライアントからsocket接続を受け付ける
      this.ns = require('node-static'); // node-staticモジュールの読み込み
      this.file = new this.ns.Server('./'); // ファイルサーバを作成する
    }
 
    // クライアントからの接続を待つ
    public start(): void { // listenイベント用のハンドラを設定する
      if (!this.handler) { this.app.listen(this.port); }
      else { this.app.listen(this.port, () => { this.handler.handler(this.port); }); }
    }

    // サーバにイベントハンドラを設定する
    public on(event: string, handler: Function): void {  // 現在は listen イベントだけ
      if (event === 'listen') { this.handler = { event: event, handler: handler }; } 
      else { console.log('エラー: ' + event + 'はサポートされていません'); }
    }

    // このサーバに接続している全員に data を送信する
    public emit(event: string, data: any): void { this.io.sockets.emit(event, data); }

    // 内部グループを作成する
    public createInnerGroup(name: string): SocketNamespace {
      for (var i = 0; i < this.groups.length; i++) { // 同じグループ名があったら、nullを返す

        var gp = this.groups[i];
        if(gp.getName() === name) return null;
      }
      return this.io.of('/' + name);
    }

    // グループを追加する
    public addGroup(group: WSServer.Group): void { this.groups.push(group); }
  }
  
  export class Group {
    private name: string; // グループ名
    private group: SocketNamespace; // グループを管理するオブジェクト
    private handlers = []; // グループが持つイベントハンドラ
  
    constructor(server: WSServer.Server, name: string = '') { 
      this.group = server.createInnerGroup(name); // グループ管理用の内部グループを作成
      if (!this.group) { // 同じグループ名がすでにある場合は null
        console.log('エラー: すでに同じグループ名があります(' + name + ')');
        return;
      }
      this.name = name;
      // connection時のイベントハンドラを設定
      this.group.on('connection', (socket: Socket) => { this.onConnect(socket); }); 
      server.addGroup(this);
    }

    private onConnect(socket: Socket): void { // connection時にイベントハンドラをsocketに設定
      for (var i = 0; i < this.handlers.length; i++) {
        var event = this.handlers[i].event;     // イベント
        var handler = this.handlers[i].handler; // イベントハンドラ
        this.addEventHandler(socket, event, handler);
      }
    }

    private addEventHandler(socket: Socket, event: string, handler: Function): void {
      switch (event) {
        case 'connect': handler(socket); break;
        case 'disconnect': 
          socket.on(event, () => { handler(socket); }); 
          break;
        default: // 上記以外のイベント
          socket.on(event, (data) => { handler(socket, data); });
      }       
    }
 
    // グループ名を取り出す
    public getName(): string { return this.name; }
    // グループにいるクライアント全員にdataを送信
    public emit(event: string, data: any): void;
    public emit(socket, event: string, data: any): void; // socket以外に送る
    public emit(arg1: any, arg2: any, arg3?): void { 
      if (typeof arg1 == 'string') { this.group.emit(arg1, arg2); } // emit(event, data)の場合
      else { arg1.broadcast.emit(arg2, arg3); }     // emit(socket, event, data)の場合
    }

    // 指定したクライアント(socket)にイベントハンドラを設定する
    public on(event: string, handler: Function): void { 
      // すでに存在するsocketにイベントハンドラを設定する
      for(var id in this.group.connected) {
        var socket = this.group.connected[id];
        this.addEventHandler(socket, event, handler);
      }
      this.handlers.push({event: event, handler: handler}); 
    }
  }
}
