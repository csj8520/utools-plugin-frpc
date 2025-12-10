declare interface Window {
  preload: typeof import('./preload/index');
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface CustomConfig {
  saveRestart?: boolean;
  // frpcPath?: string;
  // configPath?: string;
}

// gen from openai https://chatgpt.com/c/ae97de97-f9f6-4c1b-b662-c1d0f564c779

/** FRPC 客户端主配置 */
interface FrpcConfig {
  /** 客户端鉴权配置 */
  auth?: AuthClientConfig;

  /** 用户名，最终代理名会变为 {user}.{proxyName} */
  user?: string;

  /** 服务端地址 */
  serverAddr?: string;

  /** 服务端端口，默认 7000 */
  serverPort?: number;

  /** xtcp 打洞使用的 STUN 服务地址 */
  natHoleStunServer?: string;

  /** 自定义 DNS 服务器地址 */
  dnsServer?: string;

  /** 首次登录失败是否退出，默认 true */
  loginFailExit?: boolean;

  /** 指定启用的代理名称列表 */
  start?: string[];

  /** 日志配置 */
  log?: LogConfig;

  /** Admin WebServer 配置 */
  webServer?: WebServerConfig;

  /** 网络层配置 */
  transport?: ClientTransportConfig;

  /** 虚拟网络配置（Alpha） */
  virtualNet?: VirtualNetConfig;

  /** 特性开关 */
  featureGates?: Record<string, boolean>;

  /** UDP 最大包长，默认 1500 */
  udpPacketSize?: number;

  /** 附加元信息，传递给服务端插件 */
  metadatas?: Record<string, string>;

  /** 额外的配置文件目录 */
  includes?: string[];

  /** 代理配置列表（可选） */
  proxies?: ProxyConfig[];

  /** 访问者配置列表（可选） */
  visitors?: VisitorConfig[];
}

type ProxyConfig =
  | TCPProxyConfig
  | UDPProxyConfig
  | HTTPProxyConfig
  | HTTPSProxyConfig
  | TCPMuxProxyConfig
  | STCPProxyConfig
  | XTCPProxyConfig
  | SUDPProxyConfig;

type VisitorConfig = STCPVisitorConfig | SUDPVisitorConfig | XTCPVisitorConfig;
/** 客户端鉴权配置 */
interface AuthClientConfig {
  /** 鉴权方式，可选 token/oidc */
  method?: 'token' | 'oidc';

  /** 鉴权额外范围，可选 HeartBeats、NewWorkConns */
  additionalScopes?: string[];

  /** token 鉴权时使用 */
  token?: string;

  /** 从文件加载 token 的配置，与 token 互斥 */
  tokenSource?: ValueSource;

  /** OIDC 鉴权配置 */
  oidc?: AuthOIDCClientConfig;
}

/** OIDC 鉴权配置 */
interface AuthOIDCClientConfig {
  /** OIDC 客户端 ID */
  clientID?: string;

  /** OIDC 客户端密钥 */
  clientSecret?: string;

  /** OIDC audience 参数 */
  audience?: string;

  /** OIDC scope 参数 */
  scope?: string;

  /** OIDC 令牌端点 URL */
  tokenEndpointURL?: string;

  /** 附加的端点参数 */
  additionalEndpointParams?: Record<string, string>;

  /** 信任的 CA 证书文件路径 */
  trustedCaFile?: string;

  /** 跳过 TLS 证书验证 */
  insecureSkipVerify?: boolean;

  /** 访问 OIDC 令牌端点使用的代理 URL */
  proxyURL?: string;
}

/** 虚拟网络配置 */
interface VirtualNetConfig {
  /** 虚拟网络接口的 IP 地址和网段（CIDR 格式，例如 "100.86.0.1/24"） */
  address: string;
}

/** 客户端网络层配置。 */
interface ClientTransportConfig {
  /** 和 frps 之间的通信协议，可选值为 tcp, kcp, quic, websocket, wss。默认为 tcp。 */
  protocol?: 'tcp' | 'kcp' | 'quic' | 'websocket' | 'wss';
  /** 连接服务端的超时时间，默认为 10s。 */
  dialServerTimeout?: number;
  /** 和服务端底层 TCP 连接的 keepalive 间隔时间，单位秒。 */
  dialServerKeepalive?: number;
  /** 连接服务端时所绑定的本地 IP。 */
  connectServerLocalIP?: string;
  /** 连接服务端使用的代理地址，格式为 {protocol}://user:passwd@192.168.1.128:8080 protocol 目前支持 http、socks5、ntlm。 */
  proxyURL?: string;
  /** 连接池大小。 */
  poolCount?: number;
  /** TCP 多路复用，默认启用。 */
  tcpMux?: boolean;
  /** tcp_mux 的心跳检查间隔时间。 */
  tcpMuxKeepaliveInterval?: number;
  /** QUIC 协议配置参数。 */
  quic?: QUICOptions;
  /** 向服务端发送心跳包的间隔时间，默认为 30s。建议启用 tcp_mux_keepalive_interval，将此值设置为 -1。 */
  heartbeatInterval?: number;
  /** 和服务端心跳的超时时间，默认为 90s。 */
  heartbeatTimeout?: number;
  /** 客户端 TLS 协议配置。 */
  tls?: TLSClientConfig;
}

/** 日志配置 */
interface LogConfig {
  /** 日志输出路径，为 console 时输出到标准输出 */
  to?: string;
  /** 日志级别，可选 trace/debug/info/warn/error，默认 info */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** 日志文件保留天数，默认 3 天 */
  maxDays?: number;
  /** 禁用控制台日志颜色 */
  disablePrintColor?: boolean;
}

/** Admin WebServer 配置 */
interface WebServerConfig {
  /** 监听地址，默认 127.0.0.1 */
  addr?: string;
  /** 监听端口 */
  port: number;
  /** BasicAuth 用户名 */
  user?: string;
  /** BasicAuth 密码 */
  password?: string;
  /** 自定义静态资源目录 */
  assetsDir?: string;
  /** 启用 pprof 调试 */
  pprofEnable?: boolean;
  /** TLS 配置 */
  tls?: TLSConfig;
}

/** TLS 配置 */
interface TLSConfig {
  /** TLS 证书文件路径 */
  certFile: string;
  /** TLS 私钥文件路径 */
  keyFile: string;
  /** CA 证书文件路径 */
  trustedCaFile?: string;
  /** TLS Server 名称 */
  serverName?: string;
}

/** QUIC 选项 */
interface QUICOptions {
  /** 保活周期，默认 10 秒 */
  keepalivePeriod?: number;
  /** 最大空闲超时，默认 30 秒 */
  maxIdleTimeout?: number;
  /** 最大入站流数量，默认 100000 */
  maxIncomingStreams?: number;
}

/** 端口范围配置 */
interface PortsRange {
  /** 起始端口 */
  start?: number;
  /** 终止端口 */
  end?: number;
  /** 单一端口 */
  single?: number;
}

/** Header 操作 */
interface HeaderOperations {
  /** 设置 KV */
  set?: Record<string, string>;
}

/** 单个 Header */
interface HTTPHeader {
  /** Header 名称 */
  name: string;
  /** Header 值 */
  value: string;
}

/** 数据源类型，目前仅支持 file */
interface ValueSource {
  /** 数据源类型 */
  type: 'file';
  /** 文件配置 */
  file?: FileSource;
}

/** 文件数据源配置 */
interface FileSource {
  /** 文件路径 */
  path: string;
}

/** NAT 穿透配置 */
interface NatTraversalConfig {
  /** 禁用本地网络接口地址的辅助连接 */
  disableAssistedAddrs?: boolean;
}

/** 代理后端服务配置 */
interface ProxyBackend {
  /** 被代理的本地服务 IP，默认 127.0.0.1 */
  localIP?: string;

  /** 被代理的本地服务端口 */
  localPort?: number;

  /** 客户端插件配置，如果启用插件则无需 localIP/localPort */
  plugin?: ClientPluginOptions;
}

type ClientPluginOptions =
  | HTTPProxyPluginOptions
  | Socks5PluginOptions
  | StaticFilePluginOptions
  | UnixDomainSocketPluginOptions
  | HTTP2HTTPSPluginOptions
  | HTTPS2HTTPPluginOptions
  | HTTPS2HTTPSPluginOptions
  | TLS2RawPluginOptions
  | VirtualNetPluginOptions;

/** 代理基础配置，继承 ProxyBackend */
interface ProxyBaseConfig extends ProxyBackend {
  /** 代理名称 */
  name: string;

  /** 代理类型，可选 tcp、udp、http、https、tcpmux、stcp、sudp、xtcp */
  // type: 'tcp' | 'udp' | 'http' | 'https' | 'tcpmux' | 'stcp' | 'sudp' | 'xtcp';

  /** 代理注释信息，展示在 server dashboard 中 */
  annotations?: Record<string, string>;

  /** 代理网络层配置 */
  transport?: ProxyTransport;

  /** 附加元数据，传递给服务端插件 */
  metadatas?: Record<string, string>;

  /** 负载均衡配置 */
  loadBalancer?: LoadBalancerConfig;

  /** 健康检查配置 */
  healthCheck?: HealthCheckConfig;
}

/** 代理网络层配置 */
interface ProxyTransport {
  /** 是否启用加密 */
  useEncryption?: boolean;

  /** 是否启用压缩 */
  useCompression?: boolean;

  /** 单个代理带宽限流 */
  bandwidthLimit?: string;

  /** 限流模式，client/server */
  bandwidthLimitMode?: string;

  /** proxy protocol 版本 */
  proxyProtocolVersion?: 'v1' | 'v2';
}

/** 负载均衡配置 */
interface LoadBalancerConfig {
  /** 分组名称 */
  group: string;

  /** 分组密钥 */
  groupKey?: string;
}
/** 健康检查配置 */
interface HealthCheckConfig {
  /** 检查类型 */
  type: 'tcp' | 'http';

  /** 超时时间(秒) */
  timeoutSeconds?: number;

  /** 连续失败次数 */
  maxFailed?: number;

  /** 检查周期(秒) */
  intervalSeconds?: number;

  /** HTTP 路径 */
  path?: string;

  /** HTTP 请求头 */
  httpHeaders?: HTTPHeader[];
}

/** 域名配置（继承结构） */
interface DomainConfig {
  /** 自定义域名列表 */
  customDomains?: string[];

  /** 子域名 */
  subdomain?: string;
}
/** TCP 代理配置 */
interface TCPProxyConfig extends ProxyBaseConfig {
  /** 服务端绑定端口 */
  type: 'tcp';
  remotePort?: number;
}

/** UDP 代理配置 */
interface UDPProxyConfig extends ProxyBaseConfig {
  /** 服务端绑定端口 */
  type: 'udp';
  remotePort?: number;
}

/** HTTP 代理配置 */
interface HTTPProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'http';
  /** URL 路由 */
  locations?: string[];

  /** HTTP BasicAuth 用户名 */
  httpUser?: string;

  /** HTTP BasicAuth 密码 */
  httpPassword?: string;

  /** 替换 Host header */
  hostHeaderRewrite?: string;

  /** 请求 Header 操作 */
  requestHeaders?: HeaderOperations;

  /** 响应 Header 操作 */
  responseHeaders?: HeaderOperations;

  /** 根据 BasicAuth user 路由 */
  routeByHTTPUser?: string;
}

