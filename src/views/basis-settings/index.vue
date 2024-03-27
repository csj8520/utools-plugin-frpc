<template>
  <el-form class="h-full overflow-y-auto p-3" label-position="right" label-width="100px" :model="config" ref="form">
    <div class="flex">
      <div class="flex-1">
        <el-form-item label="服务器" required prop="serverAddr">
          <el-input v-model="config.serverAddr" />
        </el-form-item>
        <el-form-item label="用户名" prop="user">
          <el-input v-model="config.user" />
        </el-form-item>
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
      </div>
      <div class="flex-1">
        <el-form-item label="端口" required prop="serverPort">
          <el-input-number v-model="config.serverPort" :min="0" :max="65535" placeholder="7000" />
        </el-form-item>
        <el-form-item label="身份认证" prop="auth.method">
          <el-select v-model="config.auth.method" placeholder="token" @change="config.auth.oidc ||= {}">
            <el-option label="token" value="token" />
            <el-option label="oidc" value="oidc" />
          </el-select>
        </el-form-item>
        <template v-if="config.auth.method === 'oidc'">
          <el-form-item label="clientID" prop="auth.oidc.clientID">
            <el-input v-model="config.auth.oidc!.clientID" placeholder="clientID" type="text" />
          </el-form-item>
          <el-form-item label="clientSecret" prop="auth.oidc.clientSecret">
            <el-input v-model="config.auth.oidc!.clientSecret" placeholder="clientSecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="audience" prop="auth.oidc.audience">
            <el-input v-model="config.auth.oidc!.audience" placeholder="audience" type="text" />
          </el-form-item>
          <el-form-item label="scope" prop="auth.oidc.scope">
            <el-input v-model="config.auth.oidc!.scope" placeholder="scope" type="text" />
          </el-form-item>
          <el-form-item label="tokenEndpointURL" prop="auth.oidc.tokenEndpointURL">
            <el-input v-model="config.auth.oidc!.tokenEndpointURL" placeholder="tokenEndpointURL" type="text" />
          </el-form-item>
        </template>
        <el-form-item v-else label="令牌" prop="auth.token">
          <el-input v-model="config.auth.token" placeholder="token" type="password" show-password />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import { ref } from 'vue';
import type { FormInstance } from 'element-plus';

import { config } from '../../config';

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });
</script>
