import { computed, ref } from 'vue';

export const config = ref<FrpcConfig>({
  auth: {},
  log: {},
  transport: {},
  proxies: [],
});

export const customConfig = ref<CustomConfig>({
  saveRestart: false,
});

export const allName = computed(() => [...(config.value.proxies ?? []), ...(config.value.visitors ?? [])].map(it => it.name));
export const allStart = computed(() => {
  return config.value.start?.length ? config.value.start : allName.value;
});

export function switchStatus(name: string, open?: boolean) {
  const op = open ?? !allStart.value.includes(name);
  const start = allName.value.filter(it => {
    if (it === name) return op;
    return allStart.value.includes(it);
  });

  config.value.start = start.length ? start : [''];
}
