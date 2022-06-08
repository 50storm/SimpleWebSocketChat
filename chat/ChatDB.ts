// ChatDB.ts
/// <reference path="./MySQL.ts" />
class ChatDB extends MySQL {
  private host: string = 'localhost'; // DBが動いているホスト名
  private user: string = 'chatadmin';      // DBにログインするユーザ名
  private pass: string = 'chat!"#$!QAZ1234';          // パスワード
  private db: string = 'chat';        // ログを格納するDB名
  private table: string = 'messages'; // テーブル名
  // private port: number = 3306;
  private port: number = 8889; // MAMP
  

  public connect(): void {
    super.connect(this.host, this.db, this.user, this.pass, this.port);  // DBにログインする
  }

  public saveMessage(from, message, to: string = 'NULL'): void { //メッセージの保存
    if (from === '') return; //システムからのメッセージは保存しない
	//修正：IDを自動登録するため
    var sql = 'INSERT INTO ' + this.table + ' ( from_name,to_name,message,time) VALUES '; // SQL文の組み立て
    sql += '(\'' + from + '\', \'' + to + '\', \'' + message + '\', NOW());';
    console.log(sql);
    this.query(sql,
				//修正:ログを出力しておく
				(err, results)=>{
						console.log("////[LOG]ChatDB:saveMessage////");
						console.log("error=>" + err);
						console.log("results=>" + results);}
			  ); // SQL文を発行しログを保存する
  }
  
  //追加：最終行のメッセージを取り出す
  public getLastMessage(func):void {
	  var sql = 'SELECT * FROM ' + this.table + ' ORDER BY id desc limit 1;'; // SQL文の組み立て
	  this.query(sql, (err, results) => { // SQL文を発行しログを取得する
	    //ログ出力
	    console.log("最後のデータ");
      console.log(sql);
	    console.log(results);
        if (results != null) {
          func(results[0].id,results[0].from_name, results[0].to_name, results[0].message);
        }
	  });  
  }

  public getMessage(func): void { // メッセージを取り出す
    var sql = 'SELECT * FROM ' + this.table + ' ORDER BY time;'; // SQL文の組み立て
	
    this.query(sql, (err, results) => { // SQL文を発行しログを取得する
      if (results != null) { 
        for (var i=0; i < results.length; i++) {
          func(results[i].id,results[i].from_name, results[i].to_name, results[i].message);
        } 
      }
    });
  }
  
}