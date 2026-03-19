//**
 * 色盲模拟
 * 基于 LMS 色彩空间的色盲模拟算法
 */

const ColorBlindness = {
    // 色盲类型的转换矩阵
    matrices: {
        // 红色盲 (Protanopia) - 缺少 L 视锥细胞
        protanopia: [
            [0.567, 0.433, 0],
            [0.558, 0.442, 0],
            [0, 0.242, 0.758]
        ],
        // 绿色盲 (Deuteranopia) - 缺少 M 视锥细胞
        deuteranopia: [
            [0.625, 0.375, 0],
            [0.7, 0.3, 0],
            [0, 0.3, 0.7]
        ],
        // 蓝色盲 (Tritanopia) - 缺少 S 视锥细胞
        tritanopia: [
            [0.95, 0.05, 0],
            [0, 0.433, 0.567],
            [0, 0.475, 0.525]
        ],
        // 全色盲 (Achromatopsia)
        achromatopsia: [
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114]
        ]
    },

    /**
     * 应用色盲模拟矩阵
     * @param {object} rgb - {r, g, b} 0-255
     * @param {string} type - 色盲类型
     * @returns {object} {r, g, b} 0-255
     */
    simulate(rgb, type) {
        if (type === 'normal' || !this.matrices[type]) {
            return rgb;
        }

        const matrix = this.matrices[type];

        // 归一化到 0-1
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        // 应用矩阵
        const newR = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
        const newG = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
        const newB = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

        // 转换回 0-255 并裁剪
        return {
            r: Math.max(0, Math.min(255, Math.round(newR * 255))),
            g: Math.max(0, Math.min(255, Math.round(newG * 255))),
            b: Math.max(0, Math.min(255, Math.round(newB * 255)))
        };
    },

    /**
     * 模拟十六进制颜色
     * @param {string} hex - 十六进制颜色
     * @param {string} type - 色盲类型
     * @returns {string} 模拟后的十六进制颜色
     */
    simulateHex(hex, type) {
        if (type === 'normal') return hex;

        const rgb = ColorUtils.hexToRgb(hex);
        const simulatedRgb = this.simulate(rgb, type);
        return ColorUtils.rgbToHex(simulatedRgb.r, simulatedRgb.g, simulatedRgb.b);
    },

    /**
     * 对整个调色板应用色盲模拟
     * @param {Array} palette - 颜色数组 [{hex, name}]
     * @param {string} type - 色盲类型
     * @returns {Array} 模拟后的调色板
     */
    simulatePalette(palette, type) {
        if (type === 'normal') return palette;

        return palette.map(color => ({
            ...color,
            hex: this.simulateHex(color.hex, type),
            originalHex: color.hex
        }));
    },

    /**
     * 获取色盲类型的描述
     * @param {string} type - 色盲类型
     * @returns {string} 描述
     */
    getDescription(type) {
        const descriptions = {
            normal: '正常视觉',
            protanopia: '红色盲 - 难以区分红色和绿色',
            deuteranopia: '绿色盲 - 难以区分红色和绿色',
            tritanopia: '蓝色盲 - 难以区分蓝色和黄色',
            achromatopsia: '全色盲 - 只能看到灰度'
        };
        return descriptions[type] || descriptions.normal;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColorBlindness };
}
