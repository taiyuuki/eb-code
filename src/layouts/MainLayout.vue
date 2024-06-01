<script setup lang="ts">
onBeforeMount(() => {
    document.documentElement.classList.add('monaco-component')
    document.documentElement.addEventListener('contextmenu', e => {
        e.preventDefault()
    })
})
</script>

<template>
  <q-layout>
    <q-page-container pst="abs t-40 r-0 l-0">
      <TitleBar />
      <ToolBar />
      <router-view />
      <StatusBar />
    </q-page-container>
  </q-layout>
</template>
