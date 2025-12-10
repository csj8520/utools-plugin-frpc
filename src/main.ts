import { createApp } from 'vue';
import { ElNotification, ElLoading } from 'element-plus';

// https://github.com/element-plus/element-plus/issues/9214
import 'element-plus/es/components/message/style/css';
import 'element-plus/es/components/notification/style/css';
// import 'element-plus/es/components/dialog/style/css';
import 'element-plus/es/components/message-box/style/css';

import 'element-plus/theme-chalk/dark/css-vars.css';

import '@unocss/reset/normalize.css';
import 'virtual:uno.css';

import './style.css';
import App from './App.vue';

function handleError(error: any) {
  // 屏蔽在控制输入代码报错信息
  // if (error instanceof ErrorEvent && error.message === 'Uncaught EvalError: Possible side-effect in debug-evaluate') return;
  if (error === 'cancel') return;
  if (error === 'close') return;
  console.error(error);
  ElNotification({
    title: 'Error',
    message: error.message ?? String(error),
    type: 'error',
  });
}

const app = createApp(App);

app.config.errorHandler = handleError;
// window.addEventListener('error', handleError);
app.use(ElLoading);

app.mount('#app');
