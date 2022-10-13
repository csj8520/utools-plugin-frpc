declare interface Window {
  preload: typeof import('./preload/index');
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface FrpcConfig {
  common: Partial<FrpcConfig.Common>;
  [proxy: string]: FrpcConfig.Proxy;
}

declare namespace FrpcConfig {
  interface Common {
    // 基础配置
    /** 连接服务端的地址 */
    server_addr: string;
    /** 连接服务端的端口 */
    server_port: number;
    /** 连接服务端时所绑定的本地 IP */
    connect_server_local_ip: string;
    /** 连接服务端的超时时间 */
    dial_server_timeout: number;
    /** 和服务端底层 TCP 连接的 keepalive 间隔时间，单位秒 */
    dial_server_keepalive: number;
    /** 连接服务端使用的代理地址 */
    http_proxy: string;
    /** 日志文件地址 */
    log_file: string;
    /** 日志等级 */
    log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    /** 日志文件保留天数 */
    log_max_days: number;
    /** 禁用标准输出中的日志颜色 */
    disable_log_color: boolean;
    /** 连接池大小 */
    pool_count: number;
    /** 用户名 */
    user: string;
    /** 使用 DNS 服务器地址 */
    dns_server: string;
    /** 第一次登陆失败后是否退出 */
    login_fail_exit: boolean;
    /** 连接服务端的通信协议 */
    protocol: 'tcp' | 'kcp' | 'websocket';
    /** 启用 TLS 协议加密连接 */
    tls_enable: boolean;
    /** TLS 客户端证书文件路径 */
    tls_cert_file: string;
    /** TLS 客户端密钥文件路径 */
    tls_key_file: string;
    /** TLS CA 证书路径 */
    tls_trusted_ca_file: string;
    /** TLS Server 名称 */
    tls_server_name: string;
    /** TLS 不发送 0x17 */
    disable_custom_tls_first_byte: boolean;
    /** tcp_mux 的心跳检查间隔时间 */
    tcp_mux_keepalive_interval: number;
    /** 向服务端发送心跳包的间隔时间 */
    heartbeat_interval: number;
    /** 和服务端心跳的超时时间 */
    heartbeat_timeout: number;
    /** 代理 UDP 服务时支持的最大包长度 */
    udp_packet_size: number;
    /** 指定启用部分代理 */
    start: string;
    /** 附加元数据 */
    [meta_: `meta_${string}`]: any;

    // 权限验证
    /** 鉴权方式 */
    authentication_method: 'token' | 'oidc';
    /** 开启心跳消息鉴权 */
    authenticate_heartbeats: boolean;
    /** 开启建立工作连接的鉴权 */
    authenticate_new_work_conns: boolean;
    /** 鉴权使用的 token 值 */
    token: string;
    /** oidc_client_id */
    oidc_client_id: string;
    /** oidc_client_secret */
    oidc_client_secret: string;
    /** oidc_audience */
    oidc_audience: string;
    /** oidc_token_endpoint_url */
    oidc_token_endpoint_url: string;
    /** OIDC 附加参数 */
    [oidc_additional_: `oidc_additional_${string}`]: any;

    // UI
    /** 启用 AdminUI 监听的本地地址 */
    admin_addr: string;
    /** 启用 AdminUI 监听的本地端口 */
    admin_port: number;
    /** HTTP BasicAuth 用户名 */
    admin_user: string;
    /** HTTP BasicAuth 密码 */
    admin_pwd: string;
    /** 静态资源目录 */
    asserts_dir: string;
    /** 启动 Go HTTP pprof */
    pprof_enable: boolean;
  }

  type Proxy =
    | Partial<FrpcConfig.Proxy.TCP>
    | Partial<FrpcConfig.Proxy.UDP>
    | Partial<FrpcConfig.Proxy.HTTP>
    | Partial<FrpcConfig.Proxy.HTTPS>
    | Partial<FrpcConfig.Proxy.STCP>
    | Partial<FrpcConfig.Proxy.SUDP>
    | Partial<FrpcConfig.Proxy.XTCP>
    | Partial<FrpcConfig.Proxy.TCPMUX>;
  namespace Proxy {
    // 通用配置
    interface Common {
      // 基础配置
      /** 是否启用加密功能 */
      use_encryption: boolean;
      /** 是否启用压缩功能 */
      use_compression: boolean;
      /** 启用 proxy protocol 协议的版本 */
      proxy_protocol_version: string;
      /** 设置单个 proxy 的带宽限流 */
      bandwidth_limit: string;

      // 本地服务配置
      /** 本地服务 IP */
      local_ip: string;
      /** 本地服务端口 */
      local_port: number;
      /** 客户端插件名称 */
      plugin: string;
      /** 客户端插件参数 */
      [plugin_: `plugin_${string}`]: any;

      // 负载均衡和健康检查
      /** 负载均衡分组名称 */
      group: string;
      /** 负载均衡分组密钥 */
      group_key: string;
      /** 健康检查类型 */
      health_check_type: string;
      /** 健康检查超时时间(秒) */
      health_check_timeout_s: number;
      /** 健康检查连续错误次数 */
      health_check_max_failed: number;
      /** 健康检查周期(秒) */
      health_check_interval_s: number;
      /** 健康检查的 HTTP 接口 */
      health_check_url: string;
    }
    interface TCP extends Common {
      type: 'tcp';
      /** 服务端绑定的端口 */
      remote_port: number;
    }

    interface UDP extends Common {
      type: 'udp';
      /** 服务端绑定的端口 */
      remote_port: number;
    }

    interface HTTP extends Common {
      type: 'http';
      /** 服务器绑定自定义域名 */
      custom_domains: string;
      /** 自定义子域名 */
      subdomain: string;
      /** URL 路由配置 */
      locations: string[];
      /** 根据 HTTP Basic Auth user 路由 */
      route_by_http_user: string;
      /** 用户名 */
      http_user: string;
      /** 密码 */
      http_pwd: string;
      /** 替换 Host header */
      host_header_rewrite: string;
      /** 替换 header */
      [headers_: `headers_${string}`]: any;
    }
    interface HTTPS extends Common {
      type: 'https';
      /** 服务器绑定自定义域名 */
      custom_domains: string;
      /** 自定义子域名 */
      subdomain: string;
    }
    interface STCP extends Common {
      type: 'stcp';
      /** 角色 */
      role: string;
      /** 密钥 */
      sk: string;
    }
    interface SUDP extends Common {
      type: 'sudp';
      /** 角色 */
      role: string;
      /** 密钥 */
      sk: string;
    }
    interface XTCP extends Common {
      type: 'xtcp';
      /** 角色 */
      role: string;
      /** 密钥 */
      sk: string;
    }
    interface TCPMUX extends Common {
      type: 'tcpmux';
      /** 复用器类型 */
      multiplexer: string;
      /** 服务器绑定自定义域名 */
      custom_domains: string;
      /** 自定义子域名 */
      subdomain: string;
      /** 根据 HTTP Basic Auth user 路由 */
      route_by_http_user: string;
    }
  }
}
