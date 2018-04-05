var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var dirname = __dirname + '/public';

var pg = require('pg');
pg.defaults.ssl = true;
var config = {
    user: 'nosjmhqmhobtxn', //env var: PGUSER
    database: 'd95eflhf5qhdia', //env var: PGDATABASE
    password: '5adaee213fbda13393cbf16254d2f3c9aafd2fd1c581ee0db5961b363d02510c', //env var: PGPASSWORD
    host: 'ec2-107-21-126-193.compute-1.amazonaws.com', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 1, // how long a client is allowed to remain idle before being closed
};

var pool = new pg.Pool(config);

app.get('/', function(req, res){
  res.sendFile(dirname + '/index.html');
});
app.get('/register', function(req, res){
  res.sendFile(dirname + '/register.html');
});
app.get('/create', function (request, response) {
  var r = request.query;
  var username = r.party;
  pool.connect(function (err, cli, done) {
    var update = function () {
          cli.query("UPDATE public.chat set (fName, lName, username, password, bio, title, location) = ($1, $2, $3, $4, $5, $6, $7) where username in ($8)", [escape(r.fName).toLowerCase(), escape(r.lName), escape(r.username), escape(r.password), escape(r.bio), escape(r.title), escape(r.location), escape(r.username)], function (err, result) {
             done(); cli.end();
        });
    }
    var insert = function () {
          cli.query("INSERT INTO public.chat values($1, $2, $3, $4, $5, $6, $7)", [escape(r.fName).toLowerCase(), escape(r.lName), escape(r.username), escape(r.password), escape(r.bio), escape(r.title), escape(r.location)], function (err, result) {
             done(); cli.end();
          });
    }
    cli.query("select * from public.chat where (username = $1 and password = $2)", [escape(r.username), escape(r.password)], function(err, result){
        if(result.rows.length > 0) {
          update();
        }
        else {
          insert();
        }
    setTimeout(function() { done(); cli.end();  }, 1000);
    });
 });
    setTimeout(function() { response.send("SUCCESS"); response.end(); }, 3000);
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log(msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
