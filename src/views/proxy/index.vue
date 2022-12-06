<template>
  <el-table :data="tableData" stripe>
    <el-table-column prop="name" label="服务备注名" width="100px"/>
    <el-table-column label="远程地址" :formatter="handleFormatRemoteUrl"/>
    <el-table-column label="内网地址" width="150px">
      <template #="{ row }"> {{ `${row.config.local_ip}:${row.config.local_port}` }}</template>
    </el-table-column>
    <el-table-column label="开启加密" width="90px" align="center">
      <template #="{ row }">
        <el-checkbox :model-value="row.config.use_encryption"/>
      </template>
    </el-table-column>
    <el-table-column label="开启压缩" width="90px" align="center">
      <template #="{ row }">
        <el-checkbox :model-value="row.config.use_compression"/>
      </template>
    </el-table-column>
    <el-table-column width="190px" align="center">
      <template #="{ row }">
        <el-button type="primary" plain @click="handleShowEdit(row)">编辑</el-button>
        <el-button type="danger" plain @click="hanldeDel(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-button class="proxy__add" type="primary" @click="handldAdd">添加</el-button>

  <el-dialog v-model="showEdit" title="编辑" style="min-width: 500px">
    <el-form :model="editData" ref="form" label-width="100px">
      <el-form-item label="备注名" prop="name" required>
        <el-input v-model="editData.name"/>
      </el-form-item>
      <el-form-item label="协议类型" prop="config.type" required>
        <el-select v-model="editData.config.type">
          <el-option label="tcp" value="tcp"/>
          <el-option label="udp" value="udp"/>
          <el-option label="http" value="http"/>
          <el-option label="https" value="https"/>
          <el-option label="stcp" value="stcp"/>
          <el-option label="sudp" value="sudp"/>
          <el-option label="xtcp" value="xtcp"/>
          <el-option label="tcpmux" value="tcpmux"/>
        </el-select>
      </el-form-item>
      <div class="proxy__group">
        <el-form-item label="本地IP" prop="config.local_ip" required>
          <el-input v-model="editData.config.local_ip"/>
        </el-form-item>
        <el-form-item label="本地端口" prop="config.local_port" required>
          <el-input-number v-model="editData.config.local_port" :min="0" :max="65535" placeholder="8080"/>
        </el-form-item>
      </div>
      <div class="proxy__group">
        <el-form-item label="开启加密" prop="config.use_encryption">
          <el-checkbox v-model="editData.config.use_encryption"/>
        </el-form-item>
        <el-form-item label="开启压缩" prop="config.use_compression">
          <el-checkbox v-model="editData.config.use_compression"/>
        </el-form-item>
      </div>
      <template
        v-if="editData.config.type === 'http' || editData.config.type === 'https' || editData.config.type === 'tcpmux'">
        <el-form-item label="自定义域名" prop="config.custom_domains">
          <el-input v-model="editData.config.custom_domains"/>
        </el-form-item>
        <el-form-item label="子域名" prop="config.subdomain">
          <el-input v-model="editData.config.subdomain"/>
        </el-form-item>
        <template v-if="editData.config.type === 'https'">
          <el-form-item label="证书CER" prop="config.plugin_crt_path" required>
            <el-input v-model="editData.config.plugin_crt_path" placeholder="请输入证书cer文件绝对路径"/>
          </el-form-item>
          <el-form-item label="证书KEY" prop="config.plugin_key_path" required>
            <el-input v-model="editData.config.plugin_key_path" placeholder="请输入证书key文件绝对路径"/>
          </el-form-item>
        </template>
      </template>
      <template v-else-if="editData.config.type === 'tcp' || editData.config.type === 'udp'">
        <el-form-item label="远程端口" prop="config.remote_port" required>
          <el-input-number v-model="editData.config.remote_port" :min="0" :max="65535" placeholder="8080"/>
        </el-form-item>
      </template>
      <template
        v-else-if="editData.config.type === 'stcp' || editData.config.type === 'sudp' || editData.config.type === 'xtcp'">
        <el-form-item label="角色" prop="config.role" required>
          <el-input v-model="editData.config.role"/>
        </el-form-item>
        <el-form-item label="密钥" prop="config.sk" required>
          <el-input v-model="editData.config.sk"/>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleSaveEdit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.proxy {
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

  &__add {
    position: absolute;
    right: 10px;
    bottom: 60px;
  }
}
</style>

<script lang="ts" setup>
import {cloneDeep} from 'lodash';
import {ref, computed} from 'vue';
import {ElMessage, ElMessageBox, FormInstance} from 'element-plus';

import {config} from '../../config';
import {log} from "util";

const form = ref<FormInstance>(null!);

const showEdit = ref<boolean>(false);
const editKey = ref<keyof FrpcConfig>('');
const editData = ref<typeof tableData.value[0]>({name: '', config: {}});

const tableData = computed(() =>
  Object.entries(config.value)
    .filter(([key]) => key != 'common')
    .map(([key, value]) => ({name: key, config: value as FrpcConfig.Proxy}))
);

function handleFormatRemoteUrl(row: typeof tableData.value[0]) {
  if (row.config.type === 'http' || row.config.type === 'https' || row.config.type === 'tcpmux') {
    const urls: string[] = [];
    if (row.config.custom_domains) urls.push(...row.config.custom_domains.split(',').map(it => `${row.config.type}://${it}`));
    if (row.config.subdomain) urls.push(`${row.config.type}://${row.config.subdomain}.${config.value.common?.server_addr ?? 'unconfig'}`);
    return urls.length ? urls.join(', ') : '-';
  } else if (row.config.type === 'tcp' || row.config.type === 'udp') {
    return `${row.config.type}://${config.value.common?.server_addr ?? 'unconfig'}:${row.config.remote_port ?? 'random'}`;
  }
  return '';
}

function handleShowEdit(row: typeof tableData.value[0]) {
  showEdit.value = true;
  editKey.value = row.name;
  editData.value = cloneDeep(row);
}

async function handleSaveEdit() {
  const check = await form.value.validate().catch(() => false);
  if (!check) return ElMessage.error('请检查配置是否正确');
  const _config = editData.value.config;
  if (_config.type === 'http' || _config.type === 'https' || _config.type === 'tcpmux') {
    if (!(_config.custom_domains || _config.subdomain)) return ElMessage.error('自定义域名和子域名两者必须配置一个');
    if (_config.type === 'https') {
      if (!(_config.plugin_crt_path || _config.plugin_key_path)) return ElMessage.error('证书路径不能为空');
      _config.plugin = 'https2http';
      _config.plugin_local_addr = `${_config.local_ip}:${_config.local_port}`;
    } else {
      _config.plugin = '';
      _config.plugin_local_addr = '';
    }
  }
  if (editKey.value) {
    if (editData.value.name !== editKey.value) delete config.value[editKey.value];
  } else {
    if (editData.value.name in config.value) return ElMessage.error(`配置：[${editData.value.name}] 已存在`);
  }
  console.log(editData.value.config)
  config.value[editData.value.name] = editData.value.config;
  showEdit.value = false;
}

function handldAdd() {
  handleShowEdit({name: '', config: {local_ip: '127.0.0.1', use_compression: true, use_encryption: true}});
}

async function hanldeDel(row: typeof tableData.value[0]) {
  const res = await ElMessageBox.confirm('确定要删除吗').catch(e => e);
  if (res === 'cancel') return;
  delete config.value[row.name];
}
</script>
