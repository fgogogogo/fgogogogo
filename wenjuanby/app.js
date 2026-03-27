// ====== 问卷构建工具 - 主应用逻辑 ======

// ---- 全局状态 ----
let currentSurvey = {
    id: generateId(),
    title: '我的问卷',
    description: '感谢您参与本次问卷调查',
    timed: false,
    timeLimit: 10, // 分钟
    questions: []
};

let currentQuestionIndex = 0;
let fillAnswers = {};
let timerInterval = null;
let remainingSeconds = 0;
let allResults = []; // 所有提交的结果
let charts = []; // Chart.js 实例引用

// ---- ID 生成器 ----
function generateId() {
    return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ---- 视图切换 ----
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const view = document.getElementById('view-' + viewName);
    const tab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
    if (view) view.classList.add('active');
    if (tab) tab.classList.add('active');

    document.getElementById('btn-share').style.display = viewName === 'builder' ? 'inline-flex' : 'none';

    if (viewName === 'fill') initFillView();
    if (viewName === 'results') renderResults();
}

// ---- Toast 通知 ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
//  构建器部分
// ============================================================

// ---- 切换计时模式 ----
function toggleTimedMode() {
    const checked = document.getElementById('survey-timed').checked;
    document.getElementById('timed-settings').style.display = checked ? 'block' : 'none';
    currentSurvey.timed = checked;
}

// ---- 添加问题 ----
function addQuestion() {
    const qid = generateId();
    const q = {
        id: qid,
        type: 'radio',
        title: '',
        required: true,
        options: [{ id: generateId(), text: '选项 1' }, { id: generateId(), text: '选项 2' }],
        slider: { min: 0, max: 100, step: 1, unit: '' },
        branchLogic: {} // { optionValue: targetQuestionId }
    };
    currentSurvey.questions.push(q);
    renderQuestions();
    showToast('已添加新问题', 'success');
}

// ---- 删除问题 ----
function deleteQuestion(qid) {
    if (currentSurvey.questions.length <= 1) {
        showToast('至少需要保留一个问题', 'warning');
        return;
    }
    currentSurvey.questions = currentSurvey.questions.filter(q => q.id !== qid);
    // 清除其他问题中引用此问题的分支
    currentSurvey.questions.forEach(q => {
        Object.keys(q.branchLogic).forEach(key => {
            if (q.branchLogic[key] === qid) delete q.branchLogic[key];
        });
    });
    renderQuestions();
    showToast('问题已删除');
}

// ---- 复制问题 ----
function duplicateQuestion(qid) {
    const orig = currentSurvey.questions.find(q => q.id === qid);
    if (!orig) return;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = generateId();
    copy.options = copy.options.map(o => ({ ...o, id: generateId() }));
    copy.branchLogic = {};
    const idx = currentSurvey.questions.findIndex(q => q.id === qid);
    currentSurvey.questions.splice(idx + 1, 0, copy);
    renderQuestions();
    showToast('问题已复制', 'success');
}

