<script setup lang="ts">
import { useTheme } from '@/stores/theme'

const emit = defineEmits<{
    (e: 'search', keyword: number | string | null): void
}>()

const regex = defineModel('regex', { type: Boolean, default: false })
const case_sensitive = defineModel('case_sensitive', { type: Boolean, default: false })
const word = defineModel('word', { type: Boolean, default: false })
const keyword = defineModel('keyword', { type: String, default: '' })
const has_error = defineModel('has_error', { type: Boolean, default: false })

const theme = useTheme()
const error_tips = computed(() => {
    return `无效的正则表达式： ${keyword.value}`
})
function emit_search(keyword: number | string | null) {
    emit('search', keyword)
}
</script>

<template>
  <q-input
    v-model="keyword"
    :dark="theme.dark"
    debounce="800"
    outlined
    label="查找"
    :error="has_error"
    bottom-slots
    hide-bottom-space
    dense
    tabindex="100"
    @update:model-value="emit_search"
  >
    <template #append>
      <div
        :class="{ 'input-icon': true, 'input-icon-active': case_sensitive }"
        @click="case_sensitive = !case_sensitive"
      >
        <div
          class="i-codicon:case-sensitive"
          inline-block
        />
        <q-tooltip :delay="500">
          区分大小写
        </q-tooltip>
      </div>
      <div
        :class="{ 'input-icon': true, 'input-icon-active': word }"
        @click="word = !word"
      >
        <div
          class="i-codicon:whole-word"
          inline-block
        />
        <q-tooltip :delay="500">
          全文字匹配
        </q-tooltip>
      </div>
      <div
        :class="{ 'input-icon': true, 'input-icon-active': regex }"
        @click="regex = !regex"
      >
        <div
          class="i-codicon:regex"
          inline-block
          pointer
        >
          <q-tooltip :delay="500">
            使用正则表达式
          </q-tooltip>
        </div>
      </div>
    </template>
    <template #error>
      <div v-if="has_error">
        {{ error_tips }}
      </div>
    </template>
  </q-input>
</template>

<style scoped>
.input-icon {
  border-width: 1px;
  border-radius: 3px;
  cursor: pointer;
  display: inline-block;
  width: 28px;
  height: 28px;
  box-sizing: border-box;
}

.input-icon:hover {
  background-color: var(--vscode-inputOption-hoverBackground);
}

.input-icon.input-icon-active {
  border-style: solid;
  color: var(--vscode-inputOption-activeForeground);
  border-color: var(--vscode-inputOption-activeBorder);
  background-color: var(--vscode-inputOption-activeBackground);
}
</style>
