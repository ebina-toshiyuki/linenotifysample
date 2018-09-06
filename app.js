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

app.post('/notifyToken', function(req, res) {
    
    // トークンを取得するためのcodeとstateを取得
    var code = req.body.code;
    var state = req.body.state;
	console.log('code', code);
	console.log('state', state);
    if(state != "tenaga"){
        res.statusCode = '500';
        res.statusMessage = "不正";
    }    

    var webclient = require("request");
 
    webclient.post({
      url: "https://notify-bot.line.me/oauth/token",//固定
      headers: {
        "content-type": "application/x-www-form-urlencodedn"//固定
      },
      form: {
        "grant_type": "authorization_code",//固定
        "code": code,　//authorization endpoint で取得したcode
        /* lineのアカウントで設定される値を使用する */
        "redirect_uri": "https://tenaga.herokuapp.com/notifyToken",
        "client_id": "a19ECgC23P5fCbz3RAj3Df",
        "client_secret": "kqhb5THngQg1IC0j1TmqOV8D2ugJqzr5LH5EcRzh5eG"
        /* lineのアカウントで設定される値を使用する */
      }
    }, function (error, response, body){
      console.log(body);
      var resjson = JSON.parse(body);
      
      console.log(resjson.access_token);
      var htmltext ='<p>LINE NOTIFY に登録しました。</p>'
            
      var fs = require("fs");
      var ejs = require("ejs");
      var temp = fs.readFileSync(__dirname + "/notifyToken.ejs", "utf-8");
      var page = ejs.render(temp, {
        token:resjson.access_token,
        status:resjson.status,
        message:resjson.message
      });
      console.log(page);
      res.writeHead(200, {"Content-Type": "text/html;charset=utf-8"});
      res.write(page);
      res.end();

    });

    //res.sendFile(__dirname + '/notifyToken.html');
    
});

app.get('/sendline',function(req, res){
  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({extended: true}));

  console.log(req.query);

  const Line = require('./line');
  const myLine = new Line();
  var token = req.query.token;
  var msg = req.query.msg;

  // LINE Notify トークンセット
  myLine.setToken(token);
  // LINE Notify 実行（「こんにちは！」とメッセージを送る）
  myLine.notify(msg);

});

http.listen(POST, function() {
	console.log('接続開始：', POST);
})