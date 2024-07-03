<script setup lang="ts">
import { useRecent } from '@/stores/recent'

const emit = defineEmits<{
    (event: 'open'): void
    (event: 'create', version: number): void
    (event: 'recent', path: string): void
}>()

const recent = useRecent()
</script>

<template>
  <div
    h="100vh"
    w="100vw"
    m="t-5%"
  >
    <h1>Ebook Code</h1>
    
    <h2>开始</h2>
    <div
      w="560"
      m="auto"
    >  
      <div
        class="button-link q-gutter-sm"
        @click="emit('open')"
      >
        <div class="i-codicon:new-folder" />
        <div>打开文件</div>
      </div>

      <div
        class="button-link q-gutter-sm"
        @click="emit('create', 2)"
      >
        <div class="i-codicon:new-file" />
        <div>新建EPUB2</div>
      </div>
      <div
        class="button-link q-gutter-sm"
        @click="emit('create', 3)"
      >
        <div class="i-codicon:new-file" />
        <div>新建EPUB3</div>
      </div>
    </div>

    <h2
      v-if="recent.list.length"
      flex="~ items-center"
    >
      <div>最近打开</div>
      <div
        class="i-codicon:trash clean-icon"
        title="清除最近打开"
        @click="recent.clean"
      />
    </h2> 
    
    <div
      v-if="recent.list.length"
      w="560"
      m="auto"
    >
      <div
        v-for="path in recent.list"
        :key="path"
        class="button-link q-gutter-sm"
        @click="emit('recent', path)"
      >
        <div class="i-codicon:history" />
        <div>{{ path }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
    text-align: center;
    font-size: 50px;
    font-weight: 600;
    color: var(--vscode-foreground);
    opacity: 0.8;
    user-select: none;
}

h2 {
    text-align: center;
    font-size: 30px;
    font-weight: 600;
    margin: 15px auto;
    width: fit-content;
    color: var(--vscode-foreground);
    opacity: 0.8;
    user-select: none;
}

.clean-icon {
  width: 20px;
  height: 20px;
  margin-left: 5px;
  opacity: 0.5;
  cursor: pointer;
}

.clean-icon:hover {
  background-color: var(--vscode-textLink-activeForeground);
  opacity: 1;
}

.button-link {
    color: var(--vscode-textLink-foreground);
    user-select: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 20px;
    opacity: 0.6;
    width: fit-content;
}

.button-link:hover {
    color: var(--vscode-textLink-activeForeground);
    opacity: 1;
}
</style>
