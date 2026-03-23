// ========== State Management ==========
const AppState = {
  currentView: 'builder',
  survey: null,
  answers: {},
  currentQuestionIndex: 0,
  timerInterval: null,
  timeRemaining: 0,
  timerPaused: false,
  charts: {},
  branchRules: {},
  isDirty: false
};

// ========== Utility Functions ==========
function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function getQuestionTypeLabel(type) {
  const labels = {
    radio: '单选', checkbox: '多选', text: '文本', textarea: '多行文本',
    slider: '滑块', rating: '评分'
  };
  return labels[type] || type;
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    showToast('存储空间不足');
  }
}

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function getAllSurveys() {
  return loadFromStorage('surveys') || {};
}

function saveSurvey(survey) {
  const surveys = getAllSurveys();
  surveys[survey.id] = survey;
  saveToStorage('surveys', surveys);
}

function getSurvey(id) {
  const surveys = getAllSurveys();
  return surveys[id] || null;
}

function getResponses(surveyId) {
  return loadFromStorage('responses_' + surveyId) || [];
}

function saveResponse(surveyId, response) {
  const responses = getResponses(surveyId);
  // Avoid duplicate submissions from same session
  const exists = responses.some(r => JSON.stringify(r.answers) === JSON.stringify(response.answers) &&
    Math.abs(new Date(r.submittedAt) - new Date(response.submittedAt)) < 5000);
  if (!exists) {
    responses.push(response);
    saveToStorage('responses_' + surveyId, responses);
  }
}

function savePartialResponse(surveyId, answers) {
  saveToStorage('partial_' + surveyId, { answers, savedAt: Date.now() });
}

function loadPartialResponse(surveyId) {
  return loadFromStorage('partial_' + surveyId) || null;
}

function clearPartialResponse(surveyId) {
  localStorage.removeItem('partial_' + surveyId);
}

// ========== View Switching ==========
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const view = document.getElementById(viewName + '-view');
  const tab = document.getElementById('tab-' + viewName);
  if (view) view.classList.add('active');
  if (tab) tab.classList.add('active');

  AppState.currentView = viewName;

  if (viewName === 'results' && AppState.survey) {
    renderResults();
  }
}

// ========== Theme Toggle ==========
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').textContent = '☾';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-toggle').textContent = '☀';
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').textContent = '☾';
    localStorage.setItem('theme', 'dark');
  }
}

// ========== Builder Logic ==========
function createSurvey() {
  return {
    id: generateId(),
    title: '',
    description: '',
    isQuiz: false,
    timeLimit: 0,
    questions: []
  };
}

function createQuestion(type) {
  const q = {
    id: generateId(),
    type: type,
    title: '',
    required: true
  };

  if (type === 'radio' || type === 'checkbox') {
    q.options = [{ value: 'opt1', label: '选项 1' }, { value: 'opt2', label: '选项 2' }];
  }
  if (type === 'slider') {
    q.min = 0;
    q.max = 100;
    q.step = 1;
    q.unit = '';
  }
  if (type === 'text') {
    q.placeholder = '请输入您的回答';
    q.maxLength = 500;
  }
  if (type === 'textarea') {
    q.placeholder = '请输入您的回答';
    q.maxLength = 2000;
  }
  if (type === 'rating') {
    q.min = 1;
    q.max = 5;
  }

  return q;
}

function renderQuestionList() {
  const list = document.getElementById('question-list');
  const survey = AppState.survey;

  if (!survey || survey.questions.length === 0) {
    list.innerHTML = '<p class="empty-hint">点击上方按钮添加问题</p>';
    return;
  }

  list.innerHTML = survey.questions.map((q, idx) => buildQuestionCard(q, idx)).join('');
  attachQuestionCardListeners();
}

