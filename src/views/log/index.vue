<template>
  <div class="log" ref="el" @scroll="handleScroll">
    <p v-for="(it, idx) in logs" :key="idx">{{ it }}</p>
    <el-tooltip content="清空日志" placement="top">
      <el-button class="log__clean" type="danger" :icon="Delete" circle @click="emit('clean')" />
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.log {
  height: 100%;
  overflow-y: auto;
  padding: 10px 10px 50px;
  line-height: 1.4;
  font-size: 14px;
  &__clean {
    position: absolute;
    right: 25px;
    bottom: 20px;
  }
}
</style>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { Delete } from '@element-plus/icons-vue';

import { delay } from '../../utils';

const props = withDefaults(defineProps<{ logs?: string[] }>(), { logs: () => [] });
const emit = defineEmits(['clean']);
const el = ref<HTMLDivElement>(null!);

let systemScroll = false;
let userScroll = false;

watch(
  () => props.logs,
  async () => {
    if (userScroll) return;
    await nextTick();
    systemScroll = true;
    el.value.scrollTop = el.value.scrollHeight - el.value.offsetHeight;
    await delay(50);
    systemScroll = false;
  },
  { deep: true }
);

function handleScroll() {
  if (systemScroll) return;
  userScroll = el.value.scrollHeight - el.value.offsetHeight - el.value.scrollTop > 200;
}

// const handleScroll = throttle(_handleScroll, 200, { leading: false, trailing: true });
</script>
