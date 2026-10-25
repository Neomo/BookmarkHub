import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Bookmark } from '../types';
import { extractDomain } from '../utils/url';
import { X, QrCode, Copy, Download, Check, ExternalLink } from 'lucide-react';
import { useToast } from './Toast';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark: Bookmark | null;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  bookmark,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && bookmark?.url) {
      setCopied(false);
      QRCode.toDataURL(bookmark.url, {
        width: 260,
        margin: 2,
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate QR code', err);
          showToast('生成二维码失败', 'error');
        });
    } else {
      setQrDataUrl('');
    }
  }, [isOpen, bookmark, showToast]);

  if (!isOpen || !bookmark) return null;

  const domain = extractDomain(bookmark.url);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    showToast('网址已复制到剪贴板', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    downloadLink.download = `qrcode_${domain}_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    showToast('二维码图片已下载', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              网址二维码
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Bookmark details */}
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1 max-w-xs">
            {bookmark.title}
          </h4>
          <p className="text-xs font-mono text-neutral-400 dark:text-neutral-500 truncate max-w-xs mb-4">
            {domain}
          </p>

          {/* QR Code Container */}
          <div className="p-3 rounded-2xl bg-white border border-neutral-200 dark:border-neutral-700 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${bookmark.title}`}
                className="w-52 h-52 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-neutral-400 text-xs">
                正在生成二维码...
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-4">
            手机微信、浏览器或系统相机扫码，即可在移动端直接打开
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-5 w-full">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制网址' : '复制网址'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="flex-1 py-2 px-3 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存图片</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
