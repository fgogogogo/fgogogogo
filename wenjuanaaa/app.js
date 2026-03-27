// ===== Constants & State =====
const QUESTION_TYPES = {
    radio: '单选题',
    checkbox: '多选题',
    text: '文本输入',
    range: '滑块'
};

const COLORS = [
    '#4A90D9', '#E85D04', '#2ECC71', '#9B59B6', '#F39C12',
    '#1ABC9C', '#E74C3C', '#3498DB', '#E67E22', '#16A085',
    '#8E44AD', '#27AE60', '#D35400', '#2980B9', '#C0392B'
];

let survey = null;
let currentEditIndex = -1;
let fillState = {
    answers: {},
    currentQuestion: 0,
    questionOrder: [],
    timer: null,
    timerRemaining: 0,
    timerTotal: 0
};

// ===== Utility =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// ===== URL Encoding / Decoding =====
function encodeSurvey(survey) {
    const json = JSON.stringify(survey);
    return btoa(unescape(encodeURIComponent(json)));
}

function decodeSurvey(encoded) {
    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

// ===== localStorage =====
function saveSurvey(id, data) {
    localStorage.setItem('survey_' + id, JSON.stringify(data));
}

function loadSurvey(id) {
    const data = localStorage.getItem('survey_' + id);
    return data ? JSON.parse(data) : null;
}

function saveSubmission(id, submission) {
    const key = 'survey_submissions_' + id;
    let subs = localStorage.getItem(key);
    subs = subs ? JSON.parse(subs) : [];
    subs.push(submission);
    localStorage.setItem(key, JSON.stringify(subs));
}

function loadSubmissions(id) {
    const key = 'survey_submissions_' + id;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveProgress(id, progress) {
    localStorage.setItem('survey_progress_' + id, JSON.stringify(progress));
}

function loadProgress(id) {
    const data = localStorage.getItem('survey_progress_' + id);
    return data ? JSON.parse(data) : null;
}

function clearProgress(id) {
    localStorage.removeItem('survey_progress_' + id);
}

// ===== Router =====
function getHash() {
    return location.hash || '#/create';
}

function parseFillParams(hash) {
    const match = hash.match(/^#\/fill\?id=(.+)$/);
    if (match) return match[1];
    return null;
}

function parseResultsParams(hash) {
    const match = hash.match(/^#\/results\?id=(.+)$/);
    if (match) return match[1];
    return null;
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const page = document.getElementById('page-' + pageId);
    if (page) page.style.display = 'block';
}

function onHashChange() {
    const hash = getHash();
    if (hash.startsWith('#/create')) {
        showPage('create');
        initEditor();
    } else if (hash.startsWith('#/fill')) {
        const id = parseFillParams(hash);
        if (id) {
            initFill(id);
            showPage('fill');
        } else {
            location.hash = '#/create';
        }
    } else if (hash.startsWith('#/results')) {
        const id = parseResultsParams(hash);
        if (id) {
            initResults(id);
            showPage('results');
        } else {
            location.hash = '#/create';
        }
    } else {
        location.hash = '#/create';
    }
}

// ===== Editor =====
function initEditor() {
    survey = {
        id: generateId(),
        title: '',
        description: '',
        type: 'survey',
        timeLimit: 0,
        questions: []
    };
    currentEditIndex = -1;
    document.getElementById('survey-title').value = '';
    document.getElementById('survey-desc').value = '';
    document.getElementById('survey-type').value = 'survey';
    document.getElementById('survey-timelimit').value = '0';
    renderQuestionList();
    hideQuestionEditor();
}

function hideQuestionEditor() {
    document.getElementById('question-editor').style.display = 'none';
    currentEditIndex = -1;
    document.querySelectorAll('.question-item').forEach(el => el.classList.remove('active'));
}

function renderQuestionList() {
    const ul = document.getElementById('question-list');
    ul.innerHTML = '';
    if (survey.questions.length === 0) {
        ul.innerHTML = '<li style="color:#aaa;font-size:.85rem;padding:20px 12px;text-align:center;">暂无问题，点击上方按钮添加</li>';
        return;
    }
    survey.questions.forEach((q, i) => {
        const li = document.createElement('li');
        li.className = 'question-item' + (i === currentEditIndex ? ' active' : '');
        li.innerHTML = `
            <span class="q-text">Q${i + 1}. ${q.text || '(未填写问题)'}</span>
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="q-type-badge">${QUESTION_TYPES[q.type] || q.type}</span>
                <div class="q-actions">
                    <button title="上移" onclick="moveQuestion(${i}, -1)" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
                    <button title="下移" onclick="moveQuestion(${i}, 1)" ${i === survey.questions.length - 1 ? 'disabled' : ''}>&#9660;</button>
                </div>
            </div>
        `;
        li.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            selectQuestion(i);
        });
        ul.appendChild(li);
    });
}

function selectQuestion(index) {
    currentEditIndex = index;
    const q = survey.questions[index];
    document.getElementById('question-editor').style.display = 'block';
    document.getElementById('q-type').value = q.type;
    document.getElementById('q-text').value = q.text || '';
    document.getElementById('q-options').value = (q.options || []).join('\n');
    document.getElementById('q-range-min').value = q.rangeMin || 1;
    document.getElementById('q-range-max').value = q.rangeMax || 10;
    document.getElementById('q-range-step').value = q.rangeStep || 1;

    // Show/hide options and range groups
    const isText = q.type === 'text';
    const isRange = q.type === 'range';
    document.getElementById('options-group').style.display = isText || isRange ? 'none' : 'block';
    document.getElementById('range-group').style.display = isRange ? 'block' : 'none';
    document.getElementById('branch-group').style.display = isText ? 'none' : 'block';

    // Render branch options
    renderBranchOptions();
    renderQuestionList();
}

function renderBranchOptions() {
    const container = document.getElementById('branch-options');
    const q = survey.questions[currentEditIndex];
    if (!q) return;

    let opts = [];
    if (q.type === 'radio' || q.type === 'checkbox') {
        opts = q.options || [];
    } else if (q.type === 'range') {
        opts = ['任何值'];
    }

    container.innerHTML = '';
    opts.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'branch-row';
        const label = document.createElement('label');
        label.textContent = opt;
        div.appendChild(label);

        const sel = document.createElement('select');
        sel.className = 'input';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '下一题';
        sel.appendChild(defaultOpt);

        // Add other questions as jump targets
        survey.questions.forEach((sq, si) => {
            if (si !== currentEditIndex) {
                const optEl = document.createElement('option');
                optEl.value = si;
                optEl.textContent = `Q${si + 1}. ${sq.text || '问题'}`;
                sel.appendChild(optEl);
            }
        });

        // Set current value
        const branchKey = q.type === 'range' ? 'any' : String(i);
        if (q.branches && q.branches[branchKey] !== undefined) {
            sel.value = q.branches[branchKey];
        }

        sel.dataset.branchKey = branchKey;
        div.appendChild(sel);
        container.appendChild(div);
    });
}

