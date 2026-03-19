/**
 * 调色板生成工具 - 主应用
 */

// 全局状态
const AppState = {
    baseColor: '#6366f1',
    currentHarmony: 'complementary',
    palette: [],
    colorBlindnessType: 'normal',
    currentPreview: 'landing',
    currentExportFormat: 'css'
};

// 历史记录管理器
const historyManager = new HistoryManager(50);

// DOM 元素引用
const elements = {};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();

    // 生成初始调色板
    generatePalette();

    // 保存初始状态
    historyManager.push({
        baseColor: AppState.baseColor,
        currentHarmony: AppState.currentHarmony,
        palette: [...AppState.palette]
    });
});

// 初始化 DOM 元素引用
function initializeElements() {
    elements.baseColorPicker = document.getElementById('baseColorPicker');
    elements.baseColorText = document.getElementById('baseColorText');
    elements.harmonyButtons = document.querySelectorAll('.harmony-btn');
    elements.generateBtn = document.getElementById('generateBtn');
    elements.paletteContainer = document.getElementById('paletteContainer');
    elements.emptyState = document.getElementById('emptyState');
    elements.uploadArea = document.getElementById('uploadArea');
    elements.imageInput = document.getElementById('imageInput');
    elements.imageCanvas = document.getElementById('imageCanvas');
    elements.colorCount = document.getElementById('colorCount');
    elements.colorCountValue = document.getElementById('colorCountValue');
    elements.colorBlindnessSelect = document.getElementById('colorBlindnessSelect');
    elements.previewTabs = document.querySelectorAll('.preview-tab');
    elements.previewContainer = document.getElementById('previewContainer');
    elements.exportToggle = document.getElementById('exportToggle');
    elements.exportDropdown = document.getElementById('exportDropdown');
    elements.exportOptions = document.querySelectorAll('.export-option');
    elements.exportModal = document.getElementById('exportModal');
    elements.exportTitle = document.getElementById('exportTitle');
    elements.exportCode = document.getElementById('exportCode');
    elements.modalClose = document.getElementById('modalClose');
    elements.copyBtn = document.getElementById('copyBtn');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.undoBtn = document.getElementById('undoBtn');
    elements.redoBtn = document.getElementById('redoBtn');
}

// 设置事件监听器
function setupEventListeners() {
    // 颜色选择器
    elements.baseColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        elements.baseColorText.value = color;
        AppState.baseColor = color;
    });

    elements.baseColorPicker.addEventListener('change', () => {
        generatePalette();
        saveState();
    });

    // 颜色文本输入
    elements.baseColorText.addEventListener('input', (e) => {
        let color = e.target.value.trim();
        if (isValidHex(color)) {
            if (!color.startsWith('#')) color = '#' + color;
            elements.baseColorPicker.value = color;
            AppState.baseColor = color;
        }
    });

    elements.baseColorText.addEventListener('change', () => {
        let color = elements.baseColorText.value.trim();
        if (!color.startsWith('#')) color = '#' + color;
        if (isValidHex(color)) {
            AppState.baseColor = color;
            generatePalette();
            saveState();
        }
    });

    // 色彩理论按钮
    elements.harmonyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.harmonyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentHarmony = btn.dataset.harmony;
            generatePalette();
            saveState();
        });
    });

    // 生成按钮
    elements.generateBtn.addEventListener('click', () => {
        generatePalette();
        saveState();
    });

    // 图片上传
    elements.uploadArea.addEventListener('click', () => {
        elements.imageInput.click();
    });

    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageUpload(files[0]);
        }
    });

    elements.imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // 颜色数量滑块
    elements.colorCount.addEventListener('input', (e) => {
        elements.colorCountValue.textContent = e.target.value;
    });

    // 色盲模拟
    elements.colorBlindnessSelect.addEventListener('change', (e) => {
        AppState.colorBlindnessType = e.target.value;
        renderPalette();
        renderPreview();
    });

    // 预览标签
    elements.previewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.previewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            AppState.currentPreview = tab.dataset.preview;
            renderPreview();
        });
    });

    // 导出功能
    elements.exportToggle.addEventListener('click', () => {
        elements.exportDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-panel')) {
            elements.exportDropdown.classList.remove('show');
        }
    });

    elements.exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.dataset.format;
            AppState.currentExportFormat = format;
            showExportModal(format);
            elements.exportDropdown.classList.remove('show');
        });
    });

    // 模态框
    elements.modalClose.addEventListener('click', hideExportModal);
    elements.exportModal.addEventListener('click', (e) => {
        if (e.target === elements.exportModal) {
            hideExportModal();
        }
    });

    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.downloadBtn.addEventListener('click', downloadExport);

    // 撤销/重做
    elements.undoBtn.addEventListener('click', undo);
    elements.redoBtn.addEventListener('click', redo);

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        }
    });

    // 历史记录监听器
    historyManager.addListener((state) => {
        elements.undoBtn.disabled = !state.canUndo;
        elements.redoBtn.disabled = !state.canRedo;
    });
}

