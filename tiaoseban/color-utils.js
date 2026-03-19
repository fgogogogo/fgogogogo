/**
 * 颜色工具函数
 * 提供颜色转换、色彩理论计算等功能
 */

// 颜色转换工具
const ColorUtils = {
    /**
     * 将十六进制颜色转换为RGB对象
     * @param {string} hex - 十六进制颜色 (#RRGGBB 或 #RGB)
     * @returns {object} {r, g, b}
     */
    hexToRgb(hex) {
        // 移除 # 号
        hex = hex.replace(/^#/, '');

        // 处理简写形式 #RGB
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }

        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        return { r, g, b };
    },

    /**
     * 将RGB对象转换为十六进制颜色
     * @param {number} r - 红色 (0-255)
     * @param {number} g - 绿色 (0-255)
     * @param {number} b - 蓝色 (0-255)
     * @returns {string} #RRGGBB
     */
    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    },

    /**
     * 将RGB转换为HSL
     * @param {number} r - 红色 (0-255)
     * @param {number} g - 绿色 (0-255)
     * @param {number} b - 蓝色 (0-255)
     * @returns {object} {h, s, l} - h: 0-360, s: 0-100, l: 0-100
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    /**
     * 将HSL转换为RGB
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @returns {object} {r, g, b} - 每个值 0-255
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    /**
     * 将十六进制颜色转换为HSL
     * @param {string} hex - 十六进制颜色
     * @returns {object} {h, s, l}
     */
    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    },

    /**
     * 将HSL转换为十六进制颜色
     * @param {number} h - 色相
     * @param {number} s - 饱和度
     * @param {number} l - 亮度
     * @returns {string} #RRGGBB
     */
    hslToHex(h, s, l) {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    },

    /**
     * 计算颜色的亮度
     * @param {string} hex - 十六进制颜色
     * @returns {number} 0-255
     */
    getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
    },

    /**
     * 判断颜色是深色还是浅色
     * @param {string} hex - 十六进制颜色
     * @returns {boolean} true为深色
     */
    isDark(hex) {
        return this.getLuminance(hex) < 128;
    },

    /**
     * 获取对比文本颜色（黑或白）
     * @param {string} hex - 背景色
     * @returns {string} #000000 或 #ffffff
     */
    getContrastColor(hex) {
        return this.isDark(hex) ? '#ffffff' : '#000000';
    }
};

// 色彩理论工具
const ColorTheory = {
    /**
     * 生成互补色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateComplementary(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);
        const complementaryHue = (hsl.h + 180) % 360;

        return [
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex(complementaryHue, hsl.s, hsl.l), name: '互补色' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)), name: '主色浅色' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(0, hsl.l - 15)), name: '主色深色' },
            { hex: ColorUtils.hslToHex(complementaryHue, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)), name: '互补色浅色' }
        ];
    },

    /**
     * 生成邻近色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateAnalogous(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);
        const hueStep = 30;

        return [
            { hex: ColorUtils.hslToHex((hsl.h - hueStep + 360) % 360, hsl.s, hsl.l), name: '邻近色-1' },
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep) % 360, hsl.s, hsl.l), name: '邻近色+1' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep * 2) % 360, hsl.s, hsl.l), name: '邻近色+2' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.max(0, hsl.s - 30), Math.min(100, hsl.l + 30)), name: '主色淡化' }
        ];
    },

    /**
     * 生成三元色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateTriadic(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);
        const hueStep = 120;

        return [
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep) % 360, hsl.s, hsl.l), name: '三元色-1' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep * 2) % 360, hsl.s, hsl.l), name: '三元色-2' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 25)), name: '主色浅色' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep) % 360, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 25)), name: '三元色-1浅色' }
        ];
    },

    /**
     * 生成分裂互补色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateSplitComplementary(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);
        const complementaryHue = (hsl.h + 180) % 360;
        const splitStep = 30;

        return [
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex((complementaryHue - splitStep + 360) % 360, hsl.s, hsl.l), name: '分裂互补-1' },
            { hex: ColorUtils.hslToHex((complementaryHue + splitStep) % 360, hsl.s, hsl.l), name: '分裂互补-2' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)), name: '主色浅色' },
            { hex: ColorUtils.hslToHex((complementaryHue - splitStep + 360) % 360, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)), name: '互补色浅色' }
        ];
    },

    /**
     * 生成四元色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateTetradic(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);
        const hueStep = 90;

        return [
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep) % 360, hsl.s, hsl.l), name: '四元色-1' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep * 2) % 360, hsl.s, hsl.l), name: '四元色-2' },
            { hex: ColorUtils.hslToHex((hsl.h + hueStep * 3) % 360, hsl.s, hsl.l), name: '四元色-3' },
            { hex: ColorUtils.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)), name: '主色浅色' }
        ];
    },

    /**
     * 生成单色调色板
     * @param {string} baseColor - 基础颜色
     * @returns {Array} 颜色数组
     */
    generateMonochromatic(baseColor) {
        const hsl = ColorUtils.hexToHsl(baseColor);

        return [
            { hex: ColorUtils.hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 40)), name: '极浅' },
            { hex: ColorUtils.hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20)), name: '浅色' },
            { hex: baseColor, name: '主色' },
            { hex: ColorUtils.hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20)), name: '深色' },
            { hex: ColorUtils.hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 40)), name: '极深' }
        ];
    },

    /**
     * 根据类型生成调色板
     * @param {string} baseColor - 基础颜色
     * @param {string} type - 色彩理论类型
     * @returns {Array} 颜色数组
     */
    generatePalette(baseColor, type) {
        switch (type) {
            case 'complementary':
                return this.generateComplementary(baseColor);
            case 'analogous':
                return this.generateAnalogous(baseColor);
            case 'triadic':
                return this.generateTriadic(baseColor);
            case 'split-complementary':
                return this.generateSplitComplementary(baseColor);
            case 'tetradic':
                return this.generateTetradic(baseColor);
            case 'monochromatic':
                return this.generateMonochromatic(baseColor);
            default:
                return this.generateComplementary(baseColor);
        }
    }
};

