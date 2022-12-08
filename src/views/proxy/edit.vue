<template>
  <el-dialog :model-value="modelValue" @close="emit('update:modelValue', false)" title="编辑" style="min-width: 500px">
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
      <div class="proxy__group">
        <el-form-item label="本地IP" prop="local_ip" required>
          <el-input v-model="result.local_ip" />
        </el-form-item>
        <el-form-item label="本地端口" prop="local_port" required>
          <el-input-number v-model="result.local_port" :min="0" :max="65535" placeholder="8080" />
        </el-form-item>
      </div>
      <div class="proxy__group">
        <el-form-item label="开启加密" prop="use_encryption">
          <el-checkbox v-model="result.use_encryption" />
        </el-form-item>
        <el-form-item label="开启压缩" prop="use_compression">
          <el-checkbox v-model="result.use_compression" />
        </el-form-item>
      </div>
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
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { cloneDeep } from 'lodash';
import { ElMessage, FormInstance } from 'element-plus';

const form = ref<FormInstance>(null!);
const result = ref<FrpcConfig.Proxy>(null!);

const props = withDefaults(defineProps<{ modelValue?: boolean; data?: FrpcConfig.Proxy }>(), {
  modelValue: false,
  data: () => ({ _name: '', _enable: true, local_ip: '127.0.0.1', use_compression: true, use_encryption: true })
});
const emit = defineEmits(['update:modelValue', 'enter']);

watch(
  () => props.data,
  () => (result.value = cloneDeep(props.data)),
  { immediate: true }
);

async function handleSave() {
  const check = await form.value.validate().catch(() => false);
  if (!check) return ElMessage.error('请检查配置是否正确');
  emit('enter', result.value);
}
</script>
