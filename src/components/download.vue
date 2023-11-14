<template>
  <el-dialog class="download" :model-value="modelValue" @close="emit('update:modelValue', false)" title="下载 Frpc">
    <div v-if="!searchLatest.url" class="download__loading">
      <p>正在为你查找最新版 Frpc 客户端</p>
      <span v-if="searchLatest.loading" v-loading="searchLatest.loading" element-loading-background="rgba(0,0,0,0)"></span>
      <template v-if="searchLatest.error">
        <p>获取失败，你可以手动下载 frpc 可执行文件放入：</p>
        <p>{{ frpc.frpcBinPath }}</p>
      </template>
    </div>
    <template v-if="searchLatest.url">
      <el-input class="download__mb" v-model="searchLatest.url"> <template #prepend>下载地址</template></el-input>
      <el-progress class="download__mb" :percentage="progress" />
      <div class="download__btns">
        <el-button @click="handleDownload" type="primary" :disabled="!!cancelTokens">开始下载</el-button>
        <el-button @click="handleCancle">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.download {
  &__mb {
    margin-bottom: 10px;
  }
  &__loading {
    text-align: center;
    p {
      padding-bottom: 10px;
    }
    span {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 50px;
    }
  }

  &__btns {
    display: flex;
    justify-content: flex-end;
  }
}
</style>

<script lang="ts" setup>
import SevenZip from '7z-wasm';
import { h, reactive, ref, watch } from 'vue';
import axios, { CancelTokenSource } from 'axios';
import { Action, ElMessage, ElMessageBox } from 'element-plus';

import { getFrpcLatestVersion } from '../utils';

const { frpc, platform, arch } = window.preload;

const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false });
const emit = defineEmits(['update:modelValue', 'success']);

const searchLatest = reactive({ loading: false, error: false, url: '' });

const progress = ref<number>(0);

const cancelTokens = ref<CancelTokenSource>();

watch(
  () => props.modelValue,
  async () => {
    if (!props.modelValue) return;
    try {
      searchLatest.loading = true;
      searchLatest.error = false;
      searchLatest.url = '';
      progress.value = 0;

      const latest = await getFrpcLatestVersion(platform, arch);
      searchLatest.url = 'https://ghproxy.com/' + latest.browser_download_url;
      // searchLatest.url = 'http://127.0.0.1:8080/frp_0.43.0_windows_amd64.zip';
      // searchLatest.url = 'http://127.0.0.1:8080/frp_0.42.0_linux_amd64.tar.gz';
    } catch (error) {
      searchLatest.error = true;
      throw error;
    } finally {
      searchLatest.loading = false;
    }
  },
  { immediate: true }
);

async function handleDownload() {
  try {
    if (utools.isWindows()) {
      const res: Action = await ElMessageBox.confirm(
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
      ).catch(e => e);
      if (res === 'cancel') return;
    }

    if (frpc.isRuning) {
      const res: Action = await ElMessageBox.confirm('需要先关闭 Frpc').catch(e => e);
      if (res === 'cancel') return;
      frpc.exit();
    }
    cancelTokens.value = axios.CancelToken.source();
    const { status, data } = await axios.get<ArrayBuffer>(searchLatest.url, {
      cancelToken: cancelTokens.value.token,
      responseType: 'arraybuffer',
      onDownloadProgress: p => p.total && (progress.value = Math.floor((p.loaded / p.total) * 100))
    });

    cancelTokens.value = void 0;
    if (status !== 200) return ElMessage.error('下载错误');

    const archiveData = new Uint8Array(data);
    const sevenZip = await SevenZip({ print: console.log });
    const name = new URL(searchLatest.url).pathname.split('/').at(-1)!;
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
    if (file) {
      await frpc.saveFrpcBinFile(file.buffer);
      ElMessage.success('下载成功');
      emit('update:modelValue', false);
      emit('success');
    } else {
      return ElMessage.error('解压文件出错');
    }
  } catch (error: any) {
    if (error?.code === 'ERR_CANCELED') return;
    ElMessage.error('下载错误');
    throw error;
  }
}

function handleCancle() {
  cancelTokens.value?.cancel();
  cancelTokens.value = void 0;
  emit('update:modelValue', false);
}
</script>
