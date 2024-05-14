<script setup lang="ts">

</script>

<template>
  <q-layout @contextmenu="$event.preventDefault()">
    <q-page-container pst="abs t-40 r-0 l-0">
      <TitleBar />
      <router-view />
      <StatusBar />
    </q-page-container>
  </q-layout>
</template>