function buildQuestionCard(q, idx) {
  let optionsHtml = '';
  let configHtml = '';

  if (q.type === 'radio' || q.type === 'checkbox') {
    optionsHtml = `
      <div class="question-options">
        ${(q.options || []).map((opt, oi) => `
          <div class="option-row" data-idx="${oi}">
            <span style="color:var(--text-secondary);font-size:0.8rem">${q.type === 'radio' ? '●' : '☐'}</span>
            <input type="text" value="${opt.label}" data-field="option-label" data-idx="${oi}" placeholder="选项文本">
            <button class="icon-btn danger btn-remove-option" data-idx="${oi}" title="删除选项">&times;</button>
          </div>
        `).join('')}
        <button class="btn-add-option">+ 添加选项</button>
      </div>`;
  }

  if (q.type === 'slider') {
    configHtml = `
      <div class="slider-config">
        <label>最小值<input type="number" value="${q.min}" data-field="min"></label>
        <label>最大值<input type="number" value="${q.max}" data-field="max"></label>
        <label>步长<input type="number" value="${q.step}" data-field="step"></label>
        <label>单位<input type="text" value="${q.unit || ''}" data-field="unit" placeholder="无"></label>
      </div>`;
  }

  if (q.type === 'rating') {
    configHtml = `
      <div class="rating-config">
        <label>最小值<input type="number" value="${q.min}" data-field="min" min="1" max="10"></label>
        <label>最大值<input type="number" value="${q.max}" data-field="max" min="1" max="10"></label>
      </div>`;
  }

  if (q.type === 'text' || q.type === 'textarea') {
    configHtml = `
      <div style="margin-top:8px">
        <label style="font-size:0.8rem;color:var(--text-secondary)">占位提示:
          <input type="text" value="${q.placeholder || ''}" data-field="placeholder" style="width:200px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-primary);color:var(--text-primary);font-size:0.85rem">
        </label>
      </div>`;
  }

  return `
    <div class="question-card" data-qid="${q.id}">
      <div class="question-card-header">
        <span class="question-number">${idx + 1}.</span>
        <span class="question-type-badge">${getQuestionTypeLabel(q.type)}</span>
        <input type="text" class="question-card-title" value="${q.title}" data-field="title" placeholder="输入问题标题">
        <div class="question-card-actions">
          <button class="icon-btn btn-move-up" title="上移">↑</button>
          <button class="icon-btn btn-move-down" title="下移">↓</button>
          <button class="icon-btn danger btn-delete" title="删除">✕</button>
        </div>
      </div>
      ${optionsHtml}
      ${configHtml}
      <div class="question-card-footer">
        <label class="checkbox-label">
          <input type="checkbox" data-field="required" ${q.required ? 'checked' : ''}>
          必填
        </label>
        <button class="btn-branch btn-edit-branch" data-qid="${q.id}">
          分支规则 ${q.branchRules && q.branchRules.length > 0 ? '(' + q.branchRules.length + ')' : ''}
        </button>
      </div>
    </div>`;
}

function attachQuestionCardListeners() {
  document.querySelectorAll('.question-card').forEach(card => {
    const qid = card.dataset.qid;

    // Title change
    card.querySelector('[data-field="title"]')?.addEventListener('input', e => {
      updateQuestionField(qid, 'title', e.target.value);
    });

    // Required toggle
    card.querySelector('[data-field="required"]')?.addEventListener('change', e => {
      updateQuestionField(qid, 'required', e.target.checked);
    });

    // Option label change
    card.querySelectorAll('[data-field="option-label"]').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = parseInt(e.target.dataset.idx);
        updateOptionLabel(qid, idx, e.target.value);
      });
    });

    // Add option
    card.querySelector('.btn-add-option')?.addEventListener('click', () => {
      addOption(qid);
    });

    // Remove option
    card.querySelectorAll('.btn-remove-option').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        removeOption(qid, idx);
      });
    });

    // Slider/rating config
    card.querySelectorAll('[data-field="min"], [data-field="max"], [data-field="step"], [data-field="unit"], [data-field="placeholder"]').forEach(inp => {
      inp.addEventListener('input', e => {
        const field = e.target.dataset.field;
        let val = e.target.value;
        if (['min', 'max', 'step'].includes(field)) val = parseFloat(val) || 0;
        updateQuestionField(qid, field, val);
      });
    });

    // Move up/down
    card.querySelector('.btn-move-up')?.addEventListener('click', () => moveQuestion(qid, -1));
    card.querySelector('.btn-move-down')?.addEventListener('click', () => moveQuestion(qid, 1));

    // Delete
    card.querySelector('.btn-delete')?.addEventListener('click', () => deleteQuestion(qid));

    // Branch
    card.querySelector('.btn-edit-branch')?.addEventListener('click', () => openBranchModal(qid));
  });
}

function updateQuestionField(qid, field, value) {
  const q = AppState.survey.questions.find(q => q.id === qid);
  if (q) {
    q[field] = value;
    AppState.isDirty = true;
  }
}

function updateOptionLabel(qid, idx, label) {
  const q = AppState.survey.questions.find(q => q.id === qid);
  if (q && q.options && q.options[idx]) {
    q.options[idx].label = label;
    AppState.isDirty = true;
  }
}

