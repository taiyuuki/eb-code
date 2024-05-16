<script setup lang="ts">
import { useQuasar } from 'quasar'
import { object_keys } from '@taiyuuki/utils'
import { convertFileSrc } from '@tauri-apps/api/core'
import type { FileNode } from './types'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'
import { TREE } from '@/static'

const _META_KEY: Record<string, string> = {
    'dc:title': '书名',
    'dc:creator': '作者',
    'dc:language': '语言',
    'dc:subject': '主题',
    'dc:coverage': '地区',
    'dc:relation': '关联',
    'dc:rights': '版权',
    'dc:source': '来源',
    'dc:publisher': '出版社',
    'dc:contributor': '创作者',
    'dc:format': '格式',
    'dc:type': '类型',
    'dc:identifier': 'ID',
    'dc:description': '描述',
    'dc:date': '日期',
}

const _META_PROPERTY: Record<string, string> = {
    'role': '角色',
    'identifier': 'ID',
    'file-as': '别名',
    'display-seq': '顺序',
    'collection-type': '合集、系列',
}

const meta_items = object_keys(_META_KEY).map(t => {
    return {
        label: _META_KEY[t],
        value: t,
    }
})

const meta_property_items = object_keys(_META_PROPERTY).map(t => {
    return {
        label: _META_PROPERTY[t],
        value: t,
    }
})

const $q = useQuasar()
const cover_src = ref('')

const status = useStatus()
const theme = useTheme()

const images = computed(() => status.nodes[TREE.IMAGE]?.children)

const selections = ref([...images.value ? images.value.map(_ => false) : []])

const thumb_style = {
    width: '14px',
    background: 'var(--vscode-scrollbarSlider-activeBackground)',
    borderRadius: '0',
}

function add_meta() {
    $q.dialog({
        title: '添加元数据',
        options: {
            type: 'checkbox',
            model: [],
            items: meta_items,
        },
        dark: theme.dark,
        ok: '添加',
        cancel: '取消',
    }).onOk(data => {

        data.forEach((t: string) => {
            status.add_meta(t, '[点我修改属性值]')
        })
    })
}

function add_meta_child(item: Record<string, any>) {
    $q.dialog({
        title: '添加元数据属性',
        options: {
            type: 'checkbox',
            model: [],
            items: meta_property_items,
        },
        dark: theme.dark,
        ok: '添加',
        cancel: '取消',
    }).onOk(data => {

        data.forEach((t: string) => {
            status.add_meta_child(item, t, '[点我修改属性值]')
        })
    })
}

function save_meta() {
    status.save_meta()
}

const cover_setting = ref(false)

function seletct_cover(img: FileNode, i: number) {
    if (status.has_src(img.id)) {
        cover_src.value = status.image_srces[img.id]
    } else {
        cover_src.value = convertFileSrc(status.base_path + img.id)
        status.image_srces[img.id] = cover_src.value
    }
    selections.value.fill(false)
    selections.value[i] = true
}
function clean_selections() {
    cover_src.value = ''
    selections.value.fill(false)
}
</script>

<template>
  <div h="100%">
    <div
      flex="~ nowrap"
      p="l-20"
      style="height: calc(100% - 150px);"
      class="q-gutter-md"
      m="0"
    >
      <div
        h="100%"
        flex="1"
      >
        <img
          v-show="status.cover_src !== ''"
          w="100%"
          h="100%"
          obj-contain
          :src="status.cover_src"
          alt="cover"
        >
      </div>
      <div flex="2">
        <q-scroll-area
          :thumb-style="thumb_style"
          style="height: 100%;"
          :dark="theme.dark"
        >
          <template
            v-for="item in status.metadata"
            :key="item.r_id"
          >
            <MetaItem
              :item="item"
              :meta="_META_KEY"
              :property="_META_PROPERTY"
              @remove="status.remove_meta(item)"
              @remove-child="status.remove_meta_child"
              @add-child="add_meta_child"
            />
          </template>
        </q-scroll-area>
      </div>
    </div>
    <div
      w="fit"
      m="auto"
      class="q-gutter-md"
    >
      <q-btn
        label="设置封面"
        @click="cover_setting = true"
      /> 
      <q-btn
        label="添加元数据"
        @click="add_meta"
      />
      <q-btn
        label="保存元数据"
        @click="save_meta"
      />
    </div>
    <q-dialog
      v-model="cover_setting"
      no-backdrop-dismiss
      no-shake
      @hide="clean_selections"
    >
      <div 
        bg="var-eb-bg"
        text="var-eb-fg" 
        select-none
        w="70vw"
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
            :thumb-style="thumb_style"
            :dark="theme.dark"
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
            :thumb-style="thumb_style"
            :dark="theme.dark"
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
          <q-btn label="打开文件" />
          <q-btn label="确定" />
          <q-btn
            label="取消"
            @click="cover_setting = false"
          />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<style scoped>
.selected {
    background: var(--vscode-toolbar-activeBackground);
}
</style>
