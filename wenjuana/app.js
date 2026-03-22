/* ============================================================
   问卷构建工具 - 核心应用逻辑
   ============================================================ */

const App = {
  // ---- State ----
  surveys: [],
  currentSurvey: null,
  editingQuestionId: null,
  modalOptions: [],
  fillState: {
    survey: null,
    answers: {},
    currentStep: 0,
    questionFlow: [],
    timer: null,
    timeRemaining: 0,
    respondentId: null,
    startTime: null,
  },
  charts: [],
  confirmCallback: null,

  // ---- Question type labels ----
  typeLabels: {
    single: '单选题',
    multiple: '多选题',
    text: '文本题',
    slider: '滑块题',
  },

  // ============================================================
  // Initialization
  // ============================================================
  init() {
    this.loadSurveys();
    this.bindGlobalEvents();
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  bindGlobalEvents() {
    // Builder: save
    document.getElementById('save-survey-btn').addEventListener('click', () => this.saveSurvey());
    // Builder: add question buttons
    document.querySelectorAll('.btn-add-q').forEach(btn => {
      btn.addEventListener('click', () => this.addQuestion(btn.dataset.type));
    });
    // Fill navigation
    document.getElementById('fill-next-btn').addEventListener('click', () => this.nextQuestion());
    document.getElementById('fill-prev-btn').addEventListener('click', () => this.prevQuestion());
    document.getElementById('fill-submit-btn').addEventListener('click', () => this.submitSurvey());
    // Modal buttons
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-save-btn').addEventListener('click', () => this.saveQuestion());
    document.getElementById('add-option-btn').addEventListener('click', () => this.addOption());
    document.getElementById('q-enable-branching').addEventListener('change', () => this.toggleBranching());
    // Results
    document.getElementById('copy-link-btn').addEventListener('click', () => this.copyShareLink());
    document.getElementById('delete-responses-btn').addEventListener('click', () => this.deleteResponses());
    // Confirm modal
    document.getElementById('confirm-close-btn').addEventListener('click', () => this.closeConfirm());
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => this.closeConfirm());
    document.getElementById('confirm-ok-btn').addEventListener('click', () => this.confirmOk());
    // Mobile menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
      document.querySelector('.header-inner nav').classList.toggle('open');
    });
  },

  // ============================================================
  // Routing
  // ============================================================
  route() {
    const hash = location.hash || '#/';
    const views = ['home-view', 'builder-view', 'fill-view', 'results-view'];
    views.forEach(v => document.getElementById(v).style.display = 'none');

    // Close mobile menu on navigate
    document.querySelector('.header-inner nav').classList.remove('open');

    if (hash === '#/' || hash === '#' || hash === '') {
      document.getElementById('home-view').style.display = '';
      this.renderHome();
    } else if (hash === '#/create') {
      document.getElementById('builder-view').style.display = '';
      this.initBuilder(null);
    } else if (hash.startsWith('#/edit/')) {
      document.getElementById('builder-view').style.display = '';
      const id = hash.replace('#/edit/', '');
      this.initBuilder(id);
    } else if (hash.startsWith('#/fill/')) {
      document.getElementById('fill-view').style.display = '';
      const id = hash.replace('#/fill/', '');
      this.initFill(id, false);
    } else if (hash.startsWith('#/results/')) {
      document.getElementById('results-view').style.display = '';
      const id = hash.replace('#/results/', '');
      this.initResults(id);
    } else if (hash.startsWith('#/s/')) {
      // Shared link via URL-encoded data
      document.getElementById('fill-view').style.display = '';
      const encoded = hash.replace('#/s/', '');
      this.initFillFromShare(encoded);
    } else {
      document.getElementById('home-view').style.display = '';
      this.renderHome();
    }
  },

  // ============================================================
  // LocalStorage helpers
  // ============================================================
  loadSurveys() {
    try {
      this.surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    } catch { this.surveys = []; }
  },

  saveSurveys() {
    localStorage.setItem('surveys', JSON.stringify(this.surveys));
  },

  getSurvey(id) {
    return this.surveys.find(s => s.id === id) || null;
  },

  getResponses(surveyId) {
    try {
      return JSON.parse(localStorage.getItem('responses_' + surveyId) || '[]');
    } catch { return []; }
  },

  saveResponses(surveyId, responses) {
    localStorage.setItem('responses_' + surveyId, JSON.stringify(responses));
  },

  // ============================================================
  // Utilities
  // ============================================================
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  showConfirm(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    this.confirmCallback = callback;
    document.getElementById('confirm-modal').style.display = '';
  },

  closeConfirm() {
    document.getElementById('confirm-modal').style.display = 'none';
    this.confirmCallback = null;
  },

  confirmOk() {
    if (this.confirmCallback) this.confirmCallback();
    this.closeConfirm();
  },

  encodeSurvey(survey) {
    const json = JSON.stringify(survey);
    return btoa(unescape(encodeURIComponent(json)));
  },

  decodeSurvey(encoded) {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  },

  // ============================================================
  // Home View
  // ============================================================
  renderHome() {
    const list = document.getElementById('survey-list');
    const empty = document.getElementById('empty-state');

    this.loadSurveys();

    if (this.surveys.length === 0) {
      list.style.display = 'none';
      empty.style.display = '';
      return;
    }

    empty.style.display = 'none';
    list.style.display = '';

    list.innerHTML = this.surveys.map(s => {
      const qCount = s.questions.length;
      const rCount = this.getResponses(s.id).length;
      const timeBadge = s.timeLimit > 0
        ? `<span class="badge badge-time">⏱ ${s.timeLimit} 分钟</span>`
        : '';
      return `
        <div class="survey-card">
          <h3>${this.esc(s.title)}</h3>
          ${s.description ? `<p>${this.esc(s.description)}</p>` : ''}
          <div class="survey-card-meta">
            <span>${qCount} 道题</span>
            <span>${rCount} 份答卷</span>
            ${timeBadge}
          </div>
          <div class="survey-card-actions">
            <a href="#/fill/${s.id}" class="btn btn-outline btn-sm">填写</a>
            <a href="#/edit/${s.id}" class="btn btn-secondary btn-sm">编辑</a>
            <button class="btn btn-secondary btn-sm" onclick="App.viewResults('${s.id}')">结果</button>
            <button class="btn btn-danger btn-sm" onclick="App.deleteSurvey('${s.id}')">删除</button>
          </div>
        </div>`;
    }).join('');
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  deleteSurvey(id) {
    this.showConfirm('删除问卷', '确定要删除此问卷及所有数据？此操作无法撤销。', () => {
      this.loadSurveys();
      this.surveys = this.surveys.filter(s => s.id !== id);
      this.saveSurveys();
      localStorage.removeItem('responses_' + id);
      this.showToast('问卷已删除', 'success');
      this.renderHome();
    });
  },

  viewResults(id) {
    location.hash = '#/results/' + id;
  },

  // ============================================================
  // Builder
  // ============================================================
  initBuilder(surveyId) {
    if (surveyId) {
      this.loadSurveys();
      this.currentSurvey = this.getSurvey(surveyId);
      if (!this.currentSurvey) {
        this.showToast('问卷不存在', 'error');
        location.hash = '#/';
        return;
      }
      document.getElementById('builder-title').textContent = '编辑问卷';
    } else {
      this.currentSurvey = {
        id: this.generateId(),
        title: '',
        description: '',
        timeLimit: 0,
        questions: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      document.getElementById('builder-title').textContent = '创建问卷';
    }

    document.getElementById('survey-title-input').value = this.currentSurvey.title;
    document.getElementById('survey-desc-input').value = this.currentSurvey.description || '';
    document.getElementById('time-limit-input').value = this.currentSurvey.timeLimit || 0;

    this.renderQuestionsList();
  },

  renderQuestionsList() {
    const container = document.getElementById('questions-list');
    const questions = this.currentSurvey.questions;

    if (questions.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">还没有问题，点击下方按钮添加</p>';
      return;
    }

    container.innerHTML = questions.map((q, i) => `
      <div class="question-card" onclick="App.editQuestion('${q.id}')">
        <div class="q-number">${i + 1}</div>
        <div class="q-info">
          <div class="q-title">${this.esc(q.title || '未命名问题')}</div>
          <div class="q-type">${this.typeLabels[q.type]}${q.required ? ' · 必填' : ''}</div>
        </div>
        <div class="q-actions" onclick="event.stopPropagation()">
          <button title="上移" onclick="App.moveQuestion('${q.id}',-1)">↑</button>
          <button title="下移" onclick="App.moveQuestion('${q.id}',1)">↓</button>
          <button title="删除" onclick="App.deleteQuestion('${q.id}')">×</button>
        </div>
      </div>
    `).join('');
  },

  addQuestion(type) {
    const q = {
      id: this.generateId(),
      type,
      title: '',
      description: '',
      required: true,
      options: type === 'single' || type === 'multiple'
        ? [{ id: this.generateId(), text: '选项 1' }, { id: this.generateId(), text: '选项 2' }]
        : [],
      min: 0,
      max: 100,
      step: 1,
      defaultValue: type === 'slider' ? 50 : '',
      branching: {},
    };

    this.currentSurvey.questions.push(q);
    this.renderQuestionsList();
    this.editQuestion(q.id);
  },

  editQuestion(id) {
    const q = this.currentSurvey.questions.find(x => x.id === id);
    if (!q) return;

    this.editingQuestionId = id;
    document.getElementById('q-title').value = q.title;
    document.getElementById('q-desc').value = q.description || '';
    document.getElementById('q-required').checked = q.required;

    const isChoice = q.type === 'single' || q.type === 'multiple';
    document.getElementById('q-options-section').style.display = isChoice ? '' : 'none';
    document.getElementById('q-slider-section').style.display = q.type === 'slider' ? '' : 'none';

    if (isChoice) {
      this.modalOptions = q.options.map(o => ({ ...o }));
      this.renderModalOptions();
    }

    if (q.type === 'slider') {
      document.getElementById('q-min').value = q.min;
      document.getElementById('q-max').value = q.max;
      document.getElementById('q-step').value = q.step;
    }

    document.getElementById('modal-title').textContent =
      this.typeLabels[q.type] + ' - 编辑';

    // Branching
    const hasBranching = Object.keys(q.branching).length > 0;
    document.getElementById('q-enable-branching').checked = hasBranching;
    this.renderBranchingRules(q, hasBranching);

    document.getElementById('question-modal').style.display = '';
  },

  renderModalOptions() {
    const container = document.getElementById('q-options-list');
    container.innerHTML = this.modalOptions.map((o, i) => `
      <div class="option-item">
        <input type="text" value="${this.esc(o.text)}" data-option-idx="${i}"
               onchange="App.updateOptionText(${i}, this.value)">
        <button class="remove-option-btn" onclick="App.removeOption(${i})">×</button>
      </div>
    `).join('');
  },

  addOption() {
    this.modalOptions.push({ id: this.generateId(), text: '选项 ' + (this.modalOptions.length + 1) });
    this.renderModalOptions();
    const q = this.currentSurvey.questions.find(x => x.id === this.editingQuestionId);
    if (q) this.renderBranchingRules(q, true);
  },

  removeOption(idx) {
    if (this.modalOptions.length <= 1) {
      this.showToast('至少保留一个选项', 'error');
      return;
    }
    this.modalOptions.splice(idx, 1);
    this.renderModalOptions();
    const q = this.currentSurvey.questions.find(x => x.id === this.editingQuestionId);
    if (q) this.renderBranchingRules(q, true);
  },

  updateOptionText(idx, val) {
    if (this.modalOptions[idx]) this.modalOptions[idx].text = val;
  },

  renderBranchingRules(question, enabled) {
    const rulesDiv = document.getElementById('q-branching-rules');
    rulesDiv.style.display = enabled ? '' : 'none';

    if (!enabled) return;

    const q = question || this.currentSurvey.questions.find(x => x.id === this.editingQuestionId);
    if (!q) return;

    const questions = this.currentSurvey.questions;
    const isChoice = q.type === 'single' || q.type === 'multiple';
    const listDiv = document.getElementById('q-branching-list');

    if (isChoice) {
      const options = this.modalOptions;
      listDiv.innerHTML = options.map((o, i) => {
        const selected = q.branching[o.id] || '';
        return `
          <div class="branching-item">
            <span class="branch-label">${this.esc(o.text)}</span>
            <select onchange="App.setBranchOption(this, '${o.id}')">
              <option value="">按顺序</option>
              ${questions.filter(x => x.id !== q.id).map(qq => `
                <option value="${qq.id}" ${selected === qq.id ? 'selected' : ''}>
                  ${this.esc(qq.title || '未命名')}
                </option>
              `).join('')}
              <option value="__end" ${selected === '__end' ? 'selected' : ''}>结束问卷</option>
            </select>
          </div>`;
      }).join('');
    } else {
      listDiv.innerHTML = `
        <div class="branching-item">
          <span class="branch-label">回答后跳至</span>
          <select id="q-branch-simple" onchange="App.setBranchOption(this, '_default')">
            <option value="">按顺序</option>
            ${questions.filter(x => x.id !== q.id).map(qq => `
              <option value="${qq.id}" ${(q.branching._default || '') === qq.id ? 'selected' : ''}>
                ${this.esc(qq.title || '未命名')}
              </option>
            `).join('')}
            <option value="__end" ${q.branching._default === '__end' ? 'selected' : ''}>结束问卷</option>
          </select>
        </div>`;
    }

    // Default next
    const defaultNext = document.getElementById('q-default-next');
    const currentDefault = q.branching._default || '';
    defaultNext.innerHTML = `
      <option value="">按顺序到下一题</option>
      ${questions.filter(x => x.id !== q.id).map(qq => `
        <option value="${qq.id}" ${currentDefault === qq.id ? 'selected' : ''}>
          ${this.esc(qq.title || '未命名')}
        </option>
      `).join('')}
      <option value="__end" ${currentDefault === '__end' ? 'selected' : ''}>结束问卷</option>
    `;
  },

  toggleBranching() {
    const enabled = document.getElementById('q-enable-branching').checked;
    const q = this.currentSurvey.questions.find(x => x.id === this.editingQuestionId);
    this.renderBranchingRules(q, enabled);
  },

  setBranchOption(select, optionKey) {
    // Store in a temporary attribute; will be collected on save
    select.dataset.branchKey = optionKey;
    select.dataset.branchValue = select.value;
  },

  saveQuestion() {
    const q = this.currentSurvey.questions.find(x => x.id === this.editingQuestionId);
    if (!q) return;

    const title = document.getElementById('q-title').value.trim();
    if (!title) {
      this.showToast('请输入问题标题', 'error');
      return;
    }

    q.title = title;
    q.description = document.getElementById('q-desc').value.trim();
    q.required = document.getElementById('q-required').checked;

    if (q.type === 'single' || q.type === 'multiple') {
      // Validate options
      const validOptions = this.modalOptions.filter(o => o.text.trim());
      if (validOptions.length < 1) {
        this.showToast('至少需要一个有效选项', 'error');
        return;
      }
      q.options = validOptions;
    }

    if (q.type === 'slider') {
      q.min = parseInt(document.getElementById('q-min').value) || 0;
      q.max = parseInt(document.getElementById('q-max').value) || 100;
      q.step = parseInt(document.getElementById('q-step').value) || 1;
      if (q.min >= q.max) {
        this.showToast('最大值必须大于最小值', 'error');
        return;
      }
    }

    // Save branching
    const branchingEnabled = document.getElementById('q-enable-branching').checked;
    if (branchingEnabled) {
      const branching = {};
      // Collect from branching selects
      document.querySelectorAll('#q-branching-list select, #q-default-next').forEach(sel => {
        const key = sel.dataset.branchKey || sel.id === 'q-default-next' ? '_default' : sel.dataset.branchKey;
        const val = sel.value;
        if (val && key) {
          branching[key] = val;
        }
      });
      // Also collect from simple branch select
      const simpleSelect = document.getElementById('q-branch-simple');
      if (simpleSelect) {
        const val = simpleSelect.value;
        if (val) branching._default = val;
      }
      // Collect default next
      const defaultNext = document.getElementById('q-default-next').value;
      if (defaultNext) branching._default = defaultNext;

      q.branching = branching;
    } else {
      q.branching = {};
    }

    this.closeModal();
    this.renderQuestionsList();
    this.showToast('问题已保存', 'success');
  },

  deleteQuestion(id) {
    this.showConfirm('删除问题', '确定要删除此问题？', () => {
      this.currentSurvey.questions = this.currentSurvey.questions.filter(q => q.id !== id);
      // Clean branching references
      this.currentSurvey.questions.forEach(q => {
        const newBranching = {};
        for (const [key, val] of Object.entries(q.branching)) {
          if (val !== id) newBranching[key] = val;
        }
        q.branching = newBranching;
      });
      this.renderQuestionsList();
      this.showToast('问题已删除', 'success');
    });
  },

  moveQuestion(id, direction) {
    const questions = this.currentSurvey.questions;
    const idx = questions.findIndex(q => q.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= questions.length) return;
    [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
    this.renderQuestionsList();
  },

  closeModal() {
    document.getElementById('question-modal').style.display = 'none';
    this.editingQuestionId = null;
  },

  saveSurvey() {
    const title = document.getElementById('survey-title-input').value.trim();
    if (!title) {
      this.showToast('请输入问卷标题', 'error');
      return;
    }

    if (this.currentSurvey.questions.length === 0) {
      this.showToast('请至少添加一道题', 'error');
      return;
    }

    this.currentSurvey.title = title;
    this.currentSurvey.description = document.getElementById('survey-desc-input').value.trim();
    this.currentSurvey.timeLimit = parseInt(document.getElementById('time-limit-input').value) || 0;
    this.currentSurvey.updatedAt = Date.now();

    this.loadSurveys();
    const existing = this.surveys.findIndex(s => s.id === this.currentSurvey.id);
    if (existing >= 0) {
      this.surveys[existing] = this.currentSurvey;
    } else {
      this.currentSurvey.createdAt = Date.now();
      this.surveys.push(this.currentSurvey);
    }
    this.saveSurveys();
    this.showToast('问卷已保存', 'success');
    location.hash = '#/';
  },

  // ============================================================
  // Fill View
  // ============================================================
  initFill(surveyId, fromShare) {
    this.loadSurveys();
    let survey = this.getSurvey(surveyId);

    if (!survey) {
      this.showToast('问卷不存在', 'error');
      location.hash = '#/';
      return;
    }

    this.startFill(survey);
  },

  initFillFromShare(encoded) {
    try {
      const survey = this.decodeSurvey(decodeURIComponent(encoded));
      // Also store locally for response tracking
      this.loadSurveys();
      if (!this.getSurvey(survey.id)) {
        this.surveys.push(survey);
        this.saveSurveys();
      }
      this.startFill(survey);
    } catch (e) {
      this.showToast('链接无效或已损坏', 'error');
      location.hash = '#/';
    }
  },

  startFill(survey) {
    const respondentId = this.generateId();

    // Check for saved progress
    const savedProgress = this.loadProgress(survey.id);
    if (savedProgress) {
      const resume = confirm('检测到之前未完成的问卷，是否继续填写？');
      if (resume) {
        survey = savedProgress.survey;
        this.fillState = {
          survey,
          answers: savedProgress.answers,
          currentStep: savedProgress.currentStep,
          questionFlow: savedProgress.questionFlow,
          timer: null,
          timeRemaining: savedProgress.timeRemaining,
          respondentId: savedProgress.respondentId,
          startTime: savedProgress.startTime,
        };
        document.getElementById('fill-title').textContent = survey.title;
        document.getElementById('fill-description').textContent = survey.description || '';
        this.showCurrentQuestion();
        if (survey.timeLimit > 0) {
          this.startTimer(this.fillState.timeRemaining);
        }
        return;
      }
    }

    this.fillState = {
      survey,
      answers: {},
      currentStep: 0,
      questionFlow: [0], // indices into survey.questions
      timer: null,
      timeRemaining: (survey.timeLimit || 0) * 60,
      respondentId,
      startTime: Date.now(),
    };

    document.getElementById('fill-title').textContent = survey.title;
    document.getElementById('fill-description').textContent = survey.description || '';

    if (survey.timeLimit > 0) {
      this.startTimer(survey.timeLimit * 60);
    } else {
      document.getElementById('timer-display').style.display = 'none';
    }

    this.showCurrentQuestion();
  },

  startTimer(seconds) {
    const timerEl = document.getElementById('timer-display');
    const timerText = document.getElementById('timer-text');
    timerEl.style.display = '';
    timerEl.classList.remove('timer-warning');
    this.fillState.timeRemaining = seconds;

    if (this.fillState.timer) clearInterval(this.fillState.timer);

    const updateTimer = () => {
      const remaining = this.fillState.timeRemaining;
      if (remaining <= 0) {
        clearInterval(this.fillState.timer);
        this.showToast('时间到！问卷已自动提交', 'info');
        this.submitSurvey(true);
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerText.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      if (remaining <= 60) {
        timerEl.classList.add('timer-warning');
      }

      this.fillState.timeRemaining--;
      this.saveProgress();
    };

    updateTimer();
    this.fillState.timer = setInterval(updateTimer, 1000);
  },

  getCurrentQuestionIndex() {
    return this.fillState.questionFlow[this.fillState.currentStep];
  },

  getCurrentQuestion() {
    const idx = this.getCurrentQuestionIndex();
    if (idx === '__end' || idx === undefined) return null;
    return this.fillState.survey.questions[idx];
  },

  showCurrentQuestion() {
    const question = this.getCurrentQuestion();
    if (!question) {
      this.showSubmitScreen();
      return;
    }

    const totalQuestions = this.fillState.survey.questions.length;
    const progress = ((this.fillState.currentStep + 1) / totalQuestions * 100).toFixed(0);

    document.getElementById('fill-progress').style.width = progress + '%';
    document.getElementById('fill-progress-text').textContent =
      `进度: ${this.fillState.currentStep + 1} / ${totalQuestions}`;

    const content = document.getElementById('fill-content');
    content.innerHTML = this.renderFillQuestion(question);

    // Show/hide navigation
    document.getElementById('fill-prev-btn').style.display =
      this.fillState.currentStep > 0 ? '' : 'none';

    // Determine if this is the last question
    const isLast = this.isLastQuestion(question);
    document.getElementById('fill-next-btn').style.display = isLast ? 'none' : '';
    document.getElementById('fill-submit-btn').style.display = isLast ? '' : 'none';
  },

  isLastQuestion(question) {
    if (!question) return true;
    const hasBranching = Object.keys(question.branching).length > 0;
    if (hasBranching) {
      // Could branch to end, so we'll determine dynamically
      // But for the UI, we check if all possible branches lead to end or if there's no next
      return false; // We'll show submit on the last reachable question
    }
    const currentIdx = this.getCurrentQuestionIndex();
    return currentIdx >= this.fillState.survey.questions.length - 1;
  },

  renderFillQuestion(question) {
    const required = question.required ? '<span class="required-star">*</span>' : '';
    const desc = question.description
      ? `<div class="fill-question-desc">${this.esc(question.description)}</div>`
      : '';

    let body = '';

    switch (question.type) {
      case 'single':
        body = `<div class="fill-options">
          ${question.options.map(o => {
            const selected = this.fillState.answers[question.id] === o.id;
            return `
              <label class="fill-option ${selected ? 'selected' : ''}">
                <input type="radio" name="fill_${question.id}" value="${o.id}"
                       ${selected ? 'checked' : ''}
                       onchange="App.selectSingle('${question.id}','${o.id}', this)">
                <span class="fill-option-label">${this.esc(o.text)}</span>
              </label>`;
          }).join('')}
        </div>`;
        break;

      case 'multiple':
        const currentAnswers = this.fillState.answers[question.id] || [];
        body = `<div class="fill-options">
          ${question.options.map(o => {
            const selected = currentAnswers.includes(o.id);
            return `
              <label class="fill-option ${selected ? 'selected' : ''}">
                <input type="checkbox" value="${o.id}"
                       ${selected ? 'checked' : ''}
                       onchange="App.toggleMultiple('${question.id}','${o.id}', this)">
                <span class="fill-option-label">${this.esc(o.text)}</span>
              </label>`;
          }).join('')}
        </div>`;
        break;

      case 'text':
        body = `<textarea class="fill-textarea" placeholder="请输入您的回答..."
                   oninput="App.updateText('${question.id}', this.value)">${this.esc(this.fillState.answers[question.id] || '')}</textarea>`;
        break;

      case 'slider':
        const val = this.fillState.answers[question.id] !== undefined
          ? this.fillState.answers[question.id]
          : question.defaultValue;
        body = `<div class="fill-slider-container">
          <div class="fill-slider-value" id="slider-val-${question.id}">${val}</div>
          <input type="range" class="fill-slider"
                 min="${question.min}" max="${question.max}" step="${question.step}" value="${val}"
                 oninput="App.updateSlider('${question.id}', this.value, 'slider-val-${question.id}')">
          <div class="fill-slider-labels">
            <span>${question.min}</span>
            <span>${question.max}</span>
          </div>
        </div>`;
        // Initialize answer
        if (this.fillState.answers[question.id] === undefined) {
          this.fillState.answers[question.id] = val;
        }
        break;
    }

    return `
      <div class="fill-question">
        <div class="fill-question-title">${this.esc(question.title)}${required}</div>
        ${desc}
        ${body}
      </div>`;
  },

  selectSingle(questionId, optionId, radio) {
    this.fillState.answers[questionId] = optionId;
    // Update visual
    radio.closest('.fill-options').querySelectorAll('.fill-option').forEach(el => {
      el.classList.remove('selected');
    });
    radio.closest('.fill-option').classList.add('selected');
    this.saveProgress();
  },

  toggleMultiple(questionId, optionId, checkbox) {
    if (!this.fillState.answers[questionId]) {
      this.fillState.answers[questionId] = [];
    }
    const arr = this.fillState.answers[questionId];
    if (checkbox.checked) {
      if (!arr.includes(optionId)) arr.push(optionId);
    } else {
      const idx = arr.indexOf(optionId);
      if (idx >= 0) arr.splice(idx, 1);
    }
    checkbox.closest('.fill-option').classList.toggle('selected', checkbox.checked);
    this.saveProgress();
  },

  updateText(questionId, value) {
    this.fillState.answers[questionId] = value;
    this.saveProgress();
  },

  updateSlider(questionId, value, displayId) {
    this.fillState.answers[questionId] = Number(value);
    document.getElementById(displayId).textContent = value;
    this.saveProgress();
  },

  getNextQuestionIndex(currentQuestion) {
    const hasBranching = Object.keys(currentQuestion.branching).length > 0;

    if (hasBranching) {
      let nextTarget = null;

      if (currentQuestion.type === 'single') {
        const answer = this.fillState.answers[currentQuestion.id];
        nextTarget = currentQuestion.branching[answer];
      }

      if (!nextTarget) {
        nextTarget = currentQuestion.branching._default;
      }

      if (nextTarget === '__end') {
        return '__end';
      }

      if (nextTarget) {
        const idx = this.fillState.survey.questions.findIndex(q => q.id === nextTarget);
        if (idx >= 0) return idx;
      }
    }

    // Default: next in sequence
    const currentIdx = this.getCurrentQuestionIndex();
    if (currentIdx < this.fillState.survey.questions.length - 1) {
      return currentIdx + 1;
    }

    return '__end';
  },

  nextQuestion() {
    const question = this.getCurrentQuestion();
    if (!question) return;

    // Validate required
    if (question.required) {
      const answer = this.fillState.answers[question.id];
      if (answer === undefined || answer === null || answer === '' ||
          (Array.isArray(answer) && answer.length === 0)) {
        this.showToast('此题为必填项', 'error');
        return;
      }
    }

    const nextIdx = this.getNextQuestionIndex(question);

    if (nextIdx === '__end' || nextIdx === undefined) {
      this.showSubmitScreen();
      return;
    }

    // Check if we've already been to the next step (from going back)
    if (this.fillState.currentStep + 1 < this.fillState.questionFlow.length) {
      this.fillState.currentStep++;
    } else {
      this.fillState.questionFlow.push(nextIdx);
      this.fillState.currentStep++;
    }

    this.showCurrentQuestion();
    this.saveProgress();
  },

  prevQuestion() {
    if (this.fillState.currentStep > 0) {
      this.fillState.currentStep--;
      this.showCurrentQuestion();
    }
  },

  showSubmitScreen() {
    const totalQuestions = this.fillState.survey.questions.length;
    document.getElementById('fill-progress').style.width = '100%';
    document.getElementById('fill-progress-text').textContent = '已完成所有问题';

    const content = document.getElementById('fill-content');
    content.innerHTML = `
      <div class="fill-question" style="text-align:center;">
        <div style="font-size:3rem;margin-bottom:12px;">✅</div>
        <div class="fill-question-title" style="text-align:center;">问卷填写完毕</div>
        <div class="fill-question-desc" style="text-align:center;">请检查您的回答并点击下方按钮提交</div>
      </div>`;

    document.getElementById('fill-prev-btn').style.display =
      this.fillState.currentStep > 0 ? '' : 'none';
    document.getElementById('fill-next-btn').style.display = 'none';
    document.getElementById('fill-submit-btn').style.display = '';
  },

  submitSurvey(autoSubmit = false) {
    // Validate all required questions that were actually shown
    const shownQuestionIds = this.fillState.questionFlow
      .filter(idx => idx !== '__end' && idx !== undefined)
      .map(idx => this.fillState.survey.questions[idx]?.id)
      .filter(Boolean);

    for (const qId of shownQuestionIds) {
      const question = this.fillState.survey.questions.find(q => q.id === qId);
      if (question && question.required) {
        const answer = this.fillState.answers[qId];
        if (answer === undefined || answer === null || answer === '' ||
            (Array.isArray(answer) && answer.length === 0)) {
          this.showToast('还有必填题目未完成', 'error');
          return;
        }
      }
    }

    const response = {
      respondentId: this.fillState.respondentId,
      answers: { ...this.fillState.answers },
      startedAt: this.fillState.startTime,
      completedAt: Date.now(),
      isPartial: false,
    };

    const responses = this.getResponses(this.fillState.survey.id);
    responses.push(response);
    this.saveResponses(this.fillState.survey.id, responses);

    this.clearProgress(this.fillState.survey.id);

    if (this.fillState.timer) {
      clearInterval(this.fillState.timer);
      this.fillState.timer = null;
    }

    document.getElementById('timer-display').style.display = 'none';

    const content = document.getElementById('fill-content');
    content.innerHTML = `
      <div class="fill-question" style="text-align:center;">
        <div style="font-size:4rem;margin-bottom:16px;">🎉</div>
        <div class="fill-question-title" style="text-align:center;">感谢您的参与！</div>
        <div class="fill-question-desc" style="text-align:center;">您的问卷已成功提交。</div>
        <a href="#/" class="btn btn-primary" style="margin-top:20px;">返回首页</a>
      </div>`;

    document.getElementById('fill-prev-btn').style.display = 'none';
    document.getElementById('fill-next-btn').style.display = 'none';
    document.getElementById('fill-submit-btn').style.display = 'none';
    document.getElementById('fill-progress-text').textContent = '';

    this.showToast(autoSubmit ? '问卷已自动提交' : '问卷已成功提交', 'success');
  },

  // ---- Progress saving ----
  saveProgress() {
    if (!this.fillState.survey) return;
    const key = 'progress_' + this.fillState.survey.id;
    localStorage.setItem(key, JSON.stringify({
      survey: this.fillState.survey,
      answers: this.fillState.answers,
      currentStep: this.fillState.currentStep,
      questionFlow: this.fillState.questionFlow,
      timeRemaining: this.fillState.timeRemaining,
      respondentId: this.fillState.respondentId,
      startTime: this.fillState.startTime,
    }));
  },

  loadProgress(surveyId) {
    try {
      const data = localStorage.getItem('progress_' + surveyId);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  clearProgress(surveyId) {
    localStorage.removeItem('progress_' + surveyId);
  },

  // ============================================================
  // Results View
  // ============================================================
  initResults(surveyId) {
    this.loadSurveys();
    const survey = this.getSurvey(surveyId);
    if (!survey) {
      this.showToast('问卷不存在', 'error');
      location.hash = '#/';
      return;
    }

    // Destroy old charts
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Store current survey for reference
    this._resultsSurveyId = surveyId;

    document.getElementById('results-title').textContent = survey.title;
    const responses = this.getResponses(surveyId);
    document.getElementById('results-summary').textContent =
      `共收到 ${responses.length} 份答卷 · ${survey.questions.length} 道题目`;

    const container = document.getElementById('results-charts');

    if (responses.length === 0) {
      container.innerHTML = `
        <div class="results-empty">
          <p>还没有答卷数据</p>
          <a href="#/fill/${surveyId}" class="btn btn-primary">去填写问卷</a>
        </div>`;
      return;
    }

    container.innerHTML = survey.questions.map((q, i) => `
      <div class="result-card">
        <h3>${i + 1}. ${this.esc(q.title)}</h3>
        <div class="result-type">${this.typeLabels[q.type]}</div>
        <div class="result-chart-wrap">
          <canvas id="chart-${q.id}"></canvas>
        </div>
      </div>
    `).join('');

    // Render charts after DOM is updated
    requestAnimationFrame(() => {
      survey.questions.forEach(q => {
        this.renderChart(q, responses);
      });
    });
  },

  renderChart(question, responses) {
    const canvas = document.getElementById('chart-' + question.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const answers = responses
      .map(r => r.answers[question.id])
      .filter(a => a !== undefined && a !== null && a !== '' &&
                  !(Array.isArray(a) && a.length === 0));

    if (answers.length === 0) {
      canvas.parentElement.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px 0;">暂无数据</p>';
      return;
    }

    let config;

    switch (question.type) {
      case 'single': {
        const counts = {};
        question.options.forEach(o => { counts[o.text] = 0; });
        answers.forEach(a => {
          const opt = question.options.find(o => o.id === a);
          if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
        });
        config = {
          type: 'bar',
          data: {
            labels: Object.keys(counts),
            datasets: [{
              label: '回答数',
              data: Object.values(counts),
              backgroundColor: this.getColors(Object.keys(counts).length),
              borderRadius: 6,
              maxBarThickness: 60,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        };
        break;
      }

      case 'multiple': {
        const counts = {};
        question.options.forEach(o => { counts[o.text] = 0; });
        answers.forEach(a => {
          if (Array.isArray(a)) {
            a.forEach(id => {
              const opt = question.options.find(o => o.id === id);
              if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
            });
          }
        });
        config = {
          type: 'pie',
          data: {
            labels: Object.keys(counts),
            datasets: [{
              data: Object.values(counts),
              backgroundColor: this.getColors(Object.keys(counts).length),
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' },
            },
          },
        };
        break;
      }

      case 'text': {
        // Show text answers as a list instead of chart
        const list = answers.map(a => `<div class="result-text-item">${this.esc(String(a))}</div>`).join('');
        canvas.parentElement.innerHTML = `<div class="result-text-list">${list}</div>`;
        return;
      }

      case 'slider': {
        const values = answers.map(Number).filter(n => !isNaN(n));
        if (values.length === 0) return;

        // Create histogram
        const min = question.min;
        const max = question.max;
        const bucketCount = Math.min(10, Math.ceil((max - min) / question.step));
        const bucketSize = (max - min) / bucketCount;
        const buckets = new Array(bucketCount).fill(0);
        const labels = [];

        for (let i = 0; i < bucketCount; i++) {
          const lo = min + i * bucketSize;
          const hi = lo + bucketSize;
          labels.push(Math.round(lo));
        }

        values.forEach(v => {
          let idx = Math.floor((v - min) / bucketSize);
          if (idx >= bucketCount) idx = bucketCount - 1;
          if (idx < 0) idx = 0;
          buckets[idx]++;
        });

        config = {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: '回答数',
              data: buckets,
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
              borderRadius: 4,
              maxBarThickness: 50,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
              x: { title: { display: true, text: '数值分布' } },
            },
          },
        };
        break;
      }
    }

    if (config) {
      const chart = new Chart(ctx, config);
      this.charts.push(chart);
    }
  },

  getColors(count) {
    const palette = [
      '#4F46E5', '#818CF8', '#06B6D4', '#10B981', '#F59E0B',
      '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316',
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  },

  copyShareLink() {
    const surveyId = this._resultsSurveyId;
    const survey = this.getSurvey(surveyId);
    if (!survey) return;

    const encoded = encodeURIComponent(this.encodeSurvey(survey));
    const shareUrl = location.origin + location.pathname + '#/s/' + encoded;

    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showToast('分享链接已复制到剪贴板', 'success');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.showToast('分享链接已复制到剪贴板', 'success');
    });
  },

  deleteResponses() {
    this.showConfirm('清除数据', '确定要清除所有答卷数据？此操作无法撤销。', () => {
      localStorage.removeItem('responses_' + this._resultsSurveyId);
      this.showToast('数据已清除', 'success');
      this.initResults(this._resultsSurveyId);
    });
  },
};

// ============================================================
// Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
