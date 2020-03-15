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

// Listen for any controlPanel/settings changes
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
  fetch(`${serverRootUrl}/controlPanel`)
    .then(res => res.text())
    .then(body => {
      console.log(`Read initial controlPanel from server: ${JSON.stringify(body)}`);
    });

})
.on('io:controlPanel', function(data) {
  console.log(`got updated settings from the server: ${JSON.stringify(data)}`);
});

// how do we type these? Should always be the controlPanel object from the dataDefinitions
function handleSettings(settings) {

}


/**
 * Sends a runtime message to the server
 * @param message the message to send
 */
function sendServerMessage(message: dataDefinitions.runtimeMessage) {
  console.log('Sending runtimeMessage to server');
  fetch(`${serverRootUrl}/runtimeMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })
  .then((response: { json: () => any; }) => response.json())
  .then((data: dataDefinitions.runtimeMessage) => {
    console.log('Sent message, response:', data);
  })
  .catch((error) => {
    console.error('Error sending message:', error);
  });
}



socket.on('disconnect', function() {
  console.log('disconnected');
});

