<template>
  <div class="main">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="basis"><tab-basis-settings ref="basisSettingsRef" /></el-tab-pane>
      <el-tab-pane label="其他设置" name="other"><tab-other-settings ref="otherSettingsRef" /></el-tab-pane>
      <el-tab-pane label="服务列表" name="proxy"><tab-proxy /></el-tab-pane>
      <el-tab-pane label="日志" name="log"><tab-logs :logs="logs" @clean="handleCleanLogs" /></el-tab-pane>
    </el-tabs>
    <div class="main__btns--left">
      <p>Frpc Version: {{ frpcVersion || 'none' }}</p>
      <el-button type="success" link @click="showDownloadFrpc = true">{{ frpcVersion ? '检查更新' : '下载 Frpc' }}</el-button>
    </div>
    <div class="main__btns--right">
      <el-switch
        size="large"
        :model-value="runing"
        :disabled="!haveFrpcBinFile"
        inline-prompt
        active-text="开"
        inactive-text="关"
        @change="handleRun"
        :loading="loadings.run"
      />
      <el-button :disabled="!changed" type="success" @click="handleSave">保存</el-button>
      <el-button :disabled="!changed" type="info" @click="handleReset">复位</el-button>
    </div>
    <download v-model="showDownloadFrpc" @success="initFrpc" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  position: relative;
  height: 100%;
  :deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;
    .el-tabs__header {
      flex-shrink: 0;
      margin: 0;
      .el-tabs__item {
        padding: 0 20px;
      }
    }
    .el-tabs__content {
      flex: 1;
      overflow: hidden;
      .el-tab-pane {
        height: 100%;
      }
    }
  }

  &__btns,
  &__btns {
    &--left,
    &--right {
      position: absolute;
      left: 10px;
      bottom: 5px;
      display: flex;
      align-items: center;
      height: 40px;
      > *:not(:first-child) {
        margin-left: 12px;
      }
    }
    &--right {
      left: unset;
      right: 10px;
    }
  }
}
</style>

<script setup lang="ts">
import * as jsIni from 'js-ini';
import { useDark } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { isEqual, cloneDeep } from 'lodash';
import { computed, onMounted, reactive, ref } from 'vue';

import TabBasisSettings from './views/basis-settings/index.vue';
import TabOtherSettings from './views/other-settings/index.vue';
import TabProxy from './views/proxy/index.vue';
import TabLogs from './views/logs/index.vue';

import Dowload from './components/download.vue';

import { config } from './config';

useDark();
const { frpc } = window.preload;

const activeTab = ref('basis');
const originConfig = ref<FrpcConfig>({ common: {} });

const logs = ref<string[]>([]);
const runing = ref<boolean>(false);
const haveFrpcBinFile = ref<boolean>(false);

const basisSettingsRef = ref<{ validate: () => Promise<boolean> }>(null!);
const otherSettingsRef = ref<{ validate: () => Promise<boolean> }>(null!);

const loadings = reactive({ run: false, saveConfig: false });
const showDownloadFrpc = ref<boolean>(false);
const frpcVersion = ref<string>('');

const changed = computed(() => !isEqual(config.value, originConfig.value));

function handleRun() {
  loadings.run = true;
  runing.value ? frpc.exit() : frpc.run();
}

function syncRuningStatus() {
  runing.value = frpc.isRuning;
  loadings.run = false;
}

async function handleReset() {
  config.value = cloneDeep(originConfig.value);
}

async function handleSave() {
  try {
    loadings.saveConfig = true;
    if (!(await basisSettingsRef.value.validate())) return (activeTab.value = 'basis'), ElMessage.error('请检查基本设置');
    if (!(await otherSettingsRef.value.validate())) return (activeTab.value = 'other'), ElMessage.error('请检查其他设置');
    const ini = jsIni.stringify(config.value);
    await frpc.saveConfig(ini);
    originConfig.value = cloneDeep(config.value);
  } finally {
    loadings.saveConfig = false;
  }
}

function handleCleanLogs() {
  logs.value = [];
}

async function initFrpc() {
  haveFrpcBinFile.value = await frpc.haveFrpcBinFile();
  if (!haveFrpcBinFile.value) return (showDownloadFrpc.value = true);

  const iniConfig = await frpc.getConfig();
  const _config = { common: {}, ...(jsIni.parse(iniConfig, { comment: '#' }) as any) };
  frpcVersion.value = await frpc.getFrpcVersion();
  originConfig.value = _config;
  config.value = cloneDeep(_config);

  syncRuningStatus();
  frpc.on('run', syncRuningStatus);
  frpc.on('exit', syncRuningStatus);
  frpc.on('log', log => logs.value.push(...log.split('\n')));
}

onMounted(initFrpc);
</script>
