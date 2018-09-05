
  const Line = require('./line');

  const myLine = new Line();
 
  // LINE Notify トークンセット
  myLine.setToken("PDKa48vl9dK4p8vOzb28fZMPXJicOQEIjEdHIHcPspJ");
  // LINE Notify 実行（「こんにちは！」とメッセージを送る）
  myLine.notify('届きましたね');