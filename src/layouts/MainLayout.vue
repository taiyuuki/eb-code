<script setup lang="ts">
</script>

<template>
  <q-layout>
    <q-page-container pst="abs t-40 r-0 l-0">
      <TitleBar />
      <router-view />
      <StatusBar>
        状态栏
      </StatusBar>
    </q-page-container>
  </q-layout>
</template>