function moveQuestion(index, dir) {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= survey.questions.length) return;
    const temp = survey.questions[index];
    survey.questions[index] = survey.questions[newIndex];
    survey.questions[newIndex] = temp;
    renderQuestionList();
    if (currentEditIndex === index) currentEditIndex = newIndex;
    else if (currentEditIndex === newIndex) currentEditIndex = index;
    renderQuestionList();
}

function addQuestion() {
    const q = {
        id: generateId(),
        type: 'radio',
        text: '',
        options: ['选项 1', '选项 2', '选项 3'],
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        branches: {}
    };
    survey.questions.push(q);
    renderQuestionList();
    selectQuestion(survey.questions.length - 1);
}

function saveCurrentQuestion() {
    if (currentEditIndex < 0) return;
    const q = survey.questions[currentEditIndex];
    q.type = document.getElementById('q-type').value;
    q.text = document.getElementById('q-text').value;

    const isText = q.type === 'text';
    const isRange = q.type === 'range';
    document.getElementById('options-group').style.display = isText || isRange ? 'none' : 'block';
    document.getElementById('range-group').style.display = isRange ? 'block' : 'none';
    document.getElementById('branch-group').style.display = isText ? 'none' : 'block';

    if (!isText && !isRange) {
        q.options = document.getElementById('q-options').value.split('\n').map(s => s.trim()).filter(s => s);
    }
    if (isRange) {
        q.rangeMin = parseInt(document.getElementById('q-range-min').value) || 1;
        q.rangeMax = parseInt(document.getElementById('q-range-max').value) || 10;
        q.rangeStep = parseInt(document.getElementById('q-range-step').value) || 1;
    }

    // Save branches
    q.branches = {};
    const branchSelects = document.querySelectorAll('#branch-options select');
    branchSelects.forEach(sel => {
        const key = sel.dataset.branchKey;
        if (sel.value !== '') {
            q.branches[key] = parseInt(sel.value);
        }
    });

    renderQuestionList();
    renderBranchOptions();
    showToast('问题已保存');
}

