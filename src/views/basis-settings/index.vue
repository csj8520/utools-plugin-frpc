<template>
  <el-form class="basis-settings" label-position="right" label-width="100px" :model="config" ref="form">
    <div class="basis-settings__group">
      <el-form-item label="服务器" required prop="serverAddr">
        <el-input v-model="config.serverAddr" />
      </el-form-item>
      <el-form-item label="端口" required prop="serverPort">
        <el-input-number v-model="config.serverPort" :min="0" :max="65535" placeholder="7000" />
      </el-form-item>
    </div>
    <div class="basis-settings__group">
      <el-form-item label="用户名" prop="user">
        <el-input v-model="config.user" />
      </el-form-item>
      <el-form-item label="令牌" prop="auth.token">
        <el-input v-model="config.auth.token" placeholder="token" type="password" show-password />
      </el-form-item>
    </div>
    <el-form-item label="通信协议" prop="transport.protocol">
      <el-select v-model="config.transport.protocol" placeholder="请选择">
        <el-option label="quic" value="quic" />
        <el-option label="tcp" value="tcp" />
        <el-option label="kcp" value="kcp" />
        <el-option label="websocket" value="websocket" />
        <el-option label="wss" value="wss" />
      </el-select>
    </el-form-item>
    <el-form-item label="日志等级" prop="log.level">
      <el-select v-model="config.log.level" placeholder="请选择">
        <el-option label="trace" value="trace" />
        <el-option label="debug" value="debug" />
        <el-option label="info" value="info" />
        <el-option label="warn" value="warn" />
        <el-option label="error" value="error" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped>
.basis-settings {
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
import type { FormInstance } from 'element-plus';

import { config } from '../../config';

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });
</script>
