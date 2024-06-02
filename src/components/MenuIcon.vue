<script setup lang="ts">
import SvgIcon from '~virtual/svg-component'
import type { SvgName } from '~virtual/svg-component'

const props = defineProps<{ name: SvgName, disable?: boolean, tip: string }>()

const class_list = computed(() => {
    return {
        'menu-disable': props.disable,
        'menu-icon': true,
    }
})
</script>

<template>
  <div :class="class_list">
    <q-tooltip
      v-if="!disable"
      :delay="500"
    >
      {{ tip }}
    </q-tooltip>
    <svg-icon :name="name" />
  </div>
</template>

<style scoped>
.menu-icon {
    width: 30px;
    height: 30px;
    padding: 4px;
    margin: 2px 10px;
    border-radius: 5px;
    cursor: pointer;
    opacity: 0.8;
    background-color: #fff;
    box-shadow: 0 0 2px var(--eb-fg);
}

.menu-icon:hover {
    opacity: 1;
}

div.menu-disable {
    opacity: 0.4;
    pointer-events: none;
}
</style>
