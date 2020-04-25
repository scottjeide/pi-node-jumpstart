<template>
  <v-app id="mainApp">

    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>Pi Controller</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container>
        <h3>Control Panel</h3>
        <v-form
          ref="controlPanelForm"
        >
          <v-switch
            v-model="currentSettings.on"
            :label="`Power: ${currentSettings.on ? 'On' : 'Off'}`"
          ></v-switch>

          <v-text-field
            v-model.number="currentSettings.checkInterval"
            label="Check Interval (in seconds)"
            type="number"
            dense
          ></v-text-field>
          <v-text-field
            v-model.trim="currentSettings.checkUrl"
            label="URL to check"
            dense
          ></v-text-field>

          <v-btn class="my-2" depressed color="primary" :disabled="!settingsChanged" @click="saveSettings()">Apply</v-btn>
        </v-form>
      </v-container>
      
      <v-divider></v-divider>
      <v-container>
        <h3>Status</h3>
        <p>Settings ID: {{currentSettings.id}}</p>
        <v-textarea
          readonly
          label="Latest Measurement"
          placeholder=" "
          v-model="latestMeasurement"
          no-resize
          rows=1
        >
        </v-textarea>
        <v-textarea
          readonly
          label="Latest Messages"
          placeholder=" "
          v-model="messageText"
        >
        </v-textarea>
      </v-container>
      
      <v-divider></v-divider>
      <v-container>
        <h3>Data</h3>
        <lineChart :chartData="chartData"/>
      </v-container>
    </v-content>

    <v-footer app>
      <span>&copy; 2020</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
  import io from 'socket.io-client';
  import * as dataDefinitions from '../../shared/dataDefinitions'; // eslint-disable-line no-unused-vars
  import lineChart from './components/lineChart';
  import _ from 'lodash';

  const serverRootUrl = `http://${window.location.hostname}:3001`;
  
  
  // Set up what measurements we want to add to the chart.
  // Can pick colors from https://vuetifyjs.com/en/styles/colors/ to match the material design color palette  
  const chartData = {
    datasets: [
      {
        label: 'Response Time',
        backgroundColor: '#F44336',
        borderColor:  '#F44336',
        data: [],
        fill: false,
      },
      {
        label: 'Battery Level',
        backgroundColor: '#2196F3',
        borderColor:  '#2196F3',
        data: [],
        fill: false,
      },
      {
        label: 'Wifi Signal Level (dB)',
        backgroundColor: '#FFC107',
        borderColor:  '#FFC107',
        data: [],
        fill: false,
      }
    ],

    // The maps a measurement name to the appropriate dataset index above
    measurementToDatasetIndex: {
      responseTime: 0,
      batteryLevel: 1,  
      wifiStrength: 2
    }
  };


  export default {
    props: {
      source: String,
    },


    data: () => ({
      
      // serverSettings contains the latest know settings from the server
      serverSettings: dataDefinitions.defaultSettings,

      // currentSettings is whatever settings the UI is currently showing
      currentSettings: dataDefinitions.defaultSettings,

      settingsChanged: false,

      messageText: "",
      latestMeasurement: "",
      messages: [],      
      chartData: chartData,

      socket: null,
    }),

    created() {
      this.$vuetify.theme.dark = true;

      console.log(`Connecting to: ${serverRootUrl}`);
      this.socket = io(serverRootUrl);
      this.socket.on('connect', async () => {
        console.log('socket is connected');
        this.addMessage('UI: connected to server');
        try {
          const response = await fetch(`${serverRootUrl}/settings`);
          const settings: dataDefinitions.settings = await response.json();
          console.log('Read initial settings from server', settings);
          this.handleServerSettings(settings);
        }
        catch(error) {
          console.log('Error reading initial settings', error);
        }
      })

      .on('disconnect', () => {
        console.log('socket disconnected');
        this.addMessage('UI: lost server connection');        
      })
      
      // Pick up any changes a different UI might be making to the current settings
      .on('io:settings', (data) => {
        const settings: dataDefinitions.settings = data.msg;
        console.log('got updated settings from the server', settings);
        this.handleServerSettings(settings);
      })
      
      // Watch for any runtime messages
      .on('io:runtimeMessage', (data) => {
        const message: dataDefinitions.runtimeMessage = data.msg;
        console.log('got new runtime message', message.text);

        const messageTime = new Date(message.time);
        this.addMessage(message.text, messageTime);
      })

      // watch for the measurements
      .on('io:measurement', (data) => {
        const measurement: dataDefinitions.measurement = data.msg;
        console.log('got new measurement', measurement);

        // TODO: need to find something better for label. Maybe just a tick every minute or something?
        // a label per datapoint is really messy
        const measurementTime = new Date(measurement.time);
        this.addData(measurementTime.toLocaleString(), measurement);
        this.latestMeasurement = `${JSON.stringify(measurement)} [${measurementTime.toLocaleString()}]`;
      })
      ;

      this.$watch('currentSettings', this.currentSettingsChanged, {deep: true});
    },

    beforeDestroy() {
      if (this.socket != null) {
        console.log('Disconnecting from server');
        this.socket.disconnect();
      }

      this.socket = null;
    },

    methods: {
      // Don't declare these methods w/ arrow functions. Otherwise 'this' won't be bound to the component
      // See https://michaelnthiessen.com/this-is-undefined/ for a good explanation
      
      addData: function(label, measurement:dataDefinitions.measurement) {
        for (const measurementName in measurement) {
          const chartDataIdx = this.chartData.measurementToDatasetIndex[measurementName];
          if (chartDataIdx !== undefined) {
            this.chartData.datasets[chartDataIdx].data.push(
                {
                  x: new Date(measurement.time),
                  y: measurement[measurementName]
                }              
              );  
          }
        }

        // it won't pick up the dynamic stuff we added unless we assign app.chartData to a new object
        this.chartData = {...this.chartData}
      },

      // adds the given message text to the UI
      addMessage: function(msg: string, time: Date = null) {
        if (time === null) {
          time = new Date();
        }

        this.messages.unshift(`${msg} [${time.toLocaleString()}]`);
        if (this.messages.length > 10) {
          this.messages.pop();
        }

        this.messageText = this.messages.join("\n");        
      },

      currentSettingsChanged: function() {
         
        // If you see settingsChanged being set to true when not expected, make sure the type of the settings aren't getting
        // changed or extra whitespace being added. Be sure to add .trim and .number in the v-model bindings so the setting
        // maintains the correct type after the user changes it.
        this.settingsChanged = !_.isEqual(this.currentSettings, this.serverSettings);
      },

      handleServerSettings: function(serverSettings: dataDefinitions.settings) {
        console.log('handleSettings called', serverSettings);
        this.serverSettings = {...serverSettings};
        this.currentSettings = {...serverSettings};
      },

      saveSettings: async function() {
        // initially start out as if the settings are already saved so the apply button disables. 
        const prevSettings = {...this.serverSettings};
        this.serverSettings = {...this.currentSettings};

        console.log('Saving settings', this.currentSettings);

        // Post the new settings to the server
        try {
          const response = await fetch(`${serverRootUrl}/settings`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(this.currentSettings)
          });
          const updatedSettings: dataDefinitions.settings = await response.json();
          console.log('Saved settings to server');
          this.handleServerSettings(updatedSettings);
        }
        catch (error) {
          console.log('Error saving settings', error);
          // Restore what we had
          this.handleServerSettings(prevSettings);
        }
      }
    },

    components: {
      'lineChart': lineChart,
    }

  }
</script>
