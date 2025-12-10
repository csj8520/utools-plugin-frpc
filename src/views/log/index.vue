<template>
  <div class="h-full overflow-y-auto p-3 lh-tight text-sm flex flex-col gap-2" ref="el" @scroll="handleScroll">
    <p v-for="(it, idx) in logs" :key="idx" class="bg-dark rd-2 px2 py1">
      <span v-for="(t, i) in it.spans" :style="t.css">{{ t.text }}</span>
    </p>
    <el-tooltip content="清空日志" placement="top">
      <el-button class="absolute right-5 bottom-3" type="danger" :icon="Delete" circle @click="emit('update:logs', [])" />
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped></style>

<script lang="ts" setup>
import { AnsiColored } from 'ansicolor';
import { ref, watch, nextTick } from 'vue';
import { Delete } from '@element-plus/icons-vue';

import { delay } from '../../utils';

const props = withDefaults(defineProps<{ logs?: AnsiColored[] }>(), { logs: () => [] });
const emit = defineEmits<{
  (e: 'update:logs', v: AnsiColored[]): void;
}>();
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
  { deep: true },
);

function handleScroll() {
  if (systemScroll) return;
  userScroll = el.value.scrollHeight - el.value.offsetHeight - el.value.scrollTop > 200;
}

// const handleScroll = throttle(_handleScroll, 200, { leading: false, trailing: true });
</script>
