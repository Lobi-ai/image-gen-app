import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { DEFAULT_API_SETTINGS } from '../constants/models';
import { testConnection } from '../services/api';
import type { Vendor } from '../types';

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const VENDORS: { key: Vendor; label: string; icon: string; color: string }[] = [
  { key: 'openai', label: 'OpenAI', icon: '🔵', color: '#10A37F' },
  { key: 'google', label: 'Google Gemini', icon: '🔴', color: '#4285F4' },
  { key: 'doubao', label: '豆包 Seedream', icon: '🟠', color: '#FF6B35' },
];

export default function SettingsModal() {
  const { apiSettings, setApiSettings, isSettingsOpen, setSettingsOpen } = useStore();
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [savingVendor, setSavingVendor] = useState<Vendor | null>(null);
  const [saveName, setSaveName] = useState('');

  if (!isSettingsOpen) return null;

  const updateVendorConfig = (vendor: Vendor, field: 'apiKey' | 'baseUrl', value: string) => {
    setApiSettings({
      ...apiSettings,
      [vendor]: { ...apiSettings[vendor], [field]: value },
    });
  };

  const handleTest = async (vendor: Vendor) => {
    setTesting((prev) => ({ ...prev, [vendor]: true }));
    setTestResults((prev) => ({ ...prev, [vendor]: '' }));
    try {
      const result = await testConnection(vendor, apiSettings);
      setTestResults((prev) => ({ ...prev, [vendor]: result.message }));
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [vendor]: `❌ 连接失败: ${err}` }));
    }
    setTesting((prev) => ({ ...prev, [vendor]: false }));
  };

  const handleStartSave = (vendor: Vendor) => {
    const url = apiSettings[vendor].baseUrl;
    if (!url) return;
    setSavingVendor(vendor);
    setSaveName(extractHostname(url));
  };

  const handleConfirmSave = () => {
    if (!savingVendor || !saveName.trim()) return;
    const url = apiSettings[savingVendor].baseUrl;
    const urls = apiSettings[savingVendor].savedBaseUrls || [];
    if (urls.some((u) => u.url === url)) {
      setSavingVendor(null);
      return;
    }
    setApiSettings({
      ...apiSettings,
      [savingVendor]: {
        ...apiSettings[savingVendor],
        savedBaseUrls: [...urls, { name: saveName.trim(), url }],
      },
    });
    setSavingVendor(null);
    setSaveName('');
  };

  const handleRemoveSavedUrl = (vendor: Vendor, url: string) => {
    const urls = apiSettings[vendor].savedBaseUrls || [];
    setApiSettings({
      ...apiSettings,
      [vendor]: { ...apiSettings[vendor], savedBaseUrls: urls.filter((u) => u.url !== url) },
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setSettingsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#13161F] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>⚙️</span> API 设置
            </h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-5">
            {/* 代理地址（仅开发环境显示，生产构建自动隐藏） */}
            {import.meta.env.DEV && (
            <div className="space-y-1.5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <label className="text-xs text-white/50">代理服务器地址</label>
              <input
                type="text"
                value={apiSettings.proxyUrl || ''}
                onChange={(e) => setApiSettings({ ...apiSettings, proxyUrl: e.target.value })}
                placeholder="http://localhost:3002"
                className="
                  w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white text-sm outline-none transition-all duration-200
                  placeholder:text-white/25
                  focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                "
              />
              <p className="text-xs text-white/25">
                本地开发：http://localhost:3002<br/>
                Nginx 部署：留空（走同域 /api/proxy）
              </p>
            </div>
            )}

            {/* 安全提示 */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-amber-400 text-sm">🔒</span>
              <p className="text-xs text-amber-300/80">
                API Key 仅存储在您的浏览器本地，不会上传到任何服务器
              </p>
            </div>

            {/* 厂商配置 */}
            {VENDORS.map((vendor) => {
              const vendorUrls = apiSettings[vendor.key].savedBaseUrls || [];
              return (
              <div key={vendor.key} className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span>{vendor.icon}</span>
                  <h3 className="text-sm font-medium text-white">{vendor.label}</h3>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vendor.color }} />
                </div>

                {/* Base URL */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Base URL（可选）</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={apiSettings[vendor.key].baseUrl}
                      onChange={(e) => updateVendorConfig(vendor.key, 'baseUrl', e.target.value)}
                      placeholder={DEFAULT_API_SETTINGS[vendor.key].baseUrl}
                      className="
                        flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                        text-white text-sm outline-none transition-all duration-200
                        placeholder:text-white/25
                        focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                      "
                    />
                    {vendorUrls.length > 0 && (
                      <div className="relative w-28 flex-shrink-0">
                        <select
                          value={vendorUrls.some((u) => u.url === apiSettings[vendor.key].baseUrl) ? apiSettings[vendor.key].baseUrl : ''}
                          onChange={(e) => { if (e.target.value) updateVendorConfig(vendor.key, 'baseUrl', e.target.value); }}
                          className="
                            w-full h-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 pr-7
                            text-white/60 text-xs outline-none transition-all duration-200
                            focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                            hover:border-white/20 truncate
                          "
                        >
                          <option value="" className="bg-gray-900 text-white/40">选择已保存...</option>
                          {vendorUrls.map((item) => (
                            <option key={item.url} value={item.url} className="bg-gray-900 text-white">{item.name}</option>
                          ))}
                        </select>
                        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Save button / name input */}
                  {savingVendor === vendor.key ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSave(); if (e.key === 'Escape') setSavingVendor(null); }}
                        placeholder="输入显示名称..."
                        autoFocus
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5
                          text-white text-xs outline-none
                          focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                      />
                      <button onClick={handleConfirmSave} className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs rounded-lg transition-colors whitespace-nowrap">确认</button>
                      <button onClick={() => setSavingVendor(null)} className="px-2 py-1.5 text-white/30 hover:text-white/60 text-xs transition-colors">取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartSave(vendor.key)}
                      disabled={!apiSettings[vendor.key].baseUrl || vendorUrls.some((u) => u.url === apiSettings[vendor.key].baseUrl)}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-20 disabled:cursor-default text-left"
                    >
                      + 保存到列表
                    </button>
                  )}
                  {vendorUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vendorUrls.map((item) => (
                        <span key={item.url} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] rounded-md text-xs text-white/40" title={item.url}>
                          <span className="max-w-[120px] truncate">{item.name}</span>
                          <button
                            onClick={() => handleRemoveSavedUrl(vendor.key, item.url)}
                            className="text-white/15 hover:text-red-400 transition-colors leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey[vendor.key] ? 'text' : 'password'}
                      value={apiSettings[vendor.key].apiKey}
                      onChange={(e) => updateVendorConfig(vendor.key, 'apiKey', e.target.value)}
                      placeholder="输入 API Key..."
                      className="
                        w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10
                        text-white text-sm outline-none transition-all duration-200
                        placeholder:text-white/25
                        focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((prev) => ({ ...prev, [vendor.key]: !prev[vendor.key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      title={showKey[vendor.key] ? '隐藏' : '显示'}
                    >
                      {showKey[vendor.key] ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 测试按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(vendor.key)}
                    disabled={testing[vendor.key]}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white
                      rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {testing[vendor.key] ? '测试中...' : '🔍 测试连接'}
                  </button>
                  {testResults[vendor.key] && (
                    <span className={`text-xs ${testResults[vendor.key].startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                      {testResults[vendor.key]}
                    </span>
                  )}
                </div>
              </div>
              );
            })}

            {/* 底部操作 */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setApiSettings(DEFAULT_API_SETTINGS);
                  setTestResults({});
                }}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                重置为默认
              </button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600
                  hover:from-purple-500 hover:to-cyan-500 text-white text-sm font-medium
                  rounded-xl transition-all duration-200"
              >
                完成
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
