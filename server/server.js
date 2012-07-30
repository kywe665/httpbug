/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
/*
 * SERVER
 */
(function () {
  "use strict";

  var connect = require('steve')
    , app = connect.createServer()
    , poll = require('./poll')
    , file = require('./file')
    , browserSocket
    , Socket = require('socket.io')
    , io = Socket.listen(34541)
    ;

  connect.router = require('connect_router');

  io.set('log level', 1);

  function create (logpath) {
    openSockets();
    
    //Browser Comm Sockets
    function openSockets() {
      io.sockets.on('connection', function (socket) {
        browserSocket = socket;
        console.log('Connected to browser');
        poll.assignSocket(socket);
        socket.on('poll', poll.init);
        socket.on('stopPoll', poll.stopPoll);
        socket.on('disconnect', function () { 
          console.log('Browser disconnected');
        });
        /*socket.on('message', function (data) {
        });
        socket.on('writeFile', function (protocol, port, id) { 
        });
        socket.on('logPoll', function(port) {         
        });*/
      });
    } 

    function router(rest) {
//      rest.get('/onPageLoad', onPageLoad);
    }

    app.use(connect.favicon());
    app.use(connect.static(__dirname + '/../public'));
    app.use(connect.router(router));
    
    return app;
  }
    module.exports.create = create;
}());


