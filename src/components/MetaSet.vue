<script setup lang="ts">
import { arr_remove, object_keys } from '@taiyuuki/utils'
import { useStatus } from '@/stores/status'
import { cover_setting } from '@/composables/cover_setting'
import { dirty_meta } from '@/composables/dirty_meta'

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

const meta_selections = reactive(object_keys(_META_KEY).reduce((r, k) => {
    r[k] = false

    return r
}, {} as Record<string, boolean>))
const meta_property_selections = reactive(object_keys(_META_PROPERTY).reduce((r, k) => {
    r[k] = false

    return r
}, {} as Record<string, boolean>))

const meta_dialog = ref(false)
const meta_property_dialog = ref(false)

// const meta_items = object_keys(_META_KEY).map(t => {
//     return {
//         label: _META_KEY[t],
//         value: t,
//     }
// })

const status = useStatus()

onMounted(() => {
    Object.assign(dirty_meta.value, status.metadata)
})

onBeforeUnmount(async() => {
    if (status.meta_is_dirty) {
        status.$patch({ metadata: dirty_meta.value })

        // Object.assign(status.metadata, dirty_meta.value)
        status.save_meta()
        status.meta_is_dirty = false
    }
})

function add_meta() {
    object_keys(meta_selections).forEach(t => {
        if (meta_selections[t]) {
            status.add_meta(t, '[点我修改属性值]')

            meta_selections[t] = false
        }
    })

    meta_dialog.value = false
}

let temp_meta_item: Record<string, any>
function add_child(item: Record<string, any>) {
    temp_meta_item = item
    meta_property_dialog.value = true
}

function add_meta_property() {

    object_keys(meta_property_selections).forEach(t => {
        if (meta_property_selections[t]) {
            status.add_meta_child(temp_meta_item, t, '[点我修改属性值]')

            meta_property_selections[t] = false
        }
    })
    meta_property_dialog.value = false
}

function remove_meta_item(item: Record<string, any>) {
    arr_remove(dirty_meta.value, item)
    status.$patch({ metadata: dirty_meta.value })
    status.save_meta()
}

function remove_meta_child(item: Record<string, Record<string, any>[]>, child: Record<string, any>) {
    if (item.children) {
        arr_remove(item.children, child)
        status.$patch({ metadata: dirty_meta.value })
        status.save_meta()
    }
}

function meta_changed() {
    status.meta_is_dirty || (status.meta_is_dirty = true)
}
</script>

<template>
  <div h="95%">
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
          visible
          style="height: 100%;"
        >
          <template
            v-for="item in dirty_meta"
            :key="item.r_id"
          >
            <MetaItem
              :item="item"
              :meta="_META_KEY"
              :property="_META_PROPERTY"
              @remove="remove_meta_item"
              @remove-child="remove_meta_child"
              @add-child="add_child"
              @updata:item="meta_changed"
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
        @click="meta_dialog = true"
      />
    </div>
  </div>
  <q-dialog
    v-model="meta_dialog"
    no-backdrop-dismiss
    no-shake
    shadow
  >
    <div
      bg="var-eb-bg"
      text="var-eb-fg"
      h="65vh"
      w="80vw"
      select-none
    >
      <q-bar>
        <div>元数据设置</div>
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
          v-for="(text, key) in _META_KEY"
          :key="key"
        >
          <q-checkbox
            v-model="meta_selections[key]"
            size="xs"
            :label="text"
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
          @click="add_meta"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="取消"
          @click="meta_dialog = false"
        />
      </div>
    </div>
  </q-dialog>

  <q-dialog
    v-model="meta_property_dialog"
    no-backdrop-dismiss
    no-shake
    shadow
  >
    <div
      bg="var-eb-bg"
      text="var-eb-fg"
      h="65vh"
      w="80vw"
      select-none
    >
      <q-bar>
        <div>添加属性</div>
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
          v-for="(text, key) in _META_PROPERTY"
          :key="key"
        >
          <q-checkbox
            v-model="meta_property_selections[key]"
            size="xs"
            :label="text"
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
          @click="add_meta_property"
        />
        <q-btn
          pst="abs r-10 b-10"
          label="取消"
          @click="meta_property_dialog = false"
        />
      </div>
    </div>
  </q-dialog>
</template>
