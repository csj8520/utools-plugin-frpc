import fs from 'fs/promises';
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

  public async getConfig() {
    const stat = await fs.stat(this.configPath).catch(() => null);
    if (!stat?.isFile()) return '';
    return (await fs.readFile(this.configPath)).toString();
  }

  public async saveConfig(config: string) {
    await fs.writeFile(this.configPath, config);
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
