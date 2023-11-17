import fs from 'fs/promises';
import { promisify } from 'util';
import { EventEmitter } from '@3xpo/events';
import { ChildProcessWithoutNullStreams, spawn, execFile } from 'child_process';

type FrpcEvent = {
  log(log: string): void;
  error(log: string): void;
  exit(): void;
};

export class Frpc extends EventEmitter<FrpcEvent> {
  public process: ChildProcessWithoutNullStreams | null = null;
  public configPath: string;
  public frpcBinPath: string;
  public version: string = '0.0.0';
  public hasFrpcBinFile: boolean = false;
  public config: FrpcConfig = this.defConfig;

  public get isRuning() {
    if (!this.process) return false;
    return !this.process.killed;
  }

  public get defConfig(): FrpcConfig {
    return { auth: {}, log: {}, transport: {}, proxies: [], _custom: {} };
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
      this.version = (await promisify(execFile)(this.frpcBinPath, ['-v'])).stdout;
    }

    // 读取 db 数据，若无数据则读取 json 配置
    const data = utools.dbStorage.getItem('config-json');
    if (data) {
      this.config = data as FrpcConfig;
      await this.saveConfig(this.config);
    } else {
      // 兼容旧数据
      const oldData = utools.dbStorage.getItem('config');
      console.log('oldData: ', oldData);
      if (oldData) {
        this.config = {
          serverAddr: oldData.common.server_addr,
          serverPort: oldData.common.server_port,
          user: oldData.common.user,
          loginFailExit: oldData.common.login_fail_exit,
          dnsServer: oldData.common.dns_server,
          auth: { token: oldData.common.token },
          log: { level: oldData.common.log_level },
          transport: {
            protocol: oldData.common.protocol,
            proxyURL: oldData.common.http_proxy,
            poolCount: oldData.common.pool_count
          },
          webServer: oldData.common.admin_port && {
            addr: oldData.common.admin_addr,
            port: oldData.common.admin_port,
            user: oldData.common.admin_user,
            password: oldData.common.admin_pwd
          },
          _custom: { ...oldData.custom },
          proxies: (oldData.proxys as any[]).map(it => ({
            name: it._name,
            _enable: it._enable,
            type: it.type,
            transport: { useCompression: it.use_compression, useEncryption: it.use_encryption },
            localIP: it.local_ip || it.bind_addr,
            localPort: it.local_port || it.bind_port,
            remotePort: it.remote_port,
            subdomain: it.subdomain,
            customDomains: it.custom_domains?.split(','),
            hostHeaderRewrite: it.host_header_rewrite,
            plugin:
              it.plugin === 'http_proxy'
                ? {
                    type: 'http_proxy',
                    httpUser: it.plugin_http_user,
                    httpPassword: it.plugin_http_passwd
                  }
                : it.plugin === 'socks5'
                ? {
                    type: 'socks5',
                    username: it.plugin_user,
                    password: it.plugin_passwd
                  }
                : it.plugin === 'static_file'
                ? {
                    type: 'static_file',
                    localPath: it.plugin_local_path,
                    stripPrefix: it.plugin_strip_prefix,
                    httpUser: it.plugin_http_user,
                    httpPassword: it.plugin_http_passwd
                  }
                : it.plugin === 'unix_domain_socket'
                ? {
                    type: 'unix_domain_socket',
                    unixPath: it.plugin_unix_path
                  }
                : it.plugin === 'http2https'
                ? {
                    type: 'http2https',
                    localAddr: it.plugin_local_addr,
                    hostHeaderRewrite: it.plugin_host_header_rewrite
                    // requestHeaders: {}
                  }
                : it.plugin === 'https2http' || it.plugin === 'https2https'
                ? {
                    type: it.plugin as 'https2http',
                    localAddr: it.plugin_local_addr,
                    hostHeaderRewrite: it.plugin_host_header_rewrite,
                    crtPath: it.plugin_crt_path,
                    keyPath: it.plugin_key_path
                    // requestHeaders: {}
                  }
                : void 0
          }))
        };
        await this.saveConfig(this.config);
        // utools.dbStorage.removeItem('config');
      } else {
        const stat = await fs.stat(this.configPath).catch(() => null);
        if (!stat?.isFile()) {
          this.config = this.defConfig;
        } else {
          const file = await fs.readFile(this.configPath);
          this.config = { ...this.defConfig, ...JSON.parse(file.toString()) };
        }
      }
    }
  }

  public async saveConfig(json: FrpcConfig) {
    // 保存配置到 utools，同时写入到 json
    utools.dbStorage.setItem('config-json', json);
    await fs.writeFile(
      this.configPath,
      JSON.stringify(
        {
          ...json,
          proxies: json.proxies.filter(it => it._enable).map(({ _enable: _, ...other }) => ({ ...other }))
        },
        void 0,
        2
      )
    );
    this.config = json;
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
