declare interface Window {
  preload: typeof import('./preload/index');
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface FrpcConfig {
  /** 客户端鉴权配置。 */
  auth: AuthClientConfig;
  /** 用户名，设置此参数后，代理名称会被修改为 {user}.{proxyName}，避免代理名称和其他用户冲突。 */
  user?: string;
  /** 连接服务端的地址。 */
  serverAddr?: string;
  /** 连接服务端的端口，默认为 7000。 */
  serverPort?: number;
  /** xtcp 打洞所需的 stun 服务器地址，默认为 stun.easyvoip.com:3478。 */
  natHoleStunServer?: string;
  /** 使用 DNS 服务器地址，默认使用系统配置的 DNS 服务器，指定此参数可以强制替换为自定义的 DNS 服务器地址。 */
  dnsServer?: string;
  /** 第一次登陆失败后是否退出，默认为 true。 */
  loginFailExit?: boolean;
  // /** 指定启用部分代理，当配置了较多代理，但是只希望启用其中部分时可以通过此参数指定，默认为全部启用。 */
  // start?: string[];
  // /** 日志配置。 */
  log: LogConfig;
  // /** 客户端 AdminServer 配置。 */
  webServer?: WebServerConfig;
  // /** 客户端网络层配置。 */
  transport: ClientTransportConfig;
  // /** 代理 UDP 服务时支持的最大包长度，默认为 1500，服务端和客户端需要保持配置一致。 */
  // udpPacketSize?: number;
  // /** 附加元数据，会传递给服务端插件，提供附加能力。 */
  // metadatas?: Record<string, string>;
  // /** 指定额外的配置文件目录，其中的 proxy 和 visitor 配置会被读取加载。 */
  // includes?: string[];

  /** 代理配置，不同的代理类型对应不同的配置，例如 TCPProxyConfig 或 HTTPProxyConfig。 */
  proxies: FrpcConfig.Proxie[];

  _custom: {
    saveRestart?: boolean;
  };
}

namespace FrpcConfig {
  type Proxie =
    | TCPProxyConfig
    | UDPProxyConfig
    | HTTPProxyConfig
    | HTTPSProxyConfig
    | TCPMuxProxyConfig
    | STCPProxyConfig
    | XTCPProxyConfig
    | SUDPProxyConfig;
}

interface AuthClientConfig {
  /** 鉴权方式，可选值为 token 或 oidc，默认为 token。 */
  method?: 'token' | 'oidc';
  /** 鉴权信息附加范围，可选值为 HeartBeats 和 NewWorkConns */
  additionalScopes?: ('HeartBeats' | 'NewWorkConns')[];
  /** 在 method 为 token 时生效，客户端需要设置一样的值才能鉴权通过。 */
  token?: string;
  /** oidc 鉴权配置。 */
  oidc?: AuthOIDCClientConfig;
}

/** oidc 鉴权配置。 */
interface AuthOIDCClientConfig {
  clientID?: string;
  clientSecret?: string;
  audience?: string;
  scope?: string;
  tokenEndpointURL?: string;
  additionalEndpointParams?: Record<string, string>;
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

interface LogConfig {
  /** 日志输出文件路径，如果为 console，则会将日志打印在标准输出中。 */
  to?: string;
  /** 日志级别，可选值为 trace, debug, info, warn, error，默认级别为 info。 */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** 日志文件最多保留天数，默认为 3 天。 */
  maxDays?: number;
  /** 禁用标准输出中的日志颜色。 */
  disablePrintColor?: boolean;
}

interface WebServerConfig {
  /** webServer 监听地址，默认为 127.0.0.1。 */
  addr?: string;
  /** webServer 监听端口。 */
  port: number;
  /** HTTP BasicAuth 用户名。 */
  user?: string;
  /** HTTP BasicAuth 密码。 */
  password?: string;
  /** 静态资源目录，Dashboard 使用的资源默认打包在二进制文件中，通过指定此参数使用自定义的静态资源。 */
  assetsDir?: string;
  /** 启动 Go HTTP pprof，用于应用调试。 */
  pprofEnable?: boolean;
  /** Dashboard 启用 HTTPS 的 TLS 相关配置。 */
  tls?: TLSConfig;
}

/** 基础代理配置 */
interface ProxyBaseConfig extends ProxyBackend {
  /** 代理名称。 */
  name: string;
  /** 代理类型，可选值为 tcp, udp, http, https, tcpmux, stcp, sudp, xtcp。 */
  // type: string;
  /** 代理网络层配置。 */
  transport?: ProxyTransport;
  /** 附加元数据，会传递给服务端插件，提供附加能力。 */
  metadatas?: Record<string, string>;
  /** 负载均衡配置。 */
  loadBalancer?: LoadBalancerConfig;
  /** 健康检查配置。 */
  healthCheck?: HealthCheckConfig;