// ---- 渲染问题列表 ----
function renderQuestions() {
    const container = document.getElementById('questions-container');
    const empty = document.getElementById('builder-empty');

    if (currentSurvey.questions.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    const tpl = document.getElementById('tpl-question-editor');
    container.innerHTML = '';

    currentSurvey.questions.forEach((q, idx) => {
        const clone = tpl.content.cloneNode(true);
        const card = clone.querySelector('.question-card');

        // 填充基础数据
        card.innerHTML = card.innerHTML
            .replace(/\{\{qid\}\}/g, q.id)
            .replace(/\{\{num\}\}/g, idx + 1)
            .replace(/\{\{type\}\}/g, q.type)
            .replace(/\{\{typeLabel\}\}/g, getTypeLabel(q.type))
            .replace(/\{\{title\}\}/g, escapeHtml(q.title))
            .replace(/\{\{selectedRadio\}\}/g, q.type === 'radio' ? 'selected' : '')
            .replace(/\{\{selectedCheckbox\}\}/g, q.type === 'checkbox' ? 'selected' : '')
            .replace(/\{\{selectedText\}\}/g, q.type === 'text' ? 'selected' : '')
            .replace(/\{\{selectedSlider\}\}/g, q.type === 'slider' ? 'selected' : '')
            .replace(/\{\{requiredChecked\}\}/g, q.required ? 'checked' : '');

        container.appendChild(clone);

        // 渲染选项/滑块配置
        renderOptionsArea(q.id);
    });
}

// ---- 渲染选项编辑区 ----
function renderOptionsArea(qid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;

    const card = document.querySelector(`.question-card[data-qid="${qid}"]`);
    const area = card.querySelector('.q-options-area');
    area.setAttribute('data-area', q.type);
    area.innerHTML = '';

    if (q.type === 'radio' || q.type === 'checkbox') {
        q.options.forEach(opt => {
            const row = document.createElement('div');
            row.className = 'option-row';
            row.dataset.oid = opt.id;
            row.innerHTML = `
                <span class="option-drag">☰</span>
                <input type="text" placeholder="选项内容" value="${escapeHtml(opt.text)}" onchange="updateOptionData('${qid}', '${opt.id}')">
                <button class="btn btn-sm btn-ghost btn-danger" onclick="removeOption('${qid}', '${opt.id}')">✕</button>
            `;
            area.appendChild(row);
        });
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-option';
        addBtn.textContent = '+ 添加选项';
        addBtn.onclick = () => addOption(qid);
        area.appendChild(addBtn);
    } else if (q.type === 'slider') {
        area.innerHTML = `
            <div class="slider-config">
                <div class="form-group">
                    <label>最小值</label>
                    <input type="number" class="slider-min" value="${q.slider.min}" onchange="updateSliderConfig('${qid}')">
                </div>
                <div class="form-group">
                    <label>最大值</label>
                    <input type="number" class="slider-max" value="${q.slider.max}" onchange="updateSliderConfig('${qid}')">
                </div>
                <div class="form-group">
                    <label>步长</label>
                    <input type="number" class="slider-step" value="${q.slider.step}" min="1" onchange="updateSliderConfig('${qid}')">
                </div>
                <div class="form-group" style="grid-column: 1/-1;">
                    <label>单位</label>
                    <input type="text" class="slider-unit" placeholder="如: 分、元、%" value="${escapeHtml(q.slider.unit)}" onchange="updateSliderConfig('${qid}')">
                </div>
            </div>
        `;
    } else if (q.type === 'text') {
        area.innerHTML = `<p style="color:var(--gray-500);font-size:13px;">文本输入类型无需配置选项</p>`;
    }
}

// ---- 添加选项 ----
function addOption(qid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    q.options.push({ id: generateId(), text: `选项 ${q.options.length + 1}` });
    renderOptionsArea(qid);
}

// ---- 更新选项数据 ----
function updateOptionData(qid, oid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    const opt = q.options.find(o => o.id === oid);
    if (!opt) return;
    const input = document.querySelector(`.option-row[data-oid="${oid}"] .option-text`);
    if (input) opt.text = input.value;
}

// ---- 删除选项 ----
function removeOption(qid, oid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q || q.options.length <= 2) {
        showToast('至少需要两个选项', 'warning');
        return;
    }
    q.options = q.options.filter(o => o.id !== oid);
    renderOptionsArea(qid);
}

// ---- 更新问题数据 ----
function updateQuestionData(qid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    const card = document.querySelector(`.question-card[data-qid="${qid}"]`);
    q.title = card.querySelector('.q-title').value;
    q.required = card.querySelector('.q-required').checked;
}

// ---- 切换问题类型 ----
function changeQuestionType(qid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    const card = document.querySelector(`.question-card[data-qid="${qid}"]`);
    q.type = card.querySelector('.q-type').value;
    // 重置选项
    if (q.type === 'radio' || q.type === 'checkbox') {
        if (!q.options || q.options.length < 2) {
            q.options = [{ id: generateId(), text: '选项 1' }, { id: generateId(), text: '选项 2' }];
        }
    }
    if (q.type === 'slider' && !q.slider) {
        q.slider = { min: 0, max: 100, step: 1, unit: '' };
    }
    // 更新类型标签
    const badge = card.querySelector('.question-type-badge');
    badge.setAttribute('data-type', q.type);
    badge.textContent = getTypeLabel(q.type);
    renderOptionsArea(qid);
}

