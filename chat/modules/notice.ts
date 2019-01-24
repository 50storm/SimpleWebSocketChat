class Notice {
    private message = 'そろそろ遅くなってきたので寝ましょう！';

    constructor() { 
        console.log('instance:Notice');
    }

    //実行したい時間と、関数を受け取る。メッセージはもしあれば送信なければ、デフォルト
    public sendMessage  = ( message: string = null, time:number, func: Function)=>{
        let msg = message == null  ? this.message :message;
        var dt = new Date();
        var hour = dt.getHours();
        if(hour > time){
            func('notice_from_server', msg );
        }
    }
}