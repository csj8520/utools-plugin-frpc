<template>
  <el-dialog :model-value="modelValue" @close="emit('update:modelValue', false)" title="编辑" style="min-width: 600px">
    <el-form :model="result" ref="form" label-width="100px">
      <el-form-item label="备注名" prop="name" required>
        <el-input v-model="result.name" placeholder="代理名称。" />
      </el-form-item>
      <el-form-item label="协议类型" prop="type" required>
        <el-select v-model="result.type">
          <el-option label="tcp" value="tcp" />
          <el-option label="udp" value="udp" />
          <el-option label="http" value="http" />
          <el-option label="https" value="https" />
          <el-option label="tcpmux" value="tcpmux" />
          <el-option label="stcp" value="stcp" />
          <el-option label="xtcp" value="xtcp" />
          <el-option label="sudp" value="sudp" />
        </el-select>
      </el-form-item>

      <template v-if="result.transport">
        <el-form-item label="开启加密" prop="transport.useEncryption">
          <el-checkbox v-model="result.transport.useEncryption" />
        </el-form-item>
        <el-form-item label="开启压缩" prop="transport.useCompression">
          <el-checkbox v-model="result.transport.useCompression" />
        </el-form-item>
      </template>

      <el-form-item label="本地IP" prop="localIP">
        <el-input v-model="result.localIP" placeholder="被代理的本地服务 IP，默认为 127.0.0.1。" />
      </el-form-item>
      <el-form-item label="本地端口" prop="localPort" :required="!enablePlugin" title="被代理的本地服务端口。">
        <el-input-number v-model="result.localPort" :min="0" :max="65535" placeholder="8080" />
      </el-form-item>

      <template v-if="result.type === 'http' || result.type === 'https' || result.type === 'tcpmux'">
        <el-form-item
          v-if="result.customDomains"
          label="自定义域名"
          :prop="`customDomains[${idx}]`"
          v-for="(_, idx) in result.customDomains"
          required
        >
          <div class="flex w-full items-center">
            <el-input class="flex-1 pr-2" v-model="result.customDomains[idx]" />
            <el-icon class="cursor-pointer"><Close @click="result.customDomains.splice(idx, 1)" /></el-icon>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button @click="result.customDomains = [...(result.customDomains ?? []), '']">添加自定义域名</el-button>
        </el-form-item>

        <el-form-item label="子域名" prop="subdomain">
          <el-input v-model="result.subdomain" placeholder="子域名。" />
        </el-form-item>
      </template>

      <el-form-item v-if="result.type === 'http'" label="修改Host" prop="hostHeaderRewrite">
        <el-input v-model="result.hostHeaderRewrite" placeholder="替换 Host Header。" />
        <!-- TODO: requestHeaders -->
      </el-form-item>

      <template v-if="result.type === 'tcp' || result.type === 'udp'">
        <el-form-item label="远程端口" prop="remotePort" required title="服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务。">
          <el-input-number v-model="result.remotePort" :min="0" :max="65535" placeholder="8080" />
        </el-form-item>
      </template>

      <template v-if="result.type === 'tcpmux'">
        <el-form-item label="用户名" prop="httpUser">
          <el-input
            v-model="result.httpUser"
            placeholder="用户名，如果配置此参数，通过 HTTP CONNECT 建立连接时需要通过 Proxy-Authorization 附加上正确的身份信息。"
          />
        </el-form-item>
        <el-form-item label="密码" prop="httpPassword">
          <el-input v-model="result.httpPassword" placeholder="密码。" />
        </el-form-item>
        <el-form-item label="路由" prop="routeByHTTPUser">
          <el-input v-model="result.routeByHTTPUser" placeholder="根据 HTTP Basic Auth user 路由。" />
        </el-form-item>
        <el-form-item label="复用器类型" prop="multiplexer">
          <el-input v-model="result.multiplexer" placeholder="复用器类型，目前仅支持 httpconnect。" />
        </el-form-item>
      </template>

      <template v-if="result.type === 'stcp' || result.type === 'xtcp' || result.type === 'sudp'">
        <el-form-item label="密钥" prop="secretKey">
          <el-input v-model="result.secretKey" />
        </el-form-item>
        <el-form-item v-if="result.allowUsers" label="用户" :prop="`allowUsers[${idx}]`" v-for="(_, idx) in result.allowUsers" required>
          <div class="flex w-full items-center">
            <el-input class="flex-1 pr-2" v-model="result.allowUsers[idx]" />
            <el-icon class="cursor-pointer"><Close @click="result.allowUsers.splice(idx, 1)" /></el-icon>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button @click="result.allowUsers = [...(result.allowUsers ?? []), '']">添加允许访问用户</el-button>
        </el-form-item>
      </template>

      <el-form-item label="使用插件" prop="tls_enable">
        <el-checkbox :model-value="enablePlugin" @change="handleUsePlugin" />
        <el-tooltip content="客户端插件配置，如果启用了客户端插件，则不需要配置 localIP 和 localPort。" placement="top">
          <el-icon class="ml-5"><QuestionFilled /></el-icon>
        </el-tooltip>
      </el-form-item>

      <template v-if="result.plugin">
        <el-form-item label="插件名" prop="plugin.type" required>
          <el-select v-model="result.plugin.type">
            <el-option label="http_proxy" value="http_proxy" />
            <el-option label="socks5" value="socks5" />
            <el-option label="static_file" value="static_file" />
            <el-option label="unix_domain_socket" value="unix_domain_socket" />
            <el-option label="http2https" value="http2https" />
            <el-option label="https2http" value="https2http" />
            <el-option label="https2https" value="https2https" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="result.plugin.type">插件参数</el-form-item>
        <template v-if="result.plugin.type === 'http_proxy'">
          <el-form-item label="代理用户名" prop="plugin.httpUser">
            <el-input v-model="result.plugin.httpUser" placeholder="HTTP 代理用户名。" />
          </el-form-item>
          <el-form-item label="代理密码" prop="plugin.httpPassword">
            <el-input v-model="result.plugin.httpPassword" placeholder="HTTP 代理密码。" type="password" show-password />
          </el-form-item>
        </template>
        <template v-if="result.plugin.type === 'socks5'">
          <el-form-item label="用户名" prop="plugin.username">
            <el-input v-model="result.plugin.username" placeholder="用户名。" />
          </el-form-item>
          <el-form-item label="密码" prop="plugin.password">
            <el-input v-model="result.plugin.password" placeholder="密码。" type="password" show-password />
          </el-form-item>
        </template>
        <template v-if="result.plugin.type === 'static_file'">
          <el-form-item label="文件路径" prop="plugin.localPath" required>
            <el-input v-model="result.plugin.localPath" placeholder="静态文件所在本地路径。" />
          </el-form-item>
          <el-form-item label="特定前缀" prop="plugin.stripPrefix">
            <el-input v-model="result.plugin.stripPrefix" placeholder="去除用户 HTTP 请求 Path 的特定前缀。" />
          </el-form-item>
          <el-form-item label="用户名" prop="plugin.httpUser">
            <el-input v-model="result.plugin.httpUser" placeholder="HTTP Basic Auth 用户名。" />
          </el-form-item>
          <el-form-item label="密码" prop="plugin.httpPassword">
            <el-input v-model="result.plugin.httpPassword" placeholder="HTTP Basic Auth 密码。" type="password" show-password />
          </el-form-item>
        </template>
        <template v-if="result.plugin.type === 'unix_domain_socket'">
          <el-form-item label="地址" prop="plugin.unixPath" required>
            <el-input v-model="result.plugin.unixPath" placeholder="UNIX 域套接字的地址。" />
          </el-form-item>
        </template>
        <template v-if="result.plugin.type === 'http2https' || result.plugin.type === 'https2http' || result.plugin.type === 'https2https'">
          <el-form-item label="地址" prop="plugin.localAddr" required>
            <el-input v-model="result.plugin.localAddr" placeholder="本地 HTTPS 服务地址。" />
          </el-form-item>
          <el-form-item label="Host header" prop="plugin.hostHeaderRewrite">
            <el-input v-model="result.plugin.hostHeaderRewrite" placeholder="替换 Host header。" />
          </el-form-item>
          <!-- TODO: requestHeaders -->
          <template v-if="result.plugin.type === 'https2http' || result.plugin.type === 'https2https'">
            <el-form-item label="证书路径" prop="plugin.crtPath">
              <el-input v-model="result.plugin.crtPath" placeholder="TLS 证书文件路径。" />
            </el-form-item>
            <el-form-item label="密钥路径" prop="plugin.keyPath">
              <el-input v-model="result.plugin.keyPath" placeholder="TLS 密钥文件路径。" />
            </el-form-item>
          </template>
        </template>
      </template>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { cloneDeep } from 'lodash';
