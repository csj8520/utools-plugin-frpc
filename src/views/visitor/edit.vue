<template>
  <el-dialog v-model="modelValue" title="编辑" style="min-width: 600px">
    <el-form :model="result" ref="form" label-width="100px">
      <el-form-item label="访问者名称" prop="name" required>
        <el-input v-model="result.name" placeholder="访问者名称" />
      </el-form-item>
      <el-form-item label="协议类型" prop="type" required>
        <el-select v-model="result.type">
          <el-option label="stcp" value="stcp" />
          <el-option label="xtcp" value="xtcp" />
          <el-option label="sudp" value="sudp" />
        </el-select>
      </el-form-item>

      <el-form-item label="网络层">
        <div class="flex gap-5">
          <el-form-item label="开启加密" label-width="auto" prop="transport.useEncryption">
            <el-checkbox
              :model-value="result.transport?.useEncryption"
              @update:model-value="result.transport = { ...result.transport, useEncryption: Boolean($event) }"
            />
          </el-form-item>
          <el-form-item label="开启压缩" label-width="auto" prop="transport.useCompression">
            <el-checkbox
              :model-value="result.transport?.useCompression"
              @update:model-value="result.transport = { ...result.transport, useCompression: Boolean($event) }"
            />
          </el-form-item>
        </div>
      </el-form-item>

      <div class="flex items-center gap-5">
        <el-form-item label="监听IP：" prop="bindAddr">
          <div class="wfull flex items-center gap-5">
            <el-input v-model="result.bindAddr" placeholder="127.0.0.1" />
            <el-tooltip content="监听的本地地址，通过该地址和端口连接到远端代理服务" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item label="端口：" label-width="auto" prop="bindPort" required>
          <div class="wfull flex items-center gap-5">
            <el-input-number v-model="result.bindPort" :min="0" :max="65535" placeholder="8080" />
            <el-tooltip content="监听的本地端口，-1 表示不监听物理端口，通常用于 fallback" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </div>

      <el-form-item label="用户名" prop="serverUser">
        <div class="wfull flex items-center gap-5">
          <el-input v-model="result.serverUser" />
          <el-tooltip content="serverUser：要访问的 proxy 所属用户名，如果为空则默认为当前用户" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </el-form-item>

      <el-form-item label="代理名称" prop="serverName" required>
        <div class="wfull flex items-center gap-5">
          <el-input v-model="result.serverName" />
          <el-tooltip content="serverName：要访问的 proxy 名称" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </el-form-item>

      <el-form-item label="密钥" prop="secretKey">
        <div class="wfull flex items-center gap-5">
          <el-input v-model="result.secretKey" />
          <el-tooltip content="secretKey：密钥，服务端和访问端的密钥需要一致" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </el-form-item>

      <el-form-item label="使用插件" prop="plugin.type">
        <el-select
          :model-value="result.plugin?.type ?? 'none'"
          @update:model-value="result.plugin = $event === 'none' ? void 0 : ({ ...result.plugin, type: $event } as any)"
        >
          <el-option label="无" value="none" />
          <el-option label="virtual_net" value="virtual_net" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="result.plugin?.type">插件参数</el-form-item>
      <template v-if="result.plugin?.type === 'virtual_net'">
        <el-form-item label="虚拟 IP 地址" prop="plugin.destinationIP" required>
          <div class="wfull flex items-center gap-5">
            <el-input v-model="result.plugin.destinationIP" placeholder="" />
            <el-tooltip content="destinationIP: 要访问的目标虚拟 IP 地址，通常是服务端的虚拟网络地址" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import { cloneDeep } from 'es-toolkit';
import { ElMessage, FormInstance } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';

const form = ref<FormInstance>(null!);
const result = ref<VisitorConfig>(null!);
const modelValue = defineModel<boolean>();

const props = withDefaults(defineProps<{ data?: VisitorConfig }>(), {
  data: () => ({
    type: 'xtcp',
    name: '',
    serverName: '',
    bindPort: 3000,
  }),
});
const emit = defineEmits(['enter']);

watch(
  () => props.data,
  () => {
    result.value = cloneDeep(props.data);
  },
  { immediate: true },
);

async function handleSave() {
  const check = await form.value.validate().catch(() => false);
  if (!check) return ElMessage.error('请检查配置是否正确');
  emit('enter', result.value);
}
</script>
