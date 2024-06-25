<script setup lang="ts">
import { str_random } from '@taiyuuki/utils'
import { escape_regexp } from '@/utils'

const props = defineProps<{
    text: string,
    patten: string,
    replace: string,
    regexp: boolean,
    sensitive: boolean,
    dot: boolean,
    multiline: boolean
    greedy: boolean
}>()
const emit = defineEmits<{
    (e: 'regexp-error', text: string): void
}>()
const S = `#d#${str_random(5, 36)}`

let replace_result: [string, boolean?][] = [[props.text]]

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

const computed_result = computed<[string, boolean?][]>(() => {
    try {
        if (props.replace.trim() === '') {
            replace_result = [[props.text]]
        }
        else if (props.regexp) {
            const reg = new RegExp(props.patten, flag.value)
            const matches = reg.exec(props.text)
            if (matches) {
                replace_result = props.text.replace(reg, `${S}${matches[0]}${S}${props.replace}`).split(S)
                    .map((m, i) => {
                        if (i % 2 === 1) {
                            return [m, true]
                        }
                        else {
                            return [m]
                        }
                    })
            }
            else {
                replace_result = [[props.text]]
            }
        
        }
        else if (props.sensitive) {
            replace_result = props.text.replaceAll(props.patten, `${S}${props.patten}${S}${props.replace}`).split(S)
                .map((m, i) => {
                    if (i % 2 === 1) {
                        return [m, true]
                    }
                    else {
                        return [m]
                    }
                })
        }
        else {
            const reg = new RegExp(escape_regexp(props.patten), 'gi')
        
            replace_result = props.text.replace(reg, `${S}${props.patten}${S}${escape_regexp(props.replace)}`).split(S)
                .map((m, i) => {
                    if (i % 2 === 1) {
                        return [m, true]
                    }
                    else {
                        return [m]
                    }
                })
        }
    }
    catch(_) {
        emit('regexp-error', props.patten)
    }

    return replace_result
})
</script>

<template>
  <span
    v-for="(m, i) in computed_result"
    :key="i"
  >
    <span
      v-if="m[1]"
    >
      <del
        bg="var-eb-fg"
        text="var-eb-bg"
      >{{ m[0] }}</del> 
    </span>
    <span v-else>
      {{ m[0] }}
    </span>
  </span>
</template>
