import commandLine = require('commander');
const fetch = require('node-fetch');
import io = require('socket.io-client');
import * as dataDefinitions from '../../shared/dataDefinitions';
import _ = require('lodash');
import rpio = require('rpio');

// Check out https://www.npmjs.com/package/systeminformation for lots of handy we can measure & log about the system we're running on
import systemInfo = require('systeminformation');


// set up the command line parser
// See https://github.com/tj/commander.js#readme for a bunch of examples
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

const serverRootUrl = `http://${commandLine.server}:${commandLine.port}`;
console.log(`Connecting to: ${serverRootUrl}`);


let currentSettings = dataDefinitions.defaultSettings;

// open any pins we are going to use & set the default state. The rpio library refers to them
// by actual pin number, not GPIO#. See https://elinux.org/RPi_Low-level_peripherals for details
const GPIO4 = 7;
rpio.open(GPIO4, rpio.OUTPUT, rpio.LOW);

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


/**
 * Sends a runtime message to the server
 * @param text the message to send
 */
function sendServerMessage(text: string) {
  console.log(`Sending runtimeMessage: ${text}`);
  const message : dataDefinitions.runtimeMessage = {
    text: text
  };

  return post(`${serverRootUrl}/runtimeMessage`, message);
}

/**
 * Sends a measurement to the server
 * @param dataDefinitions.measurement
 */
function sendMeasurement(data: dataDefinitions.measurement) {
  console.log('Sending measurement to server', data);
  return post(`${serverRootUrl}/measurement`, data);
}

/**
 * Helper for posting to the server
 * @param url 
 * @param data 
 */
async function post(url:string, data: any) {
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
      // Fire off each of these async measurements into separate promises so we can kick them off in 
      // parallel and then await for all to complete rather than awaiting for each in sequence
      const [responseTime, wifiInfo, batteryInfo, cpuTemperature] = await Promise.all(
        [
          checkUrlResponseTime(currentSettings.checkUrl),
          systemInfo.wifiNetworks(),
          systemInfo.battery(),
          systemInfo.cpuTemperature(),
        ]
      );

      const measurement: dataDefinitions.measurement = {
        responseTime: responseTime,
      }
      if (wifiInfo.length > 0) {
        measurement.wifiStrength = wifiInfo[0].signalLevel;
      }
      if (batteryInfo.hasbattery) {
        measurement.batteryLevel = batteryInfo.percent;
      }
      if (cpuTemperature.main != -1) {
        measurement.cpuTemp = cpuTemperature.main;
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

  rpio.write(GPIO4, currentSettings.gpio4On ? rpio.HIGH : rpio.LOW);
}

/**
 * Fetches a URL and returns the response time
 * @param url 
 */
async function checkUrlResponseTime(url:string) {
  const startTime = new Date();
  console.log(`fetching ${url}`);
  const response = await fetch(url);   
  const endTime = new Date();
  const responseTime = endTime.getTime() - startTime.getTime();

  console.log(`got response. status: ${response.status} in ${responseTime}ms`);

  return responseTime;
}