/** HTTPS 代理配置，继承 DomainConfig */
interface HTTPSProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'https';
}

/** TCPMux 代理配置，继承 DomainConfig */
interface TCPMuxProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'tcpmux';
  /** HTTP CONNECT 用户名 */
  httpUser?: string;

  /** HTTP CONNECT 密码 */
  httpPassword?: string;

  /** 根据 BasicAuth user 路由 */
  routeByHTTPUser?: string;

  /** 复用器类型，目前仅支持 httpconnect */
  multiplexer?: string;
}

/** STCP 代理配置 */
interface STCPProxyConfig extends ProxyBaseConfig {
  type: 'stcp';
  /** 访问密钥 */
  secretKey?: string;

  /**
   * 允许访问的 visitor 用户列表
   * 默认仅允许同一用户访问，"*" 表示允许所有 visitor
   */
  allowUsers?: string[];
}

/** XTCP 代理配置 */
interface XTCPProxyConfig extends ProxyBaseConfig {
  type: 'xtcp';
  /** 访问密钥 */
  secretKey?: string;

  /**
   * 允许访问的 visitor 用户列表
   * 默认仅允许同一用户访问，"*" 表示允许所有 visitor
   */
  allowUsers?: string[];

  /** NAT 穿透配置 */
  natTraversal?: NatTraversalConfig;
}

