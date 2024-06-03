<script setup lang="ts">
const props = defineProps<{ item: Record<string, any>, meta: Record<string, string>, property: Record<string, string> }>()
const emit = defineEmits<{
    (e: 'updata:item', item: Record<string, any>): void
    (e: 'remove', item: Record<string, any>): void
    (e: 'remove-child', item: Record<string, any>, child: Record<string, any>): void
    (e: 'add-child', item: Record<string, any>): void
}>()
const is_dc = computed(() => {
    return props.item.tagName.startsWith('dc')
})
const has_property = computed(() => {
    return 'property' in props.item
})
const has_id = computed(() => {
    return 'id' in props.item
})
const has_children = computed(() => {
    return 'children' in props.item || has_id
})
const meta_name = computed(() => {
    return props.item.tagName in props.meta ? props.meta[props.item.tagName] : props.item.tagName
})
const item_class = computed(() => {
    return {
        'selected': props.item.selected,
        'meta-item': true,
    }
})
function edit_meta(e: Event, item: Record<string, any>) {
    const target = e.target as HTMLElement
    item.textContent = target.textContent
    emit('updata:item', item)
}
</script>

<template>
  <div
    v-if="is_dc || has_property"
    :class="item_class"
  >
    <template v-if="is_dc">
      <div
        flex="~ justify-start items-center"
        class="q-gutter-x-sm item-visible"
        :title="item.tagName"
      >
        <div>
          {{ meta_name }}:
        </div>
        <div
          contenteditable="true"
          @input="edit_meta($event, item)"
        >
          {{ item.textContent }}
        </div>  
        <div
          title="新增属性"
          class="i-ic:round-post-add"
          pointer
          @click="emit('add-child', item)"
        />
        <div
          title="删除"
          class="i-ic:baseline-delete"
          pointer
          @click="emit('remove', item)"
        />
      </div>
      <template v-if="has_children">
        <div
          v-for="child in item.children"
          :key="child.r_id"
          m="l-30"
        >
          <div
            flex="~ justify-start items-center"
            class="q-gutter-x-sm item-visible"
            :title="child.property"
          >
            <div>{{ 'property' in child ? property[child.property] ?? child.property : child.tagName }}:</div>
            <div
              contenteditable="true"
              @input="edit_meta($event, child)"
            >
              {{ child.textContent }}
            </div>
            <div
              title="删除"
              class="i-ic:baseline-delete"
              pointer
              @click="emit('remove-child', item, child)"
            />
          </div>
        </div>
      </template>
    </template>
    <template v-else-if="has_property">
      <div
        flex="~ justify-start items-center"
        class="q-gutter-x-sm item-visible"
        :title="item.property"
      >
        <div>{{ item.property }}:</div>
        <div
          contenteditable="true"
          @input="edit_meta($event, item)"
        >
          {{ item.textContent }}
        </div>
        <div
          title="新增属性"
          class="i-ic:round-post-add"
          pointer
          @click="emit('add-child', item)"
        />
        <div
          title="删除"
          class="i-ic:baseline-delete"
          pointer
          @click="emit('remove', item)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.meta-item {
  padding: 5px 10px;
  white-space: nowrap;
}
.meta-item > div:hover {
  background-color: var(--vscode-editor-selectionBackground);
}
.item-visible > .i-ic\:baseline-delete {
  visibility: hidden;
}
.item-visible:hover > .i-ic\:baseline-delete {
  visibility: visible;
}
.item-visible > .i-ic\:round-post-add {
  visibility: hidden;
}
.item-visible:hover > .i-ic\:round-post-add {
  visibility: visible;
}
.selected > div {
  background-color: var(--vscode-editor-selectionBackground);
}
</style>
