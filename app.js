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
var userData = {acountid: "123123123"};
var cardParams = {
    card: {
        exp_month: 10,
        exp_year: 2018,
        number: '4242424242424242',
        cvc: 100
    }
};
var stripeData = {id:'',card: {ID: '', last4: ''}}

app.get('/stripeCreateCus',function(req, res){
    var fs = require("fs");
    var ejs = require("ejs");
    var temp = fs.readFileSync(__dirname + "/stripeInvoice.ejs", "utf-8");
    var page = ejs.render(temp, { });
    console.log(page);
    res.writeHead(200, {"Content-Type": "text/html;charset=utf-8"});
    res.write(page);
    res.end();
});

app.post('/stripeCreateCus',function(req, res){

    // stripe にcustomerを登録
    var params = {
        // ユーザ情報より設定
        email: req.body.email,
        description:"acountid:" + userData.acountid
    };

    stripe.customers.create(params, function(err,customer){
        if(err != null){
            // 顧客作成エラー
            console.log("err:",err);
            res.header(500,'Content-Type', 'text/plain;charset=utf-8');
            res.end();
        }else{
            stripeData.id = customer.id;
            console.log(err);
            console.log(customer);
            // card登録
            setCard();

            res.header(200,'Content-Type', 'text/plain;charset=utf-8');
            res.end(stripeData.id );
        }
    });
    
});


app.post('/invoice',function(req, res){

    /**　https://dashboard.stripe.com/account
     * 　メール設定しておけばメールで領収書が送られる。
     * 　メールの領収書にPDFダウンロードのリンクもあり
     * 
    */
    // 請求書　割引とか税金を別途請求する場合は、こっちのほうがよい
    var params = {
        customer: req.body.customer,
        amount: 1500,
        currency: 'jpy',
        description: "お品代"

    };

    //割引
    var paramsdis = {
        customer: req.body.customer,
        amount: -500,
        currency: 'jpy',
        description: "紹介割引"
      
    };
    stripe.invoiceItems.create(params, function(err,invoiceItem){
        console.log(invoiceItem);
        stripe.invoiceItems.create(paramsdis, function(err,invoiceItem){
            console.log(invoiceItem);
            var params2 = {
                customer: req.body.customer,
                tax_percent: 8.0　//消費税
            };
            
            stripe.invoices.create(params2, function(err,invoice){
                console.log(invoice);
                if (!err) {
                    stripe.invoices.pay(invoice.id, function(err,invoice){
                        console.log(invoice);
                    });
                }
            });
        });

    });
    
    
    
    //console.log("stripe.charges.create");

    // 徴収　単純に一つの金額を決済する場合はこっちでよい
    // const charge = stripe.charges.create({
    //     amount: 2000,
    //     currency: "jpy",
    //     description: "お品代として",
    //     receipt_email :req.body.email,
    //     customer:req.body.customer,
    //     capture: "true"//即時徴収
    //   }, function(err, charge) {
    //     console.log("徴収成功");
        
    //     console.log("charge:");
    //     console.log(charge);
    //     console.log("err:");
    //     console.log(err);
    //   });

    res.header(200,'Content-Type', 'text/plain;charset=utf-8');
    res.end();
});

function setCard(){
    // token を作ってから、customers.createSource() で登録
    stripe.tokens.create(cardParams, function(err,token){
        console.log("tokens.create err:"+err);
        console.log("tokens.create token:"+token);
        console.log("token.id:"+ token.id);
        
        stripeData.card.ID = token.card.id;
        stripeData.card.last4 = token.card.last4;

        var params = {
            source: token.id
        };
        //　card登録
        stripe.customers.createSource(stripeData.id, params, function(err, card){
            console.log(card);
        });
    });
}


function updCard(){

    // 有効期限を更新
    var params = {
        exp_month: "10",
        exp_year: "2025"
    }
    stripe.customers.updateCard(stripeData.id, card.id, params, function(err, card){
        console.log(card);
    });
}


function chgCard(){

    //stripe.customers.deleteSource(.....
    //stripe.tokens.create(......
    //stripe.customers.createSource(.....
}
/** stripe---------------------------------------------------------- */

/** */
var schedule = require('node-schedule');
var dateformat = require('dateformat');
app.get('/schedule1',function(req, res){
    var now = Date.now();
    console.log("登録" + dateformat(now, 'yyyy/mm/dd HH:MM:ss') );
    // 10秒後に実行　10000ミリ秒
    var startTime = new Date(Date.now() + 10000);
    var job = schedule.scheduleJob(startTime,  function () {
        var now = Date.now();
        console.log(dateformat(now, 'yyyy/mm/dd HH:MM:ss') );
        console.log("schedule1の実行");
      });

      
      console.log(schedule.scheduledJobs);
      for(var job in schedule.scheduledJobs){
        console.log("ジョブ");
        console.log(job);
    }
    res.header(200,'Content-Type', 'text/plain;charset=utf-8');
    res.end();
});

var jobarry = new Array(10);
/**
 * https://tenaga.herokuapp.com/schedule2_start?id=1
 * https://tenaga.herokuapp.com/schedule2_start?id=2　　　
*/
app.get('/schedule2_start',function(req, res){
    var url = require('url');
    var url_parts = url.parse(req.url,true);
    var repJson = url_parts.query;
    var index = Number(repJson.id);
    
    var now = Date.now();
    console.log("schedule["+index+"]登録:"+dateformat(now, 'yyyy/mm/dd HH:MM:ss'));
    
    // 毎分30秒に実行
    jobarry[index] = schedule.scheduleJob({
        second:30
    }, function () {
        var now = Date.now();
        console.log("schedule["+index+"]実行:"+dateformat(now, 'yyyy/mm/dd HH:MM:ss'));
    });

    res.header(200,'Content-Type', 'text/plain;charset=utf-8');
    res.end();
});

/**
 * https://tenaga.herokuapp.com/schedule2_stop?id=1
 * https://tenaga.herokuapp.com/schedule2_stop?id=2　　　
*/
app.get('/schedule2_stop',function(req, res){
    var url = require('url');
    var url_parts = url.parse(req.url,true);
    var repJson = url_parts.query;
    var index = Number(repJson.id);

    jobarry[index].cancel();
    console.log("schedule["+index+"]停止");

    res.header(200,'Content-Type', 'text/plain;charset=utf-8');
    res.end();
});


app.post('/s3',function(req, res){
    console.log("s3");
    var AWS = require('aws-sdk');
    var fs  = require('fs');

    AWS.config.loadFromPath('./rootkey.json');
  
    var s3 = new AWS.S3();
    var params = {
    Bucket: "connect-base-dev",
    Key: "test1.jpg"
    };
    console.log(req.body);
    console.log(req.body.selectImage);
    
    
    //selectImage
    //var v= fs.readFileSync("./アップロード対象ファイル名.jpg");
    params.Body=req.body.selectImage;
    s3.putObject(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else     console.log(data);
    });
res.header(200,'Content-Type', 'text/plain;charset=utf-8');
res.end();
});

http.listen(POST, function() {
	console.log('接続開始：', POST);
})