  /** 是否开启 */
  _enable?: boolean;
}

/** 代理后端服务配置。 */
interface ProxyBackend {
  /** 被代理的本地服务 IP，默认为 127.0.0.1。 */
  localIP?: string;
  /** 被代理的本地服务端口。 */
  localPort?: number;
  /** 客户端插件配置，如果启用了客户端插件，则不需要配置 localIP 和 localPort。 */
  plugin?: ClientPluginOptions;
}

/** 代理网络层配置。 */
interface ProxyTransport {
  /** 是否启用加密功能，启用后该代理和服务端之间的通信内容都会被加密传输。 */
  useEncryption?: boolean;
  /** 是否启用压缩功能，启用后该代理和服务端之间的通信内容都会被压缩传输。 */
  useCompression?: boolean;
  /** 设置单个 proxy 的带宽限流，单位为 MB 或 KB，0 表示不限制。 */
  bandwidthLimit?: string;
  /** 限流类型，客户端限流或服务端限流，可选值为 client 和 server，默认为客户端限流。 */
  bandwidthLimitMode?: string;
  /** 启用 proxy protocol 协议的版本，可选值为 v1 和 v2。 */
  proxyProtocolVersion?: string;
}

/** 负载均衡配置。 */
interface LoadBalancerConfig {
  /** 负载均衡分组名称，用户请求会以轮询的方式发送给同一个 group 中的代理。 */
  group: string;
  /** 负载均衡分组密钥，用于对负载均衡分组进行鉴权，groupKey 相同的代理才会被加入到同一个分组中。 */
  groupKey?: string;
}

/** 健康检查配置。 */
interface HealthCheckConfig {
  /** 健康检查类型，可选值为 tcp 和 http。 */
  type: string;
  /** 健康检查超时时间(秒)，默认为 3s。 */
  timeoutSeconds?: number;
  /** 健康检查连续错误次数，连续检查错误多少次认为服务不健康，默认为 1。 */
  maxFailed?: number;
  /** 健康检查周期(秒)，每隔多长时间进行一次健康检查，默认为 10s。 */
  intervalSeconds?: number;
  /** 健康检查的 HTTP 接口，如果健康检查类型是 http，则需要配置此参数。 */
  path?: string;
}

/** 域名配置。 */
interface DomainConfig {
  /** 自定义域名列表。 */
  customDomains?: string[];
  /** 子域名。 */
  subdomain?: string;
}

/** TCP 代理配置 */
interface TCPProxyConfig extends ProxyBaseConfig {
  type: 'tcp';
  /** 服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务。 */
  remotePort?: number;
}

/** UDP 代理配置 */
interface UDPProxyConfig extends ProxyBaseConfig {
  type: 'udp';
  /** 服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务。 */
  remotePort?: number;
}

/** HTTP 代理配置 */
interface HTTPProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'http';
  /** URL 路由配置。 */
  locations?: string[];
  /** HTTP Basic Auth 用户名。 */
  httpUser?: string;
  /** HTTP Basic Auth 密码。 */
  httpPassword?: string;
  /** 替换 Host Header。 */
  hostHeaderRewrite?: string;
  /** 对请求 Header 的操作配置。 */
  requestHeaders?: HeaderOperations;
  /** 根据 HTTP Basic Auth user 路由。 */
  routeByHTTPUser?: string;
}

/** HTTPS 代理配置 */
interface HTTPSProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'https';
}

/** TCP 多路复用代理配置 */
interface TCPMuxProxyConfig extends ProxyBaseConfig, DomainConfig {
  type: 'tcpmux';
  /** 用户名，如果配置此参数，通过 HTTP CONNECT 建立连接时需要通过 Proxy-Authorization 附加上正确的身份信息。 */
  httpUser?: string;
  /** 密码。 */
  httpPassword?: string;
  /** 根据 HTTP Basic Auth user 路由。 */
  routeByHTTPUser?: string;
  /** 复用器类型，目前仅支持 httpconnect。 */
  multiplexer?: string;
}

/** STCP 代理配置 */
interface STCPProxyConfig extends ProxyBaseConfig {
  type: 'stcp';
  /** 密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端。 */
  secretKey?: string;
  /** 允许访问的 visitor 用户列表，默认只允许同一用户下的 visitor 访问，配置为 * 则允许任何 visitor 访问。 */
  allowUsers?: string[];
}

/** XTCP 代理配置 */
interface XTCPProxyConfig extends ProxyBaseConfig {
  type: 'xtcp';
  /** 密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端。 */
  secretKey?: string;
  /** 允许访问的 visitor 用户列表，默认只允许同一用户下的 visitor 访问，配置为 * 则允许任何 visitor 访问。 */
  allowUsers?: string[];
}

/** SUDP 代理配置 */
interface SUDPProxyConfig extends ProxyBaseConfig {
  type: 'sudp';
  /** 密钥，服务端和访问端的密钥需要一致，访问端才能访问到服务端。 */
  secretKey?: string;
  /** 允许访问的 visitor 用户列表，默认只允许同一用户下的 visitor 访问，配置为 * 则允许任何 visitor 访问。 */
  allowUsers?: string[];
}