// ---- 更新滑块配置 ----
function updateSliderConfig(qid) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    const card = document.querySelector(`.question-card[data-qid="${qid}"]`);
    q.slider.min = parseFloat(card.querySelector('.slider-min').value) || 0;
    q.slider.max = parseFloat(card.querySelector('.slider-max').value) || 100;
    q.slider.step = parseFloat(card.querySelector('.slider-step').value) || 1;
    q.slider.unit = card.querySelector('.slider-unit').value;
}

// ---- 分支逻辑配置 ----
function toggleBranchConfig(qid) {
    const panel = document.getElementById('branch-panel');
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;

    if (panel.style.display === 'block' && panel.dataset.currentQid === qid) {
        closeBranchPanel();
        return;
    }

    panel.style.display = 'block';
    panel.dataset.currentQid = qid;

    const content = document.getElementById('branch-config-content');
    content.innerHTML = '';

    if (q.type === 'text') {
        content.innerHTML = `<p style="color:var(--gray-500);font-size:13px;">文本输入类型不支持分支逻辑</p>`;
        return;
    }

    if (q.type === 'slider') {
        // 滑块使用范围分支
        content.innerHTML = `
            <p style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">为滑块的不同值范围设置跳转目标：</p>
            <div class="branch-option-row">
                <label>低值范围</label>
                <select onchange="setBranchLogic('${qid}', 'low', this.value)">
                    ${buildBranchOptions(qid, q.branchLogic.low)}
                </select>
            </div>
            <div class="branch-option-row">
                <label>高值范围</label>
                <select onchange="setBranchLogic('${qid}', 'high', this.value)">
                    ${buildBranchOptions(qid, q.branchLogic.high)}
                </select>
            </div>
        `;
        return;
    }

    // 单选/多选
    content.innerHTML = `<p style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">为每个选项设置回答后跳转到的问题（默认为下一题）：</p>`;

    (q.options || []).forEach(opt => {
        const row = document.createElement('div');
        row.className = 'branch-option-row';
        row.innerHTML = `
            <label>${escapeHtml(opt.text)}</label>
            <select onchange="setBranchLogic('${qid}', '${opt.id}', this.value)">
                ${buildBranchOptions(qid, q.branchLogic[opt.id])}
            </select>
        `;
        content.appendChild(row);
    });
}

// ---- 构建分支选项下拉 ----
function buildBranchOptions(currentQid, currentValue) {
    const qIdx = currentSurvey.questions.findIndex(q => q.id === currentQid);
    let html = `<option value="">下一题（默认）</option>`;
    currentSurvey.questions.forEach((q, idx) => {
        if (idx > qIdx) {
            const selected = q.id === currentValue ? 'selected' : '';
            html += `<option value="${q.id}" ${selected}>→ Q${idx + 1}: ${escapeHtml(q.title || '未命名问题')}</option>`;
        }
    });
    html += `<option value="__end__" ${currentValue === '__end__' ? 'selected' : ''}>→ 结束问卷</option>`;
    return html;
}

// ---- 设置分支逻辑 ----
function setBranchLogic(qid, optionKey, targetId) {
    const q = currentSurvey.questions.find(q => q.id === qid);
    if (!q) return;
    if (targetId === '') {
        delete q.branchLogic[optionKey];
    } else {
        q.branchLogic[optionKey] = targetId;
    }
}

// ---- 关闭分支面板 ----
function closeBranchPanel() {
    document.getElementById('branch-panel').style.display = 'none';
}