function deleteQuestion() {
    if (currentEditIndex < 0) return;
    if (!confirm('确定删除这个问题？')) return;
    survey.questions.splice(currentEditIndex, 1);
    hideQuestionEditor();
    renderQuestionList();
}

// ===== Preview =====
function previewSurvey() {
    survey.title = document.getElementById('survey-title').value;
    survey.description = document.getElementById('survey-desc').value;
    survey.type = document.getElementById('survey-type').value;
    survey.timeLimit = parseInt(document.getElementById('survey-timelimit').value) || 0;
    const previewId = encodeSurvey(survey);
    location.hash = '#/fill?id=' + previewId;
}

// ===== Publish =====
function publishSurvey() {
    survey.title = document.getElementById('survey-title').value;
    survey.description = document.getElementById('survey-desc').value;
    survey.type = document.getElementById('survey-type').value;
    survey.timeLimit = parseInt(document.getElementById('survey-timelimit').value) || 0;
    saveSurvey(survey.id, survey);
    const encodedId = encodeSurvey(survey);
    const url = location.origin + location.pathname + '#/fill?id=' + encodedId;
    document.getElementById('share-url').value = url;
    document.getElementById('modal-overlay').style.display = 'flex';
}

// ===== Fill Page =====
function initFill(encodedId) {
    const surveyData = decodeSurvey(encodedId);
    if (!surveyData) {
        showToast('无效的问卷链接');
        location.hash = '#/create';
        return;
    }
    survey = surveyData;

    // Restore progress
    const progress = loadProgress(encodedId);
    if (progress) {
        fillState.answers = progress.answers || {};
        fillState.currentQuestion = progress.currentQuestion || 0;
    } else {
        fillState.answers = {};
        fillState.currentQuestion = 0;
    }

    // Build question order
    buildQuestionOrder();

    // Set title and description
    document.getElementById('fill-title').textContent = survey.title || '问卷';
    document.getElementById('fill-desc').textContent = survey.description || '';

    // Setup timer
    if (survey.timeLimit && survey.timeLimit > 0) {
        const timerContainer = document.getElementById('timer-container');
        timerContainer.style.display = 'flex';
        fillState.timerTotal = survey.timeLimit * 60;

        // If restoring progress, check if there was remaining time
        if (progress && progress.timerRemaining) {
            fillState.timerRemaining = progress.timerRemaining;
        } else {
            fillState.timerRemaining = fillState.timerTotal;
        }

        updateTimerDisplay();
        if (fillState.timer) clearInterval(fillState.timer);
        fillState.timer = setInterval(() => {
            fillState.timerRemaining--;
            updateTimerDisplay();
            autoSaveProgress(encodedId);
            if (fillState.timerRemaining <= 0) {
                clearInterval(fillState.timer);
                showToast('时间到，自动提交');
                submitAnswers(encodedId);
            }
        }, 1000);
    } else {
        document.getElementById('timer-container').style.display = 'none';
    }

    renderFillQuestion();
}

function buildQuestionOrder() {
    // Build linear order first, branching will modify navigation
    fillState.questionOrder = [];
    const visited = new Set();
    const queue = [0];

    while (queue.length > 0) {
        const idx = queue.shift();
        if (visited.has(idx) || idx >= survey.questions.length) continue;
        visited.add(idx);
        fillState.questionOrder.push(idx);
        // Default: add next question
        if (idx + 1 < survey.questions.length && !visited.has(idx + 1)) {
            queue.push(idx + 1);
        }
    }
}

