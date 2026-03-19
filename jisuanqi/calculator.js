/**
 * 科学函数计算器 - 使用 Shunting-yard 算法
 * 支持 sin, cos, tan, log, ln, sqrt, 括号等
 */

// 计算器状态
const state = {
    expression: '',
    lastResult: '0',
    angleMode: 'deg', // 'deg' 或 'rad'
    history: [],
    theme: 'light'
};

// DOM 元素
const elements = {
    expression: document.getElementById('expression'),
    result: document.getElementById('result'),
    history: document.getElementById('history'),
    clearHistory: document.getElementById('clearHistory'),
    graphModal: document.getElementById('graphModal'),
    closeGraph: document.getElementById('closeGraph'),
    functionInput: document.getElementById('functionInput'),
    plotBtn: document.getElementById('plotBtn'),
    graphCanvas: document.getElementById('graphCanvas'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    resetView: document.getElementById('resetView'),
    rangeInfo: document.getElementById('rangeInfo')
};

// 图形绘制状态
const graphState = {
    canvas: null,
    ctx: null,
    scale: 40, // 像素/单位
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    currentFunction: 'x^2'
};

// 运算符优先级
const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
    'u+': 4,  // 一元加
    'u-': 4,  // 一元减
    'sin': 5, 'cos': 5, 'tan': 5,
    'asin': 5, 'acos': 5, 'atan': 5,
    'log': 5, 'ln': 5, 'sqrt': 5,
    'abs': 5, 'fact': 5
};

// 运算符是否左结合
const isLeftAssociative = {
    '+': true, '-': true, '*': true, '/': true, '^': false
};

// 函数映射
const mathFunctions = {
    sin: (x) => state.angleMode === 'deg' ? Math.sin(x * Math.PI / 180) : Math.sin(x),
    cos: (x) => state.angleMode === 'deg' ? Math.cos(x * Math.PI / 180) : Math.cos(x),
    tan: (x) => state.angleMode === 'deg' ? Math.tan(x * Math.PI / 180) : Math.tan(x),
    asin: (x) => state.angleMode === 'deg' ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
    acos: (x) => state.angleMode === 'deg' ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
    atan: (x) => state.angleMode === 'deg' ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    log: (x) => Math.log10(x),
    ln: (x) => Math.log(x),
    sqrt: (x) => Math.sqrt(x),
    abs: (x) => Math.abs(x),
    fact: factorial
};

// 常量
const constants = {
    pi: Math.PI,
    e: Math.E
};

// 计算阶乘
function factorial(n) {
    if (n < 0) throw new Error('负数没有阶乘');
    if (!Number.isInteger(n)) throw new Error('阶乘需要整数');
    if (n > 170) throw new Error('数字太大');
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// 词法分析器 - 将表达式分割成token
function tokenize(expr) {
    const tokens = [];
    let i = 0;
    expr = expr.toLowerCase().replace(/\s/g, '');

    while (i < expr.length) {
        const char = expr[i];

        // 数字和小数点
        if (/[\d.]/.test(char)) {
            let num = '';
            while (i < expr.length && /[\d.]/.test(expr[i])) {
                num += expr[i];
                i++;
            }
            if (num === '.' || num.split('.').length > 2) {
                throw new Error('无效的数字格式');
            }
            tokens.push({ type: 'number', value: parseFloat(num) });
            continue;
        }

        // 标识符（函数名、常量）
        if (/[a-z]/.test(char)) {
            let name = '';
            while (i < expr.length && /[a-z]/.test(expr[i])) {
                name += expr[i];
                i++;
            }
            if (mathFunctions[name] || name === 'fact') {
                tokens.push({ type: 'function', value: name });
            } else if (constants[name]) {
                tokens.push({ type: 'number', value: constants[name] });
            } else {
                throw new Error(`未知标识符: ${name}`);
            }
            continue;
        }

        // 运算符
        if ('+-*/^()'.includes(char)) {
            tokens.push({ type: 'operator', value: char });
            i++;
            continue;
        }

        // 一元运算符（阶乘）
        if (char === '!') {
            tokens.push({ type: 'function', value: 'fact' });
            i++;
            continue;
        }

        throw new Error(`未知字符: ${char}`);
    }

    return tokens;
}

// 处理一元运算符
function processUnaryOperators(tokens) {
    const result = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
            // 检查是否是一元运算符
            const isUnary = i === 0 ||
                (tokens[i - 1].type === 'operator' && tokens[i - 1].value !== ')') ||
                tokens[i - 1].type === 'function';

            if (isUnary) {
                result.push({ type: 'operator', value: 'u' + token.value });
                continue;
            }
        }
        result.push(token);
    }
    return result;
}

