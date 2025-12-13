<template>
  <div class="h-full overflow-y-auto p-3 lh-tight text-sm flex flex-col gap-2" ref="el" @scroll="handleScroll">
    <p v-for="it in logs" :key="it.uuid" class="bg-dark rd-2 px2 py1">
      <span v-for="t in it.spans" :style="t.css">{{ t.text }}</span>
    </p>
    <el-tooltip content="清空日志" placement="top">
      <el-button class="absolute right-5 bottom-3" type="danger" :icon="Delete" circle @click="logs = []" />
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import { AnsiColored } from 'ansicolor';
import { Delete } from '@element-plus/icons-vue';

export interface Log extends AnsiColored {
  uuid: string;
}

const logs = defineModel<Log[]>('logs', { default: () => [] });

const el = useTemplateRef('el');

let systemScroll = false;
let userScroll = false;

watch(
  () => logs,
  async () => {
    await nextTick();
    if (!el.value) return;
    if (userScroll) return;
    systemScroll = true;
    el.value.scrollTop = el.value.scrollHeight - el.value.offsetHeight;
    await nextTick();
    systemScroll = false;
  },
  { deep: true, immediate: true },
);

function handleScroll() {
  if (!el.value) return;
  if (systemScroll) return;
  const offsetBottom = el.value.scrollHeight - el.value.offsetHeight - el.value.scrollTop;
  userScroll = offsetBottom > 100;
}
</script>