// ---- 保存问卷 ----
function saveSurvey() {
    // 收集当前输入
    currentSurvey.title = document.getElementById('survey-title').value || '未命名问卷';
    currentSurvey.description = document.getElementById('survey-desc').value || '';
    currentSurvey.timed = document.getElementById('survey-timed').checked;
    currentSurvey.timeLimit = parseInt(document.getElementById('survey-timelimit').value) || 10;

    // 保存到 localStorage
    localStorage.setItem('survey_' + currentSurvey.id, JSON.stringify(currentSurvey));
    // 更新 URL hash
    const hashData = btoa(encodeURIComponent(JSON.stringify(currentSurvey)));
    window.location.hash = '#survey/' + hashData;

    showToast('问卷已保存！链接已更新', 'success');
    document.getElementById('btn-share').style.display = 'inline-flex';
}

// ---- 分享问卷 ----
function shareSurvey() {
    saveSurvey();
    const url = window.location.href;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('链接已复制到剪贴板', 'success');
        });
    } else {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('链接已复制到剪贴板', 'success');
    }
}

// ---- 从链接加载 ----
function loadFromHash() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#survey/')) {
        showToast('当前链接中没有问卷数据', 'warning');
        return;
    }
    try {
        const encoded = hash.substring(8);
        const json = decodeURIComponent(atob(encoded));
        const data = JSON.parse(json);
        currentSurvey = data;
        // 同步到 UI
        document.getElementById('survey-title').value = currentSurvey.title || '';
        document.getElementById('survey-desc').value = currentSurvey.description || '';
        document.getElementById('survey-timed').checked = currentSurvey.timed || false;
        document.getElementById('survey-timelimit').value = currentSurvey.timeLimit || 10;
        document.getElementById('timed-settings').style.display = currentSurvey.timed ? 'block' : 'none';
        renderQuestions();
        showToast('问卷已从链接加载', 'success');
    } catch (e) {
        showToast('加载失败：无效的问卷数据', 'error');
    }
}

// ---- 预览问卷（跳转到填写视图） ----
function previewSurvey() {
    saveSurvey();
    showView('fill');
}

