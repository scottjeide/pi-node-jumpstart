import * as express from 'express';
import { json } from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';

// Set up express and some default handlers
const expressApp = express()
  .use(helmet())
  .use(json())
  .use(cors())
  .use(morgan('combined'));

// get socket.io ready
const expressHttpServer = require('http').createServer(expressApp);
const socketIo = require('socket.io')(expressHttpServer);




// See if we can define the apis in some sort of a basic schema
const schema = {
  // the endpoint for the data we are collecting
  data: {
    // maybe add some type information in here too
    fields: [
      'reading1',
      'reading2'
    ],

    // something to flag it as N items

    // and a temporary hack to hold entries in memory until I wire up the db
    db: [{reading1: 123, reading2:321}, {reading1: 654, reading2:456}]
  },

  // the endpoint for the controlPanel
  controlPanel: {
    fields: [
      'run',
      'status'
    ],

    // maybe something here to flag is as there should only be one item

    // temp 'db'
    db: [{run: false, status:''}]
    
  }


  
}


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

  socket.on('clientMessage', function(msg){
    console.log('Got client message: ' + JSON.stringify(msg));
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
  