// 验证十六进制颜色
function isValidHex(hex) {
    return /^#?[0-9A-Fa-f]{6}$/.test(hex) || /^#?[0-9A-Fa-f]{3}$/.test(hex);
}

// 生成调色板
function generatePalette() {
    AppState.palette = ColorTheory.generatePalette(
        AppState.baseColor,
        AppState.currentHarmony
    );
    renderPalette();
    renderPreview();
}

// 渲染调色板
function renderPalette() {
    if (AppState.palette.length === 0) {
        elements.paletteContainer.innerHTML = '';
        elements.emptyState.style.display = 'block';
        return;
    }

    elements.emptyState.style.display = 'none';

    // 应用色盲模拟
    const displayPalette = ColorBlindness.simulatePalette(
        AppState.palette,
        AppState.colorBlindnessType
    );

    elements.paletteContainer.innerHTML = displayPalette.map((color, index) => {
        const rgb = ColorUtils.hexToRgb(color.hex);
        return `
            <div class="color-card" data-index="${index}">
                <div class="color-preview" style="background-color: ${color.hex}" data-color="${color.hex}">
                    <div class="copy-overlay">点击复制</div>
                </div>
                <div class="color-info">
                    <div class="hex" data-color="${color.hex}">${color.hex}</div>
                    <div class="rgb">RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</div>
                    ${color.name ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">${color.name}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // 添加点击复制功能
    elements.paletteContainer.querySelectorAll('.color-preview, .hex').forEach(el => {
        el.addEventListener('click', () => {
            const color = el.dataset.color;
            navigator.clipboard.writeText(color).then(() => {
                showToast(`已复制 ${color}`, 'success');
            });
        });
    });
}

// 处理图片上传
function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 调整图片大小以提高性能
            const maxSize = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            elements.imageCanvas.width = width;
            elements.imageCanvas.height = height;

            const ctx = elements.imageCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // 提取颜色
            const colorCount = parseInt(elements.colorCount.value);
            ImageColorExtractor.extractColors(elements.imageCanvas, colorCount)
                .then(colors => {
                    AppState.palette = colors;
                    // 设置基础颜色为提取的第一个颜色
                    if (colors.length > 0) {
                        AppState.baseColor = colors[0].hex;
                        elements.baseColorPicker.value = colors[0].hex;
                        elements.baseColorText.value = colors[0].hex;
                    }
                    renderPalette();
                    renderPreview();
                    saveState();
                    showToast('颜色提取成功！', 'success');
                })
                .catch(err => {
                    console.error('提取颜色失败:', err);
                    showToast('提取颜色失败，请重试', 'error');
                });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 渲染预览
function renderPreview() {
    const palette = AppState.palette.length > 0 ? AppState.palette : [
        { hex: '#6366f1', name: 'Primary' },
        { hex: '#8b5cf6', name: 'Secondary' },
        { hex: '#a855f7', name: 'Accent' }
    ];

    // 应用色盲模拟
    const displayPalette = ColorBlindness.simulatePalette(
        palette.slice(0, 5),
        AppState.colorBlindnessType
    );

    const [primary, secondary, accent, light, dark] = [
        displayPalette[0]?.hex || '#6366f1',
        displayPalette[1]?.hex || '#8b5cf6',
        displayPalette[2]?.hex || '#a855f7',
        displayPalette[3]?.hex || '#c4b5fd',
        displayPalette[4]?.hex || '#4c1d95'
    ];

    const bgColor = '#0f0f23';
    const textColor = '#ffffff';

    let previewHTML = '';

    switch (AppState.currentPreview) {
        case 'landing':
            previewHTML = `
                <div class="preview-landing" style="background: ${bgColor}; color: ${textColor};">
                    <header class="preview-header" style="background: ${dark};">
                        <div class="logo" style="color: ${primary};">Brand</div>
                        <nav>
                            <a href="#" style="color: ${textColor};">首页</a>
                            <a href="#" style="color: ${textColor};">产品</a>
                            <a href="#" style="color: ${textColor};">关于</a>
                            <a href="#" style="color: ${primary};">联系</a>
                        </nav>
                    </header>
                    <div class="preview-hero">
                        <h1 style="color: ${primary};">创造精彩设计</h1>
                        <p style="color: ${textColor}; opacity: 0.8;">使用我们的工具打造令人惊叹的视觉体验，让您的创意无限绽放</p>
                        <button class="preview-btn" style="background: ${primary}; color: ${ColorUtils.getContrastColor(primary)};">开始探索</button>
                    </div>
                </div>
            `;
            break;

        case 'dashboard':
            previewHTML = `
                <div class="preview-dashboard" style="background: ${bgColor}; color: ${textColor};">
                    <aside class="preview-sidebar" style="background: ${dark};">
                        <div class="menu-item active" style="background: ${primary}; color: ${ColorUtils.getContrastColor(primary)};">概览</div>
                        <div class="menu-item" style="color: ${textColor};">分析</div>
                        <div class="menu-item" style="color: ${textColor};">报告</div>
                        <div class="menu-item" style="color: ${textColor};">设置</div>
                    </aside>
                    <main class="preview-main">
                        <h2 style="color: ${primary};">仪表板</h2>
                        <div class="stats-grid">
                            <div class="stat-card" style="background: ${dark};">
                                <h4 style="color: ${secondary};">总访问</h4>
                                <div class="value" style="color: ${primary};">12.5K</div>
                            </div>
                            <div class="stat-card" style="background: ${dark};">
                                <h4 style="color: ${secondary};">活跃用户</h4>
                                <div class="value" style="color: ${accent};">8.2K</div>
                            </div>
                            <div class="stat-card" style="background: ${dark};">
                                <h4 style="color: ${secondary};">转化率</h4>
                                <div class="value" style="color: ${primary};">24%</div>
                            </div>
                        </div>
                        <div style="background: ${dark}; padding: 1rem; border-radius: 8px; height: 150px;">
                            <div style="color: ${textColor}; opacity: 0.6; font-size: 0.875rem;">数据图表区域</div>
                            <div style="display: flex; align-items: flex-end; gap: 8px; height: 100px; margin-top: 1rem;">
                                <div style="flex: 1; background: ${primary}; height: 60%; border-radius: 4px;"></div>
                                <div style="flex: 1; background: ${secondary}; height: 80%; border-radius: 4px;"></div>
                                <div style="flex: 1; background: ${accent}; height: 45%; border-radius: 4px;"></div>
                                <div style="flex: 1; background: ${primary}; height: 90%; border-radius: 4px;"></div>
                                <div style="flex: 1; background: ${light}; height: 70%; border-radius: 4px;"></div>
                            </div>
                        </div>
                    </main>
                </div>
            `;
            break;

        case 'card':
            previewHTML = `
                <div class="preview-card" style="background: ${bgColor};">
                    <div class="sample-card" style="background: ${dark};">
                        <div class="sample-card-image" style="background: linear-gradient(135deg, ${primary}, ${secondary});"></div>
                        <div class="sample-card-content" style="color: ${textColor};">
                            <h3 style="color: ${primary};">精美卡片</h3>
                            <p style="color: ${textColor}; opacity: 0.8;">这是一个使用当前调色板生成的示例卡片组件，展示颜色在实际 UI 中的应用效果。</p>
                            <button class="sample-card-btn" style="background: ${accent}; color: ${ColorUtils.getContrastColor(accent)};">了解更多</button>
                        </div>
                    </div>
                </div>
            `;
            break;
    }

    elements.previewContainer.innerHTML = previewHTML;
}

// 保存状态到历史记录
function saveState() {
    historyManager.push({
        baseColor: AppState.baseColor,
        currentHarmony: AppState.currentHarmony,
        palette: [...AppState.palette]
    });
}

// 撤销
function undo() {
    const state = historyManager.undo();
    if (state) {
        restoreState(state);
    }
}

// 重做
function redo() {
    const state = historyManager.redo();
    if (state) {
        restoreState(state);
    }
}

// 恢复状态
function restoreState(state) {
    AppState.baseColor = state.baseColor;
    AppState.currentHarmony = state.currentHarmony;
    AppState.palette = [...state.palette];

    // 更新 UI
    elements.baseColorPicker.value = AppState.baseColor;
    elements.baseColorText.value = AppState.baseColor;

    elements.harmonyButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.harmony === AppState.currentHarmony);
    });

    renderPalette();
    renderPreview();
}

// 显示导出模态框
function showExportModal(format) {
    const code = generateExportCode(format);
    elements.exportCode.textContent = code;
    elements.exportTitle.textContent = `导出 ${format.toUpperCase()}`;
    elements.exportModal.classList.add('show');
}

// 隐藏导出模态框
function hideExportModal() {
    elements.exportModal.classList.remove('show');
}

// 生成导出代码
function generateExportCode(format) {
    const palette = AppState.palette;
    const timestamp = new Date().toISOString();

    switch (format) {
        case 'css':
            return `/* 调色板 - 生成于 ${timestamp} */
:root {
${palette.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name || `Color ${i + 1}`} */`).join('\n')}
}

/* 使用示例 */
.primary { color: var(--color-1); }
.secondary { color: var(--color-2); }
.background { background-color: var(--color-3); }`;

        case 'scss':
            return `// 调色板 - 生成于 ${timestamp}
${palette.map((c, i) => `$color-${i + 1}: ${c.hex}; // ${c.name || `Color ${i + 1}`}`).join('\n')}

// 使用示例
.button {
  background-color: $color-1;
  color: white;

  &:hover {
    background-color: darken($color-1, 10%);
  }
}`;

        case 'svg':
            return `<!-- 调色板 - 生成于 ${timestamp} -->
<svg width="${palette.length * 100}" height="120" xmlns="http://www.w3.org/2000/svg">
${palette.map((c, i) => `  <rect x="${i * 100}" y="0" width="100" height="100" fill="${c.hex}" rx="8"/>
  <text x="${i * 100 + 50}" y="115" text-anchor="middle" font-family="monospace" font-size="12" fill="#333">${c.hex}</text>`).join('\n')}
</svg>`;

        case 'json':
            return JSON.stringify({
                name: 'Generated Palette',
                timestamp,
                colors: palette.map((c, i) => ({
                    name: c.name || `Color ${i + 1}`,
                    hex: c.hex,
                    rgb: ColorUtils.hexToRgb(c.hex)
                }))
            }, null, 2);

        default:
            return '';
    }
}

// 复制到剪贴板
function copyToClipboard() {
    const code = elements.exportCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('已复制到剪贴板！', 'success');
    });
}

// 下载文件
function downloadExport() {
    const format = AppState.currentExportFormat;
    const code = elements.exportCode.textContent;

    const mimeTypes = {
        css: 'text/css',
        scss: 'text/x-scss',
        svg: 'image/svg+xml',
        json: 'application/json'
    };

    const extensions = {
        css: 'css',
        scss: 'scss',
        svg: 'svg',
        json: 'json'
    };

    const blob = new Blob([code], { type: mimeTypes[format] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette.${extensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('文件下载成功！', 'success');
}

// 显示 Toast 通知
function showToast(message, type = 'success') {
    // 移除现有的 toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
