import commandLine = require('commander');
const fetch = require('node-fetch');
import io = require('socket.io-client');
import * as dataDefinitions from '../../shared/dataDefinitions'


// set up the command line parser
// See https://github.com/tj/commander.js#readme for a bunch of examples
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

const serverRootUrl = `http://${commandLine.server}:${commandLine.port}`;
console.log(`Connecting to: ${serverRootUrl}`);


let currentSettings = dataDefinitions.defaultSettings;

// Get connected to the server
const socket = io(serverRootUrl)
.on('connect', function() {
  console.log('socket is connected');

  // just testing:
  const msg : dataDefinitions.runtimeMessage = {
    text: 'Hello from client'
  };

  sendServerMessage(msg);


  // Read the current settings - any changes will come through the socket message. Reading them
  // here in order to pick up any settings that might have been made while we were disconnected
  fetch(`${serverRootUrl}/settings`)
    .then((res: { json: () => any; }) => res.json())
    .then((settings: dataDefinitions.settings) => {
      console.log('Read initial settings from server', settings);
      handleSettings(settings);
    });

})
.on('io:settings', (data) => {
  const settings: dataDefinitions.settings = data.msg;
  console.log('got updated settings from the server', settings);
  handleSettings(settings);
});

let timer = null;
/**
 * just a super basic timer for now to see if I can do some measurements on an interval and report to the server
 * @param newSettings 
 */
function handleSettings(newSettings: dataDefinitions.settings) {
  if (newSettings.on && !currentSettings.on) {
    // start up the client
    if (timer == null) {
      timer = setInterval(() => {

        const startTime = new Date();
        console.log(`fetching ${currentSettings.checkUrl}`);
        fetch(currentSettings.checkUrl)
        .then((res: { json: () => any; }) => res.json())
        .then((settings: dataDefinitions.settings) => {
          
          const endTime = new Date();
          console.log('got response');
          const measurement: dataDefinitions.measurement = {
            responseTime: (endTime.getTime() - startTime.getTime()),
          }
          sendMeasurement(measurement);
        });
      }, newSettings.checkInterval * 1000);
    }
  }
  else if (!newSettings.on && currentSettings.on) {
    // shutdown the client
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  }

  currentSettings = newSettings;
}


/**
 * Sends a runtime message to the server
 * @param message the message to send
 */
function sendServerMessage(message: dataDefinitions.runtimeMessage) {
  console.log('Sending runtimeMessage to server');

  return put(`${serverRootUrl}/runtimeMessage`, message);
}

function sendMeasurement(data: dataDefinitions.measurement) {
  console.log('Sending measurement to server', data);
  return put(`${serverRootUrl}/measurement`, data);
}

function put(url:string, data: any) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then((response: { json: () => any; }) => response.json())
  .then((data: any) => {
    console.log('Send response:', data);
  })
  .catch((error: any) => {
    console.error('Error sending:', error);
  });
}

socket.on('disconnect', function() {
  console.log('disconnected');
});

