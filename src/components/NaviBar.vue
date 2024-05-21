<template>
    <div w="60" p="10">
        <q-tabs vertical>
            <q-route-tab name="文件" to="/" exact>
                <div w="36" h="36" class="i-ic:baseline-folder" />
            </q-route-tab>
            <q-route-tab name="目录" to="/bookcontents" exact>
                <div w="36" h="36" class="i-ic:baseline-list-alt" />
            </q-route-tab>
            <q-route-tab name="搜索" to="/selectbar" exact>
                <div w="36" h="36" class="i-ic:baseline-search" />
            </q-route-tab>
        </q-tabs>
    </div>
</template>