function getNextQuestion(currentIdx, answer) {
    const q = survey.questions[currentIdx];
    if (!q) return currentIdx + 1;

    // Determine branch target
    let branchTarget = null;
    if (q.type === 'radio' && q.branches) {
        const optIndex = q.options.indexOf(answer);
        if (optIndex >= 0 && q.branches[String(optIndex)] !== undefined) {
            branchTarget = q.branches[String(optIndex)];
        }
    } else if (q.type === 'checkbox' && q.branches) {
        // For checkbox, check if any selected option has a branch
        const selected = Array.isArray(answer) ? answer : [];
        for (const s of selected) {
            const optIndex = q.options.indexOf(s);
            if (optIndex >= 0 && q.branches[String(optIndex)] !== undefined) {
                branchTarget = q.branches[String(optIndex)];
                break;
            }
        }
    } else if (q.type === 'range' && q.branches) {
        if (q.branches['any'] !== undefined) {
            branchTarget = q.branches['any'];
        }
    }

    return branchTarget !== null ? branchTarget : currentIdx + 1;
}

function renderFillQuestion() {
    const idx = fillState.currentQuestion;
    if (idx >= survey.questions.length) {
        // Show submit button
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-submit').style.display = 'inline-flex';
        document.getElementById('fill-content').innerHTML = '<p style="text-align:center;color:#888;padding:20px;">所有问题已填写完毕，请提交。</p>';
        updateProgressBar();
        return;
    }

    document.getElementById('btn-next').style.display = 'inline-flex';
    document.getElementById('btn-submit').style.display = 'none';

    const q = survey.questions[idx];
    const savedAnswer = fillState.answers[q.id];

    let html = `<div class="fill-question"><h3>Q${idx + 1}. ${q.text}</h3>`;

    if (q.type === 'radio') {
        html += '<div class="fill-options">';
        q.options.forEach((opt, oi) => {
            const checked = savedAnswer === opt ? 'checked' : '';
            html += `<div class="fill-option ${savedAnswer === opt ? 'selected' : ''}">
                <input type="radio" name="q_${q.id}" id="opt_${q.id}_${oi}" value="${opt}" ${checked} onchange="onFillAnswer('${q.id}', 'radio', this.value, this)">
                <label for="opt_${q.id}_${oi}">${opt}</label>
            </div>`;
        });
        html += '</div>';
    } else if (q.type === 'checkbox') {
        html += '<div class="fill-options">';
        const savedArray = Array.isArray(savedAnswer) ? savedAnswer : [];
        q.options.forEach((opt, oi) => {
            const checked = savedArray.includes(opt) ? 'checked' : '';
            html += `<div class="fill-option ${savedArray.includes(opt) ? 'selected' : ''}">
                <input type="checkbox" name="q_${q.id}" id="opt_${q.id}_${oi}" value="${opt}" ${checked} onchange="onFillAnswer('${q.id}', 'checkbox', this.value, this)">
                <label for="opt_${q.id}_${oi}">${opt}</label>
            </div>`;
        });
        html += '</div>';
    } else if (q.type === 'text') {
        const val = typeof savedAnswer === 'string' ? savedAnswer : '';
        html += `<textarea class="fill-text-input" rows="4" placeholder="请输入..." oninput="onFillAnswer('${q.id}', 'text', this.value, this)">${val}</textarea>`;
    } else if (q.type === 'range') {
        const val = typeof savedAnswer === 'number' ? savedAnswer : q.rangeMin;
        html += `<div class="fill-range-container">
            <input type="range" min="${q.rangeMin}" max="${q.rangeMax}" step="${q.rangeStep}" value="${val}" oninput="onFillAnswer('${q.id}', 'range', this.value, this)">
            <div class="fill-range-value">${val}</div>
        </div>`;
    }

    html += '</div>';
    document.getElementById('fill-content').innerHTML = html;
    updateProgressBar();
    updateNavButtons();
}

function onFillAnswer(qId, type, value, inputEl) {
    if (type === 'radio') {
        fillState.answers[qId] = value;
        // Update visual selection
        document.querySelectorAll('.fill-option').forEach(el => el.classList.remove('selected'));
        if (inputEl && inputEl.parentElement) {
            inputEl.parentElement.classList.add('selected');
        }
    } else if (type === 'checkbox') {
        if (!Array.isArray(fillState.answers[qId])) {
            fillState.answers[qId] = [];
        }
        const arr = fillState.answers[qId];
        if (inputEl.checked) {
            if (!arr.includes(value)) arr.push(value);
        } else {
            const idx = arr.indexOf(value);
            if (idx >= 0) arr.splice(idx, 1);
        }
        // Update visual selection
        if (inputEl && inputEl.parentElement) {
            inputEl.parentElement.classList.toggle('selected', inputEl.checked);
        }
    } else if (type === 'text') {
        fillState.answers[qId] = value;
    } else if (type === 'range') {
        fillState.answers[qId] = parseInt(value);
        // Update displayed value
        const valueEl = document.querySelector('.fill-range-value');
        if (valueEl) valueEl.textContent = value;
    }

    autoSaveProgress(location.hash.split('=')[1]);
}