// Shunting-yard 算法 - 中缀转后缀
function infixToPostfix(tokens) {
    const output = [];
    const operatorStack = [];

    for (const token of tokens) {
        if (token.type === 'number') {
            output.push(token);
        } else if (token.type === 'function') {
            operatorStack.push(token);
        } else if (token.type === 'operator') {
            if (token.value === '(') {
                operatorStack.push(token);
            } else if (token.value === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value !== '(') {
                    output.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) {
                    throw new Error('括号不匹配');
                }
                operatorStack.pop(); // 弹出 '('
                // 如果栈顶是函数，弹出到输出
                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'function') {
                    output.push(operatorStack.pop());
                }
            } else {
                // 操作符
                while (operatorStack.length > 0) {
                    const top = operatorStack[operatorStack.length - 1];
                    if (top.value === '(') break;
                    if (top.type !== 'operator') break;

                    const prec1 = precedence[token.value] || 0;
                    const prec2 = precedence[top.value] || 0;

                    if ((isLeftAssociative[token.value] && prec1 <= prec2) ||
                        (!isLeftAssociative[token.value] && prec1 < prec2)) {
                        output.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            }
        }
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op.value === '(' || op.value === ')') {
            throw new Error('括号不匹配');
        }
        output.push(op);
    }

    return output;
}

// 计算后缀表达式
function evaluatePostfix(tokens) {
    const stack = [];

    for (const token of tokens) {
        if (token.type === 'number') {
            stack.push(token.value);
        } else if (token.type === 'function') {
            if (stack.length === 0) throw new Error('函数参数不足');
            const arg = stack.pop();
            const func = mathFunctions[token.value];
            if (!func) throw new Error(`未知函数: ${token.value}`);
            stack.push(func(arg));
        } else if (token.type === 'operator') {
            if (token.value === 'u+' || token.value === 'u-') {
                if (stack.length === 0) throw new Error('运算符参数不足');
                const a = stack.pop();
                stack.push(token.value === 'u-' ? -a : a);
            } else {
                if (stack.length < 2) throw new Error('运算符参数不足');
                const b = stack.pop();
                const a = stack.pop();
                switch (token.value) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/':
                        if (b === 0) throw new Error('不能除以零');
                        stack.push(a / b);
                        break;
                    case '^': stack.push(Math.pow(a, b)); break;
                    default: throw new Error(`未知运算符: ${token.value}`);
                }
            }
        }
    }

    if (stack.length !== 1) throw new Error('表达式无效');
    return stack[0];
}

// 计算表达式
function calculate(expr) {
    if (!expr || expr.trim() === '') return 0;

    try {
        let tokens = tokenize(expr);
        tokens = processUnaryOperators(tokens);
        const postfix = infixToPostfix(tokens);
        const result = evaluatePostfix(postfix);

        // 检查结果是否有效
        if (!isFinite(result)) throw new Error('结果无效');

        // 格式化结果
        if (Number.isInteger(result)) return result;
        return parseFloat(result.toFixed(10));
    } catch (error) {
        throw error;
    }
}

// 更新显示
function updateDisplay() {
    elements.expression.textContent = state.expression;
    elements.result.textContent = state.lastResult;
    elements.result.classList.toggle('error', String(state.lastResult).startsWith('错误'));
}

// 添加到历史记录
function addToHistory(expr, result) {
    const item = { expression: expr, result: result, time: Date.now() };
    state.history.unshift(item);
    if (state.history.length > 50) state.history.pop();
    renderHistory();
}

