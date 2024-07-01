<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { FileNode } from './types'
import { mimetype } from '@/utils/path'
import { cover_setting } from '@/composables/cover_setting'
import { TREE } from '@/static'
import { useEPUB } from '@/stores/epub'
import { vMove } from '@/directives/v-move'

const cover_src = ref('')
const epub = useEPUB()
const images = computed(() => epub.nodes[TREE.IMAGE]?.children ?? [])

const si = ref(-1)

function seletct_cover(img: FileNode, i: number) {
    if (epub.has_src(img.id)) {
        cover_src.value = epub.image_srces[img.id]
    }
    else {
        cover_src.value = convertFileSrc(epub.base_path + img.id)
        epub.image_srces[img.id] = cover_src.value
    }
    si.value = i
}

function set_cover() {
    const img = images.value[si.value]
    if (img) {
        const id = img.id
        epub.set_cover(id)
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
        const manifest_id = file.name!
        const path = epub.manifest_path + epub.image_path + manifest_id
        const node = epub.nodes[TREE.IMAGE].children!.find(n => n.name === path)
        let has = false
        if (node) {
            has = true
        }
        else {
            epub.add_image(path)
        }
        await epub.add_file(file.path, manifest_id, epub.image_path + manifest_id, mimetype(file.path), has)
        epub.set_cover(epub.manifest_path + epub.image_path + manifest_id)
    }
    else {
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
  >
    <div 
      bg="var-eb-bg"
      text="var-eb-fg" 
      style="box-shadow:0 0 2px var(--eb-fg);"
      select-none
      w="80vw"
    >
      <q-bar v-move>
        <div>
          设置封面
        </div>
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
          visible
          h="50vh"
          flex="1"
        >
          <template
            v-for="(img, i) in images"
            :key="img.id"
          >
            <div
              m="y-5"
              p="x-5"
              :class="{ 'list-selection': true, 'selected': si === i }"
              @click="seletct_cover(img, i)"
              @dblclick="set_cover"
            >
              {{ img.id }}
            </div>
          </template>
        </q-scroll-area>
        <q-scroll-area
          visible
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