/** SUDP 代理配置 */
interface SUDPProxyConfig extends ProxyBaseConfig {
  type: 'sudp';
  /** 访问密钥 */
  secretKey?: string;

  /**
   * 允许访问的 visitor 用户列表
   * 默认仅允许同一用户访问，"*" 表示允许所有 visitor
   */
  allowUsers?: string[];
}

/** 访问者网络层配置 */
interface VisitorTransport {
  /** 是否启用加密功能，启用后通信内容会加密传输，如果 frpc 启用了全局 TLS，则不需要再启用此参数 */
  useEncryption?: boolean;

  /** 是否启用压缩功能，启用后通信内容会被压缩传输 */
  useCompression?: boolean;
}

/** 访问者基础配置 */
interface VisitorBaseConfig {
  /** 访问者名称 */
  name: string;

  /** 访问者类型，可选 stcp、sudp、xtcp */
  // type: 'stcp' | 'sudp' | 'xtcp';

  /** 访问者网络层配置 */
  transport?: VisitorTransport;

  /** 密钥，服务端和访问端的密钥需要一致 */
  secretKey?: string;

  /** 要访问的 proxy 所属用户名，如果为空则默认为当前用户 */
  serverUser?: string;

  /** 要访问的 proxy 名称 */
  serverName: string;