function addOption(qid) {
  const q = AppState.survey.questions.find(q => q.id === qid);
  if (q && q.options) {
    q.options.push({ value: 'opt' + (q.options.length + 1), label: '选项 ' + (q.options.length + 1) });
    AppState.isDirty = true;
    renderQuestionList();
  }
}

function removeOption(qid, idx) {
  const q = AppState.survey.questions.find(q => q.id === qid);
  if (q && q.options && q.options.length > 1) {
    q.options.splice(idx, 1);
    AppState.isDirty = true;
    renderQuestionList();
  }
}

function moveQuestion(qid, direction) {
  const questions = AppState.survey.questions;
  const idx = questions.findIndex(q => q.id === qid);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= questions.length) return;

  [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
  // Re-index branch rules
  reindexBranchRules();
  AppState.isDirty = true;
  renderQuestionList();
}

function deleteQuestion(qid) {
  AppState.survey.questions = AppState.survey.questions.filter(q => q.id !== qid);
  reindexBranchRules();
  AppState.isDirty = true;
  renderQuestionList();
}

function reindexBranchRules() {
  // Clean up branch rules that reference deleted questions
  AppState.survey.questions.forEach(q => {
    if (q.branchRules) {
      q.branchRules = q.branchRules.filter(rule => {
        return AppState.survey.questions.some(sq => sq.id === rule.targetValue) ||
          typeof rule.targetValue === 'string' && !rule.targetValue.startsWith('id_');
      });
    }
  });
}

// ========== Branch Logic Modal ==========
function openBranchModal(qid) {
  const question = AppState.survey.questions.find(q => q.id === qid);
  if (!question) return;

  const otherQuestions = AppState.survey.questions.filter(q => q.id !== qid && (q.type === 'radio' || q.type === 'checkbox'));

  let rulesHtml = '';
  if (question.branchRules && question.branchRules.length > 0) {
    rulesHtml = question.branchRules.map((rule, ri) => buildBranchRuleHtml(rule, ri, otherQuestions)).join('');
  }

  const body = document.getElementById('branch-modal-body');
  body.innerHTML = `
    <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:12px">
      设置分支规则：当答题者选择特定选项时，自动跳转到指定问题。
    </p>
    <div id="branch-rules-list">${rulesHtml}</div>
    <button class="btn-add-rule" id="btn-add-branch-rule">+ 添加规则</button>
    <input type="hidden" id="branch-qid" value="${qid}">
  `;

  // Add rule button
  document.getElementById('btn-add-branch-rule').addEventListener('click', () => {
    addBranchRuleRow(qid, otherQuestions);
  });

  // Existing rule listeners
  body.querySelectorAll('.btn-remove-rule').forEach(btn => {
    btn.addEventListener('click', e => {
      const row = e.target.closest('.branch-rule');
      if (row) row.remove();
    });
  });

  // Save
  document.getElementById('branch-save').onclick = () => saveBranchRules(qid);

  // Show modal
  document.getElementById('branch-modal').style.display = 'flex';
}

function buildBranchRuleHtml(rule, idx, targetQuestions) {
  const targetOptions = targetQuestions.flatMap(q =>
    (q.options || []).map(o => ({ value: q.id + '::' + o.value, label: q.title + ' → ' + o.label }))
  );

  return `
    <div class="branch-rule">
      <div class="branch-rule-header">
        <span style="font-size:0.8rem;font-weight:600;color:var(--accent)">规则 ${idx + 1}</span>
        <button class="icon-btn btn-remove-rule" style="font-size:0.8rem">✕</button>
      </div>
      <div class="branch-rule-row">
        <label>如果选择:</label>
        <select class="branch-condition-select" data-field="condition">
          <option value="">-- 选择选项 --</option>
          ${targetQuestions.flatMap(q =>
            (q.options || []).map(o =>
              `<option value="${q.id + '::' + o.value}" ${rule && rule.condition === q.id + '::' + o.value ? 'selected' : ''}>${q.title}: ${o.label}</option>`
            )
          ).join('')}
        </select>
      </div>
      <div class="branch-rule-row">
        <label>则跳转到:</label>
        <select class="branch-target-select" data-field="targetValue">
          <option value="">-- 选择目标 --</option>
          ${targetOptions.map(o =>
            `<option value="${o.value}" ${rule && rule.targetValue === o.value ? 'selected' : ''}>${o.label}</option>`
          ).join('')}
        </select>
      </div>
    </div>`;
}

