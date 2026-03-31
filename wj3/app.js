(function() {
  'use strict';

  const STORAGE_KEY = 'quiz_builder_data';
  const RESPONSES_KEY = 'quiz_responses';
  const PROGRESS_KEY = 'quiz_progress';

  const COLORS = [
    '#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#2563eb'
  ];

  const TYPE_LABELS = {
    single: '单选题',
    multiple: '多选题',
    text: '文本题',
    slider: '滑块题'
  };

  let state = {
    currentView: 'builder',
    quiz: {
      title: '',
      description: '',
      hasTimer: false,
      timerMinutes: 30,
      questions: []
    },
    fillerState: {
      currentIndex: 0,
      answers: {},
      visibleQuestions: [],
      timerRemaining: 0,
      timerInterval: null,
      submitted: false
    },
    responses: [],
    nextQuestionId: 1,
    draggedQuestion: null
  };

  function init() {
    loadState();
    setupNavigation();
    setupBuilder();
    setupFiller();
    setupPreview();
    setupModal();
    handleUrlHash();
    renderBuilder();
    window.addEventListener('hashchange', handleUrlHash);
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.quiz = parsed.quiz || state.quiz;
        state.nextQuestionId = parsed.nextQuestionId || 1;
      }
      const responses = localStorage.getItem(RESPONSES_KEY);
      if (responses) {
        state.responses = JSON.parse(responses);
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quiz: state.quiz,
        nextQuestionId: state.nextQuestionId
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function saveResponses() {
    try {
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(state.responses));
    } catch (e) {
      console.error('Failed to save responses:', e);
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        answers: state.fillerState.answers,
        currentIndex: state.fillerState.currentIndex,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    return null;
  }

  function clearProgress() {
    localStorage.removeItem(PROGRESS_KEY);
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => {
      v.style.display = 'none';
    });
    document.getElementById(`${view}-view`).style.display = '';

    if (view === 'filler') {
      initFiller();
    } else if (view === 'preview') {
      renderPreview();
    }

    if (view !== 'filler' && state.fillerState.timerInterval) {
      clearInterval(state.fillerState.timerInterval);
      state.fillerState.timerInterval = null;
    }
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  function generateId() {
    return state.nextQuestionId++;
  }

  function createQuestion(type) {
    const id = generateId();
    const base = {
      id,
      type,
      title: `问题 ${id}`,
      required: true
    };

    switch (type) {
      case 'single':
      case 'multiple':
        base.options = ['选项 1', '选项 2', '选项 3'];
        base.branches = [];
        break;
      case 'text':
        base.placeholder = '请输入您的回答...';
        base.maxLength = 500;
        break;
      case 'slider':
        base.min = 0;
        base.max = 100;
        base.step = 1;
        base.defaultValue = 50;
        base.leftLabel = '0';
        base.rightLabel = '100';
        break;
    }

    return base;
  }

  function setupBuilder() {
    document.querySelectorAll('.q-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const question = createQuestion(type);
        state.quiz.questions.push(question);
        saveState();
        renderBuilder();
        showToast('已添加问题', 'success');
      });
    });

    document.getElementById('quiz-title').addEventListener('input', (e) => {
      state.quiz.title = e.target.value;
      saveState();
    });

    document.getElementById('quiz-description').addEventListener('input', (e) => {
      state.quiz.description = e.target.value;
      saveState();
    });

    document.getElementById('quiz-timer-toggle').addEventListener('change', (e) => {
      state.quiz.hasTimer = e.target.checked;
      document.getElementById('timer-setting').style.display = e.target.checked ? '' : 'none';
      saveState();
    });

    document.getElementById('quiz-timer').addEventListener('input', (e) => {
      state.quiz.timerMinutes = parseInt(e.target.value) || 30;
      saveState();
    });

    document.getElementById('save-quiz-btn').addEventListener('click', () => {
      saveState();
      showToast('问卷已保存', 'success');
    });

    document.getElementById('share-quiz-btn').addEventListener('click', generateShareLink);
    document.getElementById('clear-quiz-btn').addEventListener('click', () => {
      if (confirm('确定要清空问卷吗？此操作不可撤销。')) {
        state.quiz.questions = [];
        state.quiz.title = '';
        state.quiz.description = '';
        state.quiz.hasTimer = false;
        state.quiz.timerMinutes = 30;
        state.nextQuestionId = 1;
        saveState();
        renderBuilder();
        showToast('问卷已清空');
      }
    });
  }

  function renderBuilder() {
    const titleInput = document.getElementById('quiz-title');
    const descInput = document.getElementById('quiz-description');
    const timerToggle = document.getElementById('quiz-timer-toggle');
    const timerInput = document.getElementById('quiz-timer');
    const timerSetting = document.getElementById('timer-setting');

    titleInput.value = state.quiz.title;
    descInput.value = state.quiz.description;
    timerToggle.checked = state.quiz.hasTimer;
    timerInput.value = state.quiz.timerMinutes;
    timerSetting.style.display = state.quiz.hasTimer ? '' : 'none';

    const container = document.getElementById('questions-list');

    if (state.quiz.questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>还没有问题</h3>
          <p>从左侧选择问题类型开始创建问卷</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.quiz.questions.map((q, index) => renderQuestionCard(q, index)).join('');

    container.querySelectorAll('.question-card').forEach((card, index) => {
      card.addEventListener('dragstart', (e) => {
        state.draggedQuestion = index;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        state.draggedQuestion = null;
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = state.draggedQuestion;
        const to = index;
        if (from !== null && from !== to) {
          const [moved] = state.quiz.questions.splice(from, 1);
          state.quiz.questions.splice(to, 0, moved);
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.option-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const oIdx = parseInt(btn.dataset.optionIndex);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q && q.options.length > 1) {
          q.options.splice(oIdx, 1);
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.add-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          q.options.push(`选项 ${q.options.length + 1}`);
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.option-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const qId = parseInt(input.dataset.questionId);
        const oIdx = parseInt(input.dataset.optionIndex);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          q.options[oIdx] = e.target.value;
          saveState();
        }
      });
    });

    container.querySelectorAll('.question-title-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const qId = parseInt(input.dataset.questionId);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          q.title = e.target.value;
          saveState();
        }
      });
    });

    container.querySelectorAll('.delete-question-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        state.quiz.questions = state.quiz.questions.filter(q => q.id !== qId);
        saveState();
        renderBuilder();
        showToast('已删除问题');
      });
    });

    container.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const idx = state.quiz.questions.findIndex(q => q.id === qId);
        if (idx > 0) {
          [state.quiz.questions[idx - 1], state.quiz.questions[idx]] =
          [state.quiz.questions[idx], state.quiz.questions[idx - 1]];
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const idx = state.quiz.questions.findIndex(q => q.id === qId);
        if (idx < state.quiz.questions.length - 1) {
          [state.quiz.questions[idx], state.quiz.questions[idx + 1]] =
          [state.quiz.questions[idx + 1], state.quiz.questions[idx]];
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.branching-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const section = toggle.closest('.branching-section');
        const rules = section.querySelector('.branch-rules');
        const isHidden = rules.style.display === 'none';
        rules.style.display = isHidden ? '' : 'none';
        toggle.querySelector('.branch-arrow').textContent = isHidden ? '▼' : '▶';
      });
    });

    container.querySelectorAll('.add-branch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q && q.type !== 'text' && q.type !== 'slider') {
          q.branches = q.branches || [];
          q.branches.push({ option: q.options[0], goTo: 'next' });
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.branch-rule select').forEach(select => {
      select.addEventListener('change', (e) => {
        const qId = parseInt(select.dataset.questionId);
        const ruleIdx = parseInt(select.dataset.ruleIndex);
        const field = select.dataset.field;
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q && q.branches && q.branches[ruleIdx]) {
          q.branches[ruleIdx][field] = e.target.value;
          saveState();
        }
      });
    });

    container.querySelectorAll('.remove-branch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = parseInt(btn.dataset.questionId);
        const ruleIdx = parseInt(btn.dataset.ruleIndex);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q && q.branches) {
          q.branches.splice(ruleIdx, 1);
          saveState();
          renderBuilder();
        }
      });
    });

    container.querySelectorAll('.slider-settings input').forEach(input => {
      input.addEventListener('input', (e) => {
        const qId = parseInt(input.dataset.questionId);
        const field = input.dataset.field;
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          const val = field === 'leftLabel' || field === 'rightLabel' ? e.target.value : parseFloat(e.target.value) || 0;
          q[field] = val;
          saveState();
        }
      });
    });

    container.querySelectorAll('.text-settings input, .text-settings textarea').forEach(input => {
      input.addEventListener('input', (e) => {
        const qId = parseInt(input.dataset.questionId);
        const field = input.dataset.field;
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          q[field] = field === 'maxLength' ? parseInt(e.target.value) || 500 : e.target.value;
          saveState();
        }
      });
    });

    container.querySelectorAll('.required-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const qId = parseInt(toggle.dataset.questionId);
        const q = state.quiz.questions.find(q => q.id === qId);
        if (q) {
          q.required = e.target.checked;
          saveState();
        }
      });
    });
  }

  function renderQuestionCard(q, index) {
    const isFirst = index === 0;
    const isLast = index === state.quiz.questions.length - 1;
    const hasBranching = q.type === 'single' || q.type === 'multiple';

    let optionsHtml = '';
    if (q.type === 'single' || q.type === 'multiple') {
      optionsHtml = `
        <div class="options-editor">
          ${q.options.map((opt, i) => `
            <div class="option-row">
              <span class="option-marker">${q.type === 'single' ? '○' : '☐'}</span>
              <input type="text" class="option-input" value="${escapeHtml(opt)}" data-question-id="${q.id}" data-option-index="${i}" placeholder="选项内容">
              <button class="option-remove-btn" data-question-id="${q.id}" data-option-index="${i}" title="删除选项">×</button>
            </div>
          `).join('')}
          <button class="add-option-btn" data-question-id="${q.id}">+ 添加选项</button>
        </div>
      `;
    } else if (q.type === 'slider') {
      optionsHtml = `
        <div class="slider-settings">
          <div class="slider-setting-group">
            <label>最小值</label>
            <input type="number" data-question-id="${q.id}" data-field="min" value="${q.min}" />
          </div>
          <div class="slider-setting-group">
            <label>最大值</label>
            <input type="number" data-question-id="${q.id}" data-field="max" value="${q.max}" />
          </div>
          <div class="slider-setting-group">
            <label>步长</label>
            <input type="number" data-question-id="${q.id}" data-field="step" value="${q.step}" min="1" />
          </div>
          <div class="slider-setting-group">
            <label>左标签</label>
            <input type="text" data-question-id="${q.id}" data-field="leftLabel" value="${escapeHtml(q.leftLabel || '')}" />
          </div>
          <div class="slider-setting-group">
            <label>右标签</label>
            <input type="text" data-question-id="${q.id}" data-field="rightLabel" value="${escapeHtml(q.rightLabel || '')}" />
          </div>
          <div class="slider-setting-group">
            <label>默认值</label>
            <input type="number" data-question-id="${q.id}" data-field="defaultValue" value="${q.defaultValue}" />
          </div>
        </div>
      `;
    } else if (q.type === 'text') {
      optionsHtml = `
        <div class="text-settings">
          <div class="slider-settings">
            <div class="slider-setting-group">
              <label>占位文本</label>
              <input type="text" data-question-id="${q.id}" data-field="placeholder" value="${escapeHtml(q.placeholder || '')}" />
            </div>
            <div class="slider-setting-group">
              <label>最大长度</label>
              <input type="number" data-question-id="${q.id}" data-field="maxLength" value="${q.maxLength || 500}" />
            </div>
          </div>
        </div>
      `;
    }

    let branchingHtml = '';
    if (hasBranching) {
      q.branches = q.branches || [];
      const questionIds = state.quiz.questions.map(q => ({ id: q.id, title: q.title }));
      branchingHtml = `
        <div class="branching-section">
          <div class="branching-toggle">
            <span class="branch-arrow">▶</span>
            <span>分支逻辑 (${q.branches.length})</span>
          </div>
          <div class="branch-rules" style="display: none;">
            ${q.branches.map((b, i) => `
              <div class="branch-rule">
                <span>如果选择</span>
                <select data-question-id="${q.id}" data-rule-index="${i}" data-field="option">
                  ${q.options.map(opt => `<option value="${escapeHtml(opt)}" ${b.option === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
                </select>
                <span>跳转到</span>
                <select data-question-id="${q.id}" data-rule-index="${i}" data-field="goTo">
                  <option value="next" ${b.goTo === 'next' ? 'selected' : ''}>下一题</option>
                  ${questionIds.map(qi => `<option value="${qi.id}" ${b.goTo == qi.id ? 'selected' : ''}>${escapeHtml(qi.title)}</option>`).join('')}
                  <option value="end" ${b.goTo === 'end' ? 'selected' : ''}>结束问卷</option>
                </select>
                <button class="option-remove-btn remove-branch-btn" data-question-id="${q.id}" data-rule-index="${i}" title="删除规则">×</button>
              </div>
            `).join('')}
            <button class="add-branch-btn" data-question-id="${q.id}">+ 添加分支规则</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="question-card fade-in" draggable="true" data-question-id="${q.id}">
        <div class="question-header">
          <span class="question-number">${index + 1}</span>
          <input type="text" class="question-title-input" value="${escapeHtml(q.title)}" data-question-id="${q.id}" placeholder="问题标题">
          <div class="question-actions">
            <button class="question-action-btn move-up-btn" data-question-id="${q.id}" title="上移" ${isFirst ? 'disabled' : ''}>↑</button>
            <button class="question-action-btn move-down-btn" data-question-id="${q.id}" title="下移" ${isLast ? 'disabled' : ''}>↓</button>
            <label class="question-action-btn" title="必填">
              <input type="checkbox" class="required-toggle" data-question-id="${q.id}" ${q.required ? 'checked' : ''} style="display:none;">
              <span style="${q.required ? 'color: var(--danger)' : ''}">*</span>
            </label>
            <button class="question-action-btn delete delete-question-btn" data-question-id="${q.id}" title="删除">🗑</button>
          </div>
        </div>
        <span class="question-type-badge">${TYPE_LABELS[q.type]}</span>
        ${optionsHtml}
        ${branchingHtml}
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setupFiller() {
    document.getElementById('prev-btn').addEventListener('click', () => {
      const fs = state.fillerState;
      if (fs.currentIndex > 0) {
        fs.currentIndex--;
        renderFillerQuestion();
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const fs = state.fillerState;
      const currentQ = fs.visibleQuestions[fs.currentIndex];
      if (!currentQ) return;

      if (currentQ.required && !isAnswered(currentQ)) {
        showToast('请回答此问题', 'error');
        return;
      }

      saveProgress();

      const nextIdx = getNextQuestionIndex(currentQ.id);
      if (nextIdx === 'end') {
        submitQuiz();
      } else if (nextIdx !== null) {
        fs.currentIndex = nextIdx;
        renderFillerQuestion();
      } else {
        if (fs.currentIndex < fs.visibleQuestions.length - 1) {
          fs.currentIndex++;
          renderFillerQuestion();
        } else {
          submitQuiz();
        }
      }
    });

    document.getElementById('submit-btn').addEventListener('click', submitQuiz);
  }

  function isAnswered(question) {
    const answer = state.fillerState.answers[question.id];
    if (question.type === 'single' || question.type === 'multiple') {
      return answer && (Array.isArray(answer) ? answer.length > 0 : answer !== '');
    } else if (question.type === 'text') {
      return answer && answer.trim() !== '';
    } else if (question.type === 'slider') {
      return answer !== undefined && answer !== null;
    }
    return false;
  }

  function getNextQuestionIndex(currentId) {
    const q = state.quiz.questions.find(q => q.id === currentId);
    if (!q || !q.branches || q.branches.length === 0) return null;

    const answer = state.fillerState.answers[currentId];
    if (!answer) return null;

    const answers = Array.isArray(answer) ? answer : [answer];

    for (const branch of q.branches) {
      if (answers.includes(branch.option)) {
        if (branch.goTo === 'end') return 'end';
        if (branch.goTo === 'next') return null;
        const targetIdx = state.fillerState.visibleQuestions.findIndex(vq => vq.id == branch.goTo);
        return targetIdx >= 0 ? targetIdx : null;
      }
    }
    return null;
  }

  function initFiller() {
    if (state.quiz.questions.length === 0) {
      showToast('请先创建问卷', 'error');
      switchView('builder');
      return;
    }

    const fs = state.fillerState;
    fs.answers = {};
    fs.currentIndex = 0;
    fs.submitted = false;

    const progress = loadProgress();
    if (progress && progress.answers) {
      const age = Date.now() - progress.timestamp;
      if (age < 24 * 60 * 60 * 1000) {
        fs.answers = progress.answers;
        fs.currentIndex = progress.currentIndex || 0;
        if (confirm('检测到上次未完成的填写，是否继续？')) {
          fs.currentIndex = progress.currentIndex || 0;
        } else {
          fs.answers = {};
          fs.currentIndex = 0;
          clearProgress();
        }
      }
    }

    fs.visibleQuestions = [...state.quiz.questions];

    document.getElementById('filler-title').textContent = state.quiz.title || '未命名问卷';
    document.getElementById('filler-description').textContent = state.quiz.description || '';

    const timerEl = document.getElementById('filler-timer');
    if (state.quiz.hasTimer) {
      timerEl.style.display = '';
      fs.timerRemaining = state.quiz.timerMinutes * 60;
      startTimer();
    } else {
      timerEl.style.display = 'none';
      if (fs.timerInterval) {
        clearInterval(fs.timerInterval);
        fs.timerInterval = null;
      }
    }

    renderFillerQuestion();
  }

  function startTimer() {
    const fs = state.fillerState;
    updateTimerDisplay();

    if (fs.timerInterval) clearInterval(fs.timerInterval);

    fs.timerInterval = setInterval(() => {
      fs.timerRemaining--;
      updateTimerDisplay();

      if (fs.timerRemaining <= 60) {
        document.getElementById('filler-timer').classList.add('warning');
      }

      if (fs.timerRemaining <= 0) {
        clearInterval(fs.timerInterval);
        showToast('时间到！问卷已自动提交', 'error');
        submitQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const fs = state.fillerState;
    const mins = Math.floor(fs.timerRemaining / 60);
    const secs = fs.timerRemaining % 60;
    document.getElementById('timer-display').textContent =
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderFillerQuestion() {
    const fs = state.fillerState;
    const total = fs.visibleQuestions.length;
    const current = fs.currentIndex;

    document.getElementById('progress-fill').style.width = `${((current + 1) / total) * 100}%`;
    document.getElementById('progress-text').textContent = `${current + 1}/${total}`;

    const q = fs.visibleQuestions[current];
    if (!q) return;

    const form = document.getElementById('filler-form');
    const answer = fs.answers[q.id];

    let inputHtml = '';
    switch (q.type) {
      case 'single':
        inputHtml = `
          <div class="filler-options">
            ${q.options.map(opt => `
              <label class="filler-option ${answer === opt ? 'selected' : ''}">
                <input type="radio" name="q-${q.id}" value="${escapeHtml(opt)}" ${answer === opt ? 'checked' : ''}>
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;
      case 'multiple':
        const selectedArr = Array.isArray(answer) ? answer : [];
        inputHtml = `
          <div class="filler-options">
            ${q.options.map(opt => `
              <label class="filler-option ${selectedArr.includes(opt) ? 'selected' : ''}">
                <input type="checkbox" name="q-${q.id}" value="${escapeHtml(opt)}" ${selectedArr.includes(opt) ? 'checked' : ''}>
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;
      case 'text':
        inputHtml = `
          <textarea class="filler-text-input" data-question-id="${q.id}" placeholder="${escapeHtml(q.placeholder || '')}" maxlength="${q.maxLength || 500}">${answer ? escapeHtml(answer) : ''}</textarea>
          <div style="text-align: right; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
            <span class="char-count">${(answer || '').length}</span>/${q.maxLength || 500}
          </div>
        `;
        break;
      case 'slider':
        const val = answer !== undefined ? answer : q.defaultValue;
        inputHtml = `
          <div class="filler-slider-container">
            <input type="range" class="filler-slider" data-question-id="${q.id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${val}">
            <div class="slider-labels">
              <span>${escapeHtml(q.leftLabel || String(q.min))}</span>
              <span>${escapeHtml(q.rightLabel || String(q.max))}</span>
            </div>
            <div class="slider-value">${val}</div>
          </div>
        `;
        break;
    }

    form.innerHTML = `
      <div class="filler-question fade-in">
        <div class="filler-question-title">
          ${escapeHtml(q.title)}
          ${q.required ? '<span class="required">*</span>' : ''}
        </div>
        ${inputHtml}
      </div>
    `;

    form.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        fs.answers[q.id] = e.target.value;
        form.querySelectorAll('.filler-option').forEach(opt => opt.classList.remove('selected'));
        e.target.closest('.filler-option').classList.add('selected');
        saveProgress();
      });
    });

    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checked = form.querySelectorAll(`input[name="q-${q.id}"]:checked`);
        fs.answers[q.id] = Array.from(checked).map(c => c.value);
        form.querySelectorAll('.filler-option').forEach(opt => {
          const cb = opt.querySelector('input[type="checkbox"]');
          opt.classList.toggle('selected', cb && cb.checked);
        });
        saveProgress();
      });
    });

    form.querySelectorAll('.filler-text-input').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        fs.answers[q.id] = e.target.value;
        const count = e.target.closest('.filler-question').querySelector('.char-count');
        if (count) count.textContent = e.target.value.length;
        saveProgress();
      });
    });

    form.querySelectorAll('.filler-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        fs.answers[q.id] = parseFloat(e.target.value);
        const display = e.target.closest('.filler-slider-container').querySelector('.slider-value');
        if (display) display.textContent = e.target.value;
        saveProgress();
      });
    });

    document.getElementById('prev-btn').style.display = current > 0 ? '' : 'none';

    const nextJump = getNextQuestionIndex(q.id);
    const isLastQuestion = current >= total - 1;

    document.getElementById('next-btn').style.display = (isLastQuestion || nextJump === 'end') ? 'none' : '';
    document.getElementById('submit-btn').style.display = (isLastQuestion || nextJump === 'end') ? '' : 'none';
  }

  function submitQuiz() {
    const fs = state.fillerState;
    if (fs.submitted) return;

    const unanswered = fs.visibleQuestions.filter(q => q.required && !isAnswered(q));
    if (unanswered.length > 0) {
      showToast(`还有 ${unanswered.length} 个必填问题未回答`, 'error');
      const firstUnanswered = fs.visibleQuestions.findIndex(q => q.required && !isAnswered(q));
      if (firstUnanswered >= 0) {
        fs.currentIndex = firstUnanswered;
        renderFillerQuestion();
      }
      return;
    }

    fs.submitted = true;
    if (fs.timerInterval) {
      clearInterval(fs.timerInterval);
      fs.timerInterval = null;
    }

    const response = {
      id: Date.now(),
      answers: { ...fs.answers },
      timestamp: new Date().toISOString(),
      timeSpent: state.quiz.hasTimer ? (state.quiz.timerMinutes * 60 - fs.timerRemaining) : null
    };

    state.responses.push(response);
    saveResponses();
    clearProgress();

    showToast('问卷提交成功！', 'success');

    const form = document.getElementById('filler-form');
    form.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>提交成功！</h3>
        <p>感谢您的参与，您的回答已成功提交。</p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-view=preview]').click()">查看结果</button>
      </div>
    `;

    document.getElementById('prev-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'none';
  }

  function setupPreview() {
    document.getElementById('generate-demo-btn').addEventListener('click', generateDemoData);
    document.getElementById('export-btn').addEventListener('click', exportData);
  }

  function renderPreview() {
    const container = document.getElementById('charts-grid');
    const tableContainer = document.getElementById('results-table-container');
    const table = document.getElementById('results-table');

    if (state.quiz.questions.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>没有可预览的问题</h3></div>';
      tableContainer.style.display = 'none';
      return;
    }

    tableContainer.style.display = '';

    let chartsHtml = '';
    state.quiz.questions.forEach(q => {
      if (q.type === 'single' || q.type === 'multiple') {
        chartsHtml += renderChoiceChart(q);
      } else if (q.type === 'slider') {
        chartsHtml += renderSliderChart(q);
      } else if (q.type === 'text') {
        chartsHtml += renderTextPreview(q);
      }
    });

    if (!chartsHtml) {
      chartsHtml = '<div class="empty-state"><h3>暂无数据</h3><p>生成模拟数据或等待真实提交</p></div>';
    }

    container.innerHTML = chartsHtml;

    let tableHtml = '<thead><tr><th>#</th><th>提交时间</th>';
    state.quiz.questions.forEach(q => {
      tableHtml += `<th>${escapeHtml(q.title)}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    if (state.responses.length === 0) {
      tableHtml += `<tr><td colspan="${state.quiz.questions.length + 2}" style="text-align: center; color: var(--text-muted);">暂无提交数据</td></tr>`;
    } else {
      state.responses.forEach((r, i) => {
        const time = new Date(r.timestamp).toLocaleString('zh-CN');
        tableHtml += `<tr><td>${i + 1}</td><td>${time}</td>`;
        state.quiz.questions.forEach(q => {
          const answer = r.answers[q.id];
          let display = '';
          if (answer === undefined || answer === null) {
            display = '-';
          } else if (Array.isArray(answer)) {
            display = answer.join(', ');
          } else {
            display = String(answer);
          }
          tableHtml += `<td>${escapeHtml(display)}</td>`;
        });
        tableHtml += '</tr>';
      });
    }

    tableHtml += '</tbody>';
    table.innerHTML = tableHtml;
  }

  function renderChoiceChart(q) {
    const counts = {};
    q.options.forEach(opt => counts[opt] = 0);

    state.responses.forEach(r => {
      const answer = r.answers[q.id];
      if (answer) {
        if (Array.isArray(answer)) {
          answer.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
        } else if (counts[answer] !== undefined) {
          counts[answer]++;
        }
      }
    });

    const total = state.responses.length || 1;
    const maxCount = Math.max(...Object.values(counts), 1);

    return `
      <div class="chart-card">
        <h4>${escapeHtml(q.title)}</h4>
        <div class="bar-chart">
          ${Object.entries(counts).map(([opt, count], i) => `
            <div class="bar-item">
              <div class="bar-value">${count}</div>
              <div class="bar" style="height: ${(count / maxCount) * 100}%; background: ${COLORS[i % COLORS.length]}"></div>
              <div class="bar-label">${escapeHtml(opt)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSliderChart(q) {
    const values = state.responses
      .map(r => r.answers[q.id])
      .filter(v => v !== undefined && v !== null);

    if (values.length === 0) {
      return `
        <div class="chart-card">
          <h4>${escapeHtml(q.title)}</h4>
          <div class="empty-state" style="padding: 2rem;">
            <p>暂无数据</p>
          </div>
        </div>
      `;
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return `
      <div class="chart-card">
        <h4>${escapeHtml(q.title)}</h4>
        <div style="padding: 1rem 0;">
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${avg.toFixed(1)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">平均值</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--success);">${min}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">最小值</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--danger);">${max}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">最大值</div>
            </div>
          </div>
          <div style="margin-top: 1rem; background: var(--bg-sidebar); height: 8px; border-radius: 4px; position: relative;">
            <div style="position: absolute; left: ${((avg - q.min) / (q.max - q.min)) * 100}%; top: -4px; width: 16px; height: 16px; background: var(--primary); border-radius: 50%; transform: translateX(-50%);"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
            <span>${q.min}</span>
            <span>${q.max}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderTextPreview(q) {
    const answers = state.responses
      .map(r => r.answers[q.id])
      .filter(a => a && a.trim());

    return `
      <div class="chart-card">
        <h4>${escapeHtml(q.title)}</h4>
        <div style="max-height: 200px; overflow-y: auto;">
          ${answers.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.875rem;">暂无回答</p>' :
            answers.map(a => `
              <div style="padding: 0.75rem; background: var(--bg); border-radius: var(--radius); margin-bottom: 0.5rem; font-size: 0.875rem;">
                ${escapeHtml(a)}
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }

  function generateDemoData() {
    if (state.quiz.questions.length === 0) {
      showToast('请先创建问卷问题', 'error');
      return;
    }

    const count = 20;
    for (let i = 0; i < count; i++) {
      const answers = {};
      state.quiz.questions.forEach(q => {
        switch (q.type) {
          case 'single':
            answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)];
            break;
          case 'multiple':
            const selected = q.options.filter(() => Math.random() > 0.5);
            answers[q.id] = selected.length > 0 ? selected : [q.options[0]];
            break;
          case 'text':
            const texts = ['很好，非常满意', '一般般吧', '需要改进', '体验不错', '有待提升', '非常好', '还可以', '不太满意', '超出预期', '符合预期'];
            answers[q.id] = texts[Math.floor(Math.random() * texts.length)];
            break;
          case 'slider':
            answers[q.id] = q.min + Math.floor(Math.random() * (q.max - q.min + 1));
            break;
        }
      });

      state.responses.push({
        id: Date.now() + i,
        answers,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeSpent: state.quiz.hasTimer ? Math.floor(Math.random() * state.quiz.timerMinutes * 60) : null
      });
    }

    saveResponses();
    renderPreview();
    showToast(`已生成 ${count} 条模拟数据`, 'success');
  }

  function exportData() {
    if (state.responses.length === 0) {
      showToast('没有可导出的数据', 'error');
      return;
    }

    const headers = ['#', '提交时间', ...state.quiz.questions.map(q => q.title)];
    const rows = state.responses.map((r, i) => {
      const time = new Date(r.timestamp).toLocaleString('zh-CN');
      return [i + 1, time, ...state.quiz.questions.map(q => {
        const answer = r.answers[q.id];
        return Array.isArray(answer) ? answer.join('; ') : (answer || '');
      })];
    });

    let csv = '\uFEFF';
    csv += headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.quiz.title || '问卷'}_结果_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  }

  function setupModal() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('share-modal').style.display = 'none';
      });
    });

    document.getElementById('copy-link-btn').addEventListener('click', () => {
      const input = document.getElementById('share-link');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('链接已复制', 'success');
      }).catch(() => {
        document.execCommand('copy');
        showToast('链接已复制', 'success');
      });
    });
  }

  function generateShareLink() {
    if (state.quiz.questions.length === 0) {
      showToast('请先添加问题', 'error');
      return;
    }

    const data = {
      title: state.quiz.title,
      description: state.quiz.description,
      hasTimer: state.quiz.hasTimer,
      timerMinutes: state.quiz.timerMinutes,
      questions: state.quiz.questions
    };

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const url = `${window.location.origin}${window.location.pathname}#quiz=${encoded}`;

    document.getElementById('share-link').value = url;
    document.getElementById('share-modal').style.display = 'flex';
  }

  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#quiz=')) {
      try {
        const encoded = hash.slice(6);
        const json = decodeURIComponent(escape(atob(encoded)));
        const data = JSON.parse(json);

        state.quiz.title = data.title || '';
        state.quiz.description = data.description || '';
        state.quiz.hasTimer = data.hasTimer || false;
        state.quiz.timerMinutes = data.timerMinutes || 30;
        state.quiz.questions = data.questions || [];

        const maxId = state.quiz.questions.reduce((max, q) => Math.max(max, q.id || 0), 0);
        state.nextQuestionId = maxId + 1;

        saveState();
        renderBuilder();
        switchView('filler');
        showToast('已从链接加载问卷', 'success');
      } catch (e) {
        console.error('Failed to parse quiz data:', e);
        showToast('链接无效，无法加载问卷', 'error');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
