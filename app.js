var users = require('./app');
var notify = require('./notify'); // ←追加

var app = express();

var router = express.Router();

// 中略
app.use('/app', app);
app.use('/notify', notify); // ←追加

// catch 404 and forward to error handler
app.use(function(req, res, next) {});


app.get('/', function(req, res, next) {
  res.render('notify', { title: 'Express' });
});
