// 植物数据库
const plantsDatabase = [
    {
        id: 'monstera',
        name: '龟背竹',
        latinName: 'Monstera deliciosa',
        category: 'indoor',
        icon: 'fa-leaf',
        color: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
        difficulty: 'easy',
        description: '龟背竹是一种非常受欢迎的室内观叶植物，因其叶片独特的裂纹形状而得名。原产于墨西哥热带雨林，喜欢温暖湿润的环境。',
        care: {
            water: '保持土壤微湿，夏季每周1-2次，冬季每10-14天一次',
            light: '明亮的散射光，避免直射阳光',
            temperature: '18-30°C，不耐寒',
            humidity: '喜欢高湿度，可经常喷水增湿'
        },
        tips: ['定期擦拭叶片保持清洁', '可攀附支架生长', '避免冷风吹袭', '每年春季换盆']
    },
    {
        id: 'peace-lily',
        name: '白鹤芋',
        latinName: 'Spathiphyllum',
        category: 'indoor',
        icon: 'fa-spa',
        color: 'linear-gradient(135deg, #E91E63, #9C27B0)',
        difficulty: 'easy',
        description: '白鹤芋又称一帆风顺，叶片翠绿，开白色花朵。具有很好的空气净化能力，是理想的室内植物。',
        care: {
            water: '保持土壤湿润但不积水，缺水时叶片会下垂',
            light: '耐阴，可放在光线较弱的地方',
            temperature: '15-28°C，怕低温',
            humidity: '喜欢较高湿度'
        },
        tips: ['缺水时及时浇水会很快恢复', '避免阳光直射导致叶片灼伤', '花谢后及时剪除花梗', '花期可适当增加磷钾肥']
    },
    {
        id: 'pothos',
        name: '绿萝',
        latinName: 'Epipremnum aureum',
        category: 'foliage',
        icon: 'fa-vine',
        color: 'linear-gradient(135deg, #00BCD4, #009688)',
        difficulty: 'easy',
        description: '绿萝是最受欢迎的室内植物之一，生命力顽强，可水培也可土培，具有很好的净化空气效果。',
        care: {
            water: '见干见湿，夏季3-5天一次，冬季7-10天一次',
            light: '明亮的散射光，耐阴性强',
            temperature: '15-30°C，最低不低于10°C',
            humidity: '适应性强，喜欢湿润环境'
        },
        tips: ['可经常向叶片喷水', '定期修剪促进分枝', '水培需定期换水', '避免温度过低']
    },
    {
        id: 'succulent',
        name: '多肉植物',
        latinName: 'Succulent',
        category: 'succulent',
        icon: 'fa-sun',
        color: 'linear-gradient(135deg, #FF9800, #FF5722)',
        difficulty: 'medium',
        description: '多肉植物是一类具有肥厚茎叶的植物，能够储存水分，适合干燥环境养护，种类繁多，形态各异。',
        care: {
            water: '干透浇透，夏季减少浇水，冬季控水',
            light: '充足的阳光，夏季适当遮阴',
            temperature: '5-35°C，耐旱不耐寒',
            humidity: '喜欢干燥环境，忌潮湿'
        },
        tips: ['使用排水良好的颗粒土', '避免积水导致烂根', '春秋季节是生长旺季', '夏季高温休眠需少水少肥']
    },
    {
        id: 'orchid',
        name: '蝴蝶兰',
        latinName: 'Phalaenopsis',
        category: 'flowering',
        icon: 'fa-fan',
        color: 'linear-gradient(135deg, #9C27B0, #673AB7)',
        difficulty: 'medium',
        description: '蝴蝶兰素有"洋兰皇后"之称，花型优美，花期长，是极具观赏价值的室内花卉。',
        care: {
            water: '水苔表面干燥时浇水，约每周一次',
            light: '明亮的散射光，忌强光直射',
            temperature: '18-28°C，昼夜温差有助于开花',
            humidity: '保持60-80%的空气湿度'
        },
        tips: ['使用水苔或树皮作基质', '花后修剪花梗可促发新花', '避免叶片积水', '适当通风预防病害']
    },
    {
        id: 'snake-plant',
        name: '虎皮兰',
        latinName: 'Sansevieria',
        category: 'indoor',
        icon: 'fa-feather',
        color: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
        difficulty: 'easy',
        description: '虎皮兰又名虎尾兰，叶片挺拔有虎斑纹，是非常耐养的室内植物，被誉为"天然的空气净化器"。',
        care: {
            water: '非常耐旱，每月浇水1-2次即可',
            light: '耐阴，也喜散射光',
            temperature: '10-35°C，适应性强',
            humidity: '对湿度要求不高'
        },
        tips: ['宁干勿湿，避免烂根', '冬季控制浇水', '可放在卧室净化空气', '繁殖可通过分株']
    },
    {
        id: 'spider-plant',
        name: '吊兰',
        latinName: 'Chlorophytum comosum',
        category: 'foliage',
        icon: 'fa-seedling',
        color: 'linear-gradient(135deg, #8BC34A, #CDDC39)',
        difficulty: 'easy',
        description: '吊兰叶片细长下垂，会抽出匍匐茎长出小植株，观赏性强，有"绿色净化器"的美誉。',
        care: {
            water: '保持土壤湿润，夏季多浇水',
            light: '喜半阴环境，忌强光',
            temperature: '15-25°C',
            humidity: '喜欢湿润环境'
        },
        tips: ['定期剪除黄叶', '小植株可剪下繁殖', '可水培也可土培', '生长期每月施肥一次']
    },
    {
        id: 'cyclamen',
        name: '仙客来',
        latinName: 'Cyclamen persicum',
        category: 'flowering',
        icon: 'fa-heart',
        color: 'linear-gradient(135deg, #E91E63, #F44336)',
        difficulty: 'hard',
        description: '仙客来花形独特，花瓣反卷似兔耳，寓意"喜迎贵客"，是冬季和早春的重要观赏花卉。',
        care: {
            water: '从盆边浇水，避免浇到球茎',
            light: '喜凉爽明亮的环境',
            temperature: '10-20°C，怕高温',
            humidity: '保持较高湿度'
        },
        tips: ['花后减少浇水进入休眠', '避免高温高湿导致腐烂', '花谢后及时剪除残花', '休眠期保持干燥']
    },
    {
        id: 'aloe',
        name: '芦荟',
        latinName: 'Aloe vera',
        category: 'succulent',
        icon: 'fa-plus',
        color: 'linear-gradient(135deg, #4CAF50, #388E3C)',
        difficulty: 'easy',
        description: '芦荟不仅具有观赏价值，叶片中的凝胶还有美容和药用功效，是非常实用的多肉植物。',
        care: {
            water: '耐旱，干透浇透，冬季少水',
            light: '喜阳光充足',
            temperature: '10-30°C',
            humidity: '适应性强'
        },
        tips: ['使用疏松透气的沙质土', '避免积水', '可提取叶汁用于护肤', '冬季需入室保暖']
    },
    {
        id: 'jasmine',
        name: '茉莉花',
        latinName: 'Jasminum',
        category: 'flowering',
        icon: 'fa-snowflake',
        color: 'linear-gradient(135deg, #FFF, #F5F5F5)',
        difficulty: 'medium',
        description: '茉莉花朵洁白，香气浓郁，是著名的香花植物，可制作茉莉花茶，深受人们喜爱。',
        care: {
            water: '保持土壤湿润，夏季需水量大',
            light: '喜阳光充足',
            temperature: '20-30°C',
            humidity: '喜欢湿润环境'
        },
        tips: ['生长期需充足光照', '花后修剪促进分枝', '喜酸性土壤', '夏季可每天浇水']
    },
    {
        id: 'fern',
        name: '铁线蕨',
        latinName: 'Adiantum',
        category: 'foliage',
        icon: 'fa-fan',
        color: 'linear-gradient(135deg, #4CAF50, #81C784)',
        difficulty: 'hard',
        description: '铁线蕨叶片细小精致，茎干纤细如铁丝，姿态优雅，是极具观赏价值的蕨类植物。',
        care: {
            water: '保持土壤和空气湿润，每日喷水',
            light: '散射光，忌强光',
            temperature: '15-25°C，怕冷',
            humidity: '需要高湿度环境'
        },
        tips: ['经常向叶片喷水', '避免干燥环境', '使用疏松透气的腐叶土', '冬季需保温保湿']
    },
    {
        id: 'kumquat',
        name: '金桔',
        latinName: 'Fortunella',
        category: 'flowering',
        icon: 'fa-circle',
        color: 'linear-gradient(135deg, #FF9800, #FFC107)',
        difficulty: 'medium',
        description: '金桔四季常青，果实金黄，寓意吉祥，是春节期间常见的观赏盆栽，果实可食用。',
        care: {
            water: '保持土壤湿润但不积水',
            light: '需要充足阳光',
            temperature: '15-30°C',
            humidity: '喜欢湿润环境'
        },
        tips: ['果实期需充足光照', '花果期适当增施磷钾肥', '春季换盆', '注意通风防病虫害']
    }
];