function addBranchRuleRow(qid, targetQuestions) {
  const list = document.getElementById('branch-rules-list');
  const count = list.querySelectorAll('.branch-rule').length;
  const div = document.createElement('div');
  div.innerHTML = buildBranchRuleHtml(null, count, targetQuestions);
  const ruleEl = div.firstElementChild;
  list.appendChild(ruleEl);

  ruleEl.querySelector('.btn-remove-rule').addEventListener('click', () => ruleEl.remove());
}

function saveBranchRules(qid) {
  const question = AppState.survey.questions.find(q => q.id === qid);
  if (!question) return;

  const rules = [];
  document.querySelectorAll('#branch-rules-list .branch-rule').forEach(ruleEl => {
    const condition = ruleEl.querySelector('.branch-condition-select')?.value;
    const targetValue = ruleEl.querySelector('.branch-target-select')?.value;
    if (condition && targetValue) {
      rules.push({ jumpTo: null, condition, targetValue });
    }
  });

  question.branchRules = rules;
  AppState.isDirty = true;
  document.getElementById('branch-modal').style.display = 'none';
  renderQuestionList();
  showToast('分支规则已保存');
}

// ========== Survey Save & Share ==========
function saveSurveyToStorage() {
  if (!AppState.survey) return;

  AppState.survey.title = document.getElementById('survey-title').value.trim();
  AppState.survey.description = document.getElementById('survey-desc').value.trim();
  AppState.survey.isQuiz = document.getElementById('is-quiz').checked;
  AppState.survey.timeLimit = AppState.survey.isQuiz ? (parseInt(document.getElementById('time-limit').value) || 30) * 60 : 0;

  // Validate
  if (!AppState.survey.title) {
    showToast('请输入问卷标题');
    return;
  }
  if (AppState.survey.questions.length === 0) {
    showToast('请至少添加一个问题');
    return;
  }

  saveSurvey(AppState.survey);
  AppState.isDirty = false;
  showToast('问卷已保存');
}

