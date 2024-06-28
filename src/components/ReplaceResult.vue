<script setup lang="ts">
import * as Diff from 'diff'
import { escape_regexp } from '@/utils'

const props = defineProps<{
    text: string,
    patten: string,
    replace: string,
    regexp: boolean,
    sensitive: boolean,
    dot: boolean,
    multiline: boolean
    greedy: boolean,
    diffMode: 1 | 2 | 3 | 4
}>()
const emit = defineEmits<{
    (e: 'regexp-error', text: string): void
}>()

const flag = computed(() => {
    let flag = 'g'
    if (props.sensitive) { 
        flag += 'i'
    }
    if (props.dot) {
        flag += 's'
    }
    if (props.multiline) {
        flag += 'm'
    }
    if (props.greedy) {
        flag += 'u'
    }

    return flag
})

const computed_result = computed<string>(() => {
    try {
        if (props.regexp) {
            const reg = new RegExp(props.patten, flag.value)

            return props.text.replace(reg, props.replace)
        
        }
        else if (props.sensitive) {
            return props.text.replaceAll(props.patten, props.replace)
        }
        else {
            const reg = new RegExp(escape_regexp(props.patten), 'gi')
        
            return props.text.replace(reg, escape_regexp(props.replace))
        }
    }
    catch(_) {
        emit('regexp-error', props.patten)
    }

    return props.text
})

const diff = computed(() => {
    switch (props.diffMode) {
        case 1:
            return Diff.diffWords(props.text, computed_result.value)
        case 2:
            return Diff.diffLines(props.text, computed_result.value)
        case 3:
            return [{ added: false, removed: false, value: props.text }]
        case 4:
            return [{ added: true, removed: false, value: computed_result.value }]
        default:
            return [{ added: false, removed: false, value: props.text }]

    } 
})
</script>

<template>
  <span
    v-for="part in diff"
    :key="part.value"
  >
    <span
      v-if="part.added"
      text="green bold"
    >
      {{ part.value }}
    </span>
    <del
      v-else-if="part.removed"
      text="red bold"
    >
      {{ part.value }}
    </del>
    <span
      v-else
      text="var-eb-fg"
    >
      {{ part.value }}
    </span>
  </span>
</template>

