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
          <el-select
            :model-value="config.transport?.protocol ?? 'tcp'"
            @update:model-value="config.transport = { ...config.transport, protocol: $event }"
            placeholder="请选择"
          >
            <el-option label="quic" value="quic" />
            <el-option label="tcp" value="tcp" />
            <el-option label="kcp" value="kcp" />
            <el-option label="websocket" value="websocket" />
            <el-option label="wss" value="wss" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志等级" prop="log.level">
          <el-select
            :model-value="config.log?.level ?? 'info'"
            @update:model-value="config.log = { ...config.log, level: $event }"
            placeholder="请选择"
          >
            <el-option label="trace" value="trace" />
            <el-option label="debug" value="debug" />
            <el-option label="info" value="info" />
            <el-option label="warn" value="warn" />
            <el-option label="error" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置文件">
          <a href="javascript:void 0" @click="copyString(frpc.configPath)">{{ frpc.configPath }}</a>
        </el-form-item>
      </div>
      <div class="flex-1">
        <el-form-item label="端口" required prop="serverPort">
          <el-input-number v-model="config.serverPort" :min="0" :max="65535" placeholder="7000" />
        </el-form-item>
        <el-form-item label="身份认证" prop="auth.method">
          <el-select :model-value="config.auth?.method ?? 'none'" placeholder="token" @update:model-value="handleOnAuthChange">
            <el-option label="token" value="token" />
            <el-option label="oidc" value="oidc" />
            <el-option label="无" value="none" />
          </el-select>
        </el-form-item>
        <template v-if="config.auth?.method === 'oidc' && config.auth.oidc">
          <el-form-item label="客户端 ID" prop="auth.oidc.clientID">
            <el-input v-model="config.auth.oidc.clientID" placeholder="clientID" type="text" />
          </el-form-item>
          <el-form-item label="客户端密钥" prop="auth.oidc.clientSecret">
            <el-input v-model="config.auth.oidc.clientSecret" placeholder="clientSecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="audience" prop="auth.oidc.audience">
            <el-input v-model="config.auth.oidc.audience" placeholder="audience" type="text" />
          </el-form-item>
          <el-form-item label="scope" prop="auth.oidc.scope">
            <el-input v-model="config.auth.oidc.scope" placeholder="scope" type="text" />
          </el-form-item>
          <el-form-item label="令牌端点 URL" prop="auth.oidc.tokenEndpointURL">
            <el-input v-model="config.auth.oidc.tokenEndpointURL" placeholder="tokenEndpointURL" type="text" />
          </el-form-item>

          <record-input
            :model-value="config.auth.oidc.additionalEndpointParams ?? {}"
            @update:model-value="config.auth.oidc.additionalEndpointParams = $event"
            label="附加参数"
            prop="auth.oidc.additionalEndpointParams"
          />

          <el-form-item label="证书路径" prop="auth.oidc.trustedCaFile">
            <el-input v-model="config.auth.oidc.trustedCaFile" placeholder="trustedCaFile" type="text" />
          </el-form-item>
          <el-form-item label="跳过证书验证" prop="auth.oidc.insecureSkipVerify">
            <el-checkbox v-model="config.auth.oidc.insecureSkipVerify" />
          </el-form-item>
          <el-form-item label="代理 URL" prop="auth.oidc.proxyURL">
            <el-input v-model="config.auth.oidc.proxyURL" placeholder="proxyURL" type="text" />
          </el-form-item>
        </template>
        <el-form-item v-else-if="config.auth?.method === 'token'" label="令牌" prop="auth.token">
          <el-input v-model="config.auth.token" placeholder="token" type="password" show-password />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { config } from '../../utils/config';

const { frpc } = window.preload;
const { utools } = window;

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });

function handleOnAuthChange(it: string) {
  if (it === 'oidc') {
    config.value.auth = { ...config.value.auth, method: it, oidc: { ...config.value.auth?.oidc } };
  } else if (it === 'token') {
    config.value.auth = { ...config.value.auth, method: it };
  } else {
    delete config.value.auth;
  }
}
</script>