  /** visitor 监听的本地地址，通过该地址和端口连接到远端代理服务 */
  bindAddr?: string;

  /** visitor 监听的本地端口，-1 表示不监听物理端口，通常用于 fallback */
  bindPort: number;

  /** 访问者插件配置，用于扩展 visitor 功能 */
  plugin?: VisitorPluginOptions;
}

type VisitorPluginOptions = VirtualNetVisitorPluginOptions;

/** STCP 访问者配置，继承 VisitorBaseConfig */
interface STCPVisitorConfig extends VisitorBaseConfig {
  type: 'stcp';
}

/** SUDP 访问者配置，继承 VisitorBaseConfig */
interface SUDPVisitorConfig extends VisitorBaseConfig {
  type: 'sudp';
}

/** XTCP 访问者配置，继承 VisitorBaseConfig */
interface XTCPVisitorConfig extends VisitorBaseConfig {
  type: 'xtcp';
  /** 隧道底层通信协议，可选 quic 和 kcp，默认为 quic */
  protocol?: 'quic' | 'kcp';

  /** 是否保持隧道打开，会定期检查并尝试保持打开 */
  keepTunnelOpen?: boolean;

  /** 每小时尝试打开隧道的次数，默认值为 8 */
  maxRetriesAnHour?: number;

  /** 重试打开隧道的最小间隔时间（秒），默认 90s */
  minRetryInterval?: number;

  /** 回退到的其他 visitor 名称 */
  fallbackTo?: string;

  /** 连接建立超过多少毫秒后回退到其他 visitor */
  fallbackTimeoutMs?: number;

