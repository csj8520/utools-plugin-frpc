import fs from 'fs/promises';
import * as jsIni from 'js-ini';
import { EventEmitter } from 'typed-events.ts';
import { ChildProcessWithoutNullStreams, spawn, execFile } from 'child_process';

type FrpcEvent = {
  log(log: string): void;
  run(): void;
  exit(): void;
};

export class Frpc extends EventEmitter<FrpcEvent> {
  public process: ChildProcessWithoutNullStreams | null = null;
  public configPath: string;
  public frpcBinPath: string;
  public version: string = '0.0.0';

  public get isRuning() {
    if (!this.process) return false;
    return !this.process.killed;
  }

  constructor(op: { configPath: string; frpcBinPath: string }) {
    super();
    this.configPath = op.configPath;
    this.frpcBinPath = op.frpcBinPath;
  }

  public iniToJson(ini: string): FrpcConfig {
    const { common = {}, ...proxys } = jsIni.parse(ini, { comment: '#' }) as any;
    return {
      common,
      proxys: Object.entries(proxys).map(([_name, value]) => ({ _name, _enable: true, ...(value as any) }))
    };
  }

  public jsonToIni(json: FrpcConfig): string {
    const proxys = json.proxys.filter(it => it._enable).reduce((obj, { _name, _enable, ...other }) => ({ ...obj, [_name as string]: other }), {});
    return jsIni.stringify({ common: json.common, ...proxys });
  }

  public async getConfig(): Promise<FrpcConfig> {
    // 读取 db 数据，若无数据则读取 ini 配置
    const data = utools.dbStorage.getItem('config');
    if (data) return data as FrpcConfig;
    const stat = await fs.stat(this.configPath).catch(() => null);
    if (!stat?.isFile()) return { common: {}, proxys: [] };
    const ini = await fs.readFile(this.configPath);
    return this.iniToJson(ini.toString());
  }

  public async saveConfig(json: FrpcConfig) {
    // 保存配置到 utools，同时写入到 ini
    utools.dbStorage.setItem('config', json);
    await fs.writeFile(this.configPath, this.jsonToIni(json));
  }

  public async getFrpcVersion() {
    this.version = await new Promise<string>((res, rej) => {
      execFile(this.frpcBinPath, ['-v'], (err, stdout) => (err ? rej(err) : res(stdout)));
    });
    return this.version;
  }

  public async haveFrpcBinFile() {
    const stat = await fs.stat(this.frpcBinPath).catch(() => null);
    return Boolean(stat?.isFile());
  }

  public async saveFrpcBinFile(buf: ArrayBuffer) {
    // https://www.nodeapp.cn/fs.html#fs_file_modes
    await fs.writeFile(this.frpcBinPath, Buffer.from(buf), { mode: 0o755 });
  }

  public run() {
    if (this.isRuning) throw new Error('Frpc is runing');
    this.process = spawn(this.frpcBinPath, ['-c', this.configPath]);
    this.process.stdout.on('data', (chunks: Buffer) => this.emit('log', chunks.toString()));
    this.process.stderr.on('data', (chunks: Buffer) => this.emit('log', chunks.toString()));

    this.emit('run');
    this.emit('log', `Frpc pid: ${this.process.pid}`);
    this.process.on('error', err => this.emit('log', err.message));
    this.process.on('exit', (code, signal) => {
      this.process = null;
      this.emit('log', `Frpc Exit code: ${code}, signal: ${signal}`);
      this.emit('exit');
    });
  }

  public exit() {
    if (this.isRuning) this.process!.kill();
  }
}
