<template>
  <div class="main relative flex flex-col hfull of-hidden">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="basis"><tab-basis-settings ref="basisSettingsRef" /></el-tab-pane>
      <el-tab-pane label="其他设置" name="other"><tab-other-settings ref="otherSettingsRef" /></el-tab-pane>
      <el-tab-pane label="代理配置" name="proxy"><tab-proxy v-if="activeTab === 'proxy'" /></el-tab-pane>
      <el-tab-pane label="访问者配置" name="visitor"><tab-visitor v-if="activeTab === 'visitor'" /></el-tab-pane>
      <el-tab-pane label="日志" name="log"><tab-log v-if="activeTab === 'log'" v-model:logs="logs" /></el-tab-pane>
    </el-tabs>
    <div class="main__btn flex-shrink-0 flex justify-between px2 py1 b-t b-t-solid b-gray-7">
      <div class="flex items-center gap-4">
        <p>Frpc Version: {{ frpc.version }}</p>
        <el-button type="success" link @click="showDownload = true">{{ frpc.version === '0.0.0' ? '下载 Frpc' : '检查更新' }}</el-button>
      </div>
      <div class="flex items-center gap-4">
        <el-switch
          size="large"
          :model-value="frpc.isRuning"
          :disabled="!frpc.hasFrpc"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleRun"
        />
        <el-button class="ml0!" :disabled="!changed" type="success" @click="handleSave">保存</el-button>
        <el-button class="ml0!" :disabled="!changed" type="info" @click="handleReset">复位</el-button>
        <el-tooltip content="重新载入本地配置" placement="top">
          <el-button class="ml0!" circle :icon="Refresh" @click="handleReload"></el-button>
        </el-tooltip>
      </div>
    </div>
    <download v-model="showDownload" @success="initFrpc" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  :deep(.el-tabs) {
    flex: 1;
    overflow: hidden;
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
}
</style>

<script setup lang="ts">
import semver from 'semver';
import { useDark } from '@vueuse/core';
import { Action, ElMessage, ElMessageBox } from 'element-plus';
import { isEqual, cloneDeep } from 'es-toolkit';
import ansicolor, { AnsiColored } from 'ansicolor';
import { computed, onMounted, ref, watch } from 'vue';

import TabBasisSettings from './views/basis-settings/index.vue';
import TabOtherSettings from './views/other-settings/index.vue';
import TabProxy from './views/proxy/index.vue';
import TabLog, { Log } from './views/log/index.vue';
import TabVisitor from './views/visitor/index.vue';

import Download from './components/download.vue';

import { config, customConfig } from './utils/config';
import { Refresh } from '@element-plus/icons-vue';

useDark();

const activeTab = ref('basis');

const logs = ref<Log[]>([]);

const basisSettingsRef = ref<InstanceType<typeof TabBasisSettings>>(null!);
const otherSettingsRef = ref<InstanceType<typeof TabOtherSettings>>(null!);

const showDownload = ref<boolean>(false);

const changedConfig = computed(() => !isEqual(config.value, frpc.value.config));
const changedCustom = computed(() => !isEqual(custom.value, customConfig.value));
const changed = computed(() => changedConfig.value || changedCustom.value);

async function handleRun() {
  if (changed.value) return ElMessage.warning('你有修改还未保存');
  if (!frpc.value.config.serverAddr) return ElMessage.warning('服务器地址你还未填写');
  if (!frpc.value.config.serverPort) return ElMessage.warning('服务器端口你还未填写');
  if (!(await checkVersion())) return;
  frpc.value.isRuning ? await frpc.value.exit() : frpc.value.run();
}

function handleReset() {
  config.value = cloneDeep(frpc.value.config);
}

async function handleSave() {
  if (changedConfig.value) {
    if (!(await basisSettingsRef.value.validate())) return (activeTab.value = 'basis'), ElMessage.error('请检查基本设置');
    if (!(await otherSettingsRef.value.validate())) return (activeTab.value = 'other'), ElMessage.error('请检查其他设置');
    await frpc.value.saveConfig(cloneDeep(config.value));
    triggerRef(frpc);
    if (!frpc.value.isRuning) return;
    if (!customConfig.value.saveRestart) return ElMessage.info('保存成功，可手动重启以生效');
    await frpc.value.exit();
    await handleRun();
    ElMessage.success('保存并重启成功');
  }
  if (changedCustom.value) {
    customConfig.value = cloneDeep(custom.value);
  }
}

function handleLog(log: string) {
  const lines = log
    .trim()
    .split('\n')
    .map(it => it.trim())
    .filter(Boolean);
  logs.value.push(...lines.map(it => ({ ...ansicolor.parse(it), uuid: crypto.randomUUID() })).filter(it => it.spans.length));
  const maxLine = 4000;
  if (logs.value.length > maxLine) logs.value.splice(0, logs.value.length - maxLine);
}

async function checkVersion() {
  if (!semver.lt(frpc.value.version, '0.52.0')) return true;
  await ElMessageBox.confirm('frp 现在支持 TOML、YAML 和 JSON 进行配置。INI 已弃用，需更新 frpc 客户端', '版本过低', {
    showCancelButton: false,
    showClose: false,
    closeOnClickModal: false,
  });
  showDownload.value = true;
  return false;
}

async function initFrpc() {
  frpc.value.removeAllListeners();
  frpc.value.on('start', () => triggerRef(frpc));
  frpc.value.on('exit', () => triggerRef(frpc));
  frpc.value.on('log', handleLog);
  frpc.value.on('error', handleLog);
  frpc.value.on('error', ElMessage.error);

  frpc.value.configPath = customConfig.value.configPath || window.preload.configPath;
  frpc.value.frpcPath = customConfig.value.frpcPath || window.preload.frpcBinPath;
  console.log('frpc.value: ', frpc.value);
  await frpc.value.init();
  triggerRef(frpc);

  showDownload.value = !frpc.value.hasFrpc;

  config.value = cloneDeep(frpc.value.config);
  custom.value = cloneDeep(customConfig.value);
  console.log('config.value: ', config.value);
}

async function handleReload() {
  if (changed.value) await ElMessageBox.confirm('你有修改还未保存，是否要继续？', '提示', { cancelButtonText: '取消', confirmButtonText: '确定' });
  await initFrpc();
  // await frpc.value.reloadLocalConfig();
  config.value = cloneDeep(frpc.value.config);
}

if (import.meta.env.DEV) {
  watch(
    config,
    () => {
      console.log('config: ', cloneDeep(config.value));
    },
    { deep: true },
  );
}

// for dev
window.addEventListener('beforeunload', () => {
  frpc.value.isRuning && frpc.value.exit();
});

onMounted(initFrpc);
</script>
