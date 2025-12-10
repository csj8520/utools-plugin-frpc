import fs from 'fs/promises';
import { promisify } from 'util';
import { EventEmitter } from '@3xpo/events';
import { ChildProcessWithoutNullStreams, spawn, execFile } from 'child_process';
import TOML from 'smol-toml';

type FrpcEvent = {
  log(log: string): void;
  error(log: string): void;
  exit(): void;
  start(): void;
};

/**
 * @deprecated
 * 本地 toml 优先，utools db 后备，下个大版本移除
 */
const DEP_CONFIG_KEY = 'config-json';

export class Frpc extends EventEmitter<FrpcEvent> {
  private process: ChildProcessWithoutNullStreams | null = null;
  public configPath: string;
  public frpcPath: string;
  public version: string = '0.0.0';
  public hasFrpc: boolean = false;
  public config: FrpcConfig = {};

  public get isRuning() {
    if (!this.process) return false;
    return !this.process.killed;
  }

  constructor(op: { configPath: string; frpcBinPath: string }) {
    super();
    this.configPath = op.configPath;
    this.frpcPath = op.frpcBinPath;
  }

  private async readLocalConfig() {
    try {
      const has = await fs.stat(this.configPath).catch(() => null);
      if (!has?.isFile()) {
        await this.saveConfig(utools.dbStorage.getItem(DEP_CONFIG_KEY) || {});
        // utools.dbStorage.removeItem(DEP_CONFIG_KEY);
      }

      const text = (await fs.readFile(this.configPath)).toString();
      return TOML.parse(text);
    } catch (error) {
      this.emit('error', '配置文件读取失败，请检查配置文件格式！');
      this.emit('error', String(error));
      return {};
    }
  }

  public async init() {
    await this.reloadLocalConfig();

    const stat = await fs.stat(this.frpcPath).catch(() => null);
    this.hasFrpc = Boolean(stat?.isFile());
    if (this.hasFrpc) {
      this.version = (await promisify(execFile)(this.frpcPath, ['-v'])).stdout.trim();
    }
  }

  public async reloadLocalConfig() {
    this.config = await this.readLocalConfig();
  }

  public async saveConfig(json: FrpcConfig) {
    await fs.writeFile(this.configPath, TOML.stringify(json));
    this.config = json;
  }

  public async saveFrpcBinFile(buf: ArrayBuffer) {
    // https://www.nodeapp.cn/fs.html#fs_file_modes
    await fs.writeFile(this.frpcPath, Buffer.from(buf), { mode: 0o755 });
  }

  public run() {
    if (this.isRuning) throw new Error('Frpc is runing');
    this.process = spawn(this.frpcPath, ['-c', this.configPath]);
    this.process.stdout.on('data', (chunks: Buffer) => this.emit('log', chunks.toString()));
    this.process.stderr.on('data', (chunks: Buffer) => this.emit('error', chunks.toString()));

    this.emit('log', `Frpc pid: ${this.process.pid}`);
    this.process.on('error', err => this.emit('error', err.message));
    this.process.on('exit', (code, signal) => {
      this.process = null;
      if ((code ?? 0) === 0) this.emit('log', `Frpc Exit code: ${code}, signal: ${signal}`);
      else this.emit('error', `Frpc 异常退出 code: ${code}, signal: ${signal}, 请检查配置！`);
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
