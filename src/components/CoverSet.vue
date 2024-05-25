<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { FileNode } from './types'
import { mimetype } from '@/utils/path'
import { cover_setting } from '@/composables/cover_setting'
import { TREE } from '@/static'
import { useStatus } from '@/stores/status'

const cover_src = ref('')
const status = useStatus()
const images = computed(() => status.nodes[TREE.IMAGE]?.children ?? [])

const selections = ref([...images.value ? images.value.map(_ => false) : []])
let si = -1

function seletct_cover(img: FileNode, i: number) {
    if (status.has_src(img.id)) {
        cover_src.value = status.image_srces[img.id]
    } else {
        cover_src.value = convertFileSrc(status.base_path + img.id)
        status.image_srces[img.id] = cover_src.value
    }
    selections.value.fill(false)
    selections.value[i] = true
    si = i
}
function clean_selections() {
    cover_src.value = ''
    selections.value.fill(false)
}
function set_cover() {
    const img = images.value[si]
    if (img) {
        const id = img.id
        status.set_cover(id)
    }
    cover_setting.value = false
}
async function open_cover() {
    const file = await open({
        title: '选择封面',
        filters: [
            { name: 'Image', extensions: ['jpg', 'png', 'svg', 'webp', 'avif', 'gif', 'ico', 'bmp', 'tif', 'tiff', 'svgz'] },
        ],
    })
    if (file) {
        const name = file.name!
        const path = status.manifest_path + status.image_path + name
        const node = status.nodes[TREE.IMAGE].children!.find(n => n.name === path)
        let has = false
        if (node) {
            has = true
        } else {
            status.add_image(path)
        }
        await status.add_file(file.path, name, status.image_path + name, mimetype(file.path), has)
        status.set_cover(status.manifest_path + status.image_path + name)
    } else {
        return
    }
    cover_setting.value = false
}
</script>

<template>
  <q-dialog
    v-model="cover_setting"
    no-backdrop-dismiss
    no-shake
    shadow
    @hide="clean_selections"
  >
    <div 
      bg="var-eb-bg"
      text="var-eb-fg" 
      style="box-shadow:0 0 2px var(--eb-fg);"
      select-none
      w="80vw"
    >
      <q-bar>
        <div>设置封面</div>
        <q-space />

        <q-btn
          v-close-popup
          dense
          flat
          icon="close"
        />
      </q-bar>
      <div
        flex="~"
      >
        <q-scroll-area
          h="50vh"
          flex="1"
        >
          <template
            v-for="(img, i) in images"
            :key="img.id"
          >
            <div
              hover="bg-var-vscode-toolbar-hoverBackground"
              m="y-5"
              p="x-5"
              :class="{ selected: selections[i] }"
              @click="seletct_cover(img, i)"
            >
              {{ img.id }}
            </div>
          </template>
        </q-scroll-area>
        <q-scroll-area
          w="300"
          h="50vh"
        >
          <img
            v-show="cover_src !== ''"
            :src="cover_src"
            w="100%"
            obj-contain
            alt="cover"
          >
        </q-scroll-area>
      </div>
      <div
        class="q-gutter-md q-mx-sm" 
        bg="var-eb-bg"
        text="var-eb-fg"
        m="auto y-10 "
        w="fit"
      >
        <q-btn
          label="确定"
          @click="set_cover"
        />
        <q-btn
          label="取消"
          @click="cover_setting = false"
        />
        <q-btn
          m="l-50"
          label="打开文件"
          @click="open_cover"
        />
      </div>
    </div>
  </q-dialog>
</template>
