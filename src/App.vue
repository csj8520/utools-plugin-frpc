<template>
  <div class="main">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="basis"><tab-basis-settings ref="basisSettingsRef" /></el-tab-pane>
      <el-tab-pane label="其他设置" name="other"><tab-other-settings ref="otherSettingsRef" /></el-tab-pane>
      <el-tab-pane label="服务列表" name="proxy"><tab-proxy /></el-tab-pane>
      <el-tab-pane label="日志" name="log"><tab-log :logs="logs" @clean="handleCleanLogs" /></el-tab-pane>
    </el-tabs>
    <div class="main__btn">
      <div>
        <p>Frpc Version: {{ frpcVersion || 'none' }}</p>
        <el-button type="success" link @click="showDownloadFrpc = true">{{ frpcVersion ? '检查更新' : '下载 Frpc' }}</el-button>
      </div>
      <div>
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
    </div>
    <download v-model="showDownloadFrpc" @success="initFrpc" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  :deep(.el-tabs) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  &__btn {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    border-top: solid 1px var(--el-border-color-light);

    > div {
      display: flex;
      align-items: center;
      height: 40px;
      > *:not(:first-child) {
        margin-left: 12px;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { isEqual, cloneDeep } from 'lodash';
import ansicolor, { AnsiColored } from 'ansicolor';
import { computed, onMounted, reactive, ref } from 'vue';

import TabBasisSettings from './views/basis-settings/index.vue';
import TabOtherSettings from './views/other-settings/index.vue';
import TabProxy from './views/proxy/index.vue';
import TabLog from './views/log/index.vue';

import Download from './components/download.vue';

import { config } from './config';

useDark();
const { frpc } = window.preload;

const activeTab = ref('basis');
const originConfig = ref<FrpcConfig>({ auth: {}, log: {}, transport: {}, proxies: [], _custom: {} });

const logs = ref<AnsiColored[]>([]);
const runing = ref<boolean>(false);
const haveFrpcBinFile = ref<boolean>(false);

const basisSettingsRef = ref<{ validate: () => Promise<boolean> }>(null!);
const otherSettingsRef = ref<{ validate: () => Promise<boolean> }>(null!);

const loadings = reactive({ run: false, saveConfig: false });
const showDownloadFrpc = ref<boolean>(false);
const frpcVersion = ref<string>('');

const changed = computed(() => !isEqual(config.value, originConfig.value));

async function handleRun() {
  if (changed.value) return ElMessage.warning('你有修改还未保存');
  if (!originConfig.value.serverAddr) return ElMessage.warning('服务器地址你还未填写');
  if (!originConfig.value.serverPort) return ElMessage.warning('服务器端口你还未填写');
  loadings.run = true;
  runing.value ? await frpc.exit() : frpc.run();
  loadings.run = false;
  runing.value = frpc.isRuning;
}

async function handleReset() {
  config.value = cloneDeep(originConfig.value);
}

async function handleSave() {
  try {
    loadings.saveConfig = true;
    if (!(await basisSettingsRef.value.validate())) return (activeTab.value = 'basis'), ElMessage.error('请检查基本设置');
    if (!(await otherSettingsRef.value.validate())) return (activeTab.value = 'other'), ElMessage.error('请检查其他设置');
    const _config = cloneDeep(config.value);
    await frpc.saveConfig(_config);
    originConfig.value = _config;
    if (!runing.value) return;
    if (!config.value._custom.saveRestart) return ElMessage.info('保存成功，可手动重启以生效');
    loadings.run = true;
    await frpc.exit();
    await handleRun();
    ElMessage.success('保存并重启成功');
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

  const _config = await frpc.getConfig();
  frpcVersion.value = await frpc.getFrpcVersion();
  originConfig.value = _config;
  config.value = cloneDeep(_config);

  frpc.removeAllListeners();
  runing.value = frpc.isRuning;
  frpc.on('exit', () => (runing.value = false));
  frpc.on('log', log => {
    const lines = log.trim().split('\n');
    logs.value.push(...lines.map(it => ansicolor.parse(it)));
    if (logs.value.length > 1000) logs.value.splice(0, logs.value.length - 1000);
  });
}

// for dev
window.addEventListener('beforeunload', () => {
  frpc.isRuning && frpc.exit();
});

onMounted(initFrpc);
</script>