function updateProgressBar() {
    const total = survey.questions.length;
    const answered = survey.questions.filter(q => {
        const a = fillState.answers[q.id];
        if (q.type === 'text') return a !== undefined && a !== '';
        if (q.type === 'range') return a !== undefined;
        if (q.type === 'radio') return a !== undefined;
        if (q.type === 'checkbox') return Array.isArray(a) && a.length > 0;
        return false;
    }).length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-text').textContent = pct + '%';
}

function updateTimerDisplay() {
    const mins = Math.floor(fillState.timerRemaining / 60);
    const secs = fillState.timerRemaining % 60;
    document.getElementById('timer-text').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    const pct = fillState.timerTotal > 0 ? (fillState.timerRemaining / fillState.timerTotal) * 100 : 0;
    document.getElementById('timer-bar').style.width = pct + '%';
}

function updateNavButtons() {
    document.getElementById('btn-prev').disabled = fillState.currentQuestion === 0;
}

function goNext() {
    const idx = fillState.currentQuestion;
    const q = survey.questions[idx];
    const answer = fillState.answers[q.id];

    // Determine next question via branching
    const nextIdx = getNextQuestion(idx, answer);

    // If we've seen all questions
    if (nextIdx >= survey.questions.length) {
        fillState.currentQuestion = nextIdx;
        renderFillQuestion();
        return;
    }

    fillState.currentQuestion = nextIdx;
    autoSaveProgress(location.hash.split('=')[1]);
    renderFillQuestion();
}

function goPrev() {
    if (fillState.currentQuestion > 0) {
        fillState.currentQuestion--;
        renderFillQuestion();
    }
}

function autoSaveProgress(encodedId) {
    const progress = {
        answers: fillState.answers,
        currentQuestion: fillState.currentQuestion,
        timerRemaining: fillState.timerRemaining
    };
    saveProgress(encodedId, progress);
}

function submitAnswers(encodedId) {
    // Stop timer
    if (fillState.timer) {
        clearInterval(fillState.timer);
        fillState.timer = null;
    }

    const submission = {
        answers: fillState.answers,
        timestamp: Date.now()
    };

    // Save to localStorage (simulate submission)
    saveSubmission(encodedId, submission);

    // Also save survey data if not already saved
    saveSurvey(survey.id, survey);

    // Clear progress
    clearProgress(encodedId);

    showToast('提交成功！');
    location.hash = '#/results?id=' + encodedId;
}

// ===== Results Page =====
function initResults(encodedId) {
    const surveyData = decodeSurvey(encodedId);
    if (!surveyData) {
        showToast('无效的问卷链接');
        location.hash = '#/create';
        return;
    }
    survey = surveyData;
    document.getElementById('results-title').textContent = survey.title || '问卷结果';

    const submissions = loadSubmissions(encodedId);
    document.getElementById('results-count').textContent = submissions.length;

    if (submissions.length === 0) {
        document.getElementById('results-charts').innerHTML =
            '<p style="text-align:center;color:#888;grid-column:1/-1;padding:40px;">暂无提交数据</p>';
        return;
    }

    renderCharts(submissions);
}

function renderCharts(submissions) {
    const container = document.getElementById('results-charts');
    container.innerHTML = '';

    survey.questions.forEach((q, qi) => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `<h4>Q${qi + 1}. ${q.text}</h4>`;

        if (q.type === 'radio') {
            renderPieChart(card, q, submissions);
        } else if (q.type === 'checkbox') {
            renderBarChart(card, q, submissions);
        } else if (q.type === 'text') {
            renderTextList(card, q, submissions);
        } else if (q.type === 'range') {
            renderRangeChart(card, q, submissions);
        }

        container.appendChild(card);
    });
}

