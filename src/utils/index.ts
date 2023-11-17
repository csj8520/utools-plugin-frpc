import axios from 'axios';
import type { components } from '@octokit/openapi-types';

export const delay = (t: number) => new Promise(res => setTimeout(res, t));

const platformDict: Record<string, string> = {
  darwin: 'darwin',
  win32: 'windows',
  linux: 'linux'
};

const archDict: Record<string, string> = {
  arm: 'arm',
  arm64: 'arm64',
  ia32: '386',
  x64: 'amd64'
};

export async function getFrpcLatestVersion(platform: NodeJS.Platform, arch: string) {
  if (!(platform in platformDict && arch in archDict)) return null;
  const { status, data } = await axios.get<components['schemas']['release']>('https://api.github.com/repos/fatedier/frp/releases/latest');
  if (status !== 200) return null;
  const name = `${platformDict[platform]}_${archDict[arch]}`;
  return {
    release: data,
    currentAssets: data.assets.find(it => it.name.includes(name))
  };
}