// AI 知识库
const knowledgeBase = {
    watering: {
        keywords: ['浇水', '水', '干燥', '湿润', '喷水', '淋水', '浇透', '见干见湿'],
        responses: [
            '浇水原则是"见干见湿"，用手指插入土壤2-3厘米，感觉干燥时再浇水。浇则浇透，直到水从盆底流出。',
            '不同植物的浇水频率不同：多肉植物每7-10天一次，绿萝3-5天一次，龟背竹每周1-2次。夏季增加频率，冬季减少。',
            '判断植物是否需要浇水的方法：观察盆土颜色（变浅说明干了）、掂盆重（变轻说明缺水）、看叶片（轻微下垂说明缺水）。',
            '浇水时间最好选择清晨或傍晚，避免正午高温时浇水。水温要与室温相近，避免刺激根系。'
        ]
    },
    fertilizing: {
        keywords: ['施肥', '肥料', '营养', '氮肥', '磷肥', '钾肥', '复合肥', '液肥'],
        responses: [
            '施肥原则是"薄肥勤施，宁少勿多"。生长季（春夏）每2-3周施一次稀薄液肥，休眠期（冬季）停止施肥。',
            '不同肥料的作用：氮肥促进叶片生长，适合观叶植物；磷钾肥促进开花结果，适合开花植物；复合肥提供均衡营养。',
            '施肥方法：先将肥料稀释，再浇在盆土上，避免直接浇在叶片上。施肥前一天先浇水，避免烧根。',
            '新上盆或刚换盆的植物暂不施肥，待适应环境1-2个月后再开始施肥。'
        ]
    },
    light: {
        keywords: ['光照', '阳光', '光', '阴', '晒', '直射', '散射'],
        responses: [
            '光照是植物生长的关键。不同植物对光照需求不同：多肉植物需要充足阳光，绿萝耐阴，龟背竹喜欢明亮的散射光。',
            '夏季中午阳光强烈时，需要给植物适当遮阴，避免叶片被灼伤。冬季光照较弱时，应尽量让植物多晒太阳。',
            '定期转动花盆方向，让植物受光均匀，避免向光生长导致株型歪斜。光线不足时可使用植物补光灯。',
            '光照不足的表现：叶片变小、颜色变浅、节间变长、植株徒长。'
        ]
    },
    yellow: {
        keywords: ['黄', '发黄', '黄叶', '变黄'],
        responses: [
            '叶子发黄可能有以下原因：\n1. 浇水过多导致烂根 - 减少浇水，保持通风\n2. 浇水不足 - 及时补充水分\n3. 光照不足 - 增加光照\n4. 缺肥 - 适当施肥\n5. 正常代谢 - 底部老叶自然发黄',
            '如果新叶发黄，可能是缺铁或缺氮，可以施用硫酸亚铁或含氮肥料。如果老叶发黄，可能是正常老化或浇水问题。',
            '解决叶子发黄的方法：先检查土壤湿度，调整浇水频率；增加散射光；根据情况补充营养；剪除严重发黄的叶片。'
        ]
    },
    specific: {
        '龟背竹': '龟背竹养护要点：喜欢温暖湿润环境，明亮的散射光。每周浇水1-2次，保持土壤微湿。经常向叶片喷水增加湿度。避免强光直射和冷风。',
        '绿萝': '绿萝养护要点：生命力强，适应性好。见干见湿，夏季3-5天浇水一次。可耐阴，但明亮的散射光长得更好。可水培也可土培。',
        '多肉': '多肉植物养护要点：非常耐旱，干透浇透。需要充足阳光，夏季适当遮阴。使用排水良好的颗粒土。冬季控制浇水，保持干燥。',
        '白鹤芋': '白鹤芋养护要点：耐阴性强，适合光线较弱的地方。保持土壤湿润，缺水时叶片会下垂，浇水后很快恢复。喜欢较高湿度。',
        '虎皮兰': '虎皮兰养护要点：非常耐养，每月浇水1-2次即可。耐阴耐旱，对光照要求不高。是天然的空气净化器，适合放在卧室。',
        '吊兰': '吊兰养护要点：保持土壤湿润，夏季多浇水。喜半阴环境，忌强光直射。会抽出小植株，可剪下繁殖。有很好的空气净化能力。'
    }
};