// 图片颜色提取
const ImageColorExtractor = {
    /**
     * 从Canvas中提取主要颜色
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {number} colorCount - 需要提取的颜色数量
     * @returns {Promise<Array>} 颜色数组
     */
    async extractColors(canvas, colorCount = 5) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // 采样像素
        const samples = [];
        const sampleRate = Math.max(1, Math.floor(pixels.length / (4 * 10000))); // 最多采样10000个像素

        for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // 跳过透明像素和接近白色的像素
            if (a < 128) continue;
            if (r > 250 && g > 250 && b > 250) continue;

            samples.push({ r, g, b });
        }

        // 使用k-means聚类
        return this.kMeans(samples, colorCount);
    },

    /**
     * k-means聚类算法
     * @param {Array} samples - 像素样本数组
     * @param {number} k - 聚类数量
     * @returns {Array} 颜色数组
     */
    kMeans(samples, k) {
        if (samples.length === 0) return [];
        if (samples.length <= k) {
            return samples.map((s, i) => ({
                hex: ColorUtils.rgbToHex(s.r, s.g, s.b),
                name: `颜色${i + 1}`
            }));
        }

        // 随机初始化中心点
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * samples.length);
            centroids.push({ ...samples[randomIndex] });
        }

        // 迭代
        const maxIterations = 20;
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // 分配样本到最近的中心点
            const clusters = Array(k).fill(null).map(() => []);

            for (const sample of samples) {
                let minDistance = Infinity;
                let closestCentroid = 0;

                for (let i = 0; i < k; i++) {
                    const distance = this.colorDistance(sample, centroids[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = i;
                    }
                }

                clusters[closestCentroid].push(sample);
            }

            // 更新中心点
            let changed = false;
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) continue;

                const newCentroid = {
                    r: Math.round(clusters[i].reduce((sum, s) => sum + s.r, 0) / clusters[i].length),
                    g: Math.round(clusters[i].reduce((sum, s) => sum + s.g, 0) / clusters[i].length),
                    b: Math.round(clusters[i].reduce((sum, s) => sum + s.b, 0) / clusters[i].length)
                };

                if (this.colorDistance(newCentroid, centroids[i]) > 1) {
                    changed = true;
                }

                centroids[i] = newCentroid;
            }

            if (!changed) break;
        }

        // 按颜色数量排序
        const colorCounts = centroids.map((centroid, i) => {
            let count = 0;
            for (const sample of samples) {
                if (this.colorDistance(sample, centroid) < 50) {
                    count++;
                }
            }
            return { centroid, count, index: i };
        });

        colorCounts.sort((a, b) => b.count - a.count);

        return colorCounts.map((item, i) => ({
            hex: ColorUtils.rgbToHex(item.centroid.r, item.centroid.g, item.centroid.b),
            name: `颜色${i + 1}`
        }));
    },

    /**
     * 计算两个颜色之间的欧几里得距离
     * @param {object} c1 - 颜色1 {r, g, b}
     * @param {object} c2 - 颜色2 {r, g, b}
     * @returns {number} 距离
     */
    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColorUtils, ColorTheory, ImageColorExtractor };
}
