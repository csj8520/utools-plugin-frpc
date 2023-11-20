<template>
  <div class="main">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="basis"><tab-basis-settings ref="basisSettingsRef" /></el-tab-pane>
      <el-tab-pane label="其他设置" name="other"><tab-other-settings ref="otherSettingsRef" /></el-tab-pane>
      <el-tab-pane label="服务列表" name="proxy"><tab-proxy /></el-tab-pane>
      <el-tab-pane label="日志" name="log"><tab-log v-model:logs="logs" /></el-tab-pane>
    </el-tabs>
    <div class="main__btn">
      <div>
        <p>Frpc Version: {{ version }}</p>
        <el-button type="success" link @click="showDownload = true">{{ version === '0.0.0' ? '下载 Frpc' : '检查更新' }}</el-button>
      </div>
      <div>
        <el-switch
          size="large"
          :model-value="isRuning"
          :disabled="!hasFrpcBinFile"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleRun"
        />
        <el-button :disabled="!changed" type="success" @click="handleSave">保存</el-button>
        <el-button :disabled="!changed" type="info" @click="handleReset">复位</el-button>
      </div>
    </div>
    <download v-model="showDownload" @success="initFrpc" />
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
import { computed, onMounted, ref } from 'vue';

import TabBasisSettings from './views/basis-settings/index.vue';
import TabOtherSettings from './views/other-settings/index.vue';
import TabProxy from './views/proxy/index.vue';
import TabLog from './views/log/index.vue';

import Download from './components/download.vue';

import { config } from './config';

useDark();
const { frpc } = window.preload;

const activeTab = ref('basis');
const originConfig = ref<FrpcConfig>(frpc.defConfig);

const logs = ref<AnsiColored[]>([]);

const version = ref<string>(frpc.version);
const isRuning = ref<boolean>(frpc.isRuning);
const hasFrpcBinFile = ref<boolean>(frpc.hasFrpcBinFile);

const basisSettingsRef = ref<InstanceType<typeof TabBasisSettings>>(null!);
const otherSettingsRef = ref<InstanceType<typeof TabOtherSettings>>(null!);

const showDownload = ref<boolean>(false);

const changed = computed(() => !isEqual(config.value, originConfig.value));

async function handleRun() {
  if (changed.value) return ElMessage.warning('你有修改还未保存');
  if (!originConfig.value.serverAddr) return ElMessage.warning('服务器地址你还未填写');
  if (!originConfig.value.serverPort) return ElMessage.warning('服务器端口你还未填写');
  frpc.isRuning ? await frpc.exit() : frpc.run();
}

async function handleReset() {
  config.value = cloneDeep(originConfig.value);
}

async function handleSave() {
  if (!(await basisSettingsRef.value.validate())) return (activeTab.value = 'basis'), ElMessage.error('请检查基本设置');
  if (!(await otherSettingsRef.value.validate())) return (activeTab.value = 'other'), ElMessage.error('请检查其他设置');
  const _config = cloneDeep(config.value);
  await frpc.saveConfig(_config);
  originConfig.value = _config;
  if (!frpc.isRuning) return;
  if (!config.value._custom.saveRestart) return ElMessage.info('保存成功，可手动重启以生效');
  await frpc.exit();
  await handleRun();
  ElMessage.success('保存并重启成功');
}

function handleLog(log: string) {
  const lines = log.trim().split('\n');
  logs.value.push(...lines.map(it => ansicolor.parse(it)));
  const maxLine = 4000;
  if (logs.value.length > maxLine) logs.value.splice(0, logs.value.length - (maxLine - 1000));
}
async function initFrpc() {
  await frpc.init();

  version.value = frpc.version;
  isRuning.value = frpc.isRuning;
  hasFrpcBinFile.value = frpc.hasFrpcBinFile;

  showDownload.value = !frpc.hasFrpcBinFile;

  originConfig.value = frpc.config;
  config.value = cloneDeep(frpc.config);
  console.log('config.value: ', config.value);

  frpc.removeAllListeners();
  frpc.on('start', () => (isRuning.value = true));
  frpc.on('exit', () => (isRuning.value = false));
  frpc.on('log', handleLog);
  frpc.on('error', handleLog);
  frpc.on('error', ElMessage.error);
}

// for dev
window.addEventListener('beforeunload', () => {
  frpc.isRuning && frpc.exit();
});

onMounted(initFrpc);
</script>
