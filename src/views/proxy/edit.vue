<template>
  <el-dialog :model-value="modelValue" @close="emit('update:modelValue', false)" title="编辑" style="min-width: 600px">
    <el-form :model="result" ref="form" label-width="100px">
      <el-form-item label="备注名" prop="_name" required>
        <el-input v-model="result._name" />
      </el-form-item>
      <el-form-item label="协议类型" prop="type" required>
        <el-select v-model="result.type">
          <el-option label="tcp" value="tcp" />
          <el-option label="udp" value="udp" />
          <el-option label="http" value="http" />
          <el-option label="https" value="https" />
          <el-option label="stcp" value="stcp" />
          <el-option label="sudp" value="sudp" />
          <el-option label="xtcp" value="xtcp" />
          <el-option label="tcpmux" value="tcpmux" />
        </el-select>
      </el-form-item>
      <el-form-item label="本地IP" prop="local_ip" :required="!enablePlugin">
        <el-input v-model="result.local_ip" />
      </el-form-item>
      <el-form-item label="本地端口" prop="local_port" :required="!enablePlugin">
        <el-input-number v-model="result.local_port" :min="0" :max="65535" placeholder="8080" />
      </el-form-item>
      <el-form-item label="开启加密" prop="use_encryption">
        <el-checkbox v-model="result.use_encryption" />
      </el-form-item>
      <el-form-item label="开启压缩" prop="use_compression">
        <el-checkbox v-model="result.use_compression" />
      </el-form-item>
      <el-form-item label="使用插件" prop="tls_enable">
        <el-checkbox v-model="enablePlugin" />
        <i class="el-checkbox"></i>
        <el-tooltip
          content="用于扩展 frpc 的能力，能够提供一些简单的本地服务，如果配置了 plugin，则 local_ip 和 local_port 无效，两者只能配置一个"
          placement="top"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
      </el-form-item>
      <template v-if="enablePlugin">
        <el-form-item label="插件名" prop="plugin" required>
          <el-input v-model="result.plugin" placeholder="插件名例如：static_file, https2http" />
        </el-form-item>
        <el-form-item label="插件参数" prop="plugin">
          <div class="edit__input__group" v-for="(it, idx) in pluginConfigs" :key="idx">
            <el-input v-model="it.key" placeholder="key 都以 “plugin_” 开头" />
            <el-input v-model="it.value" placeholder="value" />
            <el-icon><Close @click="pluginConfigs.splice(idx, 1)" /></el-icon>
          </div>
          <el-button @click="pluginConfigs.push({ key: 'plugin_', value: '' })">增加参数</el-button>
        </el-form-item>
      </template>

      <template v-if="result.type === 'http' || result.type === 'https' || result.type === 'tcpmux'">
        <el-form-item label="自定义域名" prop="custom_domains">
          <el-input v-model="result.custom_domains" />
        </el-form-item>
        <el-form-item label="子域名" prop="subdomain">
          <el-input v-model="result.subdomain" />
        </el-form-item>
      </template>
      <template v-else-if="result.type === 'tcp' || result.type === 'udp'">
        <el-form-item label="远程端口" prop="remote_port" required>
          <el-input-number v-model="result.remote_port" :min="0" :max="65535" placeholder="8080" />
        </el-form-item>
      </template>
      <template v-else-if="result.type === 'stcp' || result.type === 'sudp' || result.type === 'xtcp'">
        <el-form-item label="角色" prop="role" required>
          <el-input v-model="result.role" />
        </el-form-item>
        <el-form-item label="密钥" prop="sk" required>
          <el-input v-model="result.sk" />
        </el-form-item>
      </template>
      <el-form-item v-if="result.type === 'http'" label="修改Host" prop="host_header_rewrite">
        <el-input v-model="result.host_header_rewrite" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.edit__input__group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding-bottom: 10px;
  .el-input {
    flex: 1;
    margin: 0 10px 0 0;
  }
  .el-icon {
    cursor: pointer;
  }
}
</style>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { cloneDeep } from 'lodash';
import { ElMessage, FormInstance } from 'element-plus';
import { QuestionFilled, Close } from '@element-plus/icons-vue';

const form = ref<FormInstance>(null!);
const result = ref<FrpcConfig.Proxy>(null!);

const enablePlugin = ref<boolean>(false);
const pluginConfigs = ref<Array<{ key: string; value: string }>>([]);

const props = withDefaults(defineProps<{ modelValue?: boolean; data?: FrpcConfig.Proxy }>(), {
  modelValue: false,
  data: () => ({ _name: '', _enable: true, local_ip: '127.0.0.1', use_compression: true, use_encryption: true })
});
const emit = defineEmits(['update:modelValue', 'enter']);

watch(
  () => props.data,
  () => {
    result.value = cloneDeep(props.data);
    enablePlugin.value = !!props.data.plugin;
    pluginConfigs.value = Object.keys(result.value)
      .filter(it => it.startsWith('plugin_'))
      .map(key => ({ key, value: result.value[key as any] }));
    pluginConfigs.value.length === 0 && pluginConfigs.value.push({ key: 'plugin_', value: '' });
  },
  { immediate: true }
);

async function handleSave() {
  const check = await form.value.validate().catch(() => false);
  if (!check) return ElMessage.error('请检查配置是否正确');
  if (result.value.type === 'http' || result.value.type === 'https' || result.value.type === 'tcpmux') {
    if (!(result.value.custom_domains || result.value.subdomain)) return ElMessage.error('自定义域名和子域名两者必须配置一个');
  }
  Object.keys(result.value)
    .filter(it => it.startsWith('plugin_'))
    .forEach(it => delete result.value[it as any]);
  if (enablePlugin.value) {
    pluginConfigs.value.forEach(it => {
      if (it.key.startsWith('plugin_') && it.value) {
        result.value[it.key as any] = it.value;
      }
    });
  } else {
    delete result.value.plugin;
  }
  emit('enter', result.value);
}
</script>
