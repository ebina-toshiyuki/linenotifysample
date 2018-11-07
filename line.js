/* 【API】Line Notify送信クラス */
const axios = require('axios');
const querystring = require('querystring');
 
const Line = function () {};
 
/**
 * LINE Notifyのトークンセット
 * @param {String} token LINE Notifyトークン
 */
Line.prototype.setToken = function(token) {
  this.token = token;
};
 
/**
 * LINE Notify実行
 * @param {String} text メッセージ
 */
Line.prototype.notify = function(text) {
  if(this.token == undefined || this.token == null){
    console.error('undefined token.');
    return;
  }
  console.log(`notify message : ${text}`);
  axios(
    {
      method: 'post',
      url: 'https://notify-api.line.me/api/notify',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: querystring.stringify({
        message: text,
      }),
    }
  )
  .then( function(res) {
    console.log(res.data);
  })
  .catch( function(err) {
    console.error(err);
  });
}; 
 

var AWS = require('aws-sdk');

var s3 = new AWS.S3();

// バケット名はすべての S3 ユーザーの間で一意である必要があります

var myBucket = 'my.unique.bucket.name';

var myKey = 'myBucketKey';

s3.createBucket({Bucket: myBucket}, function(err, data) {

if (err) {

   console.log(err);

   } else {

     params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};

     s3.putObject(params, function(err, data) {

         if (err) {

             console.log(err)

         } else {

             console.log("Successfully uploaded data to myBucket/myKey");

         }

      });

   }

});

module.exports = Line;