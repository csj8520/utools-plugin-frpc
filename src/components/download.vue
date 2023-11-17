<template>
  <el-dialog :model-value="modelValue" @close="handleCancle" title="下载 Frpc">
    <div v-if="!latest?.currentAssets">
      <p class="pb-5 text-center">正在为你查找最新版 Frpc 客户端</p>
      <span class="flex w-full h-10 relative" v-if="searchIng" v-loading="searchIng" element-loading-background="rgba(0,0,0,0)"></span>
      <template v-if="searchError">
        <p class="pb-5 text-center">获取失败，你可以手动下载 frpc 可执行文件放入：</p>
        <p class="text-center">{{ frpc.frpcBinPath }}</p>
      </template>
    </div>

    <template v-else>
      <p class="text-center text-xl font-bold">{{ semver.gte(frpc.version, latest.release.tag_name) ? '当前已是最新版本' : '检测到新版本' }}</p>
      <p class="text-xl font-600">{{ latest.release.tag_name }}</p>
      <pre class="whitespace-pre-wrap">{{ latest.release.body }}</pre>
      <el-input class="mb-5" v-model="latest.currentAssets.browser_download_url"> <template #prepend>下载地址</template></el-input>
      <el-progress class="mb-5" :percentage="downloadProgress" />
    </template>
    <template #footer v-if="latest?.currentAssets">
      <el-button @click="handleDownload" type="primary" :disabled="downloadIng">开始下载</el-button>
      <el-button @click="handleCancle">取消</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import semver from 'semver';
import SevenZip from '7z-wasm';
import { h, ref, watch } from 'vue';
import type { AsyncReturnType } from 'type-fest';
import axios, { CancelTokenSource } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

import { getFrpcLatestVersion } from '../utils';

const { frpc, platform, arch } = window.preload;

const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false });
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const searchIng = ref<boolean>(false);
const searchError = ref<boolean>(false);
const latest = ref<AsyncReturnType<typeof getFrpcLatestVersion>>();
const downloadProgress = ref<number>(0);
const cancelTokens = ref<CancelTokenSource>();
const downloadIng = ref<boolean>(false);

watch(
  () => props.modelValue,
  async () => {
    if (!props.modelValue) return;
    try {
      searchIng.value = true;
      searchError.value = false;
      latest.value = null;
      downloadProgress.value = 0;

      latest.value = await getFrpcLatestVersion(platform, arch);

      if (!latest.value?.currentAssets) return;
      latest.value.currentAssets.browser_download_url = 'https://gh-proxy.com/' + latest.value.currentAssets.browser_download_url;
      // searchLatest.url = 'http://127.0.0.1:8080/frp_0.43.0_windows_amd64.zip';
      // searchLatest.url = 'http://127.0.0.1:8080/frp_0.42.0_linux_amd64.tar.gz';
    } catch (error) {
      searchError.value = true;
      throw error;
    } finally {
      searchIng.value = false;
    }
  },
  { immediate: true }
);

async function handleDownload() {
  try {
    downloadIng.value = true;
    if (utools.isWindows()) {
      await ElMessageBox.confirm(
        h('p', [
          '如果系统检测到有病毒，请允许此操作 ',
          h(
            'a',
            {
              href: 'javascript:void(0)',
              onClick: () => utools.shellOpenExternal('https://github.com/fatedier/frp/issues/1204')
            },
            '查看详情'
          )
        ])
      );
    }

    if (frpc.isRuning) {
      await ElMessageBox.confirm('需要先关闭 Frpc');
      frpc.exit();
    }
    cancelTokens.value = axios.CancelToken.source();
    const { status, data } = await axios.get<ArrayBuffer>(latest.value!.currentAssets!.browser_download_url, {
      cancelToken: cancelTokens.value.token,
      responseType: 'arraybuffer',
      onDownloadProgress: p => p.total && (downloadProgress.value = Math.floor((p.loaded / p.total) * 90))
    });

    cancelTokens.value = void 0;
    if (status !== 200) return ElMessage.error('下载错误');

    const archiveData = new Uint8Array(data);
    const sevenZip = await SevenZip({ print: s => frpc.emit('log', s) });
    downloadProgress.value = 92;
    const name = new URL(latest.value!.currentAssets!.browser_download_url).pathname.split('/').at(-1)!;
    const stream = sevenZip.FS.open(name, 'w+', 0o777);
    sevenZip.FS.write(stream, archiveData, 0, archiveData.length);
    sevenZip.FS.close(stream);
    let file: Uint8Array | void = void 0;
    if (name.endsWith('.zip')) {
      sevenZip.callMain(['e', name, 'frpc.exe', '-r']);
      sevenZip.FS.chmod('frpc.exe', 0o777);
      file = sevenZip.FS.readFile('frpc.exe', { encoding: 'binary' });
    } else if (name.endsWith('.tar.gz')) {
      sevenZip.callMain(['e', name]);
      sevenZip.callMain(['e', name.slice(0, -3), 'frpc', '-r']);
      sevenZip.FS.chmod('frpc', 0o777);
      file = sevenZip.FS.readFile('frpc', { encoding: 'binary' });
    }
    downloadProgress.value = 98;
    if (file) {
      await frpc.saveFrpcBinFile(file.buffer);
      downloadProgress.value = 100;
      ElMessage.success('下载成功');
      emit('update:modelValue', false);
      emit('success');
    } else {
      return ElMessage.error('解压文件出错');
    }
  } catch (error: any) {
    console.log('error: ', error);
    if (error === 'cancel') return;
    if (error?.code === axios.AxiosError.ERR_CANCELED) return;
    frpc.emit('error', String(error));
  } finally {
    cancelTokens.value = void 0;
    downloadIng.value = false;
  }
}

function handleCancle() {
  cancelTokens.value?.cancel();
  cancelTokens.value = void 0;
  emit('update:modelValue', false);
}
</script>