// 页面导航
function switchSection(sectionId) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });

    // 切换内容区域
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // 如果切换到植物库，渲染植物列表
    if (sectionId === 'plants') {
        renderPlants();
    }
}

// 绑定导航按钮事件
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchSection(btn.dataset.section);
    });
});

// 渲染植物列表
function renderPlants() {
    const grid = document.getElementById('plantGrid');
    const searchTerm = document.getElementById('plantSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filteredPlants = plantsDatabase.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm) ||
                            plant.latinName.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || plant.category === category;
        return matchesSearch && matchesCategory;
    });

    grid.innerHTML = filteredPlants.map(plant => `
        <div class="plant-card" onclick="showPlantDetail('${plant.id}')">
            <div class="plant-icon" style="background: ${plant.color};">
                <i class="fas ${plant.icon}"></i>
            </div>
            <div class="plant-info">
                <h4>${plant.name}</h4>
                <p>${plant.latinName}</p>
                <span class="difficulty ${plant.difficulty}">${getDifficultyText(plant.difficulty)}</span>
            </div>
        </div>
    `).join('');
}

function getDifficultyText(difficulty) {
    const texts = {
        easy: '容易养护',
        medium: '中等难度',
        hard: '较难养护'
    };
    return texts[difficulty] || difficulty;
}