function renderPieChart(card, q, submissions) {
    const counts = {};
    q.options.forEach(opt => counts[opt] = 0);
    submissions.forEach(sub => {
        const a = sub.answers[q.id];
        if (a !== undefined && counts[a] !== undefined) {
            counts[a]++;
        }
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    if (labels.length === 0 || data.every(v => v === 0)) {
        card.innerHTML += '<p style="color:#aaa;font-size:.85rem;">暂无数据</p>';
        return;
    }

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: COLORS.slice(0, labels.length),
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 8, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / submissions.length * 100)}%)`
                    }
                }
            }
        }
    });
}

function renderBarChart(card, q, submissions) {
    const counts = {};
    q.options.forEach(opt => counts[opt] = 0);
    submissions.forEach(sub => {
        const a = sub.answers[q.id];
        if (Array.isArray(a)) {
            a.forEach(val => { if (counts[val] !== undefined) counts[val]++; });
        }
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    if (labels.length === 0) {
        card.innerHTML += '<p style="color:#aaa;font-size:.85rem;">暂无数据</p>';
        return;
    }

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '选中次数',
                data: data,
                backgroundColor: COLORS.slice(0, labels.length),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.raw} 次 (${Math.round(ctx.raw / submissions.length * 100)}%)`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function renderTextList(card, q, submissions) {
    const answers = submissions
        .map(sub => sub.answers[q.id])
        .filter(a => a !== undefined && a !== '')
        .map(a => String(a).trim())
        .filter(a => a.length > 0);

    if (answers.length === 0) {
        card.innerHTML += '<p style="color:#aaa;font-size:.85rem;">暂无回答</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.style.cssText = 'list-style:none;padding:0;max-height:240px;overflow-y:auto;';
    answers.forEach(a => {
        const li = document.createElement('li');
        li.style.cssText = 'padding:6px 0;border-bottom:1px solid #eee;font-size:.88rem;color:#444;';
        li.textContent = a;
        ul.appendChild(li);
    });
    card.appendChild(ul);
}

function renderRangeChart(card, q, submissions) {
    const values = submissions
        .map(sub => sub.answers[q.id])
        .filter(a => typeof a === 'number' && !isNaN(a));

    if (values.length === 0) {
        card.innerHTML += '<p style="color:#aaa;font-size:.85rem;">暂无数据</p>';
        return;
    }

    // Build histogram
    const min = q.rangeMin || 1;
    const max = q.rangeMax || 10;
    const step = q.rangeStep || 1;
    const labels = [];
    const data = [];

    for (let v = min; v <= max; v += step) {
        labels.push(String(v));
        data.push(values.filter(val => val >= v && val < v + step).length);
    }

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '次数',
                data: data,
                backgroundColor: '#4A90D9',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// ===== Modal =====
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function copyShareUrl() {
    const input = document.getElementById('share-url');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('链接已复制到剪贴板');
    }).catch(() => {
        input.setSelectionRange(0, input.value.length);
        document.execCommand('copy');
        showToast('链接已复制');
    });
}

// ===== Question type change in editor =====
function onQuestionTypeChange() {
    const type = document.getElementById('q-type').value;
    const isText = type === 'text';
    const isRange = type === 'range';
    document.getElementById('options-group').style.display = isText || isRange ? 'none' : 'block';
    document.getElementById('range-group').style.display = isRange ? 'block' : 'none';
    document.getElementById('branch-group').style.display = isText ? 'none' : 'block';
}

// ===== Event Bindings =====
document.addEventListener('DOMContentLoaded', () => {
    // Router
    window.addEventListener('hashchange', onHashChange);
    onHashChange();

    // Editor
    document.getElementById('btn-add-question').addEventListener('click', addQuestion);
    document.getElementById('btn-save-question').addEventListener('click', saveCurrentQuestion);
    document.getElementById('btn-delete-question').addEventListener('click', deleteQuestion);
    document.getElementById('btn-preview').addEventListener('click', previewSurvey);
    document.getElementById('btn-publish').addEventListener('click', publishSurvey);
    document.getElementById('q-type').addEventListener('change', onQuestionTypeChange);

    // Fill page
    document.getElementById('btn-next').addEventListener('click', goNext);
    document.getElementById('btn-prev').addEventListener('click', goPrev);
    document.getElementById('btn-submit').addEventListener('click', () => {
        submitAnswers(location.hash.split('=')[1]);
    });

    // Modal
    document.getElementById('btn-copy-url').addEventListener('click', copyShareUrl);
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
});

// Expose global functions used in inline handlers
window.moveQuestion = moveQuestion;
window.selectQuestion = selectQuestion;
window.onFillAnswer = onFillAnswer;
