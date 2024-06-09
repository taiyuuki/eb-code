<script setup lang="ts">
import { debounce } from '@taiyuuki/utils'
import type { SearchResult } from '@/components/types'
import { invoke_replace, invoke_search } from '@/invoke'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { is_html } from '@/utils/is'
import { DISPLAY } from '@/static'

const theme = useTheme()
const status = useStatus()
const keyword = ref('')
const replacement = ref('')
const search_result = ref<[string, SearchResult[]][]>([])
const case_sensitive = ref(false)
const regex = ref(false)
const word = ref(false)
const has_error = ref(false)

const error_tips = computed(() => {
    return `无效的正则表达式： ${keyword.value}`
})

const disable_replace = computed(() => {
    return has_error.value || keyword.value === ''
})

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
    has_error.value = false
    if (keyword.value === '') {
        search_result.value.length = 0

        return
    }
    try {
        search_result.value = await invoke_search(status.dir, keyword.value, regex.value, case_sensitive.value, word.value)
    } catch (_) {
        has_error.value = true
    }
}

const trigger_search = debounce(search, 500)

async function replace() {
    if (keyword.value.trim() === '') {
        return
    }
    try {
        await invoke_replace(status.dir, keyword.value, regex.value, case_sensitive.value, word.value, replacement.value)
        if (status.display === DISPLAY.CODE && is_html(status.current.id)) {
            status.reload_current()
        }
        await trigger_search()
    } catch(_) {
        has_error.value = true
    }
}

function open(k: string, item: SearchResult) {
    status.open_by_id(k, item.lnum)
}

watch([() => case_sensitive.value, () => regex.value, () => word.value], () => {
    trigger_search()
})

watch(() => status.dir, () => {
    keyword.value = ''
    replacement.value = ''
    search_result.value.length = 0
    has_error.value = false
})

function regexp_error_tips() {
    has_error.value = true
}
</script>

<template>
  <TitleBanner
    :dark="theme.dark"
    dense
  >
    <div
      m="x-5"
      text="20 bold"
    >
      搜索
    </div>
  </TitleBanner>
  <div p="r-10">
    <q-input
      v-model="keyword"
      :dark="theme.dark"
      debounce="800"
      outlined
      label="搜索"
      :error="has_error"
      bottom-slots
      hide-bottom-space
      dense
      tabindex="100"
      @update:model-value="search"
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
  </div>
  <div
    p="r-10"
    m="t-5"
  >
    <q-input
      v-model="replacement"
      :dark="theme.dark"
      debounce="500"
      outlined
      label="替换"
      dense
      tabindex="100"
    >
      <template #append>
        <q-btn
          class="i-codicon:replace-all"
          :disable="disable_replace"
          @click="replace"
        >
          <q-tooltip
            v-if="!disable_replace"
            :delay="500"
          >
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
    visible
    m="t-10"
    style="height: calc(100vh - 300px);"
    select-none
  >
    <template
      v-for="(rst, index) in search_result"
      :key="index"
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
          class="list-selection"
          pointer
          m="l-5"
          flex="1"
          @click="open(rst[0], rst[1][0])"
        >
          {{ rst[0] }}
        </div>
      </div>
      <div
        v-for="(item, i) in rst[1]"
        :key="i"
        class="list-selection"
        m="l-30"
        pointer
        @click="open(rst[0], item)"
      >
        <ReplaceResult
          :text="item.line"
          :patten="keyword"
          :replace="replacement"
          :regexp="regex"
          :fixed="case_sensitive"
          @regexp-error="regexp_error_tips"
        />
        <q-separator :dark="theme.dark" />
      </div>
    </template>
  </q-scroll-area>
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