// 过滤植物
function filterPlants() {
    renderPlants();
}

// 显示植物详情
function showPlantDetail(plantId) {
    const plant = plantsDatabase.find(p => p.id === plantId);
    if (!plant) return;

    const modal = document.getElementById('plantModal');
    const detail = document.getElementById('plantDetail');

    detail.innerHTML = `
        <div class="plant-detail-header">
            <div class="plant-detail-icon" style="background: ${plant.color};">
                <i class="fas ${plant.icon}"></i>
            </div>
            <div class="plant-detail-info">
                <h3>${plant.name}</h3>
                <p class="latin-name">${plant.latinName}</p>
                <span class="difficulty ${plant.difficulty}">${getDifficultyText(plant.difficulty)}</span>
            </div>
        </div>
        <p class="plant-description">${plant.description}</p>
        <div class="care-info">
            <div class="care-item">
                <i class="fas fa-tint"></i>
                <span>${plant.care.water}</span>
            </div>
            <div class="care-item">
                <i class="fas fa-sun"></i>
                <span>${plant.care.light}</span>
            </div>
            <div class="care-item">
                <i class="fas fa-thermometer-half"></i>
                <span>${plant.care.temperature}</span>
            </div>
            <div class="care-item">
                <i class="fas fa-cloud"></i>
                <span>${plant.care.humidity}</span>
            </div>
        </div>
        <div class="plant-tips">
            <h4><i class="fas fa-lightbulb"></i> 养护小贴士</h4>
            <ul>
                ${plant.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;

    modal.classList.add('active');
}

// 关闭模态框
function closeModal() {
    document.getElementById('plantModal').classList.remove('active');
}

// 聊天功能
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    // 添加用户消息
    addMessage(message, 'user');
    input.value = '';

    // 显示打字指示器
    showTypingIndicator();

    // 模拟AI回复延迟
    setTimeout(() => {
        removeTypingIndicator();
        const response = generateResponse(message);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 1000);
}

function sendQuickQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

function addMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = type === 'bot' ? 'fa-robot' : 'fa-user';
    const iconClass = type === 'bot' ? 'message-avatar' : 'message-avatar';

    messageDiv.innerHTML = `
        <div class="${iconClass}">
            <i class="fas ${avatar}"></i>
        </div>
        <div class="message-content">
            ${formatMessage(content)}
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessage(content) {
    // 将换行符转换为段落
    return content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// 生成AI回复
function generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // 检查特定植物问题
    for (const [plantName, response] of Object.entries(knowledgeBase.specific)) {
        if (lowerMessage.includes(plantName)) {
            return response;
        }
    }

    // 检查浇水问题
    for (const keyword of knowledgeBase.watering.keywords) {
        if (lowerMessage.includes(keyword)) {
            return knowledgeBase.watering.responses[Math.floor(Math.random() * knowledgeBase.watering.responses.length)];
        }
    }

    // 检查施肥问题
    for (const keyword of knowledgeBase.fertilizing.keywords) {
        if (lowerMessage.includes(keyword)) {
            return knowledgeBase.fertilizing.responses[Math.floor(Math.random() * knowledgeBase.fertilizing.responses.length)];
        }
    }

    // 检查光照问题
    for (const keyword of knowledgeBase.light.keywords) {
        if (lowerMessage.includes(keyword)) {
            return knowledgeBase.light.responses[Math.floor(Math.random() * knowledgeBase.light.responses.length)];
        }
    }

    // 检查黄叶问题
    for (const keyword of knowledgeBase.yellow.keywords) {
        if (lowerMessage.includes(keyword)) {
            return knowledgeBase.yellow.responses[Math.floor(Math.random() * knowledgeBase.yellow.responses.length)];
        }
    }

    // 默认回复
    const defaultResponses = [
        '这是个好问题！关于植物养护，我可以帮您解答浇水、施肥、光照等方面的问题。请问您具体想了解什么呢？',
        '我能帮您解答各种植物的养护问题。您可以询问某种植物的具体养护方法，或者浇水、施肥的频率和技巧。',
        '作为您的绿植助手，我建议您先告诉我是什么植物，这样我能给您更准确的养护建议。'
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// 处理回车键发送
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 清空对话
function clearChat() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
        <div class="message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>你好！我是你的 AI 绿植助手。我可以帮助你解决以下问题：</p>
                <ul class="quick-questions">
                    <li onclick="sendQuickQuestion('多久浇一次水？')">多久浇一次水？</li>
                    <li onclick="sendQuickQuestion('如何判断植物需要浇水？')">如何判断植物需要浇水？</li>
                    <li onclick="sendQuickQuestion('施肥频率是多少？')">施肥频率是多少？</li>
                    <li onclick="sendQuickQuestion('叶子发黄怎么办？')">叶子发黄怎么办？</li>
                    <li onclick="sendQuickQuestion('龟背竹怎么养护？')">龟背竹怎么养护？</li>
                </ul>
            </div>
        </div>
    `;
}

// 解决方案数据
const solutions = {
    yellow: {
        title: '叶子发黄解决方案',
        steps: [
            {
                title: '检查浇水情况',
                content: '用手指插入土壤2-3厘米，检查土壤湿度。如果过湿则停止浇水加强通风，如果过干则及时补充水分。'
            },
            {
                title: '调整光照',
                content: '将植物移到光线适宜的位置。观叶植物需要明亮的散射光，避免强光直射或长期阴暗。'
            },
            {
                title: '补充营养',
                content: '如果植物长期未施肥，可以施用适量复合肥。新叶发黄可能是缺铁，可施用硫酸亚铁。'
            },
            {
                title: '修剪黄叶',
                content: '剪除严重发黄的叶片，避免消耗养分。注意保留健康的绿色叶片。'
            }
        ]
    },
    curled: {
        title: '叶子卷曲解决方案',
        steps: [
            {
                title: '补充水分',
                content: '立即浇透水，并向叶片喷水增加空气湿度。保持土壤湿润但不积水。'
            },
            {
                title: '调节光照',
                content: '如果光照过强导致卷曲，需要移到阴凉处；如果光照不足，需要增加散射光。'
            },
            {
                title: '调整温度',
                content: '检查环境温度是否适宜，避免温度过高或过低。大部分室内植物适宜15-28°C。'
            },
            {
                title: '检查虫害',
                content: '仔细检查叶片正反面，如有虫害及时用相应药剂处理。'
            }
        ]
    },
    spots: {
        title: '叶片斑点解决方案',
        steps: [
            {
                title: '诊断斑点原因',
                content: '褐色斑点可能是日灼或叶面喷水后晒干；黑色斑点可能是真菌病害；不规则斑点可能是虫害。'
            },
            {
                title: '调整浇水方式',
                content: '避免在强光下向叶片喷水，浇水时不要让水滴长时间留在叶面上。'
            },
            {
                title: '病害处理',
                content: '如果是真菌感染，可以用多菌灵等杀菌剂喷洒，并保持通风。'
            },
            {
                title: '虫害防治',
                content: '发现虫害可用肥皂水擦拭叶片，或使用对应的杀虫剂处理。'
            }
        ]
    },
    rot: {
        title: '茎干腐烂解决方案',
        steps: [
            {
                title: '停止浇水',
                content: '立即停止浇水，将植物移到通风良好的地方，加快土壤水分蒸发。'
            },
            {
                title: '检查根部',
                content: '脱盆检查根系，剪除腐烂发黑的根，用多菌灵溶液消毒。'
            },
            {
                title: '重新上盆',
                content: '使用新鲜的排水良好的土壤重新种植，上盆后暂时不浇水。'
            },
            {
                title: '加强通风',
                content: '保持环境通风良好，避免高温高湿环境，预防病菌滋生。'
            }
        ]
    }
};

// 显示解决方案
function showSolution(type) {
    const solution = solutions[type];
    if (!solution) return;

    const modal = document.getElementById('solutionModal');
    const content = document.getElementById('solutionContent');

    content.innerHTML = `
        <h3>${solution.title}</h3>
        <ul class="solution-steps">
            ${solution.steps.map((step, index) => `
                <li>
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                        <h4>${step.title}</h4>
                        <p>${step.content}</p>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;

    modal.classList.add('active');
}

// 关闭解决方案弹窗
function closeSolutionModal() {
    document.getElementById('solutionModal').classList.remove('active');
}

// 点击模态框外部关闭
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// 自动调整文本框高度
document.getElementById('messageInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderPlants();
});
