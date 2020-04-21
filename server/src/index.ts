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

  // This is probably also worth logging a runtime message - if not to redis itself, at least broadcast it on the socket
  
}); 


// This one also makes sense to write to the messages. 
//var res = redis.set("test:startupMsg", "Hello! Server started at " + new Date());
//console.log("wrote startup message: " + JSON.stringify(res));



// Set up the settings api handlers
const currentSettings = dataDefinitions.defaultSettings;

expressApp.get('/settings', (req, res) => {
  res.send(currentSettings);
});
expressApp.post('/settings', async (req, res) => {
  const newSettings: dataDefinitions.settings = {...req.body};
  
  console.log('Received new settings', newSettings);
  
  // give this settings change a new id
  newSettings.id = (new Date).getTime().toString();

  for (let prop in currentSettings) {
    if (newSettings.hasOwnProperty(prop)) {
        currentSettings[prop] = newSettings[prop];
    }
  }
  
  // Save off the settings in the db
  try {
    await redis.set(`settingsId:${currentSettings.id}`, JSON.stringify(currentSettings));
    console.log('Saved new settings');
  }
  catch(error) {
    console.log('Error savings settings', error);
  }

  // echo it back on the post request response
  res.send(currentSettings);

  // and broadcast it on the socket
  socketIo.emit('io:settings', {emit: true, msg: currentSettings});
});


// The measurement api handlers
expressApp.get('/measurement', (req, res) => {
  // TODO: Finish this - want to be able to have the UI load measurements from the past
  console.log('GET /measurement called')
});
expressApp.post('/measurement', async (req, res) => {
  const clientMeasurement: dataDefinitions.measurement = {...req.body};
  
  console.log('Received new measurement:', clientMeasurement);
  
  const now = new Date();

  // server assigns the time
  clientMeasurement.time = now.getTime();

  // probably could remove/ignore any props in the measurement that we don't expect, but doesn't really matter
  // for my use cases. If this was exposed publicly then would need to sanitize things (probably just worth a note
  // in the readme of what to change if making it publicly accessible)
  for (let prop in clientMeasurement) {
      // Writing each measurement separately so we can query them individually a bit easier through 
      // a get on measurement:runid:measurementName

      try {
        await redis.xadd(
          'measurement:' + currentSettings.id, 
          '*', 
          prop, clientMeasurement[prop], 
          'time', now.getTime().toString()
          );
        console.log('Saved measurement');
      }
      catch (error) {
        console.log('Error saving measurement', error);
      }
  }

  // echo it back on the post request response
  res.send(clientMeasurement);

  // and broadcast it on the socket
  socketIo.emit('io:measurement', {emit: true, msg: clientMeasurement});
});


// The message api handlers
expressApp.get('/runtimeMessage', (req, res) => {
  // TODO: Finish this - want to be able to have the UI load older messages
  console.log('GET /runtimeMessage called')
});
expressApp.post('/runtimeMessage', async (req, res) => {
  const runtimeMessage: dataDefinitions.runtimeMessage = {...req.body};
  
  console.log(`Received new message: ${JSON.stringify(runtimeMessage)}`);
  
  const now = new Date();
  runtimeMessage.time = now.getTime();

  try {
    await redis.xadd(
      'runtimeMessage:' + currentSettings.id, 
      '*', 
      'text', runtimeMessage.text,
      'time', now.getTime().toString()
      );
    console.log('Runtime message saved');
  }
  catch (error) {
    console.log('Error saving runtime message', error);
  }

  // echo it back on the post request response
  res.send(runtimeMessage);

  // and broadcast it on the socket
  socketIo.emit('io:runtimeMessage', {emit: true, msg: runtimeMessage});
});



// set up the socket handler
socketIo.on('connection', function(socket){
  console.log('Got new client connection');

  // Probably should add this to the runtimeMessage log. And client disconnects too
  //  redis.xadd('server:runLog', '*', 'message', 'New client connection');

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


