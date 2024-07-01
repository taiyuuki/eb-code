<script setup lang="ts">
import { arr_remove, key_in } from '@taiyuuki/utils'
import { SSV } from '@/static'
import type { FileNode } from '@/components/types'
import { useEPUB } from '@/stores/epub'
import { vMove } from '@/directives/v-move'
import { useActivity } from '@/composables/useActivity'

const props = defineProps<{ node: FileNode }>()
const emit = defineEmits<{ (e: 'complate'): void }>()
const activity_node = useActivity()

const epub = useEPUB()

const semantic = ref('')

const find_semantic = epub.guide.find(g => g.id === props.node.id)

if (find_semantic) {
    semantic.value = find_semantic.type
}

async function set_semantic() {
    const cur = epub.guide.find(g => g.type === semantic.value)
    if (cur && cur.id !== props.node.id) {
        arr_remove(epub.guide, cur)
    }
    if (key_in(semantic.value, SSV)) {
        if (find_semantic) {
            find_semantic.type = semantic.value
            find_semantic.title = SSV[semantic.value]
        }
        else {
            epub.add_to_guide(props.node, semantic.value)
        }
        await epub.save_guide()
        if (
            epub.nav_version === 2 && epub.current.id === epub.opf_id
            || epub.nav_version === 3 && activity_node.opened_node?.type === 'navigation'
        ) {
            epub.reload_current()
        }
    }
    emit('complate')
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
      <div>添加语义</div>
      <q-space />

      <q-btn
        v-close-popup
        dense
        flat
        icon="close"
      />
    </q-bar>
    <q-scroll-area h="50vh">
      <div
        v-for="(s, k) in SSV"
        :key="k"
      >
        <q-radio
          v-model="semantic"
          :val="k"
          :label="s"
        />
      </div>
    </q-scroll-area>
    <div
      pst="rel"
      p="10"
      h="80"
    >
      <q-btn
        pst="abs r-80 b-10"
        label="确定"
        @click="set_semantic"
      />
      <q-btn
        pst="abs r-10 b-10"
        label="取消"
        @click="emit('complate')"
      />
    </div>
  </div>
</template>
