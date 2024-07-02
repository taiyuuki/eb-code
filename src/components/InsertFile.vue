<script setup lang="ts">
import { vMove } from '@/directives/v-move'
import { insert_text } from '@/editor'
import { TREE } from '@/static'
import { useEPUB } from '@/stores/epub'
import { filename, relative } from '@/utils/path'

const emit = defineEmits<{
    (e: 'close'): void
}>()

const epub = useEPUB()
const tab = ref('image')
const tab_width = ref(80)
const list_width = ref(150)
const si = ref(-1)
const selected = ref('')

const files = computed(() => {
    switch (tab.value) {
        case 'image':
            return epub.nodes[TREE.IMAGE]?.children ?? []
        case 'audio':
            return epub.nodes[TREE.AUDIO]?.children ?? []
        case 'video':
            return epub.nodes[TREE.VIDEO]?.children ?? []
        default:
            return []
    }
})

function change_tab() {
    si.value = -1
    selected.value = ''
}

function select(id: string, i: number) {
    selected.value = id
    si.value = i
}

function insert() {
    if (selected.value) {
        const src = relative(selected.value, epub.current.id)
        const name = filename(selected.value)
        switch (tab.value) {
            case 'image':
                insert_text(`<img src="${src}" alt="${name}" />`)
                break
            case 'audio':
                insert_text(`<audio src="${src}" controls />`)
                break
            case 'video':
                insert_text(`<video src="${src}" controls />`)
                break
        }
        selected.value = ''
    }
    emit('close')
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
      <div>添加文件</div>
      <q-space />

      <q-btn
        v-close-popup
        dense
        flat
        icon="close"
      />
    </q-bar>
    <q-splitter
      v-model="tab_width"
      unit="px"
    >
      <template #before>
        <q-tabs
          v-model="tab"
          vertical
          @update:model-value="change_tab"
        >
          <q-tab
            name="image"
            icon="image"
            label="图片"
          />
          <q-tab
            name="audio"
            icon="audiotrack"
            label="音频"
          />
          <q-tab
            name="video"
            icon="videocam"
            label="视频"
          />
        </q-tabs>
      </template>

      <template #after>
        <q-splitter
          v-model="list_width"
          reverse
          :limits="[120, 300]"
          unit="px"
        >
          <template #before>
            <q-scroll-area
              visible
              h="50vh"
              flex="1"
            >
              <template
                v-for="(file, i) in files"
                :key="file.id"
              >
                <div
                  m="y-5"
                  p="x-5"
                  :class="{ 'list-selection': true, 'selected': si === i }"
                  @click="select(file.id, i)"
                  @dblclick="insert"
                >
                  {{ file.id }}
                </div>
              </template>
            </q-scroll-area>
          </template>
          <template #after>
            <q-scroll-area
              visible
              h="50vh"
            >
              <template v-if="selected">
                <InsertPreview :file="selected" />
              </template>
            </q-scroll-area>
          </template>
        </q-splitter>
      </template>
    </q-splitter>
    <div
      class="q-gutter-md q-mx-sm" 
      bg="var-eb-bg"
      text="var-eb-fg"
      m="auto y-10 "
      w="fit"
    >
      <q-btn
        label="确定"
        @click="insert"
      />
      <q-btn
        label="取消"
        @click="emit('close')"
      />
    </div>
  </div>
</template>
