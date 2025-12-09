<template>
  <el-form-item :label="label" :prop="prop">
    <div class="flex flex-col items-start gap-6 wfull">
      <el-form-item class="wfull" v-for="(it, key) in modelValue" :prop="[prop, key].join('.')" required>
        <div class="flex items-center gap-5 wfull">
          <span class="text-right flex-1">{{ key }}:</span>
          <el-input class="flex-1" v-model="modelValue[key]" placeholder="value" type="text" />
          <el-icon class="cursor-pointer"><Close @click="delete modelValue[key]" /></el-icon>
        </div>
      </el-form-item>
      <el-form-item>
        <div class="flex gap-5">
          <el-input v-model="key" placeholder="key" type="text" />
          <span>:</span>
          <el-input v-model="value" placeholder="value" type="text" />
          <el-button @click="handleAdd">添加</el-button>
        </div>
      </el-form-item>
    </div>
  </el-form-item>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';

const modelValue = defineModel<Record<string, string>>({ required: true });

defineProps<{
  label: string;
  prop: string;
}>();

const key = ref('');
const value = ref('');

function handleAdd() {
  if (key.value in modelValue.value) return ElMessage.error('key已存在');
  modelValue.value = {
    ...modelValue.value,
    [key.value]: value.value,
  };
  // modelValue.value[key.value] = value.value;
  key.value = '';
  value.value = '';
}
</script>
