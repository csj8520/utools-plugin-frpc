<template>
  <el-form class="basis-settings" label-position="right" label-width="100px" :model="config.common" ref="form">
    <div class="basis-settings__group">
      <el-form-item label="服务器" required prop="server_addr">
        <el-input v-model="config.common.server_addr" />
      </el-form-item>
      <el-form-item label="端口" required prop="server_port">
        <el-input-number v-model="config.common.server_port" :min="0" :max="65535" placeholder="7000" />
      </el-form-item>
    </div>
    <div class="basis-settings__group">
      <el-form-item label="用户名" prop="user">
        <el-input v-model="config.common.user" />
      </el-form-item>
      <el-form-item label="令牌" prop="token">
        <el-input v-model="config.common.token" placeholder="token" type="password" show-password />
      </el-form-item>
    </div>
    <el-form-item label="通信协议" prop="protocol">
      <el-select v-model="config.common.protocol" placeholder="请选择">
        <el-option label="tcp" value="tcp" />
        <el-option label="kcp" value="kcp" />
        <el-option label="websocket" value="websocket" />
      </el-select>
    </el-form-item>
    <el-form-item label="日志等级" prop="log_level">
      <el-select v-model="config.common.log_level" placeholder="请选择">
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
