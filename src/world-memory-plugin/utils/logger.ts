const PLUGIN_NAME = '[WorldMemoryPlugin]';

/**
 * 带有插件名称前缀的日志工具。
 * @param message 要打印的消息
 * @param args 其他参数
 */
export function log(message: any, ...args: any[]) {
  console.log(PLUGIN_NAME, message, ...args);
}
