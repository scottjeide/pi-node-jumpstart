<template>
  <div>
    <p> I'm the controlPanel </p>
    <v-divider></v-divider>
    <v-switch
        v-model="onOff"
        :label="On/Off"
      ></v-switch>
  </div>
</template>

<script lang="ts">
console.log('panel opened');

// Listen for any controlPanel/settings changes
/*
import * as dataDefinitions from '../../../shared/dataDefinitions';
let currentSettings: dataDefinitions.controlPanel = {
  on: false,
  runId: '',
  smokerSetTemp: 0,
};
*/


export default {
  data: function() {
    return {
      someValue: 'test'
    }
  },
  // can we do props here too? Like passing in a URL or something?
}
</script>