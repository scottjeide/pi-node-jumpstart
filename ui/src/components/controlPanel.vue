<template>
  <div>
    <p> I'm the controlPanel </p>
    <v-divider></v-divider>
    <v-switch
        v-model="onOff"
        :label="`Power: ${onOff ? 'On' : 'Off'}`"
      ></v-switch>
  </div>
</template>

<script lang="ts">
console.log('panel opened');

import * as dataDefinitions from '../../../shared/dataDefinitions'; // eslint-disable-line no-unused-vars
let currentSettings: dataDefinitions.controlPanel = {
  on: false,
  runId: '',
  smokerSetTemp: 0,
};


export default {
  data: function() {
    return {
      onOff: currentSettings.on
    }
  }, 
  watch: {
    onOff: (val) => {
      console.log('on/off changed', val);

      // It is not directly updating current settings. The state is only held in the onOff value in data
      // Looks like it might be best to just have data values for each of the things (runid, on, temp)
      // and watch for changes on them and then save to server as they change
      console.log('currentSettings:', currentSettings)
    }
  } 
  // can we do props here too? Like passing in a URL or something?
}
</script>