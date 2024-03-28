import { ref } from 'vue';

export const config = ref<FrpcConfig>({
  auth: {},
  log: {},
  transport: {},
  proxies: []
  // _custom: {}
});

export const customConfig = ref<CustomConfig>({
  saveRestart: false
});
