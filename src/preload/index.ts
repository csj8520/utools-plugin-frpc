import os from 'os';
import path from 'path';
import fs from 'fs';

import { Frpc } from './frpc';

export const platform = os.platform();
export const arch = os.arch();

const baseDir = path.join(utools.getPath('home'), '.utools-plugin-frpc');

const frpcBinPath = path.join(baseDir, platform === 'win32' ? 'frpc.exe' : 'frpc');
console.log('frpcBinPath: ', frpcBinPath);
const configPath = path.join(baseDir, 'frpc.toml');
console.log('configPath: ', configPath);

const stat = fs.statSync(baseDir, { throwIfNoEntry: false });
if (!stat?.isDirectory()) fs.mkdirSync(baseDir, { recursive: true });
// utools.onPluginEnter(async () => {});

utools.onPluginOut(async exit => {
  if (!exit) return;
  frpc.isRuning && frpc.exit();
});

export const frpc = new Frpc({ frpcBinPath, configPath });