// 渲染历史记录
function renderHistory() {
    elements.history.innerHTML = '';
    state.history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${item.result}</div>
        `;
        div.addEventListener('click', () => {
            state.expression = item.expression;
            state.lastResult = item.result;
            updateDisplay();
        });
        elements.history.appendChild(div);
    });
}

// 处理按钮点击
function handleButton(action) {
    switch (action) {
        case 'clear':
            state.expression = '';
            state.lastResult = '0';
            break;
        case 'delete':
            state.expression = state.expression.slice(0, -1);
            break;
        case 'equals':
            if (state.expression) {
                try {
                    const result = calculate(state.expression);
                    addToHistory(state.expression, result);
                    state.lastResult = result;
                } catch (error) {
                    state.lastResult = '错误: ' + error.message;
                }
            }
            break;
        case 'add': state.expression += '+'; break;
        case 'subtract': state.expression += '-'; break;
        case 'multiply': state.expression += '*'; break;
        case 'divide': state.expression += '/'; break;
        case 'open': state.expression += '('; break;
        case 'close': state.expression += ')'; break;
        case 'decimal': state.expression += '.'; break;
        case 'pow': state.expression += '^'; break;
        case 'pi': state.expression += 'pi'; break;
        case 'e': state.expression += 'e'; break;
        case 'sin': state.expression += 'sin('; break;
        case 'cos': state.expression += 'cos('; break;
        case 'tan': state.expression += 'tan('; break;
        case 'asin': state.expression += 'asin('; break;
        case 'acos': state.expression += 'acos('; break;
        case 'atan': state.expression += 'atan('; break;
        case 'log': state.expression += 'log('; break;
        case 'ln': state.expression += 'ln('; break;
        case 'sqrt': state.expression += 'sqrt('; break;
        case 'abs': state.expression += 'abs('; break;
        case 'factorial': state.expression += '!'; break;
        case 'reciprocal':
            if (state.expression) {
                state.expression = '1/(' + state.expression + ')';
            }
            break;
        case 'deg': state.angleMode = 'deg'; break;
        case 'rad': state.angleMode = 'rad'; break;
        case 'graph':
            openGraphModal();
            return;
        default:
            if (/^[0-9]$/.test(action)) {
                state.expression += action;
            }
    }
    updateDisplay();
}

// 键盘支持
document.addEventListener('keydown', (e) => {
    if (elements.graphModal.classList.contains('active')) {
        if (e.key === 'Escape') closeGraphModal();
        return;
    }

    const keyMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide',
        '(': 'open', ')': 'close', '.': 'decimal', '^': 'pow',
        'Enter': 'equals', '=': 'equals',
        'Backspace': 'delete', 'Delete': 'clear',
        'Escape': 'clear'
    };

    if (keyMap[e.key]) {
        e.preventDefault();
        handleButton(keyMap[e.key]);
    }
});

// 按钮事件绑定
document.querySelectorAll('.btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
        handleButton(btn.dataset.action);
    });
});

// 主题切换
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        state.theme = theme;

        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        localStorage.setItem('calculator-theme', theme);
    });
});

// 清空历史
elements.clearHistory.addEventListener('click', () => {
    state.history = [];
    renderHistory();
});

// ==================== 图形绘制功能 ====================

// 打开图形模态框
function openGraphModal() {
    elements.graphModal.classList.add('active');
    initGraph();
    plotFunction();
}

// 关闭图形模态框
function closeGraphModal() {
    elements.graphModal.classList.remove('active');
}

elements.closeGraph.addEventListener('click', closeGraphModal);

// 初始化画布
function initGraph() {
    graphState.canvas = elements.graphCanvas;
    graphState.ctx = graphState.canvas.getContext('2d');

    // 设置画布尺寸
    const rect = graphState.canvas.getBoundingClientRect();
    graphState.canvas.width = rect.width;
    graphState.canvas.height = rect.height;

    // 重置视图
    graphState.offsetX = graphState.canvas.width / 2;
    graphState.offsetY = graphState.canvas.height / 2;

    // 鼠标事件
    graphState.canvas.addEventListener('mousedown', onMouseDown);
    graphState.canvas.addEventListener('mousemove', onMouseMove);
    graphState.canvas.addEventListener('mouseup', onMouseUp);
    graphState.canvas.addEventListener('wheel', onWheel);
}

// 鼠标按下
function onMouseDown(e) {
    graphState.isDragging = true;
    graphState.lastMouseX = e.offsetX;
    graphState.lastMouseY = e.offsetY;
}

// 鼠标移动
function onMouseMove(e) {
    if (!graphState.isDragging) return;
    const dx = e.offsetX - graphState.lastMouseX;
    const dy = e.offsetY - graphState.lastMouseY;
    graphState.offsetX += dx;
    graphState.offsetY += dy;
    graphState.lastMouseX = e.offsetX;
    graphState.lastMouseY = e.offsetY;
    plotFunction();
}

// 鼠标释放
function onMouseUp() {
    graphState.isDragging = false;
}

// 滚轮缩放
function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    graphState.scale *= zoomFactor;
    graphState.scale = Math.max(5, Math.min(200, graphState.scale));
    plotFunction();
}

// 绘制坐标轴
function drawAxes() {
    const ctx = graphState.ctx;
    const width = graphState.canvas.width;
    const height = graphState.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    ctx.lineWidth = 0.5;

    const gridSize = graphState.scale;
    const startX = Math.floor((-graphState.offsetX) / gridSize) * gridSize;
    const startY = Math.floor((-graphState.offsetY) / gridSize) * gridSize;

    for (let x = startX; x < width - graphState.offsetX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(graphState.offsetX + x, 0);
        ctx.lineTo(graphState.offsetX + x, height);
        ctx.stroke();
    }

    for (let y = startY; y < height - graphState.offsetY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, graphState.offsetY + y);
        ctx.lineTo(width, graphState.offsetY + y);
        ctx.stroke();
    }

    // 绘制坐标轴
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    ctx.lineWidth = 2;

    // X轴
    ctx.beginPath();
    ctx.moveTo(0, graphState.offsetY);
    ctx.lineTo(width, graphState.offsetY);
    ctx.stroke();

    // Y轴
    ctx.beginPath();
    ctx.moveTo(graphState.offsetX, 0);
    ctx.lineTo(graphState.offsetX, height);
    ctx.stroke();

    // 原点标签
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    ctx.font = '12px sans-serif';
    ctx.fillText('0', graphState.offsetX + 5, graphState.offsetY - 5);
}

// 将函数字符串转换为可计算函数
function parseFunction(funcStr) {
    // 替换常用表示法
    funcStr = funcStr.toLowerCase()
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E');

    return (x) => {
        try {
            // 使用 Function 构造函数安全地求值
            const fn = new Function('x', 'Math', `return ${funcStr}`);
            return fn(x, Math);
        } catch (e) {
            return NaN;
        }
    };
}

// 绘制函数
function plotFunction() {
    drawAxes();

    const funcStr = elements.functionInput.value.trim();
    if (!funcStr) return;

    graphState.currentFunction = funcStr;
    const fn = parseFunction(funcStr);

    const ctx = graphState.ctx;
    const width = graphState.canvas.width;
    const height = graphState.canvas.height;

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;

    for (let px = 0; px < width; px++) {
        const x = (px - graphState.offsetX) / graphState.scale;
        const y = fn(x);

        if (!isFinite(y) || isNaN(y)) {
            firstPoint = true;
            continue;
        }

        const py = graphState.offsetY - y * graphState.scale;

        if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();

    // 更新范围显示
    const minX = (-graphState.offsetX / graphState.scale).toFixed(1);
    const maxX = ((width - graphState.offsetX) / graphState.scale).toFixed(1);
    elements.rangeInfo.textContent = `范围: ${minX} ~ ${maxX}`;
}

// 绘制按钮
elements.plotBtn.addEventListener('click', plotFunction);
elements.functionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') plotFunction();
});

// 缩放控制
elements.zoomIn.addEventListener('click', () => {
    graphState.scale *= 1.2;
    plotFunction();
});

elements.zoomOut.addEventListener('click', () => {
    graphState.scale *= 0.8;
    graphState.scale = Math.max(5, graphState.scale);
    plotFunction();
});

elements.resetView.addEventListener('click', () => {
    graphState.scale = 40;
    graphState.offsetX = graphState.canvas.width / 2;
    graphState.offsetY = graphState.canvas.height / 2;
    plotFunction();
});

// 初始化
function init() {
    // 加载保存的主题
    const savedTheme = localStorage.getItem('calculator-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    state.theme = savedTheme;

    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });

    updateDisplay();
}

// 窗口大小改变时重新初始化画布
window.addEventListener('resize', () => {
    if (elements.graphModal.classList.contains('active')) {
        initGraph();
        plotFunction();
    }
});

// 启动
init();
