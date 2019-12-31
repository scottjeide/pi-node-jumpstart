import * as express from 'express';
import { json } from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import Redis = require("ioredis");

// Set up express and some default handlers
const expressApp = express()
  .use(helmet())
  .use(json())
  .use(cors())
  .use(morgan('combined'))
  .use(express.static('www'));

const expressHttpServer = require('http').createServer(expressApp);

// get socket.io ready
const socketIo = require('socket.io')(expressHttpServer);

// get our connection to redis all set up
const redis = new Redis(); // this will connect to 127.0.0.1:6379
// TODO: Need to figure out how to detect if redis is down and handle it gracefully
// Looks like you can specify lazyConnect = true, then call async redis.connect() and handle the exception but haven't tried it yet

var res = redis.set("test:startupMsg", "Hello! Server started at " + new Date());
console.log("wrote startup message: " + JSON.stringify(res));



// See if we can define the apis in some sort of a basic schema
const schema = {
  // the endpoint for the data we are collecting
  data: {
    // maybe add some type information in here too?
    fields: [
      'reading1',
      'reading2'
    ],

    // something to flag it as N items (as opposed to the controlPanel which will normally only have one)

    // and a temporary hack to hold entries in memory until I wire up the db
    db: [{reading1: 123, reading2:321}, {reading1: 654, reading2:456}]
  },


  // the endpoint for client runtime messages. Messages that clients post to this will be added to the runtime
  // messages table and can be viewed in the UI
  messages: {
    fields: [
      'text',
    ]
  },


  // the endpoint for the controlPanel / settings
  controlPanel: {
    fields: [
      'run',
      'status'
    ],

    // maybe something here to flag is as there should only be one item

    // temp 'db'
    db: [{run: false, status:''}]

  }



};



// Set up a get handler for each of the endpoints
for(const endpoint in schema) {
  expressApp.get('/' + endpoint, (req, res) => {
    res.send(schema[endpoint].db);
  });

  /*
  app.put('/' + endpoint, (req, res) => {
  });
  */
}

// set up the socket handler
socketIo.on('connection', function(socket){
  console.log('Got new client connection');
  redis.xadd('server:runLog', '*', 'message', 'New client connection');

  socket.on('clientMessage', function(msg){
    var t = new Date();
    redis.xadd('client:runLog', '*', 'message', JSON.stringify(msg), 'time', t.toString());
    console.log('Got client message: ' + JSON.stringify(msg));

    // broadcast it back out to everyone (including the original sender)
    socketIo.emit('clientMessage', {emit: true, msg: msg});

    // this version will broadcast back to everyone _except_ for the original sender
    //socket.broadcast.emit('clientMessage', {broadcast: true, msg: msg});
  });

  socket.on('disconnect', function(){
    console.log('client disconnected');
  });
});

// broadcast a message every few seconds just to see if it's working
let heartbeatCount = 0;
setInterval(() => {
  socketIo.emit('heartbeat', {count: heartbeatCount++});
}, 3000);



// start listening for client connections
expressHttpServer.listen(3001, () => {
  console.log('listening on port 3001');
});

