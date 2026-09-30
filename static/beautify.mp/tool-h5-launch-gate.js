(function installToolH5LaunchGate(global) {
  'use strict';

  if (!global || global.JuneOver24ToolLaunchGate) return;

  const HASH_KEY = 'toolLaunchTicket';
  const VERIFY_PATH = '/api/tools/h5-launch-ticket/verify';
  const DEFAULT_API_ORIGIN = 'https://api.beautify.mp.juneover24.cn';
  const DEFAULT_OFFLINE_CONFIG_URLS = [
    'https://cdn.status.beautify.mp.juneover24.cn/config/emergency-tools.v2.json',
    'https://status.gushao.bond/config/emergency-tools.v2.json',
    'https://status.gushao.club/config/emergency-tools.v2.json',
  ];
  const CACHE_KEY = 'juneover24_tool_emergency_config_v2';
  const MAX_TICKET_LENGTH = 4096;
  const DEFAULT_TIMEOUT_MS = 8000;
  const CONFIG_TIMEOUT_MS = 5000;
  const MIN_TTL_MS = 60 * 1000;
  const MAX_TTL_MS = 60 * 60 * 1000;

  function runtimeConfig() {
    const value = global.__JUNEOVER24_TOOL_LAUNCH_GATE_CONFIG__;
    return value && typeof value === 'object' ? value : {};
  }

  function normalizeErrorDetail(payload, fallback) {
    const detail = payload && payload.detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
    if (detail && typeof detail.message === 'string' && detail.message.trim()) return detail.message.trim();
    return fallback;
  }

  function launchError(message, code, allowEmergencyFallback) {
    const error = new Error(message);
    error.code = code;
    error.allowEmergencyFallback = allowEmergencyFallback === true;
    return error;
  }

  function readLaunchTicket() {
    const params = new URLSearchParams(global.location.hash.replace(/^#/, ''));
    return String(params.get(HASH_KEY) || '').trim();
  }

  function removeLaunchTicketFromHash() {
    const params = new URLSearchParams(global.location.hash.replace(/^#/, ''));
    params.delete(HASH_KEY);
    const nextHash = params.toString();
    const nextUrl = `${global.location.pathname}${global.location.search}${nextHash ? `#${nextHash}` : ''}`;
    global.history.replaceState(null, '', nextUrl);
  }

  function isMiniProgramEntry() {
    return new URLSearchParams(global.location.search || '').get('miniProgram') === '1';
  }

  function verifyEndpoint() {
    const configured = String(runtimeConfig().verifyEndpoint || '').trim();
    if (/^https:\/\//i.test(configured) || /^http:\/\/127\.0\.0\.1(?::\d+)?\//i.test(configured)) {
      return configured;
    }
    const current = new URL(global.location.href);
    if (current.hostname === 'api.beautify.mp.juneover24.cn' || current.hostname === '127.0.0.1' || current.hostname === 'localhost') {
      return `${current.origin}${VERIFY_PATH}`;
    }
    return `${DEFAULT_API_ORIGIN}${VERIFY_PATH}`;
  }

  function offlineConfigUrls() {
    const configured = runtimeConfig().offlineConfigUrls;
    const values = Array.isArray(configured) ? configured : DEFAULT_OFFLINE_CONFIG_URLS;
    return Array.from(new Set(values
      .map(value => String(value || '').trim())
      .filter(value => /^https:\/\//i.test(value))));
  }

  function requestTimeoutMs() {
    const value = Number(runtimeConfig().requestTimeoutMs);
    return Number.isFinite(value) && value >= 1000 && value <= 30000 ? Math.round(value) : DEFAULT_TIMEOUT_MS;
  }

  async function fetchWithTimeout(url, init, timeoutMs) {
    const controller = new AbortController();
    const resolvedTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? Math.max(1, Math.round(timeoutMs))
      : requestTimeoutMs();
    const timeout = setTimeout(() => controller.abort(), resolvedTimeout);
    try {
      return await global.fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function remainingDeadlineMs(deadline) {
    return Math.max(1, Number(deadline || 0) - Date.now());
  }

  async function verifyOnlineTicket(ticket, toolKey, deadline) {
    let response;
    try {
      response = await fetchWithTimeout(verifyEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket, toolKey }),
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
      }, remainingDeadlineMs(deadline));
    } catch (_) {
      throw launchError('主服务器暂时无法访问，正在尝试应急配置', 'server_unavailable', true);
    }

    const payload = await readJson(response);
    if (!response.ok) {
      if (response.status >= 500) {
        throw launchError('主服务器暂时无法访问，正在尝试应急配置', 'server_unavailable', true);
      }
      throw launchError(
        normalizeErrorDetail(payload, '启动票据无效，请返回小程序重试'),
        'ticket_rejected',
        false,
      );
    }
    if (!payload || payload.valid !== true || payload.toolKey !== toolKey) {
      throw launchError('启动票据工具不匹配，请返回小程序重试', 'ticket_mismatch', false);
    }
    return { ...payload, mode: 'online' };
  }

  function normalizeEmergencyConfig(payload, fetchedAt) {
    if (!payload || payload.schemaVersion !== 2 || typeof payload.enabled !== 'boolean' || !Array.isArray(payload.tools)) {
      throw new Error('应急配置格式无效');
    }
    const tools = [];
    const seenKeys = new Set();
    for (const tool of payload.tools) {
      if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
        throw new Error('应急配置包含无效工具项');
      }
      const key = typeof tool.key === 'string' ? tool.key.trim() : '';
      if (!key || typeof tool.enabled !== 'boolean' || seenKeys.has(key)) {
        throw new Error('应急配置工具 key/enabled 无效或重复');
      }
      seenKeys.add(key);
      if (!tool.enabled) continue;
      const entryUrl = typeof tool.entryUrl === 'string' && /^https:\/\/[^\s]+$/i.test(tool.entryUrl.trim())
        ? tool.entryUrl.trim()
        : '';
      tools.push({
        key,
        enabled: true,
        mode: tool.mode === 'partial' ? 'partial' : 'full',
        disabledFeatures: Array.isArray(tool.disabledFeatures)
          ? Array.from(new Set(tool.disabledFeatures.map(value => String(value || '').trim()).filter(Boolean)))
          : [],
        entryUrl,
      });
    }
    const rawArchiveService = payload.services && payload.services.archiveProtection;
    const archiveProtection = rawArchiveService
      && rawArchiveService.enabled === true
      && typeof rawArchiveService.endpoint === 'string'
      && /^https:\/\/[^\s]+$/i.test(rawArchiveService.endpoint.trim())
      && typeof rawArchiveService.bootstrapEndpoint === 'string'
      && /^https:\/\/[^\s]+$/i.test(rawArchiveService.bootstrapEndpoint.trim())
      ? {
        enabled: true,
        endpoint: rawArchiveService.endpoint.trim(),
        bootstrapEndpoint: rawArchiveService.bootstrapEndpoint.trim(),
      }
      : null;
    if (tools.some(tool => tool.key === 'skin_pro') && !archiveProtection) {
      throw new Error('skin_pro 应急配置缺少完整 archiveProtection 服务');
    }
    const ttlSeconds = Number(payload.ttlSeconds);
    const ttlMs = Math.min(
      MAX_TTL_MS,
      Math.max(MIN_TTL_MS, Number.isFinite(ttlSeconds) ? Math.round(ttlSeconds * 1000) : 5 * 60 * 1000),
    );
    return {
      schemaVersion: 2,
      revision: payload.revision,
      updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt.trim() : '',
      enabled: payload.enabled,
      notice: typeof payload.notice === 'string' ? payload.notice.trim() : '',
      tools,
      services: { archiveProtection },
      fetchedAt,
      expiresAt: fetchedAt + ttlMs,
    };
  }

  function readCachedEmergencyConfig() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      const config = cached && cached.config;
      if (!config || config.schemaVersion !== 2 || typeof config.enabled !== 'boolean' || !Array.isArray(config.tools)) {
        return null;
      }
      const fetchedAt = Number(config.fetchedAt) || Date.now();
      const ttlMs = Math.max(MIN_TTL_MS, Number(config.expiresAt) - fetchedAt || MIN_TTL_MS);
      const normalized = normalizeEmergencyConfig({
        ...config,
        ttlSeconds: ttlMs / 1000,
      }, fetchedAt);
      return {
        ...normalized,
        expiresAt: Number(config.expiresAt) || normalized.expiresAt,
      };
    } catch (_) {
      return null;
    }
  }

  function writeCachedEmergencyConfig(config) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(CACHE_KEY, JSON.stringify({ config }));
      }
    } catch (_) {
      // 隐私模式或存储配额不足不影响当前这次启动。
    }
  }

  function compareRevision(left, right) {
    const leftValue = String(left == null ? '' : left).trim();
    const rightValue = String(right == null ? '' : right).trim();
    if (/^\d+$/.test(leftValue) && /^\d+$/.test(rightValue) && leftValue.length !== rightValue.length) {
      return leftValue.length - rightValue.length;
    }
    return leftValue.localeCompare(rightValue);
  }

  function compareConfigFreshness(left, right) {
    const revisionResult = compareRevision(left && left.revision, right && right.revision);
    if (revisionResult) return revisionResult;
    const leftUpdatedAt = Date.parse(left && left.updatedAt) || 0;
    const rightUpdatedAt = Date.parse(right && right.updatedAt) || 0;
    if (leftUpdatedAt !== rightUpdatedAt) return leftUpdatedAt - rightUpdatedAt;
    return Number(left && left.fetchedAt || 0) - Number(right && right.fetchedAt || 0);
  }

  async function fetchEmergencyConfigFrom(url, deadline) {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      headers: { Accept: 'application/json' },
    }, Math.min(CONFIG_TIMEOUT_MS, remainingDeadlineMs(deadline)));
    if (!response.ok) throw new Error(`应急配置返回 HTTP ${response.status}`);
    return normalizeEmergencyConfig(await readJson(response), Date.now());
  }

  async function newestValidEmergencyConfig(urls, deadline) {
    if (!urls.length) throw new Error('未配置应急配置源');
    const results = await Promise.all(urls.map(async url => {
      try {
        return { config: await fetchEmergencyConfigFrom(url, deadline), error: null };
      } catch (error) {
        return { config: null, error };
      }
    }));
    const configs = results.map(result => result.config).filter(Boolean);
    if (!configs.length) {
      const errors = results.map(result => result.error).filter(Boolean);
      throw errors[errors.length - 1] || new Error('应急配置加载失败');
    }
    return configs.reduce((latest, candidate) => (
      compareConfigFreshness(candidate, latest) > 0 ? candidate : latest
    ));
  }

  let emergencyConfigInFlight = null;

  async function loadEmergencyConfig(deadline) {
    const cached = readCachedEmergencyConfig();
    if (cached && Number(cached.expiresAt) > Date.now()) return cached;
    if (!emergencyConfigInFlight) {
      emergencyConfigInFlight = newestValidEmergencyConfig(offlineConfigUrls(), deadline)
        .then(config => {
          const selected = cached && compareConfigFreshness(cached, config) > 0 ? cached : config;
          if (selected === config) writeCachedEmergencyConfig(config);
          return selected;
        })
        .catch(error => {
          // TTL 只控制刷新频率，不删除最后一次有效配置。所有配置源同时失联时，
          // 继续使用 stale cache 才能避免应急控制面本身成为新的单点。
          if (cached) return cached;
          throw error;
        })
        .finally(() => {
          emergencyConfigInFlight = null;
        });
    }
    return emergencyConfigInFlight;
  }

  async function verifyEmergencyTool(toolKey, configPromise, deadline) {
    let config;
    try {
      config = await (configPromise || loadEmergencyConfig(deadline));
    } catch (_) {
      throw launchError('主服务器和应急配置均无法访问，请稍后重试', 'emergency_config_unavailable', false);
    }
    if (!config.enabled) {
      throw launchError('当前未开启应急访问，请返回小程序重试', 'emergency_disabled', false);
    }
    const tool = config.tools.find(item => item.key === toolKey);
    if (!tool || tool.enabled !== true) {
      throw launchError('当前工具未在应急配置中开放', 'tool_not_enabled', false);
    }
    return {
      valid: true,
      toolKey,
      mode: 'offline',
      configRevision: config.revision,
      notice: config.notice,
      toolMode: tool.mode,
      disabledFeatures: tool.disabledFeatures,
    };
  }

  async function verify(expectedToolKey, options) {
    const toolKey = String(expectedToolKey || '').trim();
    if (!toolKey) throw launchError('启动工具标识缺失', 'tool_key_missing', false);
    const settings = options && typeof options === 'object' ? options : {};
    const miniProgramEntry = isMiniProgramEntry();
    const ticket = readLaunchTicket();
    const deadline = Date.now() + requestTimeoutMs();
    if (ticket.length > MAX_TICKET_LENGTH) {
      throw launchError('启动票据无效，请返回小程序重试', 'ticket_invalid', false);
    }
    // PSD 等明确允许浏览器本地使用的页面不应被小程序票据机制误锁死；但 URL
    // 若已经携带票据，仍优先验证并清理 fragment，不能让凭据长期留在地址栏。
    if (!miniProgramEntry && settings.allowPublicBrowser === true && !ticket) {
      return { valid: true, toolKey, mode: 'public_browser', disabledFeatures: [] };
    }

    // 配置与在线验证并行加载，共享同一个 8 秒整体截止时间。配置请求本身最多 5 秒，
    // 因此在线请求到截止点才失败时也能立即切换，不会串行累加成 16 秒。
    const emergencyConfigPromise = loadEmergencyConfig(deadline);
    void emergencyConfigPromise.catch(() => undefined);
    // fragment 中的票据只需读取一次，立即从地址栏移除；失败页也不能长期保留凭据。
    if (ticket) removeLaunchTicketFromHash();

    let result;
    if (ticket) {
      try {
        result = await verifyOnlineTicket(ticket, toolKey, deadline);
      } catch (error) {
        if (!error || error.allowEmergencyFallback !== true) throw error;
        result = await verifyEmergencyTool(toolKey, emergencyConfigPromise, deadline);
      }
    } else if (miniProgramEntry) {
      // miniProgram=1 只是 UI 提示，不能证明来源。无票据时仍向在线 verify 提交空票据：
      // 服务在线会返回 4xx 并拒绝；只有网络/整体超时/5xx 才允许 schema v2 裁决。
      try {
        result = await verifyOnlineTicket('', toolKey, deadline);
      } catch (error) {
        if (!error || error.allowEmergencyFallback !== true) throw error;
        result = await verifyEmergencyTool(toolKey, emergencyConfigPromise, deadline);
      }
    } else {
      throw launchError('启动票据缺失，请从小程序已开通入口进入', 'ticket_missing', false);
    }

    return result;
  }

  global.JuneOver24ToolLaunchGate = Object.freeze({ verify });
})(globalThis);