function openShareModal() {
  if (!AppState.survey) {
    showToast('请先创建并保存问卷');
    return;
  }

  // Make sure we have an ID
  if (!AppState.survey.id) {
    AppState.survey.id = generateId();
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const takeUrl = baseUrl + '#take=' + AppState.survey.id;
  const builderUrl = baseUrl + '#builder=' + AppState.survey.id;

  document.getElementById('share-url').value = takeUrl;
  document.getElementById('share-take-url').value = builderUrl;
  document.getElementById('share-modal').style.display = 'flex';
}

function copyShareUrl() {
  const input = document.getElementById('share-url');
  input.select();
  document.execCommand('copy');
  showToast('链接已复制');
}

function clearSurvey() {
  if (AppState.isDirty && !confirm('确定要清空问卷吗？未保存的更改将丢失。')) return;
  AppState.survey = createSurvey();
  AppState.isDirty = false;
  syncBuilderUI();
  renderQuestionList();
  showToast('已清空');
}

// ========== Builder UI Sync ==========
function syncBuilderUI() {
  if (!AppState.survey) return;

  document.getElementById('survey-title').value = AppState.survey.title || '';
  document.getElementById('survey-desc').value = AppState.survey.description || '';
  document.getElementById('is-quiz').checked = AppState.survey.isQuiz || false;
  document.getElementById('time-limit').value = Math.floor((AppState.survey.timeLimit || 1800) / 60);
  document.getElementById('time-limit-setting').style.display = AppState.survey.isQuiz ? '' : 'none';
}

// ========== Take View Logic ==========
function loadSurveyForTaking() {
  if (!AppState.survey || AppState.survey.questions.length === 0) {
    showToast('问卷不存在或为空');
    switchView('builder');
    return;
  }

  document.getElementById('take-title').textContent = AppState.survey.title;
  document.getElementById('take-desc').textContent = AppState.survey.description || '';

  // Load partial response
  const partial = loadPartialResponse(AppState.survey.id);
  if (partial) {
    AppState.answers = partial.answers || {};
  } else {
    AppState.answers = {};
  }

  AppState.currentQuestionIndex = 0;

  // Setup quiz timer
  if (AppState.survey.isQuiz && AppState.survey.timeLimit > 0) {
    const timerEl = document.getElementById('quiz-timer');
    timerEl.style.display = '';
    startTimer(AppState.survey.timeLimit);
  } else {
    document.getElementById('quiz-timer').style.display = 'none';
  }

  renderCurrentQuestion();
  updateProgress();
}

function getNextQuestionIndex() {
  const questions = AppState.survey.questions;
  const currentIndex = AppState.currentQuestionIndex;

  // Check branch rules for the current question
  const currentQ = questions[currentIndex];
  if (currentQ && currentQ.branchRules && currentQ.branchRules.length > 0) {
    const answer = AppState.answers[currentQ.id];
    for (const rule of currentQ.branchRules) {
      // rule.condition format: "questionId::optionValue"
      if (answer === rule.condition.split('::')[1]) {
        // Find the target question
        const targetQId = rule.targetValue.split('::')[0];
        const targetIdx = questions.findIndex(q => q.id === targetQId);
        if (targetIdx >= 0) return targetIdx;
      }
    }
  }

  // Normal next question
  return currentIndex + 1;
}

function renderCurrentQuestion() {
  const questions = AppState.survey.questions;
  if (AppState.currentQuestionIndex >= questions.length) {
    // All questions done
    document.getElementById('take-body').innerHTML = `
      <div class="take-question" style="text-align:center">
        <h3>已完成所有问题</h3>
        <p style="color:var(--text-secondary);margin-top:8px">请提交您的答案</p>
      </div>`;
    document.getElementById('take-footer').style.display = 'flex';
    document.getElementById('btn-next').style.display = 'none';
    document.getElementById('btn-back').style.display = 'none';
    return;
  }

  const q = questions[AppState.currentQuestionIndex];
  const answer = AppState.answers[q.id];
  let contentHtml = '';

  const requiredMark = q.required ? '<span class="required-star">*</span>' : '';

  switch (q.type) {
    case 'radio':
      contentHtml = buildRadioOptions(q, answer);
      break;
    case 'checkbox':
      contentHtml = buildCheckboxOptions(q, answer);
      break;
    case 'text':
      contentHtml = `<input type="text" class="text-input" id="input-${q.id}" placeholder="${q.placeholder || ''}" maxlength="${q.maxLength || 500}" value="${answer || ''}">`;
      break;
    case 'textarea':
      contentHtml = `<textarea class="textarea-input" id="input-${q.id}" placeholder="${q.placeholder || ''}" maxlength="${q.maxLength || 2000}">${answer || ''}</textarea>`;
      break;
    case 'slider':
      contentHtml = buildSliderInput(q, answer);
      break;
    case 'rating':
      contentHtml = buildRatingInput(q, answer);
      break;
  }

  document.getElementById('take-body').innerHTML = `
    <div class="take-question" data-qid="${q.id}">
      <div class="take-question-title">${AppState.currentQuestionIndex + 1}. ${q.title} ${requiredMark}</div>
      ${contentHtml}
    </div>`;

  attachTakeQuestionListeners(q);
  updateTakeNavigation();
}

function buildRadioOptions(q, answer) {
  return `<div class="option-group">
    ${(q.options || []).map(opt => `
      <label class="option-item ${answer === opt.value ? 'selected' : ''}" data-value="${opt.value}">
        <input type="radio" name="q_${q.id}" value="${opt.value}" ${answer === opt.value ? 'checked' : ''}>
        <span>${opt.label}</span>
      </label>
    `).join('')}
  </div>`;
}

function buildCheckboxOptions(q, answer) {
  const checked = answer || [];
  return `<div class="option-group">
    ${(q.options || []).map(opt => `
      <label class="option-item ${checked.includes(opt.value) ? 'selected' : ''}" data-value="${opt.value}">
        <input type="checkbox" name="q_${q.id}" value="${opt.value}" ${checked.includes(opt.value) ? 'checked' : ''}>
        <span>${opt.label}</span>
      </label>
    `).join('')}
  </div>`;
}

function buildSliderInput(q, answer) {
  const val = answer !== undefined ? answer : Math.floor((q.min + q.max) / 2);
  return `
    <div class="slider-wrapper">
      <div class="slider-value" id="slider-value-${q.id}">${val} ${q.unit || ''}</div>
      <input type="range" class="slider-input" id="input-${q.id}"
        min="${q.min}" max="${q.max}" step="${q.step}" value="${val}">
      <div class="slider-labels">
        <span>${q.min} ${q.unit || ''}</span>
        <span>${q.max} ${q.unit || ''}</span>
      </div>
    </div>`;
}

function buildRatingInput(q, answer) {
  const val = answer || q.min;
  const stars = [];
  for (let i = q.min; i <= q.max; i++) {
    stars.push(`<span class="rating-star ${i <= val ? 'active' : ''}" data-value="${i}">★</span>`);
  }
  return `
    <div class="rating-stars" id="rating-${q.id}">
      ${stars.join('')}
      <div style="text-align:center;font-size:0.9rem;color:var(--text-secondary);margin-top:8px">
        ${val} / ${q.max}
      </div>
    </div>`;
}

function attachTakeQuestionListeners(q) {
  // Radio
  document.querySelectorAll(`.option-item input[type="radio"]`).forEach(inp => {
    inp.addEventListener('change', e => {
      const value = e.target.value;
      AppState.answers[q.id] = value;
      savePartialResponse(AppState.survey.id, AppState.answers);
      document.querySelectorAll(`.option-item`).forEach(el => el.classList.remove('selected'));
      e.target.closest('.option-item').classList.add('selected');
    });
  });

  // Checkbox
  document.querySelectorAll(`.option-item input[type="checkbox"]`).forEach(inp => {
    inp.addEventListener('change', e => {
      let checked = AppState.answers[q.id] || [];
      if (e.target.checked) {
        if (!checked.includes(e.target.value)) checked.push(e.target.value);
      } else {
        checked = checked.filter(v => v !== e.target.value);
      }
      AppState.answers[q.id] = checked;
      savePartialResponse(AppState.survey.id, AppState.answers);
      e.target.closest('.option-item').classList.toggle('selected', e.target.checked);
    });
  });

  // Text
  const textInput = document.getElementById('input-' + q.id);
  if (textInput) {
    textInput.addEventListener('input', debounce(() => {
      AppState.answers[q.id] = textInput.value.trim();
      savePartialResponse(AppState.survey.id, AppState.answers);
    }, 300));
  }

  // Slider
  const sliderInput = document.getElementById('input-' + q.id);
  if (sliderInput) {
    sliderInput.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      const display = document.getElementById('slider-value-' + q.id);
      if (display) display.textContent = val + ' ' + (q.unit || '');
      AppState.answers[q.id] = val;
      savePartialResponse(AppState.survey.id, AppState.answers);
    });
  }

  // Rating
  document.querySelectorAll('.rating-star').forEach(star => {
    star.addEventListener('click', e => {
      const val = parseInt(e.target.dataset.value);
      AppState.answers[q.id] = val;
      savePartialResponse(AppState.survey.id, AppState.answers);
      document.querySelectorAll('.rating-star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.value) <= val);
      });
      const ratingDiv = document.getElementById('rating-' + q.id);
      if (ratingDiv) {
        const label = ratingDiv.querySelector('div');
        if (label) label.textContent = val + ' / ' + q.max;
      }
    });
  });
}

