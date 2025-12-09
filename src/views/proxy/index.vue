<template>
  <el-table class="h-full!" :data="config.proxies" stripe>
    <el-table-column prop="name" label="服务备注名" width="120px" />
    <el-table-column label="远程地址">
      <template #="{ row }: Scope">
        <a href="javascript:void 0" @click="copyString(formatUrl(row))">{{ formatUrl(row) }}</a>
      </template>
    </el-table-column>
    <el-table-column label="本地地址" :formatter="handleFormatLocalUrl" />
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

  <el-button class="absolute right-3 bottom-3 z-3" type="primary" @click="handleShowEdit(config.proxies?.length ?? 0)">添加</el-button>
  <edit v-model="showEdit" :data="config.proxies?.[editIndex]" @enter="handleSaveEdit" />
</template>

<style lang="scss" scoped>
:deep(.el-scrollbar__wrap) {
  padding-bottom: 50px;
}
</style>

<script lang="ts" setup>
import { ElMessage, ElMessageBox, RenderRowData } from 'element-plus';

import Edit from './edit.vue';

type Scope = RenderRowData<ProxyConfig>;

const showEdit = ref<boolean>(false);
const editIndex = ref<number>(-1);

function formatUrl(row: ProxyConfig) {
  if (row.type === 'http' || row.type === 'https' || row.type === 'tcpmux') {
    const urls: string[] = [];
    const path = row.plugin?.type === 'static_file' && row.plugin.stripPrefix ? `/${row.plugin.stripPrefix}/` : '';
    if (row.customDomains) urls.push(...row.customDomains.map(it => `${row.type}://${it}${path}`));
    if (row.subdomain) urls.push(`${row.type}://${row.subdomain}.${config.value.serverAddr ?? '-'}${path}`);
    return urls.length ? urls.join(', ') : '-';
  } else if (row.type === 'tcp' || row.type === 'udp') {
    return `${row.type}://${config.value.serverAddr ?? '-'}:${row.remotePort ?? '-'}`;
  } else {
    return `${row.type}://${row.localIP ?? '-'}:${row.localPort ?? '-'}`;
  }
}

function handleFormatLocalUrl(row: ProxyConfig) {
  if (!row.plugin) return `${row.localIP || '127.0.0.1'}:${row.localPort}`;
  if (row.plugin.type === 'http2https') return row.plugin.localAddr;
  if (row.plugin.type === 'https2http') return row.plugin.localAddr;
  if (row.plugin.type === 'https2https') return row.plugin.localAddr;
  if (row.plugin.type === 'http_proxy') return `${row.plugin.httpUser || '-'}@${row.plugin.httpPassword || '-'}`;
  if (row.plugin.type === 'socks5') return `${row.plugin.username || '-'}@${row.plugin.password || '-'}`;
  if (row.plugin.type === 'static_file') return row.plugin.localPath;
  if (row.plugin.type === 'unix_domain_socket') return row.plugin.unixPath;
  return '-';
}

function handleShowEdit(idx: number) {
  showEdit.value = true;
  editIndex.value = idx;
}

async function handleSaveEdit(_config: ProxyConfig) {
  config.value.proxies ||= [];
  const others = [
    ...(config.value.proxies ?? []),
    ...config.value.proxies.slice(0, editIndex.value),
    ...config.value.proxies.slice(editIndex.value + 1),
  ];

  const hasName = others.some(it => it.name === _config.name);
  if (hasName) return ElMessage.error(`配置：[${_config.name}] 已存在`);

  if (editIndex.value === config.value.proxies.length) {
    config.value.proxies.push(_config);
    switchStatus(_config.name, true);
  } else {
    const hasEnable = allStart.value.includes(config.value.proxies[editIndex.value].name);
    config.value.proxies[editIndex.value] = _config;
    switchStatus(_config.name, hasEnable);
  }
  showEdit.value = false;
}

async function hanldeDel(idx: number) {
  const res = await ElMessageBox.confirm('确定要删除吗').catch(e => e);
  if (res === 'cancel') return;
  switchStatus(config.value.proxies![idx].name, false);
  config.value.proxies!.splice(idx, 1);
}
</script>
