import type { components } from '@octokit/openapi-types';
import { ElMessage } from 'element-plus';

const platformDict: Record<string, string> = {
  darwin: 'darwin',
  win32: 'windows',
  linux: 'linux',
};

const archDict: Record<string, string> = {
  arm: 'arm',
  arm64: 'arm64',
  ia32: '386',
  x64: 'amd64',
};

export async function getFrpcLatestVersion(platform: NodeJS.Platform, arch: string) {
  if (!(platform in platformDict && arch in archDict)) return null;
  const res = await fetch('https://api.github.com/repos/fatedier/frp/releases/latest');
  if (!res.ok) throw new Error('获取版本信息失败');
  const data: components['schemas']['release'] = await res.json();
  const name = `${platformDict[platform]}_${archDict[arch]}`;
  return { release: data, currentAssets: data.assets.find(it => it.name.includes(name)) };
}

export function copyString(str: string) {
  utools.copyText(str);
  ElMessage.success('已复制到剪贴板');
}

export const frpc = shallowRef(window.preload.frpc);