// ---- 工具函数 ----
function getTypeLabel(type) {
    const map = { radio: '单选题', checkbox: '多选题', text: '文本输入', slider: '滑块题' };
    return map[type] || type;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
//  填写问卷部分
// ============================================================

function initFillView() {
    // 先保存当前设置
    currentSurvey.title = document.getElementById('survey-title').value || '未命名问卷';
    currentSurvey.description = document.getElementById('survey-desc').value || '';

    // 检查 hash 中是否有问卷数据
    const hash = window.location.hash;
    if (hash && hash.startsWith('#survey/')) {
        try {
            const encoded = hash.substring(8);
            const json = decodeURIComponent(atob(encoded));
            currentSurvey = JSON.parse(json);
        } catch (e) { /* ignore */ }
    }

    // 恢复草稿
    const draftKey = 'draft_' + (currentSurvey.id || 'default');
    const draft = localStorage.getItem(draftKey);
    if (draft) {
        try {
            fillAnswers = JSON.parse(draft);
            showToast('已恢复上次保存的草稿', 'info');
        } catch (e) { fillAnswers = {}; }
    } else {
        fillAnswers = {};
    }

    currentQuestionIndex = 0;
    renderFillHeader();
    renderCurrentQuestion();
    updateProgress();

    // 初始化计时器
    initTimer();
}

// ---- 渲染填写头部 ----
function renderFillHeader() {
    document.getElementById('fill-title').textContent = currentSurvey.title || '问卷';
    document.getElementById('fill-desc').textContent = currentSurvey.description || '';

    const timerBar = document.getElementById('timer-bar');
    if (currentSurvey.timed && currentSurvey.timeLimit > 0) {
        timerBar.style.display = 'block';
        remainingSeconds = currentSurvey.timeLimit * 60;
        updateTimerDisplay();
    } else {
        timerBar.style.display = 'none';
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
}

// ---- 计算可见问题列表（考虑分支逻辑） ----
function getVisibleQuestions() {
    const visible = [];
    let i = 0;
    while (i < currentSurvey.questions.length) {
        const q = currentSurvey.questions[i];
        visible.push({ ...q, originalIndex: i });
        // 如果已有答案且有分支逻辑，跳到目标问题
        const answer = fillAnswers[q.id];
        if (answer !== undefined && answer !== null && answer !== '' && q.branchLogic) {
            let targetId = null;
            if (q.type === 'slider') {
                const val = parseFloat(answer);
                const mid = (q.slider.min + q.slider.max) / 2;
                targetId = val < mid ? q.branchLogic.low : q.branchLogic.high;
            } else if (Array.isArray(answer)) {
                // 多选：找到第一个匹配的分支
                for (const aid of answer) {
                    if (q.branchLogic[aid]) { targetId = q.branchLogic[aid]; break; }
                }
            } else {
                targetId = q.branchLogic[answer];
            }
            if (targetId === '__end__') break;
            if (targetId) {
                const targetIdx = currentSurvey.questions.findIndex(q => q.id === targetId);
                if (targetIdx > i) { i = targetIdx; continue; }
            }
        }
        i++;
    }
    return visible;
}

// ---- 渲染当前问题 ----
function renderCurrentQuestion() {
    const visible = getVisibleQuestions();
    const container = document.getElementById('fill-questions');

    if (currentQuestionIndex >= visible.length) {
        // 所有问题已答完
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;">
                <div style="font-size:48px;margin-bottom:16px;">✅</div>
                <h3 style="color:var(--gray-700);">您已完成所有问题！</h3>
                <p style="color:var(--gray-500);margin-top:8px;">请检查后提交问卷</p>
            </div>
        `;
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-submit').style.display = 'inline-flex';
        document.getElementById('btn-prev').disabled = currentQuestionIndex <= 0;
        return;
    }

    document.getElementById('btn-next').style.display = 'inline-flex';
    document.getElementById('btn-submit').style.display = 'none';

    const q = visible[currentQuestionIndex];
    const answer = fillAnswers[q.id];
    const requiredMark = q.required ? '<span class="required-mark">*</span>' : '';

    let html = `<div class="fill-question" data-qid="${q.id}">
        <h3>${requiredMark}${escapeHtml(q.title || '未命名问题')}</h3>`;

    if (q.type === 'radio') {
        html += '<div class="option-list">';
        (q.options || []).forEach(opt => {
            const selected = answer === opt.id ? 'selected' : '';
            html += `
                <div class="option-item ${selected}" onclick="selectRadio('${q.id}', '${opt.id}')">
                    <div class="option-radio-circle"></div>
                    <span class="option-label">${escapeHtml(opt.text)}</span>
                </div>`;
        });
        html += '</div>';
    } else if (q.type === 'checkbox') {
        html += '<div class="option-list">';
        const checkedAnswers = Array.isArray(answer) ? answer : [];
        (q.options || []).forEach(opt => {
            const selected = checkedAnswers.includes(opt.id) ? 'selected' : '';
            html += `
                <div class="option-item ${selected}" onclick="selectCheckbox('${q.id}', '${opt.id}')">
                    <div class="option-checkbox-box"></div>
                    <span class="option-label">${escapeHtml(opt.text)}</span>
                </div>`;
        });
        html += '</div>';
    } else if (q.type === 'text') {
        html += `<textarea class="text-input" placeholder="请输入您的回答..." onchange="updateTextAnswer('${q.id}', this.value)" oninput="updateTextAnswer('${q.id}', this.value)">${escapeHtml(answer || '')}</textarea>`;
    } else if (q.type === 'slider') {
        const val = answer !== undefined ? parseFloat(answer) : ((q.slider.min + q.slider.max) / 2);
        const clampedVal = Math.max(q.slider.min, Math.min(q.slider.max, val));
        html += `
            <div class="slider-input-container">
                <div class="slider-labels">
                    <span>${q.slider.min}${q.slider.unit}</span>
                    <span>${q.slider.max}${q.slider.unit}</span>
                </div>
                <div class="slider-value-display">${clampedVal}${q.slider.unit}</div>
                <input type="range" class="slider-input"
                    min="${q.slider.min}" max="${q.slider.max}" step="${q.slider.step}" value="${clampedVal}"
                    oninput="updateSliderAnswer('${q.id}', this.value, '${q.slider.unit}')">
            </div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // 更新按钮状态
    document.getElementById('btn-prev').disabled = currentQuestionIndex <= 0;
}

// ---- 单选 ----
function selectRadio(qid, oid) {
    fillAnswers[qid] = oid;
    renderCurrentQuestion();
    autoSaveDraft();
}

// ---- 多选 ----
function selectCheckbox(qid, oid) {
    if (!Array.isArray(fillAnswers[qid])) fillAnswers[qid] = [];
    const arr = fillAnswers[qid];
    const idx = arr.indexOf(oid);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(oid);
    renderCurrentQuestion();
    autoSaveDraft();
}

// ---- 文本 ----
function updateTextAnswer(qid, value) {
    fillAnswers[qid] = value;
    autoSaveDraft();
}

// ---- 滑块 ----
function updateSliderAnswer(qid, value, unit) {
    fillAnswers[qid] = value;
    const display = document.querySelector('.slider-value-display');
    if (display) display.textContent = value + unit;
    autoSaveDraft();
}

// ---- 上一题/下一题 ----
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
        updateProgress();
    }
}

function nextQuestion() {
    // 验证当前问题
    const visible = getVisibleQuestions();
    if (currentQuestionIndex < visible.length) {
        const q = visible[currentQuestionIndex];
        if (q.required) {
            const ans = fillAnswers[q.id];
            if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
                showToast('请回答此必填问题', 'warning');
                return;
            }
        }
    }

    // 分支逻辑：根据答案决定下一个问题
    if (currentQuestionIndex < visible.length) {
        const q = visible[currentQuestionIndex];
        const answer = fillAnswers[q.id];
        if (answer !== undefined && answer !== null && answer !== '' && q.branchLogic && Object.keys(q.branchLogic).length > 0) {
            let targetId = null;
            if (q.type === 'slider') {
                const val = parseFloat(answer);
                const mid = (q.slider.min + q.slider.max) / 2;
                targetId = val < mid ? q.branchLogic.low : q.branchLogic.high;
            } else if (Array.isArray(answer)) {
                for (const aid of answer) {
                    if (q.branchLogic[aid]) { targetId = q.branchLogic[aid]; break; }
                }
            } else {
                targetId = q.branchLogic[answer];
            }
            if (targetId === '__end__') {
                currentQuestionIndex = visible.length; // 跳到结束
            } else if (targetId) {
                const targetIdx = visible.findIndex(v => v.id === targetId);
                if (targetIdx > currentQuestionIndex) {
                    currentQuestionIndex = targetIdx;
                } else {
                    currentQuestionIndex++;
                }
            } else {
                currentQuestionIndex++;
            }
        } else {
            currentQuestionIndex++;
        }
    }

    renderCurrentQuestion();
    updateProgress();
}

