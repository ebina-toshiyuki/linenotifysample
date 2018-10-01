/*
  Line Notifyサンプル
*/
var express = require('express');
var app = express();
var http = require('http').Server(app);
var POST = process.env.PORT || 8080;


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//フロント側の連携設定画面を想定
app.get('/', function(req, res) {
	//index.htmlに遷移する  
    res.sendFile(__dirname + '/index.html');
    
});

/**
 * 【API】バックエンドのAPIを想定
 * アカウントごとのトークンを取得して、アカウントテーブルに保存
*/
app.post('/notifyToken', function(req, res) {
    
    // トークンを取得するためのcodeとstateを取得
    var code = req.body.code;
    var state = req.body.state;
	console.log('code', code);
  console.log('state', state);
  // stateとの比較を行う（運営者の情報をtableで保持）　lineアカウントで任意の文字列を設定
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

      /**
       * 以下は、デモのため画面に出力しているが、
       * 本来は、完了のメッセージのみでトークンは、アカウントテーブルに登録する
       */
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


/**
 * 【API】line通知の呼び出しサンプル
*/
app.post('/sendline',function(req, res){

  /**
   * 本来は、アカウントテーブルからトークンを取得し送信
  */
  const Line = require('./line');
  const myLine = new Line();
  var token = req.body.token;
  var msg = req.body.msg;
  console.log("token:" + token);

  // LINE Notify トークンセット
  myLine.setToken(token);
  // LINE Notify 実行（メッセージを送る）
  myLine.notify(msg);
  res.send('sendline');


});


/** stripe---------------------------------------------------------- */
var stripe = require('stripe')("sk_test_z5wdYYDUsr9O5gcF7Iw12xGl");
var userData = {acountid: "123123123", email: 'customer3@example.com'};
var cardParams = {
    card: {
        exp_month: 10,
        exp_year: 2018,
        number: '4242424242424242',
        cvc: 100
    }
};
var stripeData = {id:"",card: {ID: '', last4: ''}}


app.post('/stripeCreateCus',function(req, res){

    // stripe customer の存在チェック
    stripe.customers.retrieve(stripeData.id, function(err, customer) {
        if(err != null){
            // 存在チェックエラー
            lonsole.log("err:",err);
        }else{
            // 存在しないので顧客新規作成
            if (!customer || customer.deleted) {
                // stripe customer が存在しない時は stripe にcustomerを登録
                var params = {
                    email: userData.email,
                    description:"acountid:" + userData.acountid
                };

                stripe.customers.create(params, function(err,customer){
                    if(err != null){
                        // 顧客作成エラー
                        lonsole.log("err:",err);
                    }else{
                        stripeData.id = customer.id;
                        console.log(err);
                        console.log(customer);
                    }
                    
                });
            }
        }
    });
});
function setCard(){
    // カードの存在チェック
    stripe.customers.retrieveCard(stripeData.id, stripeData.card.ID, function(err, card){
        if(err != null){
            // 顧客作成エラー
            lonsole.log("err:",err);
        }else{
            if (!card || card.deleted) {
                // カードが登録されていなければ token を作ってから、customers.createSource() で登録
                stripe.tokens.create(cardParams, function(err,token){
                    console.log("tokens.create err:"+err);
                    console.log("tokens.create token:"+token);
                    console.log("token.id:"+ token.id);
                    
                    stripeData.card.ID = token.card.id;
                    stripeData.card.last4 = token.card.last4;

                    var params = {
                        source: token.id
                    };
                    stripe.customers.createSource(customer.id, params, function(err, card){
                        console.log(card);
                    });
                });
            } else {
                // カードが登録されていたら有効期限を更新
                stripeData.card.ID = card.id;
                stripeData.card.last4 = card.last4;
                
                var params = {
                    exp_month: cardParams.card.exp_month,
                    exp_year: cardParams.card.exp_year
                }
                stripe.customers.updateCard(stripeData.ID, card.id, params, function(err, card){
                    console.log(card);
                });
            }
        }
    });
}
/** stripe---------------------------------------------------------- */


http.listen(POST, function() {
	console.log('接続開始：', POST);
})