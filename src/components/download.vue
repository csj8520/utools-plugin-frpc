<template>
  <el-dialog v-model="modelValue" @close="handleCancle" title="下载 Frpc">
    <div v-if="!latest?.currentAssets">
      <p class="pb-5 text-center">正在查找最新版 Frpc 客户端</p>
      <span class="flex w-full h-10 relative" v-if="searchIng" v-loading="searchIng" element-loading-background="rgba(0,0,0,0)"></span>
      <template v-if="searchError">
        <p class="pb-5 text-center">获取失败，可以手动下载 frpc 可执行文件放入：</p>
        <p class="text-center">{{ frpc.frpcPath }}</p>
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
import type { AsyncReturnType } from 'type-fest';
import { ElMessage, ElMessageBox } from 'element-plus';

import { getFrpcLatestVersion } from '../utils';

const { frpc, platform, arch } = window.preload;

const modelValue = defineModel<boolean>();
const emit = defineEmits<{
  success: [];
}>();

const searchIng = ref<boolean>(false);
const searchError = ref<boolean>(false);
const latest = ref<AsyncReturnType<typeof getFrpcLatestVersion>>();
const downloadProgress = ref<number>(0);
const abortController = shallowRef<AbortController>();
const downloadIng = ref<boolean>(false);

watch(
  modelValue,
  async () => {
    if (!modelValue.value) return;
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
  { immediate: true },
);

async function handleDownload() {
  try {
    downloadIng.value = true;
    if (utools.isWindows()) {
      await ElMessageBox.confirm(
        h('p', [
          '如果系统检测到有病毒，请允许此操作 ',
          h('a', { href: 'javascript:void(0)', onClick: () => copyString('https://github.com/fatedier/frp/issues/1204') }, '查看详情'),
        ]),
      );
    }

    if (frpc.isRuning) {
      await ElMessageBox.confirm('需要先关闭 Frpc');
      await frpc.exit();
    }
    abortController.value = new AbortController();
    const res = await fetch(latest.value!.currentAssets!.browser_download_url, { signal: abortController.value.signal });
    if (!res.body) throw new Error('下载错误');
    const reader = res.body.getReader();
    const contentLength = Number(res.headers.get('content-length'));
    const blob = new Uint8Array(contentLength);
    let offset = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      blob.set(value!, offset);
      offset += value!.length;
      downloadProgress.value = Math.floor((offset / contentLength) * 90);
    }

    const archiveData = new Uint8Array(blob);
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
    if (!file) throw new Error('解压文件出错');
    await frpc.saveFrpcBinFile(file.buffer as ArrayBuffer);
    downloadProgress.value = 100;
    ElMessage.success('下载成功');
    modelValue.value = false;
    emit('success');
  } catch (error: any) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    throw error;
  } finally {
    abortController.value = void 0;
    downloadIng.value = false;
  }
}

function handleCancle() {
  abortController.value?.abort();
  abortController.value = void 0;
  modelValue.value = false;
}
</script>
