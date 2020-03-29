<template>
  <v-app id="mainApp">

    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>Pi Controller</v-toolbar-title>
      <!-- Could put a on/off button here on the title. That would make it always available at the top? Either that or just make a fixed panel at the top that has the status/controlPanel
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
          <v-expansion-panel-header>Status</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model="currentSettings.on"
              :label="`Power: ${currentSettings.on ? 'On' : 'Off'}`"
            ></v-switch>
            <v-text-field
              v-model="currentSettings.smokerSetTemp"
              label="Smoker Target Temperature"
              readonly
              :outlined=true
            ></v-text-field>
            <v-text-field
              v-model="currentSettings.runId"
              label="Run ID"
              placeholder=" "
              readonly
              :outlined=true
            ></v-text-field>
            
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
            <v-slider
              v-model="newSettings.smokerSetTemp"
              :label="`Smoker Set Temp`"
              thumb-label="always"
              :max=400
              :min=200>
              </v-slider>
            <div class="my-2">
              <!-- Make this enabled/disabled based on if new settings == currentSettings -->
              <v-btn depressed color="primary">Apply</v-btn>
            </div>              
          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Data</v-expansion-panel-header>
          <v-expansion-panel-content>
            The pretty graphs
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

  const serverRootUrl = `http://localhost:3001`;
  console.log(`Connecting to: ${serverRootUrl}`);

  const defaultSettings: dataDefinitions.controlPanel = {
    on: false,
    runId: '',
    smokerSetTemp: 350,
  };





  // Next steps: Add the messages and the data (maybe make some timers on the server or client just generate some)





  let self = null;
  
  export default {
    props: {
      source: String,
    },



    data: () => ({
      currentSettings: defaultSettings,
      newSettings: defaultSettings,
      messageText: "",
      messages: [],
    }),



    created () {
      self = this;

      this.$vuetify.theme.dark = true;

      function handleServerSettings(serverSettings: dataDefinitions.controlPanel) {
        console.log('handleSettings called', serverSettings);
        self.currentSettings = {...serverSettings};
      }

      const socket = io(serverRootUrl);
      socket.on('connect', function() {
        console.log('socket is connected');

        // Grab the current settings
        fetch(`${serverRootUrl}/controlPanel`)
          .then((res: { json: () => any; }) => res.json())
          .then((settings: dataDefinitions.controlPanel) => {
            console.log('Read initial controlPanel from server', settings);
            handleServerSettings(settings);
          });
      })
      
      // Pick up any changes a different client might be making to the current settings
      .on('io:controlPanel', (data) => {
        const settings: dataDefinitions.controlPanel = data.msg;
        console.log('got updated settings from the server', settings);
        handleServerSettings(settings);
      })
      
      // Watch for any runtime messages
      .on('io:runtimeMessage', (data) => {
        const message: dataDefinitions.runtimeMessage = data.msg;
        console.log('got new runtime message', message.text);

        self.messages.unshift(message.text);
        if (self.messages.length > 10) {
          self.messages.pop();
        }

        self.messageText = self.messages.join("\n");
      })
      ;
    },

    methods: {
    },

  }
</script>