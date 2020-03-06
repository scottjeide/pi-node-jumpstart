
// This defines the data objects used by the client/server and stored in the DB

/**
 * The controlPanel is the main object that contains the settings for a given run.
 * If you need additional settings, add them here.
 * 
 * The example below is what some settings for a temperature controller for a smoker might use.
 * These are set by the UI through the rest endpoint /controlPanel
 * Anytime something is written to the control panel, it will be broadcast on the socket
 * io:controlPanel so the runners (need to find a word for that - basically the command line
 * client that's actually turning things on/off and making measurements). Probably just leave it
 * called client though - client (the pi doing stuff), server (logging things), and UI (controlling things 
 * and displaying status)
 */
const controlPanel = {

  // TODO: Maybe this should have a create/new operator that returns one of these? 



  // indicates if we are running or not. Clients can set this on/off to switch the system on or off
  on: false,

  // the current run identifier (when the system is ON). Set by the server only
  runId: '',

  // the desired smoker temp (in degrees C)
  smokerSetTemp: 0,

  // Could also set low/high meat and smoker alert thresholds?
};



/**
 * The measurements that the client will be making and sending to the server for logging.
 * Each property within measurements is it's own endpoint and can be reported/logged independently.
 * 
 * Measurements can be read via the /measurements/run-id/ rest endpoint. 
 * 
 * Posting to /measurements/run-id/temp will log a new temp measurement. 
 * Posting to /measurements/run-id/system will log a new system measurement.
 * 
 * Anytime a measurement is written, it will also be broadcast through the socket io:measurements:<name>. 
 * For example, io:measurements:temp or io:measurements:system
 */
const measurements = {
  // each measurement property here is its own rest endpoint and can be posted independently

  temp: {
    smoker: 0,
    meat: 0,
  },

  // Example of another set of measurements
  system: {
    batteryLevel: 0,
    wifiStrength: 0,
  },
};


/**
 * The runtime messages sent from the client to server to report back status
 */
const runtimeMessage = {
  text: '',
};

