<script setup lang="ts">
import { useQuasar } from 'quasar'
import { object_keys } from '@taiyuuki/utils'
import { useStatus } from '@/stores/status'
import { useTheme } from '@/stores/theme'

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

const status = useStatus()
const theme = useTheme()

const thumb_style = {
    width: '14px',
    background: 'var(--vscode-scrollbarSlider-hoverBackground)',
    borderRadius: '0',
}

function prompt() {
    $q.dialog({
        title: '添加元数据',
        options: {
            type: 'checkbox',
            model: [],
            items: meta_items,
        },
        cancel: true,
        persistent: true,
        dark: theme.dark,
    }).onOk(data => {

        data.forEach((t: string) => {
            status.add_meta(t, '[点我修改属性值]')
        })
    })
}

function add_child(item: Record<string, any>) {
    $q.dialog({
        title: '添加元数据属性',
        options: {
            type: 'checkbox',
            model: [],
            items: meta_property_items,
        },
        cancel: true,
        persistent: true,
        dark: theme.dark,
    }).onOk(data => {

        data.forEach((t: string) => {
            status.add_meta_child(item, t, '[点我修改属性值]')
        })
    })
}

function save_meta() {
    status.save_meta()
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
              @add-child="add_child"
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
      <q-btn label="设置封面" /> 
      <q-btn
        label="添加元数据"
        @click="prompt"
      />
      <q-btn
        label="保存元数据"
        @click="save_meta"
      />
    </div>
  </div>
</template>
