<template>
  <el-table class="proxy" :data="config.proxys" stripe>
    <el-table-column prop="_name" label="服务备注名" width="100px" />
    <el-table-column label="远程地址" :formatter="handleFormatRemoteUrl" />
    <el-table-column label="内网地址" width="150px">
      <template #="{ row }"> {{ `${row.local_ip}:${row.local_port}` }} </template>
    </el-table-column>
    <el-table-column label="开启加密" width="90px" align="center">
      <template #="{ row }"><el-checkbox :model-value="row.use_encryption" /></template>
    </el-table-column>
    <el-table-column label="开启压缩" width="90px" align="center">
      <template #="{ row }"><el-checkbox :model-value="row.use_compression" /></template>
    </el-table-column>
    <el-table-column label="操作" width="160px" align="center">
      <template #="{ row, $index }">
        <el-button type="primary" plain @click="handleShowEdit($index)">编辑</el-button>
        <el-button type="danger" plain @click="hanldeDel($index)">删除</el-button>
      </template>
    </el-table-column>
    <el-table-column label="启用/禁用" width="90px" align="center">
      <template #="{ row }">
        <el-switch size="large" v-model="row._enable" inline-prompt active-text="开" inactive-text="关" />
      </template>
    </el-table-column>
  </el-table>

  <el-button class="proxy__add" type="primary" @click="handldAdd">添加</el-button>
  <edit v-model="showEdit" :data="config.proxys[editIndex]" @enter="handleSaveEdit" />
</template>

<style lang="scss" scoped>
.proxy {
  height: 100%;

  :deep(.el-scrollbar__wrap) {
    padding-bottom: 50px;
  }

  &__group {
    display: flex;
    flex-wrap: wrap;
    padding-right: 20px;
    .el-form-item {
      width: 50%;
    }
  }

  &__add {
    position: absolute;
    z-index: 3;
    right: 10px;
    bottom: 10px;
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { config } from '../../config';

import Edit from './edit.vue';

const showEdit = ref<boolean>(false);
const editIndex = ref<number>(-1);

function handleFormatRemoteUrl(row: FrpcConfig.Proxy) {
  if (row.type === 'http' || row.type === 'https' || row.type === 'tcpmux') {
    const urls: string[] = [];
    if (row.custom_domains) urls.push(...row.custom_domains.split(',').map(it => `${row.type}://${it}`));
    if (row.subdomain) urls.push(`${row.type}://${row.subdomain}.${config.value.common?.server_addr ?? 'unconfig'}`);
    return urls.length ? urls.join(', ') : '-';
  } else if (row.type === 'tcp' || row.type === 'udp') {
    return `${row.type}://${config.value.common?.server_addr ?? 'unconfig'}:${row.remote_port ?? 'random'}`;
  }
  return '';
}

function handleShowEdit(idx: number) {
  showEdit.value = true;
  editIndex.value = idx;
}

async function handleSaveEdit(_config: FrpcConfig.Proxy) {
  const others = config.value.proxys.slice(0, editIndex.value).concat(config.value.proxys.slice(editIndex.value + 1));
  const hasName = others.some(it => it._name === _config._name);
  if (hasName) return ElMessage.error(`配置：[${_config._name}] 已存在`);

  if (_config.type === 'http' || _config.type === 'https' || _config.type === 'tcpmux') {
    if (!(_config.custom_domains || _config.subdomain)) return ElMessage.error('自定义域名和子域名两者必须配置一个');
  }

  config.value.proxys[editIndex.value] = _config;
  showEdit.value = false;
}

function handldAdd() {
  handleShowEdit(config.value.proxys.length);
}

async function hanldeDel(idx: number) {
  const res = await ElMessageBox.confirm('确定要删除吗').catch(e => e);
  if (res === 'cancel') return;
  config.value.proxys.splice(idx, 1);
}
</script>
