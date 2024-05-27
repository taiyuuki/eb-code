<script setup lang="ts">
import type { SearchResult } from '@/components/types'
import { invoke_replace, invoke_search } from '@/invoke'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

const theme = useTheme()
const status = useStatus()
const keyword = ref('')
const replacement = ref('')
const search_result = ref<Record<string, SearchResult[]>>({})
const case_sensitive = ref(false)
const regex = ref(false)
const counter = computed(() => {
    const c = {
        total: 0,
        found: 0,
    }
    c.total = Object.values(search_result.value).reduce((a, b) => a + b.length, 0)
    c.found = Object.keys(search_result.value).length

    return c
})

async function search() {
    if (keyword.value.trim() === '') {
        search_result.value = {}

        return
    }
    search_result.value = await invoke_search(status.dir, keyword.value.trim(), regex.value, case_sensitive.value)
}

async function replace() {
    if (keyword.value.trim() === '') {
        return
    }
    await invoke_replace(status.dir, keyword.value.trim(), regex.value, case_sensitive.value, replacement.value)
    search()
}

watch([() => case_sensitive.value, () => regex.value], () => {
    search()
})
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div text="20 bold">
      搜索
    </div>
  </TitleBanner>
  <div p="r-10">
    <q-input
      v-model="keyword"
      :dark="theme.dark"
      debounce="500"
      outlined
      label="搜索"
      dense
      @update:model-value="search"
    >
      <template #append>
        <q-btn
          :class="{ 'i-mdi:format-letter-case': true, 'input-icon': case_sensitive }"
          op="60 hover:100"
          pointer
          @click="case_sensitive = !case_sensitive"
        >
          <q-tooltip>
            区分大小写
          </q-tooltip>
        </q-btn>
        <q-btn
          :class="{ 'i-mdi:regex': true, 'input-icon': regex }"
          op="60 hover:100"
          pointer
          @click="regex = !regex"
        >
          <q-tooltip>
            使用正则表达式
          </q-tooltip>
        </q-btn>
      </template>
    </q-input>
  </div>
  <div p="r-10">
    <q-input
      v-model="replacement"
      :dark="theme.dark"
      outlined
      label="替换"
      dense
    >
      <template #append>
        <q-btn
          class="i-ic:round-find-replace"
          op="60 hover:100"
          pointer
          @click="replace"
        >
          <q-tooltip>
            全部替换
          </q-tooltip>
        </q-btn>
      </template>
    </q-input>
  </div>
  <div
    m="t-10"
    cursor-default
    select-none
  >
    {{ counter.found }}个文件中有 {{ counter.total }} 个结果
  </div>
  <q-scroll-area
    m="t-10"
    style="height: calc(100vh - 300px);"
    select-none
  >
    <template
      v-for="(v, k) in search_result"
      :key="k"
    >
      <div flex="~ items-center">
        <div
          class="i-vscode-icons:file-type-html"
          middle
          w="20"
          h="20"
          pointer
        />
        <div
          pointer
          m="l-5"
          flex="1"
        >
          {{ k }}
        </div>
      </div>
      <div
        v-for="(item, i) in v"
        :key="i"
        m="l-30"
        pointer
      >
        {{ item.line }}
      </div>
    </template>
  </q-scroll-area>
</template>

<style scoped>
.input-icon {
    background-color: var(--vscode-button-background);
    opacity: 1;
    box-shadow: 0 0 2px var(--eb-fg);
}
</style>