  /** NAT 穿透配置 */
  natTraversal?: NatTraversalConfig;
}

/** HTTP 代理插件配置 */
interface HTTPProxyPluginOptions {
  /** 插件类型，设置为 "http_proxy" */
  type: 'http_proxy';

  /** HTTP 代理用户名 */
  httpUser?: string;

  /** HTTP 代理密码 */
  httpPassword?: string;
}

/** Socks5 插件配置 */
interface Socks5PluginOptions {
  /** 插件类型，设置为 "socks5" */
  type: 'socks5';

  /** 用户名 */
  username?: string;

  /** 密码 */
  password?: string;
}

/** 静态文件插件配置 */
interface StaticFilePluginOptions {
  /** 插件类型，设置为 "static_file" */
  type: 'static_file';

  /** 静态文件所在本地路径 */
  localPath: string;

  /** 去除用户 HTTP 请求 Path 的特定前缀 */
  stripPrefix?: string;

  /** HTTP Basic Auth 用户名 */
  httpUser?: string;

  /** HTTP Basic Auth 密码 */
  httpPassword?: string;
}

/** UNIX 域套接字插件配置 */
interface UnixDomainSocketPluginOptions {
  /** 插件类型，设置为 "unix_domain_socket" */
  type: 'unix_domain_socket';

  /** UNIX 域套接字地址 */
  unixPath: string;
}

/** HTTP 转 HTTPS 插件配置 */
interface HTTP2HTTPSPluginOptions {
  /** 插件类型，设置为 "http2https" */
  type: 'http2https';

  /** 本地 HTTPS 服务地址 */
  localAddr: string;

  /** 替换 Host header */
  hostHeaderRewrite?: string;

  /** 对请求 Header 的操作配置 */
  requestHeaders?: HeaderOperations;
}

/** HTTPS 转 HTTP 插件配置 */
interface HTTPS2HTTPPluginOptions {
  /** 插件类型，设置为 "https2http" */
  type: 'https2http';

  /** 本地 HTTPS 服务地址 */
  localAddr: string;

  /** 替换 Host header */
  hostHeaderRewrite?: string;

  /** 对请求 Header 的操作配置 */
  requestHeaders?: HeaderOperations;

  /** 是否启用 HTTP/2，默认启用 */
  enableHTTP2?: boolean;

  /** TLS 证书文件路径 */
  crtPath?: string;

  /** TLS 密钥文件路径 */
  keyPath?: string;
}

/** HTTPS 转 HTTPS 插件配置 */
interface HTTPS2HTTPSPluginOptions {
  /** 插件类型，设置为 "https2https" */
  type: 'https2https';

  /** 本地 HTTPS 服务地址 */
  localAddr: string;

  /** 替换 Host header */
  hostHeaderRewrite?: string;

  /** 对请求 Header 的操作配置 */
  requestHeaders?: HeaderOperations;

  /** 是否启用 HTTP/2，默认启用 */
  enableHTTP2?: boolean;

  /** TLS 证书文件路径 */
  crtPath?: string;

  /** TLS 密钥文件路径 */
  keyPath?: string;
}

/** TLS 转 Raw 插件配置 */
interface TLS2RawPluginOptions {
  /** 插件类型，设置为 "tls2raw" */
  type: 'tls2raw';

  /** 本地服务地址 */
  localAddr: string;

  /** TLS 证书文件路径 */
  crtPath?: string;

  /** TLS 密钥文件路径 */
  keyPath?: string;
}

/** 虚拟网络插件配置 */
interface VirtualNetPluginOptions {
  /** 插件类型，设置为 "virtual_net" */
  type: 'virtual_net';
}

/** 虚拟网络访问者插件配置 */
interface VirtualNetVisitorPluginOptions {
  /** 插件类型，设置为 "virtual_net" */
  type: 'virtual_net';

  /** 要访问的目标虚拟 IP 地址，通常是服务端的虚拟网络地址 */
  destinationIP: string;
}
