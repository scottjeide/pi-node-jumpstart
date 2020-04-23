import * as express from 'express';
import { json } from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import Redis = require("ioredis");
import * as dataDefinitions from '../../shared/dataDefinitions'
import { Socket } from 'socket.io';

const serverPort = 3001;

// Set up express and some default handlers
const expressApp = express()
  .use(helmet())
  .use(json())
  .use(cors())
  .use(morgan('tiny'))  // the express logging middleware
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
  addRuntimeServerMessage('Connected to redis');

  // once we are connected to redis we can start serving client connections
  if (!serverListening) {
    console.log('Starting http server');
    expressHttpServer.listen(serverPort, () => {
      console.log(`listening on port ${serverPort}`);
    });
    serverListening = true;
  }
})
.on('error', (err) => {
  console.log('Redis error', err);
})
.on('reconnecting', (ms) => {
  const logMessage = `Reconnecting to redis in ${ms} ms`;
  console.log(logMessage);
  addRuntimeServerMessage(logMessage);
});

// Set up the settings api handlers
const currentSettings = dataDefinitions.defaultSettings;

expressApp.get('/settings', (req, res) => {
  res.send(currentSettings);
});
expressApp.post('/settings', async (req, res) => {
  const newSettings: dataDefinitions.settings = {...req.body};
  
  console.log('Received new settings', newSettings);
  
  // give this settings change a new id
  newSettings.id = (new Date()).getTime().toString();

  for (let prop in currentSettings) {
    if (newSettings.hasOwnProperty(prop)) {
        currentSettings[prop] = newSettings[prop];
    }
  }
  
  addRuntimeServerMessage(`Server settings updated: ${JSON.stringify(currentSettings)}`);

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
  
  console.log('Received new runtimeMessage:', runtimeMessage);

  const message = await addRuntimeMessage(runtimeMessage);
  
  // echo it back on the post request response
  res.send(message);
});



// set up the socket handler
socketIo.on('connection', function(socket: Socket) {
  console.log(`Got new client connection from ${socket.request.connection.remoteAddress}`);

  socket.on('disconnect', function() {
    console.log(`Client ${socket.request.connection.remoteAddress} disconnected`);
  });
});

// Now that we're all set up, make the connection to redis and once we are connected we can start listening
// for client connections
redis.connect()
.catch((error) => {
  console.log('Connect error:', error);
});


/**
 * Helper for the server adding it's own runtime messages
 * @param text the message to add
 */
function addRuntimeServerMessage(text: string) {
    const msg:dataDefinitions.runtimeMessage = {
      text: `Server: ${text}`
    }
    addRuntimeMessage(msg);  
}


/**
 * Main function that adds a runtime message to the db and broadcast to clients listening on that socket
 * @param msg The message to add
 * @return the message that was added
 */
async function addRuntimeMessage(msg: dataDefinitions.runtimeMessage): Promise<dataDefinitions.runtimeMessage> {
  // stamp the time w/ the server's time
  const now = new Date();
  msg.time = now.getTime();

  try {
    await redis.xadd(
      'runtimeMessage:' + currentSettings.id, 
      '*', 
      'text', msg.text,
      'time', now.getTime().toString()
      );
    console.log('Runtime message saved');
  }
  catch (error) {
    console.log('Error saving runtime message', error);
  }

  // and broadcast it on the socket
  socketIo.emit('io:runtimeMessage', {emit: true, msg: msg});

  return msg;
}