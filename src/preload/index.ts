import os from 'os';
import path from 'path';
import fs from 'fs/promises';

import { Frpc } from './frpc';

export const platform = os.platform();
export const arch = os.arch();

const baseDir = path.join(utools.getPath('home'), '.utools-plugin-frpc');

const frpcBinPath = path.join(baseDir, platform === 'win32' ? 'frpc.exe' : 'frpc');
const configPath = path.join(baseDir, 'frpc.ini');

utools.onPluginEnter(async () => {
  const stat = await fs.stat(baseDir).catch(() => null);
  if (!stat?.isDirectory()) await fs.mkdir(baseDir, { recursive: true });
});

utools.onPluginOut(async exit => {
  if (!exit) return;
  frpc.isRuning && frpc.exit();
});

export const frpc = new Frpc({ frpcBinPath, configPath });
