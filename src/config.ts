import { ref } from 'vue';

export const config = ref<FrpcConfig>({
  auth: {},
  log: {},
  transport: {},
  proxies: [],
  _custom: {}
});
