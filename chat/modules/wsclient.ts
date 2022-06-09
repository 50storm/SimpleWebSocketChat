// wsclient.ts (c) 2014 matsuda
///<reference path='../../DefinitelyTyped/socket.io/socket.io.js.d.ts'/>

module WSClient {
  // client側のモジュール
  export class Client {
    private server: string; // サーバ名(localhostなど)
    private groups: WSClient.Group[] = []; // グループのリスト
    private port: number; // 8888など

    constructor(server: string, port: number) {
      this.server = server;
      this.port = port;
    }

    // サーバとの通信開始
    public start(): void {
      for (var i = 0, length = this.groups.length; i < length; i++) {
        var group = this.groups[i];
        var name = group.getName();
        // サーバ名、ポート番号、グループ名をもとにサーバに接続する
        var socket = io.connect(
          "http://" + this.server + ":" + this.port + "/" + name
        );
        group.setSocket(socket);
      }
    }

    public checkGroupName(name: string): boolean {
      // 同じグループ名があるかどうかチェックする
      for (var i = 0, length = this.groups.length; i < length; i++) {
        if (this.groups[i].getName() == name) return false;
      }
      return true;
    }

    public addGroup(group: WSClient.Group): void {
      this.groups.push(group);
    } // グループを追加する
  }

  export class Group {
    // グループを管理するクラス
    private name: string; // 名前
    private socket = null; // サーバと通信するソケット
    private handlers = []; // イベントハンドラ {event, handler}

    constructor(client: WSClient.Client, name = "") {
      if (!client.checkGroupName(name)) {
        // 同じグループ名がすでにある場合は false
        console.log("エラー: すでに同じグループ名があります(" + name + ")");
        return;
      }
      this.name = name;
      client.addGroup(this);
    }

    public getName(): string {
      return this.name;
    } // 名前を返す

    public setSocket(socket): void {
      // サーバとの通信路が決まるとハンドラを設定する
      this.socket = socket;

      for (var i = 0, length = this.handlers.length; i < length; i++) {
        // socketにイベントハンドラを設定
        var event = this.handlers[i].event;
        var handler = this.handlers[i].handler;
        this.socket.on(event, handler); // イベントハンドラを設定
      }
    }

    // イベント付でデータを送信する
    public emit(event: string, data): void {
      this.socket.emit(event, data);
    }

    public on(event: string, handler: Function): void {
      // イベントハンドラを設定する
      if (this.socket == null) {
        // まだsocketが決まっていない場合
        this.handlers.push({ event: event, handler: handler });
      } else {
        this.socket.on(event, handler);
      }
    }

    public disconnect(): void {
      this.socket.disconnect();
    } // サーバとの接続を切る
  }
}
