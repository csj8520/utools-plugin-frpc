<template>
  <el-form class="other-settings" label-position="right" label-width="100px" :model="config" ref="form">
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
    <div class="other-settings__group" v-if="config.webServer">
      <el-form-item label="监听地址" prop="webServer.addr">
        <el-input v-model="config.webServer.addr" placeholder="0.0.0.0" />
      </el-form-item>
      <el-form-item label="监听端口" prop="webServer.port" required>
        <el-input-number v-model="config.webServer.port" :min="0" :max="65535" placeholder="5000" />
      </el-form-item>
      <el-form-item label="用户名" prop="webServer.user">
        <el-input v-model="config.webServer.user" placeholder="admin" />
      </el-form-item>
      <el-form-item label="密码" prop="webServer.password">
        <el-input v-model="config.webServer.password" placeholder="password" type="password" show-password />
      </el-form-item>
    </div>

    <el-form-item label="开启 TLS" prop="transport.tls">
      <el-checkbox v-model="config.transport.tls" />
    </el-form-item>
    <el-form-item label="失败后退出" prop="loginFailExit">
      <el-checkbox :model-value="config.loginFailExit ?? true" @click="config.loginFailExit = !(config.loginFailExit ?? true)" />
      <i class="el-checkbox"></i>
      <el-tooltip content="第一次登陆失败后是否退出" placement="top">
        <el-icon><QuestionFilled /></el-icon>
      </el-tooltip>
    </el-form-item>
    <el-form-item label="保存后重启" prop="_custom.saveRestart">
      <el-checkbox v-model="config._custom.saveRestart" />
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped>
.other-settings {
  height: 100%;
  overflow-y: auto;
  padding: 10px;

  &__group {
    display: flex;
    flex-wrap: wrap;
    padding-right: 20px;
    .el-form-item {
      width: 50%;
    }
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import type { FormInstance, CheckboxValueType } from 'element-plus';

import { config } from '../../config';

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });

function handleEnableAdminUi(value: CheckboxValueType) {
  if (value) return delete config.value.webServer;
  config.value.webServer = {} as any;
}
</script>
