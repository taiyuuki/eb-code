<script setup lang="ts">
import { themes } from '@/editor/themes'
import { NOT_SUPPORTED_THEMES } from '@/static'
import { useTheme } from '@/stores/theme'

const theme = useTheme()

const supported_themes = themes.filter(t => !NOT_SUPPORTED_THEMES.includes(t))
const options = supported_themes
    .map(t => t.split('-')
        .map(t => t.charAt(0).toUpperCase() + t.slice(1))
        .join(' '))

const selected_theme = ref(options[supported_themes.indexOf(theme.shiki)])

function set_theme(t: string) {
    theme.set_theme(supported_themes[options.indexOf(t)])
}
</script>

<template>
  <div class="toolbar">
    <q-select
      v-model="selected_theme"
      square
      outlined
      dense
      label="主题"
      popup-content-class="bg-var-eb-bg text-var-eb-fg"
      color="fg"
      w="175"
      :options="options"
      :dark="theme.dark"
      @update:model-value="set_theme"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: end;
  background-color: var(--vscode-menu-background);
  padding: 0;
  color: var(--vscode-menu-foreground);
  border-width: 0 0 1px 0;
  border-style: solid;
  border-color: var(--vscode-textSeparator-foreground);
}
</style>