// ---- 更新进度 ----
function updateProgress() {
    const visible = getVisibleQuestions();
    const total = visible.length;
    const answered = visible.filter(q => {
        const ans = fillAnswers[q.id];
        return ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
    }).length;

    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `${answered} / ${total}`;
}

// ---- 自动保存草稿 ----
let draftSaveTimeout = null;
function autoSaveDraft() {
    if (draftSaveTimeout) clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(() => {
        const key = 'draft_' + (currentSurvey.id || 'default');
        localStorage.setItem(key, JSON.stringify(fillAnswers));
    }, 800);
}

// ---- 手动保存草稿 ----
function saveDraft() {
    const key = 'draft_' + (currentSurvey.id || 'default');
    localStorage.setItem(key, JSON.stringify(fillAnswers));
    showToast('草稿已保存', 'success');
}

// ---- 提交问卷 ----
function submitSurvey() {
    // 验证所有必填题
    const visible = getVisibleQuestions();
    for (const q of visible) {
        if (q.required) {
            const ans = fillAnswers[q.id];
            if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
                // 跳到该问题
                const idx = visible.indexOf(q);
                currentQuestionIndex = idx;
                renderCurrentQuestion();
                updateProgress();
                showToast(`请回答必填问题：${q.title || 'Q' + (idx + 1)}`, 'warning');
                return;
            }
        }
    }

    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // 保存结果
    const result = {
        id: generateId(),
        surveyId: currentSurvey.id,
        timestamp: new Date().toISOString(),
        answers: { ...fillAnswers },
        timeSpent: currentSurvey.timed ? (currentSurvey.timeLimit * 60 - remainingSeconds) : null
    };

    // 加载已有结果
    const resultsKey = 'results_' + (currentSurvey.id || 'default');
    const existing = localStorage.getItem(resultsKey);
    allResults = existing ? JSON.parse(existing) : [];
    allResults.push(result);
    localStorage.setItem(resultsKey, JSON.stringify(allResults));

    // 清除草稿
    const draftKey = 'draft_' + (currentSurvey.id || 'default');
    localStorage.removeItem(draftKey);

    showToast('问卷提交成功！', 'success');

    // 跳转到结果页
    setTimeout(() => showView('results'), 800);
}

