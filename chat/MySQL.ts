// MySQL.ts
/// <reference path='../DefinitelyTyped/mysql/mysql.d.ts'/>
/// <reference path='../DefinitelyTyped/node/node.d.ts'/>
class MySQL {
  private mysql; // mysqlモジュール
  private connection: IConnection; // mysqlとの接続

  constructor() { this.mysql = require('mysql'); } // MySQLモジュールのロード

  // データベースにログイン(接続)する
  public connect(host: string, db: string, user: string, pass: string): void {
    this.connection = this.mysql.createConnection({ // MySQLへ接続
      host: host,     // データベースが動いているホスト名(localhost)
      database: db,   // 使用するデータベース名(chat)
      user: user,     // ログインするユーザ名(root)
      password: pass, // ログインするユーザのパスワード(なし)
    });
  }

  //細かいバグを修正
  public query(sql: string, func?: Function): void { // 問い合わせを実行する
    this.connection.query(sql, (err: IError, results: any[]) => {
      if (typeof err !== 'undefined') func(err, results);
    });
  }

  public close(): void { this.connection.end(); }  // MySQLとの接続を切断
}
