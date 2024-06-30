<template>
  <div class="navi">
    <q-tabs vertical>
      <q-route-tab
        name="文件"
        to="/"
        exact
      >
        <div
          w="36"
          h="36"
          class="i-ic:baseline-folder"
        />
      </q-route-tab>
      <q-route-tab
        name="目录"
        to="/contents"
        exact
      >
        <div
          w="36"
          h="36"
          class="i-ic:baseline-list-alt"
        />
      </q-route-tab>
      <q-route-tab
        name="搜索"
        to="/search"
        exact
      >
        <div
          w="36"
          h="36"
          class="i-ic:baseline-search"
        />
      </q-route-tab>
      <q-route-tab
        name="设置"
        to="/option"
        exact
      >
        <div
          w="36"
          h="36"
          class="i-ic:baseline-settings"
        />
      </q-route-tab>
    </q-tabs>
  </div>
</template>

<style scoped>
.navi {
  color: var(--vscode-menu-foreground);
  width: 60px;
  padding: 0;
  background-color: var(--vscode-menu-background);
  border-width: 0 1px 0 0;
  border-style: solid;
  border-color: var(--vscode-textSeparator-foreground);
}
</style>
