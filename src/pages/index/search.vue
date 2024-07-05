<script setup lang="ts">
import { debounce } from '@taiyuuki/utils'
import type { SearchResult } from '@/components/types'
import { invoke_replace, invoke_search } from '@/invoke'
import { useEPUB } from '@/stores/epub'
import { useTheme } from '@/stores/theme'
import { is_html } from '@/utils/is'
import { DISPLAY } from '@/static'
import { de_escape } from '@/utils'

const theme = useTheme()
const epub = useEPUB()
const keyword = ref('')
const replacement = ref('')
const search_result = ref<[string, SearchResult[]][]>([])
const case_sensitive = ref(false)
const regex = ref(false)
const word = ref(false)
const has_error = ref(false)
const dot = ref(false)
const multi_line = ref(true)
const diff_mode = ref<1 | 2 | 3 | 4>(1)

// const error_tips = computed(() => {
//     return `无效的正则表达式： ${keyword.value}`
// })

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
        search_result.value = await invoke_search(
            epub.dir,
            keyword.value,
            regex.value, 
            case_sensitive.value,
            word.value,
            multi_line.value,
            dot.value,

        )
    }
    catch (_) {
        has_error.value = true
    }
}

const trigger_search = debounce(search, 500)

const repl = computed(() => {
    try {
        return regex.value ? de_escape(replacement.value) : replacement.value
    }
    catch (_) {
        return replacement.value
    }
})

const total = computed(() => {
    return `${counter.value.found}个文件中有${counter.value.total}个结果`
})

async function replace() {
    if (keyword.value.trim() === '') {
        return
    }
    try {
        await invoke_replace(
            epub.dir, 
            keyword.value,
            regex.value,
            case_sensitive.value,
            word.value, 
            multi_line.value,
            dot.value,
            repl.value,
        )
        if (epub.display === DISPLAY.CODE && is_html(epub.current.id)) {
            await epub.reload_current()
        }
        await trigger_search()
    }
    catch(e) {
        console.error(e)
        has_error.value = true
    }
}

function open(k: string, item: SearchResult) {
    epub.open_by_id(k, item.lnum)
}

watch(() => [
    case_sensitive.value,
    regex.value,
    word.value,
    multi_line.value,
    dot.value,
], () => {
    trigger_search()
})

watch(() => epub.dir, () => {
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
  <div
    p="x-10"
    m="t-10"
  >
    <InputSearch 
      v-model:case_sensitive="case_sensitive"
      v-model:word="word"
      v-model:regex="regex"
      v-model:keyword="keyword"
      v-model:has_error="has_error"
      @search="search"
    />
  </div>
  <div
    p="x-10"
    m="t-10"
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
    p="x-10"
    select-none
    class="q-gutter-y-sm"
  >
    <div>
      <q-checkbox
        v-model="multi_line"
        dense
        label="多行匹配"
      />
    </div>
    <div>
      <q-checkbox
        v-model="dot"
        dense
        label="允许点匹配换行符"
      />
    </div>
  </div>
  <q-separator
    m="t-10"
    class="sprt"
  />
  <div
    m="t-10"
    p="5"
    cursor-default
    select-none
  >
    {{ total }}
  </div>
  <div
    m="t-10"
    p="l-5"
  >
    <q-btn-toggle
      v-model="diff_mode"
      color="fg"
      text-color="fg"
      toggle-color="button"
      toggle-text-color="button"
      flat
      unelevated
      :rounded="false"
      :options="[
        { label: '行内', value: 1 },
        { label: '整行', value: 2 },
        { label: '原始', value: 3 },
        { label: '替换', value: 4 },
      ]"
    />
    <q-scroll-area
      visible
      m="t-10"
      p="r-14"
      style="height: calc(100vh - 425px);padding-bottom: 12px;"
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
            :replace="repl"
            :regexp="regex"
            :sensitive="case_sensitive"
            :dot="dot"
            :multiline="multi_line"
            :diff-mode="diff_mode"
            @regexp-error="regexp_error_tips"
          />
          <q-separator class="sprt" />
        </div>
      </template>
    </q-scroll-area>
  </div>
</template>

