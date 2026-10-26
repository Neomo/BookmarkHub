import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Bookmark, Category } from '../types';
import { extractDomain } from '../utils/url';
import {
  X,
  Copy,
  Download,
  Check,
  ExternalLink,
  Plane,
  Globe,
  Clock,
  Tag,
  ShieldCheck,
  Compass,
  FileText,
  Sparkles,
  Ticket,
  Calendar,
} from 'lucide-react';
import { useToast } from './Toast';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark: Bookmark | null;
  categories?: Category[];
}

type TicketTheme = 'aero' | 'classic' | 'cyber';

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  bookmark,
  categories = [],
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [ticketTheme, setTicketTheme] = useState<TicketTheme>('aero');
  const [systemTime, setSystemTime] = useState<{
    dateStr: string;
    timeStr: string;
    dayOfWeek: string;
    fullStamp: string;
  }>({
    dateStr: '',
    timeStr: '',
    dayOfWeek: '',
    fullStamp: '',
  });

  const ticketRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Initialize timestamp on modal open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const date = pad(now.getDate());
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const daysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayIndex = now.getDay();

      setSystemTime({
        dateStr: `${year}-${month}-${date}`,
        timeStr: `${hours}:${minutes}:${seconds}`,
        dayOfWeek: `${days[dayIndex]}, ${daysZh[dayIndex]}`,
        fullStamp: `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`,
      });
    }
  }, [isOpen]);

  // Generate crisp QR Code
  useEffect(() => {
    if (isOpen && bookmark?.url) {
      setCopied(false);
      QRCode.toDataURL(bookmark.url, {
        width: 320,
        margin: 1,
        color: {
          dark: ticketTheme === 'cyber' ? '#0f172a' : '#1e1b4b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate QR code', err);
          showToast('生成二维码失败', 'error');
        });
    } else {
      setQrDataUrl('');
    }
  }, [isOpen, bookmark, ticketTheme, showToast]);

  if (!isOpen || !bookmark) return null;

  const domain = extractDomain(bookmark.url);
  const destinationCode = domain.split('.')[0].toUpperCase().slice(0, 4) || 'WEB';

  // Category breadcrumbs or name
  const category = categories.find((c) => c.id === bookmark.categoryId);
  const categoryName = category ? category.name : '默认收藏';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    showToast('网址已复制到剪贴板', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Canvas Fallback Export in case html-to-image hits sandbox or style issues
  const fallbackCanvasExport = async () => {
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      const width = 420 * scale;
      const height = 660 * scale;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2d context');

      ctx.scale(scale, scale);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 660);
      if (ticketTheme === 'aero') {
        bgGrad.addColorStop(0, '#2d1b69');
        bgGrad.addColorStop(0.5, '#482882');
        bgGrad.addColorStop(1, '#6d32a5');
      } else if (ticketTheme === 'cyber') {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
      } else {
        bgGrad.addColorStop(0, '#1c1917');
        bgGrad.addColorStop(0.5, '#292524');
        bgGrad.addColorStop(1, '#44403c');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 420, 660);

      // Route Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('轻藏 HUB', 32, 42);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('ORIGIN', 32, 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✈', 210, 46);

      ctx.textAlign = 'right';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(destinationCode, 388, 42);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(domain.toUpperCase(), 388, 56);

      // Ticket Card Container
      const cardX = 24;
      const cardY = 74;
      const cardW = 372;
      const cardH = 540;
      const radius = 18;

      ctx.fillStyle = ticketTheme === 'cyber' ? '#111827' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Top Ticket Strip
      ctx.fillStyle = ticketTheme === 'cyber' ? '#38bdf8' : '#4f46e5';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BOOKMARK BOARDING PASS · 网址探索凭证', cardX + 16, cardY + 28);

      // Title
      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('WEBSITE TITLE / 网站标题', cardX + 16, cardY + 52);

      ctx.fillStyle = ticketTheme === 'cyber' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      const cleanTitle = bookmark.title.length > 22 ? bookmark.title.slice(0, 22) + '...' : bookmark.title;
      ctx.fillText(cleanTitle, cardX + 16, cardY + 74);

      // URL
      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('TARGET URL / 访问网址', cardX + 16, cardY + 98);

      ctx.fillStyle = ticketTheme === 'cyber' ? '#38bdf8' : '#3730a3';
      ctx.font = '12px monospace';
      const cleanUrl = bookmark.url.length > 36 ? bookmark.url.slice(0, 36) + '...' : bookmark.url;
      ctx.fillText(cleanUrl, cardX + 16, cardY + 116);

      // Grid Info: Time & Category
      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('SYSTEM TIME / 当前系统时间', cardX + 16, cardY + 144);
      ctx.fillStyle = ticketTheme === 'cyber' ? '#f8fafc' : '#1e1b4b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(systemTime.fullStamp, cardX + 16, cardY + 162);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('CATEGORY / 所属分类', cardX + 210, cardY + 144);
      ctx.fillStyle = ticketTheme === 'cyber' ? '#f8fafc' : '#1e1b4b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(categoryName, cardX + 210, cardY + 162);

      // Remarks / Notes
      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('REMARKS / 备注说明', cardX + 16, cardY + 192);

      const notesText =
        bookmark.notes?.trim() || '暂无详细备注 · 微信或相机扫码即刻前往该网址，探索精彩内容。';
      ctx.fillStyle = ticketTheme === 'cyber' ? '#94a3b8' : '#334155';
      ctx.font = '11px sans-serif';
      const notesSnippet = notesText.length > 34 ? notesText.slice(0, 34) + '...' : notesText;
      ctx.fillText(notesSnippet, cardX + 16, cardY + 212);

      // Perforation Line & Cutouts
      const perfY = cardY + 240;

      // Draw dashed line
      ctx.strokeStyle = ticketTheme === 'cyber' ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cardX + 16, perfY);
      ctx.lineTo(cardX + cardW - 16, perfY);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Cutout circles (matching outer background)
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cardX, perfY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cardX + cardW, perfY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Lower Stub: Terminal & QR code
      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('TERMINAL / 通道', cardX + 16, perfY + 36);
      ctx.fillStyle = ticketTheme === 'cyber' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('WEB-01', cardX + 16, perfY + 56);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('GATE / 登机门', cardX + 110, perfY + 36);
      ctx.fillStyle = ticketTheme === 'cyber' ? '#38bdf8' : '#4f46e5';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('PASS-A', cardX + 110, perfY + 56);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('STATUS / 状态', cardX + 16, perfY + 86);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('VERIFIED 验证有效', cardX + 16, perfY + 104);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.fillText('TAGS / 标签', cardX + 16, perfY + 134);
      ctx.fillStyle = ticketTheme === 'cyber' ? '#94a3b8' : '#475569';
      ctx.font = '11px sans-serif';
      const tagsText = bookmark.tags && bookmark.tags.length > 0 ? bookmark.tags.map((t) => `#${t}`).join(' ') : '#默认书签';
      ctx.fillText(tagsText.slice(0, 20), cardX + 16, perfY + 152);

      // Draw QR Code onto canvas
      if (qrDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = qrDataUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            const qrSize = 140;
            const qrX = cardX + cardW - qrSize - 16;
            const qrY = perfY + 20;

            // QR container box
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 12);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SCAN TO VISIT 扫码直达', qrX + qrSize / 2, qrY + qrSize + 22);

            resolve(true);
          };
          img.onerror = () => resolve(false);
        });
      }

      // Bottom footnote
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('* 本票据由轻藏 BookmarkHub 签发 · 支持微信与系统相机扫码直达', 210, 638);

      const downloadLink = document.createElement('a');
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.download = `Ticket_${destinationCode}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      showToast('票据图片已成功保存！', 'success');
    } catch (err) {
      console.error('Canvas export error:', err);
      showToast('保存图片失败，请稍后重试', 'error');
    }
  };

  // Main Export Function: Saves the ENTIRE ticket area as image
  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsExporting(true);

    try {
      // Use html-to-image to capture the exact styled ticket
      // skipFonts: true avoids cross-origin cssRules SecurityError on remote Google Fonts stylesheets
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 1,
        skipFonts: true,
        filter: (node) => {
          // Exclude any temporary ignore elements if needed
          return !node.classList?.contains('no-export');
        },
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Ticket_${destinationCode}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      showToast('票据图片已成功保存至本地！', 'success');
    } catch (err) {
      console.warn('html-to-image encountered issue, using fallback canvas export:', err);
      await fallbackCanvasExport();
    } finally {
      setIsExporting(false);
    }
  };

  // Theme-specific styles
  const themeStyles = {
    aero: {
      outerBg: 'bg-gradient-to-b from-[#251555] via-[#43237a] to-[#612b97]',
      cardBg: 'bg-white text-neutral-900',
      badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
      accentColor: '#4f46e5',
      cutoutBg: 'bg-[#43237a]',
      dashedBorder: 'border-neutral-200',
      stubBg: 'bg-neutral-50/70',
      headerText: 'text-white',
      subText: 'text-neutral-500',
      valueText: 'text-neutral-900',
      highlightText: 'text-indigo-600',
    },
    classic: {
      outerBg: 'bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#44403c]',
      cardBg: 'bg-[#faf8f5] text-neutral-900',
      badgeBg: 'bg-amber-100 text-amber-900',
      accentColor: '#b45309',
      cutoutBg: 'bg-[#292524]',
      dashedBorder: 'border-amber-200',
      stubBg: 'bg-[#f4efe6]',
      headerText: 'text-amber-100',
      subText: 'text-neutral-500',
      valueText: 'text-neutral-900',
      highlightText: 'text-amber-800',
    },
    cyber: {
      outerBg: 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#1e293b]',
      cardBg: 'bg-[#111827] text-neutral-100 border border-neutral-800',
      badgeBg: 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50',
      accentColor: '#06b6d4',
      cutoutBg: 'bg-[#0f172a]',
      dashedBorder: 'border-neutral-800',
      stubBg: 'bg-[#0b0f19]',
      headerText: 'text-cyan-300',
      subText: 'text-neutral-400',
      valueText: 'text-neutral-100',
      highlightText: 'text-cyan-400',
    },
  }[ticketTheme];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md my-auto flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Control Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-1 text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">网址探索通行证</h3>
              <p className="text-[10px] text-white/70">类似机票票据的分享凭证卡</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setTicketTheme('aero')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  ticketTheme === 'aero'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="航旅紫风（参考效果）"
              >
                航旅
              </button>
              <button
                type="button"
                onClick={() => setTicketTheme('classic')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  ticketTheme === 'classic'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="复古纸质"
              >
                复古
              </button>
              <button
                type="button"
                onClick={() => setTicketTheme('cyber')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  ticketTheme === 'cyber'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="暗黑极客"
              >
                极客
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================
            THE TICKET CARD TO EXPORT (ticketRef)
            Contains: Route header, White Boarding Pass, Notches,
            Perforated dashed line, QR code & Footnotes.
        ======================================================== */}
        <div
          ref={ticketRef}
          className={`w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${themeStyles.outerBg}`}
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Subtle World Map / Dot Pattern Watermark */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          {/* Top Route Zone: London LHR ✈ New York JFK Vibe */}
          <div className="relative z-10 flex items-center justify-between mb-4 px-1">
            <div className="text-left">
              <span className={`text-[10px] tracking-wider uppercase opacity-75 font-mono ${themeStyles.headerText}`}>
                ORIGIN 始发站
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 ${themeStyles.headerText}`}>
                <span>轻藏 HUB</span>
              </div>
            </div>

            {/* Flight Indicator Center */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="relative flex items-center">
                <span className="w-8 sm:w-12 border-t border-dashed border-white/40" />
                <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white mx-1 shadow-inner animate-pulse">
                  <Plane className="w-3.5 h-3.5 rotate-45" />
                </div>
                <span className="w-8 sm:w-12 border-t border-dashed border-white/40" />
              </div>
              <span className="text-[9px] font-mono text-white/60 mt-0.5 tracking-widest uppercase">
                DIRECT VISIT
              </span>
            </div>

            <div className="text-right">
              <span className={`text-[10px] tracking-wider uppercase opacity-75 font-mono ${themeStyles.headerText}`}>
                DESTINATION 目的地
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight ${themeStyles.headerText}`}>
                <span>{destinationCode}</span>
              </div>
              <div className="text-[10px] font-mono opacity-80 truncate max-w-[100px] text-white">
                {domain}
              </div>
            </div>
          </div>

          {/* ========================================================
              Main Ticket Paper Card
          ======================================================== */}
          <div className={`relative rounded-2xl shadow-xl overflow-hidden ${themeStyles.cardBg}`}>
            {/* Top Security Line */}
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: bookmark.color || themeStyles.accentColor,
              }}
            />

            {/* Top Pass Title & Serial */}
            <div className="pt-3.5 px-4 sm:px-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  BOOKMARK PASS
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  · 网址探索凭证
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                #BM-{bookmark.id.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Upper Stub Content */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* 1. Website Title (Passenger Equivalent) */}
              <div>
                <span className={`block text-[10px] font-mono font-semibold tracking-wider uppercase ${themeStyles.subText}`}>
                  WEBSITE TITLE / 网站标题
                </span>
                <h4 className={`text-base sm:text-lg font-bold tracking-tight line-clamp-2 mt-0.5 leading-snug ${themeStyles.valueText}`}>
                  {bookmark.title}
                </h4>
              </div>

              {/* 2. Target URL */}
              <div>
                <span className={`block text-[10px] font-mono font-semibold tracking-wider uppercase ${themeStyles.subText}`}>
                  TARGET URL / 访问网址
                </span>
                <div className={`text-xs font-mono font-medium truncate mt-0.5 flex items-center gap-1 ${themeStyles.highlightText}`}>
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{bookmark.url}</span>
                </div>
              </div>

              {/* 3. Ticket Flight Meta Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* System Time (User explicitly requested 当前系统时间) */}
                <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-750">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span>SYSTEM TIME / 签发时间</span>
                  </div>
                  <div className={`text-xs font-bold font-mono ${themeStyles.valueText}`}>
                    {systemTime.timeStr}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {systemTime.dateStr} ({systemTime.dayOfWeek})
                  </div>
                </div>

                {/* Category & Status */}
                <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-750">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 mb-0.5">
                    <Compass className="w-3 h-3" />
                    <span>CATEGORY / 所属分类</span>
                  </div>
                  <div className={`text-xs font-bold truncate ${themeStyles.valueText}`}>
                    {categoryName}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ● VERIFIED 准许通行
                  </div>
                </div>
              </div>

              {/* 4. Notes & Remarks (User explicitly requested 备注说明等信息) */}
              <div className="p-2.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-750 text-left">
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 mb-1">
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span>REMARKS / 备注说明</span>
                </div>
                <p className={`text-xs leading-relaxed ${themeStyles.subText}`}>
                  {bookmark.notes?.trim() ? (
                    bookmark.notes
                  ) : (
                    <span className="italic text-neutral-400 dark:text-neutral-500">
                      轻藏收藏出行凭证。手机微信或相机扫码即刻前往该网址，探索精彩内容。
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* ========================================================
                The Ticket Perforation (经典撕票凹槽与虚线)
            ======================================================== */}
            <div className="relative py-1 flex items-center">
              {/* Left Notch Cutout */}
              <div
                className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full shadow-inner z-20 ${themeStyles.cutoutBg}`}
              />

              {/* Center Dashed Divider Line */}
              <div className={`flex-1 border-t-2 border-dashed mx-5 ${themeStyles.dashedBorder}`} />

              {/* Right Notch Cutout */}
              <div
                className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full shadow-inner z-20 ${themeStyles.cutoutBg}`}
              />
            </div>

            {/* ========================================================
                Lower Stub: Terminal, Gate, Tags & QR Code
            ======================================================== */}
            <div className={`p-4 sm:p-5 flex items-center justify-between gap-3 ${themeStyles.stubBg}`}>
              {/* Left: Flight Terminal / Gate details */}
              <div className="flex-1 min-w-0 space-y-2 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[9px] font-mono uppercase text-neutral-400">
                      TERMINAL / 通道
                    </span>
                    <span className={`text-xs sm:text-sm font-black font-mono ${themeStyles.valueText}`}>
                      WEB-01
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase text-neutral-400">
                      GATE / 登机门
                    </span>
                    <span className={`text-xs sm:text-sm font-black font-mono ${themeStyles.highlightText}`}>
                      PASS-A
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                    TAGS / 标签
                  </span>
                  <div className="flex flex-wrap gap-1 max-w-[170px]">
                    {bookmark.tags && bookmark.tags.length > 0 ? (
                      bookmark.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-mono">#精选书签</span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="block text-[9px] font-mono uppercase text-neutral-400">
                    VISITS / 探索热度
                  </span>
                  <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                    {bookmark.clickCount || 0} CLICKS
                  </span>
                </div>
              </div>

              {/* Right: The QR Code Container */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-2 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${bookmark.title}`}
                      className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center text-neutral-400 text-xs">
                      生成中...
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 mt-1.5 tracking-wider uppercase font-semibold">
                  SCAN TO BOARD · 扫码访问
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footnote on Outer Card */}
          <div className="mt-3 text-center">
            <p className="text-[10px] text-white/70 font-mono">
              * 本票据由轻藏 BookmarkHub 签发 · 支持微信与系统相机扫码直达
            </p>
          </div>
        </div>

        {/* ========================================================
            Action Buttons (Below the Ticket)
        ======================================================== */}
        <div className="w-full mt-3 flex items-center gap-2">
          {/* Copy URL */}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-white border border-white/10 text-xs font-semibold backdrop-blur-md transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制网址' : '复制网址'}</span>
          </button>

          {/* Save Entire Ticket Image (Primary Requirement) */}
          <button
            type="button"
            onClick={handleDownloadTicket}
            disabled={isExporting}
            className="flex-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 active:scale-98 text-neutral-900 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            title="保存整个票据卡片的精美图片"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                <span>生成票据图片中...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>保存票据图片</span>
              </>
            )}
          </button>

          {/* Open URL directly in new tab */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-white border border-white/10 transition-all flex items-center justify-center"
            title="在浏览器新标签页直接打开"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
