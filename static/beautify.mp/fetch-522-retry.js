(function installBrowserFetch522Retry(global) {
  'use strict';

  if (!global || typeof global.fetch !== 'function' || global.fetch.__juneover24_522_retry__) return;
  const nativeFetch = global.fetch.bind(global);
  const DEFAULT_RETRY_LIMIT = 3;
  const MAX_RETRY_LIMIT = 10;
  const BASE_DELAY_MS = 250;
  const MAX_DELAY_MS = 4000;
  const DEFAULT_DEADLINE_MS = 10000;
  const MAX_DEADLINE_MS = 60000;
  const JITTER_RATIO = 0.2;
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

  /**
   * 返回指定请求来源允许的 522 重试次数。
   *
   * 默认最多重试三次。调用方可以按来源收紧或放宽，但统一限制在十次以内，
   * 避免配置错误重新制造无限请求；达到上限后把最后一个 522 原样交给业务降级。
   */
  function retryLimitFor(url) {
    const limits = global.__JUNEOVER24_FETCH_522_RETRY_LIMITS__;
    if (!limits || typeof limits !== 'object') return DEFAULT_RETRY_LIMIT;
    let origin = '';
    try {
      origin = new URL(url, global.location && global.location.href).origin;
    } catch (_) {
      return DEFAULT_RETRY_LIMIT;
    }
    const configured = Object.prototype.hasOwnProperty.call(limits, origin)
      ? limits[origin]
      : limits['*'];
    const normalized = Number(configured);
    return Number.isInteger(normalized) && normalized >= 0
      ? Math.min(MAX_RETRY_LIMIT, normalized)
      : DEFAULT_RETRY_LIMIT;
  }

  function retryDeadlineFor(url) {
    const deadlines = global.__JUNEOVER24_FETCH_522_RETRY_DEADLINES__;
    if (!deadlines || typeof deadlines !== 'object') return DEFAULT_DEADLINE_MS;
    let origin = '';
    try {
      origin = new URL(url, global.location && global.location.href).origin;
    } catch (_) {
      return DEFAULT_DEADLINE_MS;
    }
    const configured = Object.prototype.hasOwnProperty.call(deadlines, origin)
      ? deadlines[origin]
      : deadlines['*'];
    const normalized = Number(configured);
    return Number.isFinite(normalized) && normalized >= 0
      ? Math.min(MAX_DEADLINE_MS, normalized)
      : DEFAULT_DEADLINE_MS;
  }

  function waitBeforeRetry(retryCount, signal) {
    const exponential = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** Math.max(0, retryCount - 1)));
    const delayMs = Math.min(MAX_DELAY_MS, exponential + exponential * JITTER_RATIO * Math.random());
    if (!signal || typeof signal.addEventListener !== 'function') {
      return new Promise(resolve => setTimeout(resolve, delayMs));
    }
    if (signal.aborted) {
      const error = signal.reason || new Error('The operation was aborted.');
      if (!signal.reason) error.name = 'AbortError';
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, delayMs);
      const onAbort = () => {
        clearTimeout(timer);
        const error = signal.reason || new Error('The operation was aborted.');
        if (!signal.reason) error.name = 'AbortError';
        reject(error);
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  async function fetchWith522Retry(input, init) {
    const requestInit = init && typeof init === 'object' ? { ...init } : init;
    // 该字段只用于本地策略，不能继续传给浏览器 Request 构造器。写请求只有后端已经按
    // 幂等键/任务 ID 去重时才允许调用方设置；普通表单提交、支付和通知必须保持 false。
    const idempotentWrite = !!(requestInit && requestInit.juneover24Retry522Idempotent === true);
    if (requestInit) delete requestInit.juneover24Retry522Idempotent;

    // 先构造一个未消费的请求模板。每次尝试使用 clone() 创建独立请求体，确保
    // 显式幂等的 FormData/Blob 不会因为第一次 522 已发送而在下一次变成空内容。
    const template = new Request(input, requestInit);
    const safeByDefault = SAFE_METHODS.has(String(template.method || 'GET').toUpperCase());
    const retryLimit = safeByDefault || idempotentWrite ? retryLimitFor(template.url) : 0;
    const deadlineMs = retryDeadlineFor(template.url);
    const startedAt = Date.now();
    for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
      const response = await nativeFetch(template.clone());
      if (response.status !== 522) return response;
      if (attempt >= retryLimit) {
        console.warn('[fetch-522-retry] HTTP 522 已达到该来源的重试上限', template.url);
        // 最后一次响应必须保持未消费状态返回给调用方。调用方随后会按正常的非成功
        // 响应处理并触发备用链路，不能像真正重试时一样提前 cancel() 响应体。
        return response;
      }
      const retryCount = attempt + 1;
      const exponential = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** Math.max(0, retryCount - 1)));
      const estimatedDelayMs = Math.min(MAX_DELAY_MS, exponential * (1 + JITTER_RATIO));
      if (Date.now() - startedAt + estimatedDelayMs > deadlineMs) {
        console.warn('[fetch-522-retry] HTTP 522 已达到总重试 deadline', template.url);
        return response;
      }
      try { await response.body?.cancel(); } catch (_) {}
      console.warn('[fetch-522-retry] HTTP 522，指数退避后进行第 ' + retryCount + ' 次重试', template.url);
      await waitBeforeRetry(retryCount, template.signal);
    }
    throw new Error('HTTP 522 重试状态异常');
  }

  fetchWith522Retry.__juneover24_522_retry__ = true;
  global.fetch = fetchWith522Retry;
})(globalThis);
