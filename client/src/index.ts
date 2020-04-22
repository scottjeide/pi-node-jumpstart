import commandLine = require('commander');
const fetch = require('node-fetch');
import io = require('socket.io-client');
import * as dataDefinitions from '../../shared/dataDefinitions';
import _ = require('lodash');
import batteryLevel = require('battery-level');


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

.on('connect', async () => {
  console.log('socket connected');

  sendServerMessage('Client is connected to server');

  // Read the current settings - any changes will come through the socket message. Reading them
  // here in order to pick up any settings that might have been made while we were disconnected
  try {
    const response = await fetch(`${serverRootUrl}/settings`);
    const settings: dataDefinitions.settings = await response.json();
    console.log('Read initial settings from server', settings);
    handleSettings(settings);
  }
  catch (error) {
    console.log('Error reading initial settings', error);
  }
})

.on('disconnect', () => {
  console.log('socket disconnected');
  sendServerMessage('Client lost connection to server');
})

.on('io:settings', (data) => {
  const settings: dataDefinitions.settings = data.msg;
  console.log('got updated settings from the server', settings);
  handleSettings(settings);
});




let timer = null;
/**
 * Handles the settings updates. Currently just collects measurements on the configured interval
 * @param newSettings 
 */
function handleSettings(newSettings: dataDefinitions.settings) {

  if (_.isEqual(newSettings, currentSettings)) {
    console.log(`Settings haven't changed. Ignoring`);
    return;
  }

  currentSettings = newSettings;

  // shutdown the previous
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }

  const doMeasurements = async () => {
    try {
      const startTime = new Date();
      console.log(`fetching ${currentSettings.checkUrl}`);
      const response = await fetch(currentSettings.checkUrl);
      console.log(`got response. status: ${response.status}`);
      
      // no real use for the actual data
      //const data = await response.text();
      //console.log('response text', data);

      const endTime = new Date();
      const measurement: dataDefinitions.measurement = {
        responseTime: (endTime.getTime() - startTime.getTime()),
        batteryLevel: await batteryLevel()
      }
      sendMeasurement(measurement);  
    }        
    catch (error) {
      console.log(`error fetching ${currentSettings.checkUrl}`, error);
      sendServerMessage(`Error fetching ${currentSettings.checkUrl}: ${JSON.stringify(error)}`);          
    }
  }

  if (currentSettings.on) {
    // start up the client measurement timer
    console.log(`Running measurement checks in ${currentSettings.checkInterval} seconds`)
    timer = setInterval(doMeasurements, currentSettings.checkInterval * 1000);
  }
  else {
    console.log('Settings off, not running checks');
  }
}


/**
 * Sends a runtime message to the server
 * @param text the message to send
 */
function sendServerMessage(text: string) {
  console.log(`Sending runtimeMessage: ${text}`);
  const message : dataDefinitions.runtimeMessage = {
    text: text
  };

  return put(`${serverRootUrl}/runtimeMessage`, message);
}

function sendMeasurement(data: dataDefinitions.measurement) {
  console.log('Sending measurement to server', data);
  return put(`${serverRootUrl}/measurement`, data);
}

async function put(url:string, data: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    console.log('Send response:', responseData);
  }
  catch (error) {
    console.error('Error sending:', error);
  }
}
