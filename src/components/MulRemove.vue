<script setup lang="ts">
import { ask } from '@tauri-apps/plugin-dialog'
import { useEPUB } from '@/stores/epub'
import { TREE } from '@/static'
import { vMove } from '@/directives/v-move'
import { useTheme } from '@/stores/theme'

const epub = useEPUB()
const theme = useTheme()
const htmls = ref<[string, boolean][]>(epub.nodes[TREE.HTML]?.children?.map(n => [n.id, false]) ?? [])
const select_all = ref(false)

const emit = defineEmits<{
    (e: 'close'): void
}>()

watch(() => select_all.value, () => {
    htmls.value.forEach(n => n[1] = select_all.value)
})

async function remove() {
    const conf = await ask('确定要删除所选文件吗？', {
        title: '确认',
        okLabel: '是',
        cancelLabel: '取消',
    })
    if (conf) {
        htmls.value.forEach(n => {
            if (n[1]) {
                epub.remove_file_by_id(n[0], true)
            }
        })
        await epub.save_guide()
        emit('close')
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
      <div>批量删除</div>
      <q-space />

      <q-btn
        v-close-popup
        dense
        flat
        icon="close"
      />
    </q-bar>

    <div>
      <q-checkbox
        v-model="select_all"
        :dark="theme.dark"
        label="全选"
      />
    </div>
    <q-scroll-area
      visible
      h="50vh"
    >
      <template
        v-for="node in htmls"
        :key="node[0]"
      >
        <div m="t-2">
          <q-checkbox
            v-model="node[1]"
            :dark="theme.dark"
            :label="node[0]"
          />
        </div>
      </template>
    </q-scroll-area>
    <div
      class="q-gutter-md q-mx-sm" 
      bg="var-eb-bg"
      text="var-eb-fg"
      m="auto y-10 "
      w="fit"
    >
      <q-btn
        label="删除"
        @click="remove"
      />
      <q-btn
        label="取消"
        @click="emit('close')"
      />
    </div>
  </div>
</template>
