/*
var http = require('http'); //httpモジュール呼び出し
http.createServer(function (request, response) {
    // リクエストを受けると以下のレスポンスを送信する
    response.writeHead(200, {'Content-Type': 'text/plain'}); //レスポンスヘッダーに書き込み
    response.end('Hello World\n'); // レスポンスボディに書き込み＆レスポンス送信を完了する
}).listen(process.env.PORT || 8080); //公開ポートで待ち受け

*/
var express = require('express');
var app = express();
var http = require('http').Server(app);
var POST = process.env.PORT || 8080;



//ルートディレクトリにアクセスした時に動く処理
app.get('/', function(req, res) {
	//index.htmlに遷移する  
    res.sendFile(__dirname + '/index.html');
    
});

app.get('/notifyToken', function(req, res) {
    //index.htmlに遷移する  
    var code = req.query.code;
    var state = req.query.state;
	console.log('code', code);
	console.log('state', state);
    if(state != "tenaga"){
        res.statusCode = '500';
        res.statusMessage = "不正";
    }
    

    var webclient = require("request");
 
    webclient.post({
      url: "https://notify-bot.line.me/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencodedn"
      },
      form: {
        "grant_type": "authorization_code",
        "code": code,　//authorization endpoint で取得したcode
        /* lineのアカウントで設定される値を使用する */
        "redirect_uri": "https://tenaga.herokuapp.com/notifyToken",
        "client_id": "a19ECgC23P5fCbz3RAj3Df",
        "client_secret": "kqhb5THngQg1IC0j1TmqOV8D2ugJqzr5LH5EcRzh5eG"
        /* lineのアカウントで設定される値を使用する */
      }
    }, function (error, response, body){
      console.log(body);
    });

    res.sendFile(__dirname + '/notifyToken.html');
    
});
http.listen(POST, function() {
	console.log('接続開始：', POST);
})