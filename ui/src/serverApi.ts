// Handles the communication with the server

import io from 'socket.io-client';
import * as dataDefinitions from '../../shared/dataDefinitions';

const serverRootUrl = `http://localhost:3001`;
console.log(`Connecting to: ${serverRootUrl}`);


const socket = io(serverRootUrl, {autoConnect: false});
socket.on('connect', function() {
  console.log('socket is connected');

  // Read the current settings - any changes will come through the socket message. Reading them
  // here in order to pick up any settings that might have been made while we were disconnected
  fetch(`${serverRootUrl}/controlPanel`)
    .then((res: { json: () => any; }) => res.json())
    .then((settings: dataDefinitions.controlPanel) => {
      console.log('Read initial controlPanel from server', settings);
      handleSettings(settings);
    });

})
.on('io:controlPanel', (data) => {
  const settings: dataDefinitions.controlPanel = data.msg;
  console.log('got updated settings from the server', settings);
  handleSettings(settings);
});

function handleSettings(newSettings: dataDefinitions.controlPanel) {
  console.log('handleSettings called', newSettings);
}

/*
 * export all of the data we expect from the server along with events that are triggered when changed
 * and export methods that can be called to update/save settings on the server
 */
export default {

  // initiates the connection to the server
  connect: function() {
    socket.connect();

  },

  connected: false,

  // control panel w/ changed event?

  // 
}