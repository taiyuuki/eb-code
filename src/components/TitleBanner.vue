<script setup lang="ts">
</script>

<template>
  <q-banner
    dense
    overflow-auto
    select-none
    class="banner"
  >
    <slot />
  </q-banner>
</template>

<style scoped>
.banner {
  background-color: var(--vscode-menu-background);
  padding: 0;
  color: var(--vscode-menu-foreground);
  border-width: 0 0 1px 0;
  border-style: solid;
  border-color: var(--vscode-textSeparator-foreground);
}
</style>
