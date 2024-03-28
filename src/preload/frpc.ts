import fs from 'fs/promises';
import { promisify } from 'util';
import { EventEmitter } from '@3xpo/events';
import { ChildProcessWithoutNullStreams, spawn, execFile } from 'child_process';

type FrpcEvent = {
  log(log: string): void;
  error(log: string): void;
  exit(): void;
  start(): void;
};

const CONFIG_KEY = 'config-json';
const OLD_CONFIG_KEY = 'config';
const CUSTOM_CONFIG_KEY = 'custom-config';

export class Frpc extends EventEmitter<FrpcEvent> {
  public process: ChildProcessWithoutNullStreams | null = null;
  public configPath: string;
  public frpcBinPath: string;
  public version: string = '0.0.0';
  public hasFrpcBinFile: boolean = false;
  public config: FrpcConfig = this.defConfig;
  public customConfig: CustomConfig = this.defCustomConfig;

  public get isRuning() {
    if (!this.process) return false;
    return !this.process.killed;
  }

  public get defConfig(): FrpcConfig {
    return { auth: {}, log: {}, transport: {}, proxies: [] };
  }

  public get defCustomConfig(): CustomConfig {
    return { saveRestart: false };
  }

  constructor(op: { configPath: string; frpcBinPath: string }) {
    super();
    this.configPath = op.configPath;
    this.frpcBinPath = op.frpcBinPath;
  }

  public async init() {
    const stat = await fs.stat(this.frpcBinPath).catch(() => null);
    this.hasFrpcBinFile = Boolean(stat?.isFile());
    if (this.hasFrpcBinFile) {
      this.version = (await promisify(execFile)(this.frpcBinPath, ['-v'])).stdout.trim();
    }

    // 读取 db 数据，若无数据则读取 json 配置
    const data: FrpcConfig = utools.dbStorage.getItem(CONFIG_KEY) || this.defConfig;
    // fix: config error
    if (data._custom) {
      this.saveCustomConfig({ ...this.defCustomConfig, saveRestart: data._custom.saveRestart || false });
      delete data._custom;
    } else {
      this.customConfig = utools.dbStorage.getItem(CUSTOM_CONFIG_KEY) || this.defCustomConfig;
    }
    await this.saveConfig(data);
  }

  public async saveConfig(json: FrpcConfig) {
    // 保存配置到 utools，同时写入到 json
    utools.dbStorage.setItem(CONFIG_KEY, json);
    await fs.writeFile(this.configPath, JSON.stringify(json, void 0, 2));
    this.config = json;
  }

  public async saveCustomConfig(json: CustomConfig) {
    utools.dbStorage.setItem(CUSTOM_CONFIG_KEY, json);
    this.customConfig = json;
  }

  public async saveFrpcBinFile(buf: ArrayBuffer) {
    // https://www.nodeapp.cn/fs.html#fs_file_modes
    await fs.writeFile(this.frpcBinPath, Buffer.from(buf), { mode: 0o755 });
  }

  public run() {
    if (this.isRuning) throw new Error('Frpc is runing');
    this.process = spawn(this.frpcBinPath, ['-c', this.configPath]);
    this.process.stdout.on('data', (chunks: Buffer) => this.emit('log', chunks.toString()));
    this.process.stderr.on('data', (chunks: Buffer) => this.emit('error', chunks.toString()));

    this.emit('log', `Frpc pid: ${this.process.pid}`);
    this.process.on('error', err => this.emit('error', err.message));
    this.process.on('exit', (code, signal) => {
      this.process = null;
      this.emit('log', `Frpc Exit code: ${code}, signal: ${signal}`);
      this.emit('exit');
    });

    this.emit('start');

    if (!this.process.pid) {
      this.process = null;
      this.emit('exit');
    }
  }

  public async exit() {
    if (!this.isRuning) return;
    await new Promise<void>(res => {
      this.process!.once('exit', () => res());
      this.process!.kill('SIGINT');
    });
    this.process = null;
  }
}
