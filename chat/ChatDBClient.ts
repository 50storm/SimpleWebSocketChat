// ChatDBClient.ts
/// <reference path="./modules/wsclient.ts" />
class ChatClient extends WSClient.Client {
  private output = document.getElementById('output'); // メッセージの表示用
  //private notice = document.getElementById('notice'); // 修正:メッセージの表示用
  private group: WSClient.Group; // 作成したグループを保持
  private name: string = ''; // ハンドル名

  constructor(server, port) {
    super(server, port);

    var gp = new WSClient.Group(this);    // グループを作成する
    this.group = gp;
    // グループにイベントハンドラを設定する
    gp.on('connect', () => { 
      this.showMessage('サーバに接続'); 
      var cnt = 0; //修正:2回キャンセルしたらブラウザをクローズ
      var flgCancel = false;
      do { // ハンドル名を確認する
      //修正：強制的にwindowを閉じる 
        if(cnt == 2){ 
            flgCancel=true;
            break;
        }
        this.name = prompt('ハンドル名を入力して下さい。', this.name);
        cnt ++;
        
      } while(!confirm('「' + this.name + '」でよろしいですか?'));
      //修正：強制的にwindowを閉じる
      if(flgCancel){
          window.alert('チャットプログラムを終了します！');
          // window.close(); Chrom / Firefoxで閉じれない
          window.open('about:blank','_self').close();
      }
      this.group.emit('check_name', this.name);
    });

    gp.on('valid_name', (name) => { // 名前が重複していなかった
      this.showMessage('ようこそ、' + name + 'さん');
      // 必要なイベントハンドラを設定
      this.addEventHandlers(gp);
    });

    gp.on('duplicated_name', (name) => { // 名前が重複していた
      do { // ハンドル名を再確認する
        this.name = prompt('「' + this.name + '」はすでに使われています。新しいハンドル名を入力して下さい。', this.name);
      } while(!confirm('「' + this.name + '」でよろしいですか?'));
      
      gp.emit('check_name', this.name);
    });
	//修正：サーバーからのお知らせ
	//gp.on('notice_from_server', (message) => { console.log(message); this.showNoticeMessage(message); });
    gp.on('disconnect', () => { this.showMessage('サーバから切断'); });
  }

  public sendMessage(message) {   // サーバにメッセージを送信する
    this.group.emit('message', { from: this.name, message: message }); 
  }

  public sendPrivateMessage(to, message) { // サーバにプライベートメッセージを送信する
    this.group.emit('private_message', 
      { from: this.name, to: to, message: message });
  }

  public getNameList() { // 今いるユーザ名をすべて得る
    this.group.emit('get_names', 'all');
  }

  private addEventHandlers(gp) {   // イベントハンドラを設定する
    //サーバーから時刻送られてきたら表示
	
  
    gp.on('message', (fromMessage) => { 
		//修正:idの取り出し
	  var id = fromMessage.id;
      var from = fromMessage.from; // ハンドル名の取り出し
      var message = fromMessage.message; // メッセージの取り出し
	  
      //this.showMessage(from + ': ' + message); 
	  this.showMessage('<span style="color: red">' +  '[' + id + ']' +  '</span>'　+  '<span style="color: black">'　+ from + ': ' + message + '</span>'); 
    });
    gp.on('new_user', (name) => { this.showMessage(name + 'さんが来ました'); });
    gp.on('private_message', (fromToMessage) => { 
      var id = fromToMessage.id;
      var from = fromToMessage.from;
      var message = fromToMessage.message;
      this.showMessage('<span style="color: red">' +  '[' + id + ']' + '[プライベート] ' + from + ': ' + message); 
    });
    gp.on('no_user', (name) => {
      this.showMessage('[エラー] ' + name + 'さんは居ません。'); 
    });
    gp.on('name_list', (list) => {
      this.showMessage('[今居るユーザ] ' + list);
    });
    gp.on('log_message', (fromMessage) => { 
	  //console.log('log_message');
	  //console.log(fromMessage);
	  
	  //修正:idの取り出し
	  var id = fromMessage.id;
      var from = fromMessage.from; // ハンドル名の取り出し
      var message = fromMessage.message; // メッセージの取り出し
	  //修正：idの表示
      this.showMessage('<span style="color: red">' +  '[' + id + ']' +  '</span>'　+  '<span style="color: black">'　+ from + ': ' + message + '</span>'); 
    });
    gp.on('log_private_message', (fromToMessage) => {
	  //修正:idの取り出し
	  var id = fromToMessage.id;	
      var from = fromToMessage.from;
      var message = fromToMessage.message;
      this.showMessage('<span style="color: red">' +  '[' + id + ']' +  '</span>'　+  '<span style="color: blue">[プライベート] ' + from + ': ' + message + '</span>'); 
    });
  }

  // メッセージをブラウザに表示する
  private showMessage(message) { this.output.innerHTML += message + '<br>'; }
 // private showNoticeMessage(message) { 
 //     //alert(message);
 //     //alert('管理者からの通知！！');
 //     this.notice.innerHTML += message.replace(/\r?\n/g, '<br>') + '<br>'; 
 //}
  
}

var cc: ChatClient;

function sendMessage(obj) { // サーバにデータを送る(HTMLから呼び出される)
  var separator = ' >> '; // プライベートメッセージの例: こんにちは >> くんにゃ
  var message = obj.comment.value; // 送信する文字列の取り出し
  var i = message.search(separator); // ' >> 'があるか?
  obj.comment.value = ''; // テキストエリアを空にする

  if (i < 0) { // '>> 'が含まれていない(普通のチャット)
    cc.sendMessage(message);  // サーバにメッセージを送信
  } else {
    var to = message.substr(i + separator.length); // ' >> '以降が宛先名なので取り出す
    cc.sendPrivateMessage(to, message); // サーバにプライベートメッセージを送信
  }
}

window.onload = () => { 
  //cc = new ChatClient(location.hostname, 8888); // ローカルで動いているサーバに接続
   //cc = new ChatClient(location.hostname, 80); // GROOMで動いているサーバに接続
   cc = new ChatClient(location.hostname, 8888); // conoha VPSで動いているサーバに接続
   cc.start();
  
}