function updateTakeNavigation() {
  const questions = AppState.survey.questions;
  const idx = AppState.currentQuestionIndex;

  document.getElementById('btn-back').style.display = idx > 0 ? '' : 'none';
  document.getElementById('btn-next').style.display = idx < questions.length - 1 ? '' : 'none';
  document.getElementById('btn-submit').style.display = idx >= questions.length - 1 ? '' : 'none';
  document.getElementById('take-footer').style.display = 'flex';
}

function updateProgress() {
  const questions = AppState.survey.questions;
  const answered = questions.filter(q => {
    const a = AppState.answers[q.id];
    if (q.required) return a !== undefined && a !== '' && a !== null &&
      (Array.isArray(a) ? a.length > 0 : true);
    return true; // Non-required questions don't block progress
  }).length;

  const pct = questions.length > 0 ? (answered / questions.length) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function goNextQuestion() {
  // Validate current question
  const q = AppState.survey.questions[AppState.currentQuestionIndex];
  if (q && q.required) {
    const a = AppState.answers[q.id];
    if (a === undefined || a === '' || a === null || (Array.isArray(a) && a.length === 0)) {
      showToast('请回答必填问题: ' + q.title);
      return;
    }
  }

  const nextIdx = getNextQuestionIndex();
  if (nextIdx < AppState.survey.questions.length) {
    AppState.currentQuestionIndex = nextIdx;
    renderCurrentQuestion();
    updateProgress();
  } else {
    AppState.currentQuestionIndex = AppState.survey.questions.length;
    renderCurrentQuestion();
  }
}

function goPrevQuestion() {
  if (AppState.currentQuestionIndex > 0) {
    AppState.currentQuestionIndex--;
    renderCurrentQuestion();
    updateProgress();
  }
}

function submitSurvey() {
  // Validate all required questions
  for (const q of AppState.survey.questions) {
    if (q.required) {
      const a = AppState.answers[q.id];
      if (a === undefined || a === '' || a === null || (Array.isArray(a) && a.length === 0)) {
        AppState.currentQuestionIndex = AppState.survey.questions.indexOf(q);
        renderCurrentQuestion();
        showToast('请回答必填问题: ' + q.title);
        return;
      }
    }
  }

  // Save response
  const response = {
    surveyId: AppState.survey.id,
    answers: { ...AppState.answers },
    submittedAt: new Date().toISOString()
  };
  saveResponse(AppState.survey.id, response);
  clearPartialResponse(AppState.survey.id);

  // Stop timer
  stopTimer();

  showToast('提交成功！');

  // Switch to results
  setTimeout(() => switchView('results'), 500);
}

// ========== Timer ==========
function startTimer(seconds) {
  AppState.timeRemaining = seconds;
  AppState.timerPaused = false;
  updateTimerDisplay();

  if (AppState.timerInterval) clearInterval(AppState.timerInterval);

  AppState.timerInterval = setInterval(() => {
    if (AppState.timerPaused) return;

    AppState.timeRemaining--;
    updateTimerDisplay();

    if (AppState.timeRemaining <= 0) {
      stopTimer();
      showToast('时间到！问卷已自动提交。');
      submitSurvey();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(AppState.timeRemaining / 60);
  const secs = AppState.timeRemaining % 60;
  const display = document.getElementById('timer-display');
  display.textContent = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');

  const timerEl = document.getElementById('quiz-timer');
  if (AppState.timeRemaining <= 60) {
    timerEl.classList.add('warning');
  } else {
    timerEl.classList.remove('warning');
  }
}

function stopTimer() {
  if (AppState.timerInterval) {
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = null;
  }
}

function toggleTimer() {
  AppState.timerPaused = !AppState.timerPaused;
  document.getElementById('timer-toggle').textContent = AppState.timerPaused ? '继续' : '暂停';
}

// ========== Results View ==========
function renderResults() {
  if (!AppState.survey) return;

  document.getElementById('results-title').textContent = AppState.survey.title + ' - 结果';

  const responses = getResponses(AppState.survey.id);
  const body = document.getElementById('results-body');

  if (responses.length === 0) {
    body.innerHTML = '<p class="empty-hint">暂无结果数据</p>';
    return;
  }

  // Destroy old charts
  Object.values(AppState.charts).forEach(c => c.destroy());
  AppState.charts = {};

  // Build question selector
  const selector = document.getElementById('results-question-select');
  selector.innerHTML = '<option value="all">查看所有问题</option>' +
    AppState.survey.questions.map((q, i) =>
      `<option value="${q.id}">${i + 1}. ${q.title}</option>`
    ).join('');

  // Summary stats
  const summaryHtml = `
    <div class="results-summary" style="grid-column:1/-1">
      <div class="summary-card">
        <div class="summary-value">${responses.length}</div>
        <div class="summary-label">总回复数</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${AppState.survey.questions.length}</div>
        <div class="summary-label">问题数</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${new Date().toLocaleDateString('zh-CN')}</div>
        <div class="summary-label">最新回复</div>
      </div>
    </div>`;

  // Question cards with charts
  let questionsHtml = '';
  AppState.survey.questions.forEach((q, qi) => {
    questionsHtml += buildResultCard(q, qi, responses);
  });

  body.innerHTML = summaryHtml + questionsHtml;

  // Initialize charts
  AppState.survey.questions.forEach((q, qi) => {
    initChart(q, qi, responses);
  });

  // Question filter
  selector.onchange = () => {
    const val = selector.value;
    document.querySelectorAll('.result-card').forEach(card => {
      if (val === 'all') {
        card.style.display = '';
      } else {
        card.style.display = card.dataset.qid === val ? '' : 'none';
      }
    });
    // Always show summary
    document.querySelectorAll('.results-summary').forEach(el => el.style.display = '');
  };
}

function buildResultCard(q, idx, responses) {
  const cardId = 'chart-' + idx;
  let chartHtml = `<canvas id="${cardId}"></canvas>`;

  if (q.type === 'text' || q.type === 'textarea') {
    chartHtml = buildTextAnswers(q, responses);
  }

  return `
    <div class="result-card" data-qid="${q.id}">
      <h3>${idx + 1}. ${q.title}</h3>
      ${chartHtml}
    </div>`;
}

function buildTextAnswers(q, responses) {
  const answers = responses
    .map(r => r.answers[q.id])
    .filter(a => a && a.toString().trim());

  if (answers.length === 0) {
    return '<p style="color:var(--text-secondary);font-size:0.9rem">暂无回答</p>';
  }

  return `
    <div class="text-answers-list">
      ${answers.map(a => `<div class="text-answer-item">${escapeHtml(a.toString().trim())}</div>`).join('')}
    </div>
    <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">
      共 ${answers.length} 条回答
    </p>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initChart(q, idx, responses) {
  if (q.type === 'text' || q.type === 'textarea') return;

  const canvas = document.getElementById('chart-' + idx);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const chartData = getChartData(q, responses);

  let chart;
  if (q.type === 'slider' || q.type === 'rating') {
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: q.title,
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  } else {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: [
            '#4f46e5', '#22c55e', '#f59e0b', '#ef4444',
            '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
            '#f97316', '#6366f1'
          ],
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 12 } }
          }
        }
      }
    });
  }

  AppState.charts[idx] = chart;
}

function getChartData(q, responses) {
  const labels = [];
  const data = [];

  if (q.type === 'radio' || q.type === 'checkbox') {
    const counts = {};
    (q.options || []).forEach(o => { counts[o.label] = 0; });

    responses.forEach(r => {
      const a = r.answers[q.id];
      if (q.type === 'checkbox' && Array.isArray(a)) {
        a.forEach(v => {
          const opt = (q.options || []).find(o => o.value === v);
          if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
        });
      } else if (a) {
        const opt = (q.options || []).find(o => o.value === a);
        if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
      }
    });

    Object.keys(counts).forEach(k => {
      labels.push(k);
      data.push(counts[k]);
    });
  } else if (q.type === 'slider' || q.type === 'rating') {
    const values = responses.map(r => r.answers[q.id]).filter(v => v !== undefined && v !== null);

    if (values.length > 0) {
      // Create distribution
      const min = q.min || 0;
      const max = q.max || 100;
      const step = q.step || 1;
      const buckets = {};

      for (let v = min; v <= max; v += step) {
        buckets[v] = 0;
      }

      values.forEach(v => {
        const rounded = Math.round(v / step) * step;
        if (buckets[rounded] !== undefined) buckets[rounded]++;
        else buckets[v] = (buckets[v] || 0) + 1;
      });

      Object.keys(buckets).sort((a, b) => a - b).forEach(k => {
        labels.push(k + (q.unit || ''));
        data.push(buckets[k]);
      });
    }
  }

  return { labels, data };
}

// ========== URL Routing ==========
function parseHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  if (params.has('take')) {
    return { mode: 'take', id: params.get('take') };
  }
  if (params.has('builder')) {
    return { mode: 'builder', id: params.get('builder') };
  }
  return null;
}

function handleRoute() {
  const route = parseHash();
  if (!route) return;

  if (route.mode === 'take') {
    const survey = getSurvey(route.id);
    if (survey) {
      AppState.survey = survey;
      switchView('take');
      loadSurveyForTaking();
    } else {
      showToast('问卷不存在');
    }
  } else if (route.mode === 'builder') {
    const survey = getSurvey(route.id);
    if (survey) {
      AppState.survey = survey;
      switchView('builder');
      syncBuilderUI();
      renderQuestionList();
    } else {
      showToast('问卷不存在');
    }
  }
}

// ========== Debounce ==========
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ========== Event Bindings ==========
function bindEvents() {
  // Tab switching
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view === 'take' && AppState.survey) {
        loadSurveyForTaking();
      }
      switchView(view);
    });
  });

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Builder: question type buttons
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      AppState.survey.questions.push(createQuestion(type));
      AppState.isDirty = true;
      renderQuestionList();
    });
  });

  // Builder: survey settings
  document.getElementById('is-quiz').addEventListener('change', e => {
    document.getElementById('time-limit-setting').style.display = e.target.checked ? '' : 'none';
  });

  // Builder: save
  document.getElementById('btn-save').addEventListener('click', saveSurveyToStorage);

  // Builder: share
  document.getElementById('btn-share').addEventListener('click', openShareModal);

  // Builder: clear
  document.getElementById('btn-clear').addEventListener('click', clearSurvey);

  // Share modal
  document.getElementById('copy-url').addEventListener('click', copyShareUrl);

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  // Close modal on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });

  // Take: navigation
  document.getElementById('btn-next').addEventListener('click', goNextQuestion);
  document.getElementById('btn-back').addEventListener('click', goPrevQuestion);
  document.getElementById('btn-submit').addEventListener('click', submitSurvey);
  document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
}

// ========== Initialization ==========
function init() {
  initTheme();
  AppState.survey = createSurvey();
  bindEvents();
  handleRoute();
}

// Start
document.addEventListener('DOMContentLoaded', init);
