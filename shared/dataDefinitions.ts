
/**
 * dataDefinitions describes the data objects used by the client/server and stored in the DB 
 */


/**
 * settings is the main object that contains the on/off switches and any other settings
 * that control the pi
 * 
 * These are set by the UI by POSTing a settings object to the rest endpoint /settings
 * 
 * Anytime a new settings object is written, it will be broadcast on the socket
 * io:settings so the clients can react to any changes
 */
interface settings {

  // the current settings identifier. Set/updated by the server any time the settings are changed
  id: string,

  // The on/off switch
  on: boolean,

  // How frequently we should run the checks (in seconds)
  checkInterval: number,

  // The url we'll check every interval
  checkUrl: string,

  // GPIO4 pin on/off
  gpio4On: boolean,
}

/**
 * The settings defaults used by the various components until they can load the current values
 * from the server/db.
 * These should be the safe defaults to use when things startup/reboot/etc
 */ 
const defaultSettings: settings = {
  id: '',
  on: false,
  checkInterval: 10,
  checkUrl: 'https://www.google.com',
  gpio4On: false,
}


/**
 * The measurements that the client will be making and sending to the server for logging.
 * 
 * Measurements can be read via GETs to the /measurement rest endpoint
 * /measurement gets them all
 * /measurement/controlId to get all the measurements associated with the given control id
 * /measurement/controlId/<measurementName> to get all of the given measurements for a run
 * 
 * Post a measurement object to /measurement to log a new measurement
 * Not all measurement properties need to be in the given measurement object, whatever properties
 * are filled in will be logged.
 * 
 * Anytime a measurement is written, it will also be broadcast through the socket io:measurement. 
 */
interface measurement {
  responseTime?: number;
  batteryLevel?: number;
  wifiStrength?: number;
  cpuTemp?: number;

  // UTC timestamp of the measurement (assigned by server)
  time?: number;
}



/**
 * The runtime messages sent from the client to server to report back status
 * These are posted to /runtimeMessage and when they are posted they are also 
 * broadcast on the io:runtimeMessage socket
 */
interface runtimeMessage {
  text: string;

  // UTC timestamp of the message (assigned by server)
  time?: number;
}

export {
  settings,
  defaultSettings,
  measurement,
  runtimeMessage,
}
