<template>
  <el-form class="other-settings" label-position="right" label-width="100px" :model="config.common" ref="form">
    <el-form-item label="DNS" prop="dns_server">
      <el-input v-model="config.common.dns_server" placeholder="114.114.114.114" />
    </el-form-item>
    <el-form-item label="HTTP 代理" prop="http_proxy">
      <el-input v-model="config.common.http_proxy" placeholder="{protocol}://user:passwd@192.168.1.128:8080" />
    </el-form-item>
    <el-form-item label="连接池大小" prop="tls_enable">
      <el-input-number type="number" v-model="config.common.pool_count" :min="0" placeholder="0" />
    </el-form-item>
    <el-form-item label="开启网页管理" prop="tls_enable">
      <el-checkbox v-model="enableAdminUi" @change="handleEnableAdminUi" />
    </el-form-item>
    <div class="other-settings__group" v-if="enableAdminUi">
      <el-form-item label="监听地址" prop="admin_addr">
        <el-input v-model="config.common.admin_addr" placeholder="0.0.0.0" />
      </el-form-item>
      <el-form-item label="监听端口" prop="admin_port" required>
        <el-input-number v-model="config.common.admin_port" :min="0" :max="65535" placeholder="5000" />
      </el-form-item>
      <el-form-item label="用户名" prop="admin_user">
        <el-input v-model="config.common.admin_user" placeholder="admin" />
      </el-form-item>
      <el-form-item label="密码" prop="admin_pwd">
        <el-input v-model="config.common.admin_pwd" placeholder="password" type="password" show-password />
      </el-form-item>
    </div>

    <el-form-item label="开启 TLS" prop="tls_enable">
      <el-checkbox v-model="config.common.tls_enable" />
    </el-form-item>
    <el-form-item label="失败后退出" prop="login_fail_exit">
      <el-checkbox
        :model-value="config.common.login_fail_exit ?? true"
        @click="config.common.login_fail_exit = !(config.common.login_fail_exit ?? true)"
      />
      <i class="el-checkbox"></i>
      <el-tooltip content="第一次登陆失败后是否退出" placement="top">
        <el-icon><QuestionFilled /></el-icon>
      </el-tooltip>
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped>
.other-settings {
  height: 100%;
  overflow-y: auto;
  padding: 10px 10px 50px;

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
import { ref, watch } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import type { FormInstance, CheckboxValueType } from 'element-plus';

import { config } from '../../config';

const form = ref<FormInstance>(null!);

defineExpose({ validate: () => form.value.validate().catch(() => false) });

const enableAdminUi = ref<boolean>(false);

watch(
  () => config.value.common.admin_port,
  () => {
    if (enableAdminUi.value) return;
    enableAdminUi.value = !!config.value.common.admin_port;
  },
  { immediate: true }
);
function handleEnableAdminUi(value: CheckboxValueType) {
  if (value) return;
  config.value.common.admin_port = 0;
}
</script>
