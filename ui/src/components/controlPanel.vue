<template>
  <p> I'm the controlPanel </p>
</template>

<script>
console.log('panel opened');
export default {
  data: function() {
    return {
      someValue: 'test'
    }
  },
  // can we do props here too? Like passing in a URL or something?
}
</script>