<template>
  <el-table class="h-full!" :data="config.visitors" stripe>
    <el-table-column prop="name" label="访问者名称" width="120px" />
    <el-table-column label="本地地址">
      <template #="{ row }: Scope">
        <a href="javascript:void 0" @click="copyString(formatUrl(row))">{{ formatUrl(row) }}</a>
      </template>
    </el-table-column>
    <el-table-column label="代理名称" prop="serverName" />
    <el-table-column label="开启加密" width="82px" align="center">
      <template #="{ row }: Scope"><el-checkbox :model-value="row.transport?.useEncryption" /></template>
    </el-table-column>
    <el-table-column label="开启压缩" width="82px" align="center">
      <template #="{ row }: Scope"><el-checkbox :model-value="row.transport?.useCompression" /></template>
    </el-table-column>
    <el-table-column label="操作" width="160px" align="center">
      <template #="{ $index }: Scope">
        <el-button type="primary" plain @click="handleShowEdit($index)">编辑</el-button>
        <el-button type="danger" plain @click="hanldeDel($index)">删除</el-button>
      </template>
    </el-table-column>
    <el-table-column label="启用/禁用" width="90px" align="center">
      <template #="{ row }: Scope">
        <el-switch
          size="large"
          :model-value="allStart.includes(row.name)"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @update:model-value="switchStatus(row.name, Boolean($event))"
        />
      </template>
    </el-table-column>
  </el-table>

  <el-button class="absolute right-3 bottom-3 z-3" type="primary" @click="handleShowEdit(config.visitors?.length ?? 0)">添加</el-button>
  <edit v-model="showEdit" :data="config.visitors?.[editIndex]" @enter="handleSaveEdit" />
</template>

<style lang="scss" scoped>
:deep(.el-scrollbar__wrap) {
  padding-bottom: 50px;
}
</style>

<script lang="ts" setup>
import { ElMessage, ElMessageBox, RenderRowData } from 'element-plus';

import Edit from './edit.vue';

type Scope = RenderRowData<VisitorConfig>;

const showEdit = ref<boolean>(false);
const editIndex = ref<number>(-1);

function formatUrl(row: VisitorConfig) {
  return `${row.type}://${row.bindAddr || '127.0.0.1'}:${row.bindPort ?? '-'}`;
}

function handleShowEdit(idx: number) {
  showEdit.value = true;
  editIndex.value = idx;
}

async function handleSaveEdit(_config: VisitorConfig) {
  config.value.visitors ||= [];
  const others = [
    ...(config.value.proxies ?? []),
    ...config.value.visitors.slice(0, editIndex.value),
    ...config.value.visitors.slice(editIndex.value + 1),
  ];

  const hasName = others.some(it => it.name === _config.name);
  if (hasName) return ElMessage.error(`配置：[${_config.name}] 已存在`);

  if (editIndex.value === config.value.visitors.length) {
    config.value.visitors.push(_config);
    switchStatus(_config.name, true);
  } else {
    const hasEnable = allStart.value.includes(config.value.visitors[editIndex.value].name);
    config.value.visitors[editIndex.value] = _config;
    switchStatus(_config.name, hasEnable);
  }
  showEdit.value = false;
}

async function hanldeDel(idx: number) {
  const res = await ElMessageBox.confirm('确定要删除吗').catch(e => e);
  if (res === 'cancel') return;
  switchStatus(config.value.visitors![idx].name, false);
  config.value.visitors!.splice(idx, 1);
}
</script>
