
// This defines the data objects used by the client/server and stored in the DB

/**
 * The controlPanel is the main object that contains the settings for the run.
 * If you need additional settings, add them here.
 * 
 * The example below is what some settings for a temperature controller for a smoker might use.
 * These are set by the UI by POSTing a controlPanel object to the rest endpoint /controlPanel
 * 
 * Anytime a new controlPanel object is written, it will be broadcast on the socket
 * io:controlPanel so the clients can turn on/off or adjust their settings. 
 */
interface controlPanel {

  // indicates if we are running or not. Clients can set this on/off to switch the system on or off
  on: boolean,

  // the current run identifier (when the system is ON). Set by the server when the system is turned on
  runId: string,

  // the desired smoker temp (in degrees C)
  smokerSetTemp: number,

  // Could also set low/high meat and smoker alert thresholds
};



/**
 * The measurements that the client will be making and sending to the server for logging.
 * 
 * Measurements can be read via GETs to the /measurement rest endpoint
 * /measurement gets them all
 * /measurement/run-id to get them all for a given run
 * /measurement/run-id/<measurementName> to get all of the given measurements for a run
 * 
 * Post a measurement object to /measurement to log a new measurement for the current run.
 * Not all measurement properties need to be in the given measurement object. Whatever properties are filled in
 * will be logged.
 * 
 * Anytime a measurement is written, it will also be broadcast through the socket io:measurement. 
 */
interface measurement {
  smokerTemp?: number;
  meatTemp?: number;
  batteryLevel?: number;
  wifiStrength?: number;
}




/**
 * The runtime messages sent from the client to server to report back status
 * These are posted to /runtimeMessage and when they are posted they are also 
 * broadcast on the io:runtimeMessage socket
 */
interface runtimeMessage {
  text: string;
}

export {
  controlPanel,
  measurement,
  runtimeMessage
}