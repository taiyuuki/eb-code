<script setup lang="ts">
import { useTheme } from '@/stores/theme'

const theme = useTheme()
</script>

<template>
  <q-banner
    :dark="theme.dark"
    dense
    bg="var-eb-bg"
    text="var-eb-fg"
    h="55"
    p="0"
    overflow-auto
    select-none
  >
    <slot />
  </q-banner>
</template>
