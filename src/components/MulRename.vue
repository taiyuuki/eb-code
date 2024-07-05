<script setup lang="ts">
import { message } from '@tauri-apps/plugin-dialog'
import InputSearch from './InputSearch.vue'
import { useEPUB } from '@/stores/epub'
import { TREE } from '@/static'
import { vMove } from '@/directives/v-move'
import { useTheme } from '@/stores/theme'
import { basename, dirname, extname, filename, join } from '@/utils/path'
import { escape_regexp } from '@/utils'
import { invoke_rename_file } from '@/invoke'

const epub = useEPUB()
const theme = useTheme()
const htmls = computed(() => epub.nodes[TREE.HTML]?.children ?? [])

const keyword = ref('')
const case_sensitive = ref(false)
const regex = ref(false)
const word = ref(false)
const has_error = ref(false)
const invalid = ref(false)
const replacement = ref('')
const only_renamed = ref(false)
const invalid_tips = computed(() => {
    return `无效的文件名： ${replacement.value}`
})

const emit = defineEmits<{
    (e: 'close'): void
}>()

const flag = computed(() => {
    let flag = 'gu'
    if (case_sensitive.value) { 
        flag += 'i'
    }
    if (regex.value) {
        flag += 'm'
    }
    if (word.value) {
        flag += 'w'
    }

    return flag
})

const renamed = computed(() => {
    const result: { id: string, origin: string, target: string, new_id: string }[] = []
    try {
        const map = new Map<string, number>()
        for (const h of htmls.value) {
            const origin = basename(h.id)
            const ext = extname(h.id)
            let target = origin
            if (!invalid.value) {
                if (keyword.value === '') {
                    if (replacement.value !== '') {
                        target = `${replacement.value}.${ext}`
                    }
                } 
                else {
                    target = regex.value 
                        ? origin.replace(new RegExp(keyword.value, flag.value), replacement.value)
                        : case_sensitive.value 
                            ? origin.replace(new RegExp(escape_regexp(keyword.value), 'gi'), replacement.value) 
                            : origin.replace(keyword.value, replacement.value)
                }
            }
            if (map.has(target)) {
                let n = map.get(target)!
                if (n === 1) {
                    const first = result.find(r => r.target === target)
                    first!.target = `${filename(first!.target)}-${n.toString().padStart(4, '0')}.${ext}`
                    first!.new_id = join(dirname(first!.new_id), first!.target)
                }
                n++
                map.set(target, n)
                target = `${filename(target)}-${n.toString().padStart(4, '0')}.${ext}`
            }
            else {
                map.set(target, 1)
            }

            const new_id = join(dirname(h.id), target)

            result.push({
                id: h.id,
                new_id: new_id,
                origin,
                target,
            })
        }

    }
    catch {
        nextTick(() => has_error.value = true)
    }

    return result
})

const list_should_be_rename = computed(() => {
    return renamed.value.filter(r => r.target !== r.origin)
})

const display_rename = computed(() => {
    return only_renamed.value
        ? list_should_be_rename.value
        : renamed.value
})

function search() {
    has_error.value = false
}

function check_name() {
    const reg = new RegExp('[\\\\/:*?"<>|]')
    if (reg.test(replacement.value)) {
        invalid.value = true
    }
    else {
        invalid.value = false
    }
}

async function rename() {
    emit('close')
    if (!invalid.value) {
        epub.is_working = true
        for await (const r of list_should_be_rename.value) {
            await invoke_rename_file(epub.dir, r.id, r.new_id)
            await epub.rename_file_by_id(r.id, r.new_id, true)
        }
        epub.is_working = false
        await epub.save_opf()
        await message('已完成', { title: '批量重命名' })
        await epub.reload_current()
    }
}
</script>

<template>
  <div
    bg="var-eb-bg"
    text="var-eb-fg"
    w="80vw"
    select-none
  >
    <q-bar v-move>
      <div>批量重命名</div>
      <q-space />

      <q-btn
        v-close-popup
        dense
        flat
        icon="close"
      />
    </q-bar>
    <div class="q-gutter-sm p-5">
      <InputSearch 
        v-model:case_sensitive="case_sensitive"
        v-model:word="word"
        v-model:regex="regex"
        v-model:keyword="keyword"
        v-model:has_error="has_error"
        @search="search"
      />
      <q-input
        v-model="replacement"
        dense
        outlined
        label="重命名"
        bottom-slots
        hide-bottom-space
        tabindex="100"
        :dark="theme.dark"
        :error="invalid"
        @update:model-value="check_name"
      >
        <template #error>
          <div v-if="invalid">
            {{ invalid_tips }}
          </div>
        </template>  
      </q-input>
    </div>
    <div
      p="5"
      opacity="75"
    >
      提示：当出现重复的文件名时，会自动在后面添加数字序号，s-0001、s-0002以此类推。
    </div>
    <div>
      <q-checkbox
        v-model="only_renamed"
        :dark="theme.dark"
        label="只显示会修改的文件"
      />
    </div>
    <q-scroll-area
      visible
      h="50vh"
    >
      <div
        grid="~ cols-2"
        p="10"
      >
        <template
          v-for="node in display_rename"
          :key="node.origin"
        >
          <div>{{ node.origin }}</div>
          <div> {{ node.target }}</div>
        </template>
      </div>
    </q-scroll-area>
    <div
      class="q-gutter-md q-mx-sm" 
      bg="var-eb-bg"
      text="var-eb-fg"
      m="auto y-10 "
      w="fit"
    >
      <q-btn
        label="确定"
        @click="rename"
      />
      <q-btn
        label="取消"
        @click="emit('close')"
      />
    </div>
  </div>
</template>