// ---- 计时器 ----
function initTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (!currentSurvey.timed) return;

    remainingSeconds = currentSurvey.timeLimit * 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            showToast('时间到！问卷将自动提交', 'warning');
            setTimeout(() => submitSurvey(), 1000);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
    const secs = Math.max(0, remainingSeconds) % 60;
    const display = document.getElementById('timer-display');
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const total = currentSurvey.timeLimit * 60;
    const pct = (remainingSeconds / total) * 100;
    document.getElementById('timer-progress-fill').style.width = pct + '%';

    const bar = document.getElementById('timer-bar');
    if (remainingSeconds <= 60) {
        bar.classList.add('timer-warning');
    } else {
        bar.classList.remove('timer-warning');
    }
}

// ============================================================
//  结果统计部分
// ============================================================

function renderResults() {
    // 加载结果
    const resultsKey = 'results_' + (currentSurvey.id || 'default');
    const existing = localStorage.getItem(resultsKey);
    allResults = existing ? JSON.parse(existing) : [];

    const summaryEl = document.getElementById('results-summary');
    const chartsEl = document.getElementById('results-charts');
    const rawEl = document.getElementById('results-raw');

    // 摘要
    summaryEl.innerHTML = `
        <div class="summary-stat">
            <div class="stat-value">${allResults.length}</div>
            <div class="stat-label">总提交数</div>
        </div>
        <div class="summary-stat">
            <div class="stat-value">${currentSurvey.questions.length}</div>
            <div class="stat-label">问题数量</div>
        </div>
        <div class="summary-stat">
            <div class="stat-value">${currentSurvey.timed ? currentSurvey.timeLimit + '分钟' : '无限制'}</div>
            <div class="stat-label">时间限制</div>
        </div>
    `;

    // 销毁旧图表
    charts.forEach(c => c.destroy());
    charts = [];

    // 渲染每个问题的图表
    chartsEl.innerHTML = '';
    if (allResults.length === 0) {
        chartsEl.innerHTML = `
            <div class="chart-card" style="grid-column:1/-1;text-align:center;padding:60px;">
                <div style="font-size:48px;margin-bottom:16px;">📭</div>
                <p style="color:var(--gray-500);">暂无提交数据，填写问卷后将在此显示统计结果</p>
                <button class="btn btn-primary" style="margin-top:16px;" onclick="showView('fill')">去填写问卷</button>
            </div>
        `;
        rawEl.style.display = 'none';
        return;
    }

    currentSurvey.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `<h3>Q${idx + 1}: ${escapeHtml(q.title || '未命名问题')}</h3><div class="chart-container"><canvas id="chart-${q.id}"></canvas></div>`;
        chartsEl.appendChild(card);

        // 收集数据
        const chartData = collectChartData(q);
        let chart;

        if (q.type === 'text') {
            // 文本题：显示为词云式列表
            chart = new Chart(document.getElementById(`chart-${q.id}`), {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '回答次数',
                        data: chartData.data,
                        backgroundColor: 'rgba(79, 70, 229, 0.6)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: chartData.labels.length > 8 ? 'y' : 'x',
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        } else if (q.type === 'slider') {
            // 滑块：分布图
            chart = new Chart(document.getElementById(`chart-${q.id}`), {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: '值分布',
                        data: chartData.data,
                        borderColor: 'rgba(79, 70, 229, 1)',
                        backgroundColor: 'rgba(79, 70, 229, 0.15)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(79, 70, 229, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: '次数' } },
                        x: { title: { display: true, text: q.slider.unit ? `值 (${q.slider.unit})` : '值' } }
                    }
                }
            });
        } else {
            // 单选/多选：饼图 + 柱状图
            const colors = [
                '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
                '#14b8a6', '#a855f7', '#eab308', '#22c55e', '#3b82f6'
            ];
            chart = new Chart(document.getElementById(`chart-${q.id}`), {
                type: 'doughnut',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.data,
                        backgroundColor: colors.slice(0, chartData.labels.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { padding: 12, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${ctx.parsed} 次 (${Math.round(ctx.parsed / allResults.length * 100)}%)`
                            }
                        }
                    }
                }
            });
        }
        charts.push(chart);
    });

    // 原始数据
    rawEl.style.display = 'block';
    document.getElementById('raw-data').textContent = JSON.stringify(allResults, null, 2);
}

// ---- 收集图表数据 ----
function collectChartData(question) {
    const labels = [];
    const data = [];

    if (question.type === 'radio' || question.type === 'checkbox') {
        const counts = {};
        (question.options || []).forEach(opt => { counts[opt.text] = 0; });
        allResults.forEach(result => {
            const ans = result.answers[question.id];
            if (question.type === 'radio') {
                if (ans) {
                    const opt = (question.options || []).find(o => o.id === ans);
                    if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
                }
            } else if (Array.isArray(ans)) {
                ans.forEach(aid => {
                    const opt = (question.options || []).find(o => o.id === aid);
                    if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
                });
            }
        });
        Object.entries(counts).forEach(([k, v]) => { labels.push(k); data.push(v); });
    } else if (question.type === 'slider') {
        const dist = {};
        allResults.forEach(result => {
            const val = result.answers[question.id];
            if (val !== undefined) {
                const rounded = Math.round(parseFloat(val) / (question.slider.step || 1)) * (question.slider.step || 1);
                dist[rounded] = (dist[rounded] || 0) + 1;
            }
        });
        const sorted = Object.entries(dist).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
        sorted.forEach(([k, v]) => {
            labels.push(k + (question.slider.unit || ''));
            data.push(v);
        });
    } else if (question.type === 'text') {
        const textCounts = {};
        allResults.forEach(result => {
            const ans = result.answers[question.id];
            if (ans && typeof ans === 'string' && ans.trim()) {
                const key = ans.trim().length > 30 ? ans.trim().substring(0, 30) + '...' : ans.trim();
                textCounts[key] = (textCounts[key] || 0) + 1;
            }
        });
        const sorted = Object.entries(textCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
        sorted.forEach(([k, v]) => { labels.push(k); data.push(v); });
    }

    return { labels, data };
}

// ============================================================
//  初始化
// ============================================================

(function init() {
    // 检查 URL hash 是否有问卷数据
    const hash = window.location.hash;
    if (hash && hash.startsWith('#survey/')) {
        loadFromHash();
    }

    // 渲染初始问题列表
    renderQuestions();

    // 自动保存草稿监听（页面关闭前）
    window.addEventListener('beforeunload', () => {
        if (Object.keys(fillAnswers).length > 0) {
            const key = 'draft_' + (currentSurvey.id || 'default');
            localStorage.setItem(key, JSON.stringify(fillAnswers));
        }
    });
})();
