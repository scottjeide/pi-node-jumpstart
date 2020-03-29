import * as express from 'express';
import { json } from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import Redis = require("ioredis");
import * as dataDefinitions from '../../shared/dataDefinitions'

// Set up express and some default handlers
const expressApp = express()
  .use(helmet())
  .use(json())
  .use(cors())
  .use(morgan('combined'))
  .use(express.static('www'))
  .use((req, res, next) => {
    res.header("Content-Type",'application/json');
    next();
  });

const expressHttpServer = require('http').createServer(expressApp);
let serverListening = false;

// get socket.io ready
const socketIo = require('socket.io')(expressHttpServer);

// get our connection to redis all set up. Will connect to 127.0.0.1:6379 by default
const redis = new Redis({lazyConnect: true})
.on('connect', () => {
  console.log('Connected to redis');

  // once we are connected to redis we can start serving client connections
  if (!serverListening) {
    console.log('Starting http server');
    expressHttpServer.listen(3001, () => {
      console.log('listening on port 3001');
    });
    serverListening = true;
  }
})
.on('error', (err) => {
  console.log(`Redis error: ${err}`);
})
.on('reconnecting', (ms) => {
  console.log(`Reconnecting to redis in ${ms} ms`);
}); 



//var res = redis.set("test:startupMsg", "Hello! Server started at " + new Date());
//console.log("wrote startup message: " + JSON.stringify(res));



// Set up the controlPanel api handlers
const currentSettings: dataDefinitions.controlPanel = {
  on: false,
  runId: '',
  smokerSetTemp: 260
};

expressApp.get('/controlPanel', (req, res) => {
  res.send(currentSettings);
});
expressApp.post('/controlPanel', (req, res) => {
  const newSettings: dataDefinitions.controlPanel = {...req.body};
  
  console.log('Received new controlPanel setting', newSettings);

  // the server controls the runId property
  if (newSettings.on && !currentSettings.on) {
    // starting a new run so create a new rid
    newSettings.runId = (new Date).toString();
    console.log(`Starting new runId: ${newSettings.runId}`);
  }
  else {
    delete newSettings.runId;
  }

  for (let prop in currentSettings) {
    if (newSettings.hasOwnProperty(prop)) {
        currentSettings[prop] = newSettings[prop];
    }
  }
  
  // Save off the runid in the db
  const dbRes = redis.set(`runId:${currentSettings.runId}`, JSON.stringify(currentSettings));
  console.log(`Saved runId, res: ${dbRes}`);

  // echo it back on the post request response
  res.send(currentSettings);

  // and broadcast it on the socket
  socketIo.emit('io:controlPanel', {emit: true, msg: currentSettings});
});


// The measurement api handlers
expressApp.get('/measurement', (req, res) => {
  //res.send(dataDefinitions.controlPanel);
});
expressApp.post('/measurement', (req, res) => {
  const clientMeasurement: dataDefinitions.measurement = {...req.body};
  
  console.log('Received new measurement:', clientMeasurement);
  
  const now = new Date();

  // probably could remove/ignore any props in the measurement that we don't expect, but doesn't really matter
  // for my use cases. If this was exposed publicly then would need to sanitize things (probably just worth a note
  // in the readme of what to change if making it publicly accessible)
  for (let prop in clientMeasurement) {
      // It may be better to just write them all in one xadd call, but try this first. Or may need 
      // to write them as separate measurements measurement:runid:measurementName to query them individually

      const dbRet = redis.xadd(
        'measurement:' + currentSettings.runId, 
        '*', 
        prop, clientMeasurement[prop], 
        'time', now.toString()
        );
      console.log(`Measurement save ret: ${dbRet}`);
  }

  // echo it back on the post request response
  res.send(clientMeasurement);

  // and broadcast it on the socket
  socketIo.emit('io:measurement', {emit: true, msg: clientMeasurement});
});


// The message api handlers
expressApp.get('/runtimeMessage', (req, res) => {
  //res.send(dataDefinitions.controlPanel);
});
expressApp.post('/runtimeMessage', (req, res) => {
  const runtimeMessage: dataDefinitions.runtimeMessage = {...req.body};
  
  console.log(`Received new message: ${JSON.stringify(runtimeMessage)}`);
  
  const now = new Date();

  const dbRet = redis.xadd(
    'runtimeMessage:' + currentSettings.runId, 
    '*', 
    'text', runtimeMessage.text,
    'time', now.toString()
    );
  console.log(`Measurement save ret: ${dbRet}`);

  // echo it back on the post request response
  res.send(runtimeMessage);

  // and broadcast it on the socket
  socketIo.emit('io:runtimeMessage', {emit: true, msg: runtimeMessage});
});



// set up the socket handler
socketIo.on('connection', function(socket){
  console.log('Got new client connection');
//  redis.xadd('server:runLog', '*', 'message', 'New client connection');

  // TODO: May not even need to watch for this one on the server. Clients will be posting to the rest api to add messages, not here
 
  socket.on('io:runtimeMessage', function(msg: dataDefinitions.runtimeMessage){
    console.log('Got runtimeMessage:', msg);

    // broadcast it back out to everyone (including the original sender)
    //socketIo.emit('clientMessage', {emit: true, msg: msg});

    // this version will broadcast back to everyone _except_ for the original sender
    //socket.broadcast.emit('clientMessage', {broadcast: true, msg: msg});
  });

  socket.on('disconnect', function(){
    console.log('client disconnected');
  });
});

// Now that we're all set up, make the connection to redis and once we are connected we can start listening
// for client connections
redis.connect()
.catch((error) => {
  console.log('Connect error:', error);
});


