<template>
  <v-app id="mainApp">

    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>Pi Controller</v-toolbar-title>
      <!-- Could put a on/off button here on the title. That would make it always available at the top? Either that or just make a fixed panel at the top that has the status + settings
      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>      
      -->
    </v-app-bar>

    <v-content>
      <!-- cards might be better too - especially for fixed content like the status & data -->
      <v-expansion-panels
        :accordion=true
        :multiple=true
      >
        <v-expansion-panel
          :isActive=true
        >
          <v-expansion-panel-header>Control Panel</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model="currentSettings.on"
              :label="`Power: ${currentSettings.on ? 'On' : 'Off'}`"
            ></v-switch>
            <v-text-field
              v-model.number="currentSettings.checkInterval"
              label="Check Interval (in seconds)"
              type="number"
              :outlined=true
            ></v-text-field>
            <v-text-field
              v-model.trim="currentSettings.checkUrl"
              label="URL to check"
              :outlined=true
            ></v-text-field>

            <v-text-field
              v-model="currentSettings.id"
              label="Settings ID"
              placeholder=" "
              readonly
              disabled
              :outlined=false
            ></v-text-field>

            <div class="my-2">
              <v-btn depressed color="primary" :disabled="!settingsChanged" @click="saveSettings()">Apply</v-btn>
            </div>              

            <v-textarea
              readonly
              :outlined=true
              label="Messages"
              placeholder=" "
              v-model="messageText"

            >
            </v-textarea>
            <!-- start/stop buttons?, running or not running, current settings, last N messages -->

          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Change Settings</v-expansion-panel-header>
          <v-expansion-panel-content>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Data</v-expansion-panel-header>
          <v-expansion-panel-content>
            <lineChart :chartData="chartData"/>
          </v-expansion-panel-content>
        </v-expansion-panel>

      </v-expansion-panels>
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

  const serverRootUrl = `http://localhost:3001`;
  console.log(`Connecting to: ${serverRootUrl}`);

  

  let self = null;
  
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
      messages: [],      
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Smoker Temp',
            backgroundColor: '#FF0033',
            borderColor:  '#FF0033',
            data: [],
            fill: false,
          },
          {
            label: 'Meat Temp',
            backgroundColor: '#0033FF',
            borderColor:  '#0033FF',
            data: [],
            fill: false,
          }
        ]
      },
    }),

    created () {
      self = this;

      this.$vuetify.theme.dark = true;


      const socket = io(serverRootUrl);
      socket.on('connect', async () => {
        console.log('socket is connected');
        try {
          const response = await fetch(`${serverRootUrl}/settings`);
          const settings: dataDefinitions.settings = await response.json();
          console.log('Read initial settings from server', settings);
          self.handleServerSettings(settings);
        }
        catch(error) {
          console.log('Error reading initial settings', error);
        }
      })
      
      // Pick up any changes a different UI might be making to the current settings
      .on('io:settings', (data) => {
        const settings: dataDefinitions.settings = data.msg;
        console.log('got updated settings from the server', settings);
        self.handleServerSettings(settings);
      })
      
      // Watch for any runtime messages
      .on('io:runtimeMessage', (data) => {
        const message: dataDefinitions.runtimeMessage = data.msg;
        console.log('got new runtime message', message.text);

        const messageTime = new Date(message.time);
        self.messages.unshift(`${message.text} [${messageTime.toLocaleString()}]`);
        if (self.messages.length > 10) {
          self.messages.pop();
        }

        self.messageText = self.messages.join("\n");
      })

      // watch for the measurements
      .on('io:measurement', (data) => {
        const measurement: dataDefinitions.measurement = data.msg;
        console.log('got new measurement', measurement);

        // TODO: need to find something better for label. Maybe just a tick every minute or something?
        // a label per datapoint is really messy
        const measurementTime = new Date(measurement.time);
        self.addData(measurementTime.toLocaleString(), measurement);
      })
      ;

      self.$watch('currentSettings', self.currentSettingsChanged, {deep: true});
    },

    methods: {
      addData: (label, measurement:dataDefinitions.measurement) => {
        self.chartData.labels.push(label);

        self.chartData.datasets[0].data.push(measurement.responseTime);

        // it won't pick up the dynamic stuff we added unless we assign app.chartData to a new object
        self.chartData = {...self.chartData}
      },

      currentSettingsChanged: () => {
         
        /* Note: if you see settingsChanged being set to true when not expected, make sure the type of the settings aren't getting
          * changed or extra whitespace being added. Be sure to add .trim and .number in the v-model bindings so the setting
          * maintains the correct type after the user changes it.
          */
        self.settingsChanged = !_.isEqual(self.currentSettings, self.serverSettings);
      },

      handleServerSettings: (serverSettings: dataDefinitions.settings) => {
        console.log('handleSettings called', serverSettings);
        self.serverSettings = {...serverSettings};
        self.currentSettings = {...serverSettings};
      },

      saveSettings: async () => {
        // initially start out as if the settings are already saved so the apply button disables. 
        const prevSettings = {...self.serverSettings};
        self.serverSettings = {...self.currentSettings};

        console.log('Saving settings', self.currentSettings);

        // Post the new settings to the server
        try {
          const response = await fetch(`${serverRootUrl}/settings`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(self.currentSettings)
          });
          const updatedSettings: dataDefinitions.settings = await response.json();
          console.log('Saved settings to server');
          self.handleServerSettings(updatedSettings);
        }
        catch (error) {
          console.log('Error saving settings', error);
          // Restore what we had
          self.handleServerSettings(prevSettings);
        }
      }
    },

    components: {
      'lineChart': lineChart,
    }

  }
</script>