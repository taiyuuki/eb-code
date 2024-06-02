<script setup lang="ts">
import { themes } from '@/editor/themes'
import { NOT_SUPPORTED_THEMES } from '@/static'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

const emit = defineEmits<{
    (e: 'open'): void,
    (e: 'save'): void,
    (e: 'create', version: number): void,
    (e: 'meta'): void,
    (e: 'cover'): void,
    (e: 'contents'): void,
    (e: 'preview'): void
}>()

const theme = useTheme()
const status = useStatus()
const router = useRouter()

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
    <div flex="~ justify-start items-center">
      <MenuIcon
        name="read-book"
        tip="打开"
        @click="emit('open')"
      />
      <MenuIcon
        name="save-file"
        tip="保存"
        :disable="!status.editable"
        @click="status.editable && emit('save')"
      />
      <q-separator
        m="x-10"
        vertical
        class="sprt"
      />
      <MenuIcon
        name="create-epub-2"
        tip="新建ePub2"
        @click="emit('create', 2)"
      />
      <MenuIcon
        name="create-epub-3"
        tip="新建ePub3"
        @click="emit('create', 3)"
      />
      <q-separator
        m="x-10"
        vertical
        class="sprt"
      />
      <MenuIcon
        name="epub-meta"
        tip="元数据"
        :disable="!status.editable"
        @click="status.editable && emit('meta')"
      />
      <MenuIcon
        name="image"
        tip="封面"
        :disable="!status.editable"
        @click="status.editable && emit('cover')"
      />
      <MenuIcon
        name="contents"
        tip="目录"
        :disable="!status.editable"
        @click="status.editable && emit('contents')"
      />
      <q-separator
        m="x-10"
        vertical
        class="sprt"
      />
      <MenuIcon
        name="search"
        tip="全书搜索"
        :disable="!status.editable"
        @click="router.push('/search')"
      />
      <MenuIcon
        name="eyes"
        tip="预览"
        :disable="!status.editable"
        @click="status.editable && emit('preview')"
      />
    </div>
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
  justify-content: space-between;
  background-color: var(--vscode-menu-background);
  padding: 0 5px;
  color: var(--vscode-menu-foreground);
  border-width: 0 0 1px 0;
  border-style: solid;
  border-color: var(--vscode-textSeparator-foreground);
}
</style>