import { CheckboxValueType, ElMessage, FormInstance } from 'element-plus';
import { QuestionFilled, Close } from '@element-plus/icons-vue';

const form = ref<FormInstance>(null!);
const result = ref<FrpcConfig.Proxie>(null!);

const props = withDefaults(defineProps<{ modelValue?: boolean; data?: FrpcConfig.Proxie }>(), {
  modelValue: false,
  data: () => ({ type: 'http', name: '', transport: { useCompression: true, useEncryption: true } })
});
const emit = defineEmits(['update:modelValue', 'enter']);

const enablePlugin = computed(() => !!result.value.plugin);

watch(
  () => props.data,
  () => {
    result.value = cloneDeep(props.data);
  },
  { immediate: true }
);

function handleUsePlugin(value: CheckboxValueType) {
  if (value) delete result.value.plugin;
  else result.value.plugin = {} as any;
}

async function handleSave() {
  const check = await form.value.validate().catch(() => false);
  if (!check) return ElMessage.error('请检查配置是否正确');
  if (result.value.type === 'http' || result.value.type === 'https' || result.value.type === 'tcpmux') {
    if (!(result.value.customDomains?.length || result.value.subdomain)) return ElMessage.error('自定义域名和子域名两者必须配置一个');
  }
  emit('enter', result.value);
}
</script>
