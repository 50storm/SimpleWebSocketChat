// ChatDBServer.ts
/// <reference path="./modules/wsserver.ts" />
/// <reference path="./ChatDB.ts" />
/// <reference path="./Notice.ts" />
class ChatDBServer extends WSServer.Server {
  private names = []; // ハンドル名の連想配列 { name : socket }
  private db: ChatDB; //ChatDBクラス
  private notice:Notice;//Noticeクラス
  private timerToken: any; 
 
  constructor(port) { 
    super(port);
    this.on('listen', (port) => { console.log('サーバ起動: ' + port); });

    this.db = new ChatDB(); //ChatDBクラスのインスタンス生成
    this.notice = new Notice();

    var gp = new WSServer.Group(this);  // デフォルトのグループを作成する

    //お知らせ機能(サーバーからクライアントへ通知)
    //this.timerToken = this.notice.sendMessage( 11, 1000 * 60 , (event, msg) => {super.emit( event , msg)} );
      
     
       this.timerToken = this.notice.sendMessage((event, msg) => {super.emit( event , msg)} );
     
     
    // イベントハンドラの設定
    gp.on('connect', (socket) => { 
        console.log('クライアントが接続[Socket通信中]');
    });
  
    gp.on('message', (socket, message) => { // チャット内容を再送
      console.log(message);
      
      //修正：DB保存してから返信
      //gp.emit('message', message); // グループに接続する全員に返信

      this.db.saveMessage(message.from, message.message); // DBに保存
      console.log('=======DB保存しました。=====');
      //修正：DB保存してから返信
      this.db.getLastMessage((id, from, to, message) => { // ログの取り出し
         console.log('=====DEBUG========');
         console.log('id' + id);
         console.log('from' + from);
         console.log('to' + to);
         console.log('message' + message);
         gp.emit('message', { id:id, from: from, message: message } ); // グループに接続する全員に返信
        });
    });
    
    gp.on('private_message', (socket, fromToMessage) => { // プライベートチャット
      console.log('private_message:fromToMessage:' + fromToMessage);  
      console.log('fromToMessage.to:' + fromToMessage.to);  
      console.log('fromToMessage.message:' + fromToMessage.message);  
  
      var to = fromToMessage.to;    // 宛名を取り出す
      var toSocket = this.names[to]; // 宛名に対応するsocketを取り出す
      // 指定されたユーザがいるか？
      if (this.names[to] === undefined) { 
         socket.emit('no_user', to); // クライアントにいないことを伝える
         return;
      }
      var message = fromToMessage.message; // メッセージを取り出す
     
      //修正：DB保存してから、送信する
      // toSocket.emit('private_message', message); // 相手に送る
      // socket.emit('private_message', message); // 自分に送る

      // this.db.saveMessage(fromToMessage.from, message, to); // DBに保存
      
      //修正：DB保存してから、送信する
      this.db.saveMessage(fromToMessage.from, message, to); // DBに保存
      this.db.getLastMessage( (id, from, to, message) => { // ログの取り出し
        toSocket.emit('private_message', { id:id, from: from, message: message } ); // 相手に送る
        socket.emit('private_message', { id:id, from: from, message: message } ); // 自分に送る
      } );
      
    });

    gp.on('get_names', (socket, data) => {
      var names = '';
      for (var name in this.names) { names += name + ' '; }
      socket.emit('name_list', names);
    });
    
    gp.on('check_name', (socket, name) => { // ハンドル名の重複の確認
      if (this.names[name] === undefined) {
        this.names[name] = socket; // ハンドル名を連想リストに追加
        socket.name = name;  // socketにハンドル名を覚えておく
        socket.emit('valid_name', name); // ハンドル名が重複していないことを送信
        gp.emit(socket, 'new_user', name); // 他の人に知らせる
        console.log('ハンドル名の確認完了: ' + name); 

        this.db.getMessage((id, from, to, message) => { // ログの取り出し
          if (to === 'NULL') { // 全員宛のメッセージ
            socket.emit('log_message', { id:id, from: from, message: message });
            return;
          } // プライベートメッセージ
          if (to === name || from === name) // 自分宛、自分からのメッセージ
              socket.emit('log_private_message', { id:id, from: from, to: to, message: message });
        });
      } else {
        socket.emit('duplicated_name', name); // ハンドル名が重複している
        console.log('ハンドル名が重複: ' + name); 
      }
    });

    gp.on('disconnect', (socket) => {
      var name = socket.name;
      delete this.names[name]; // ハンドル名の連想配列を削除する
      console.log('クライアントが切断: ' + name);
    });
  }

  public start() {
    super.start();
    this.db.connect(); // データベースに接続する
  }
}

var cs = new ChatDBServer(8888); // サーバを作成し、起動する(local)
//var cs = new ChatDBServer(80); // サーバを作成し、起動する(groom)

cs.start();
