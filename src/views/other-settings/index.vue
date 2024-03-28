<template>
  <el-form class="h-full overflow-y-auto p-3" label-position="right" label-width="100px" :model="config" ref="form">
    <el-form-item label="DNS" prop="dnsServer">
      <el-input v-model="config.dnsServer" placeholder="114.114.114.114" />
    </el-form-item>
    <el-form-item label="HTTP 代理" prop="transport.proxyURL">
      <el-input v-model="config.transport.proxyURL" placeholder="{protocol}://user:passwd@192.168.1.128:8080" />
    </el-form-item>
    <el-form-item label="连接池大小" prop="transport.poolCount">
      <el-input-number type="number" v-model="config.transport.poolCount" :min="0" placeholder="0" />
    </el-form-item>
    <el-form-item label="开启网页管理">
      <el-checkbox :model-value="!!config.webServer" @change="handleEnableAdminUi" />
    </el-form-item>
    <template v-if="config.webServer">
      <div class="flex">
        <el-form-item class="flex-1" label="监听地址" prop="webServer.addr">
          <el-input v-model="config.webServer.addr" placeholder="0.0.0.0" />
        </el-form-item>
        <el-form-item class="flex-1" label="监听端口" prop="webServer.port" required>
          <el-input-number v-model="config.webServer.port" :min="0" :max="65535" placeholder="5000" />
        </el-form-item>
      </div>
      <div class="flex">
        <el-form-item class="flex-1" label="用户名" prop="webServer.user">
          <el-input v-model="config.webServer.user" placeholder="admin" />
        </el-form-item>
        <el-form-item class="flex-1" label="密码" prop="webServer.password">
          <el-input v-model="config.webServer.password" placeholder="password" type="password" show-password />
        </el-form-item>
      </div>
      <el-form-item>
        <a href="javascript:void 0" @click="utools.shellOpenPath(webServerUrl)">{{ webServerUrl }}</a>
      </el-form-item>
    </template>

    <!-- <el-form-item label="开启 TLS" prop="transport.tls">
      <el-checkbox v-model="config.transport.tls" />
    </el-form-item> -->
    <!-- <el-form-item label="禁用标准输出中的日志颜色" prop="log.disablePrintColor">
      <el-checkbox v-model="config.log.disablePrintColor" />
    </el-form-item> -->
    <el-form-item label="失败后退出" prop="loginFailExit">
      <el-checkbox :model-value="config.loginFailExit ?? true" @click="config.loginFailExit = !(config.loginFailExit ?? true)" />
      <i class="el-checkbox"></i>
      <el-tooltip content="第一次登陆失败后是否退出" placement="top">
        <el-icon><QuestionFilled /></el-icon>
      </el-tooltip>
    </el-form-item>
    <el-form-item label="保存后重启">
      <el-checkbox v-model="customConfig.saveRestart" />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import type { FormInstance, CheckboxValueType } from 'element-plus';

import { config, customConfig } from '../../config';
const { utools } = window;

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });

const webServerUrl = computed(() => {
  if (!config.value.webServer) return '';
  const addr = config.value.webServer.addr;
  return `http://${addr === '0.0.0.0' ? '127.0.0.1' : addr || '127.0.0.1'}:${config.value.webServer.port}`;
});

function handleEnableAdminUi(value: CheckboxValueType) {
  if (value) return delete config.value.webServer;
  config.value.webServer = { port: 5000 };
}
</script>
