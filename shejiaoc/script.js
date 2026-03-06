// 模拟数据：帖子
const postsData = [
    {
        id: 1,
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '2小时前',
        content: '今天完成了一个新项目！使用React和Node.js构建的全栈应用，感觉非常有成就感。💪 #编程 #开发',
        likes: 42,
        comments: 8,
        shares: 5,
        liked: false
    },
    {
        id: 2,
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '昨天',
        content: '分享一下我对前端框架选择的看法：没有最好的框架，只有最适合的框架。关键是要理解每个框架的设计哲学和适用场景。你最喜欢哪个前端框架？',
        image: 'https://picsum.photos/600/300?random=1',
        likes: 128,
        comments: 23,
        shares: 15,
        liked: true
    },
    {
        id: 3,
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '2天前',
        content: '开源项目贡献者突破了100人！感谢所有贡献者的支持。如果你也想参与开源，欢迎访问我们的GitHub仓库。🎉',
        likes: 256,
        comments: 34,
        shares: 45,
        liked: true
    },
    {
        id: 4,
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '3天前',
        content: '学习了TypeScript的新特性，类型推导真的很强大！推荐大家在使用TypeScript时充分利用类型系统，能减少很多运行时错误。⚡',
        likes: 89,
        comments: 12,
        shares: 8,
        liked: false
    },
    {
        id: 5,
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '5天前',
        content: '周末去参加了一个技术meetup，认识了很多志同道合的开发者。技术交流真的很有意义，希望以后能多参加这样的活动！🤝',
        likes: 67,
        comments: 9,
        shares: 3,
        liked: false
    }
];

// 模拟数据：关注列表
const followingData = [
    { name: 'Sarah Lee', username: '@sarahlee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', bio: 'UI/UX设计师' },
    { name: 'Mike Wang', username: '@mikewang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', bio: '后端工程师' },
    { name: 'Emma Zhang', username: '@emmazhang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', bio: '产品经理' },
    { name: 'David Liu', username: '@davidliu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', bio: '全栈开发者' },
    { name: 'Lisa Chen', username: '@lisachen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', bio: '数据科学家' },
    { name: 'Tom Wu', username: '@tomwu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', bio: 'DevOps工程师' }
];

// 模拟数据：粉丝列表
const followersData = [
    { name: 'Anna Smith', username: '@annasmith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', bio: '前端开发者' },
    { name: 'John Doe', username: '@johndoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', bio: '技术博主' },
    { name: 'Kate Brown', username: '@katebrown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kate', bio: '移动开发者' },
    { name: 'Chris Wilson', username: '@chriswilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', bio: '创业公司创始人' },
    { name: 'Nancy White', username: '@nancywhite', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nancy', bio: '技术顾问' },
    { name: 'Ryan Miller', username: '@ryanmiller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan', bio: '游戏开发者' },
    { name: 'Sophia Green', username: '@sophiagreen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia', bio: 'AI研究员' },
    { name: 'James Taylor', username: '@jamestaylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', bio: '开源贡献者' }
];

// 初始化
let posts = [...postsData];

// 渲染帖子列表
function renderPosts() {
    const postsList = document.getElementById('postsList');

    if (posts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <i class="far fa-file-alt"></i>
                <p>还没有发布任何帖子</p>
            </div>
        `;
        return;
    }

    postsList.innerHTML = posts.map(post => `
        <div class="post" data-post-id="${post.id}">
            <img src="${post.avatar}" alt="${post.author}" class="post-avatar">
            <div class="post-content">
                <div class="post-header">
                    <a href="#" class="post-author">${post.author}</a>
                    <span class="post-username">${post.username}</span>
                    <span class="post-time">· ${post.time}</span>
                </div>
                <div class="post-text">${post.content}</div>
                ${post.image ? `
                    <div class="post-image">
                        <img src="${post.image}" alt="帖子图片">
                    </div>
                ` : ''}
                <div class="post-actions">
                    <button class="post-action-btn" onclick="commentPost(${post.id})">
                        <i class="far fa-comment"></i>
                        <span>${post.comments}</span>
                    </button>
                    <button class="post-action-btn" onclick="retweetPost(${post.id})">
                        <i class="fas fa-retweet"></i>
                        <span>${post.shares}</span>
                    </button>
                    <button class="post-action-btn like-btn ${post.liked ? 'liked' : ''}" onclick="likePost(${post.id})">
                        <i class="${post.liked ? 'fas' : 'far'} fa-heart"></i>
                        <span class="like-count">${post.likes}</span>
                    </button>
                    <button class="post-action-btn" onclick="sharePost(${post.id})">
                        <i class="far fa-share-square"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 创建新帖子
function createPost() {
    const postInput = document.getElementById('postInput');
    const content = postInput.value.trim();

    if (!content) {
        alert('请输入帖子内容！');
        return;
    }

    const newPost = {
        id: Date.now(),
        author: 'Alex Chen',
        username: '@alexchen_dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
        time: '刚刚',
        content: content,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false
    };

    posts.unshift(newPost);
    renderPosts();
    postInput.value = '';

    // 更新帖子数量
    updatePostCount();
}

// 点赞帖子
function likePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        renderPosts();
    }
}

// 评论帖子
function commentPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments += 1;
        renderPosts();
        alert('评论功能演示：评论数已更新');
    }
}

// 转发帖子
function retweetPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.shares += 1;
        renderPosts();
        alert('转发功能演示：转发数已更新');
    }
}

// 分享帖子
function sharePost(postId) {
    alert('分享功能演示：复制链接已剪贴板');
}

// 更新帖子数量
function updatePostCount() {
    const postCount = document.querySelector('.stat-number');
    if (postCount) {
        const currentCount = parseInt(postCount.textContent.replace(',', ''));
        postCount.textContent = (currentCount + 1).toLocaleString();
    }
}

// 打开关注/粉丝模态框
function openFollowModal(type) {
    const modal = document.getElementById('followModal');
    const modalTitle = document.getElementById('modalTitle');
    const followList = document.getElementById('followList');

    if (type === 'following') {
        modalTitle.textContent = '关注列表';
        followList.innerHTML = followingData.map(user => `
            <li class="follow-item">
                <img src="${user.avatar}" alt="${user.name}">
                <div class="follow-info">
                    <h4>${user.name}</h4>
                    <p>${user.username}</p>
                </div>
                <button class="btn-follow" onclick="toggleFollow(this)">已关注</button>
            </li>
        `).join('');
    } else {
        modalTitle.textContent = '粉丝列表';
        followList.innerHTML = followersData.map(user => `
            <li class="follow-item">
                <img src="${user.avatar}" alt="${user.name}">
                <div class="follow-info">
                    <h4>${user.name}</h4>
                    <p>${user.username}</p>
                </div>
                <button class="btn-follow" onclick="toggleFollow(this)">关注</button>
            </li>
        `).join('');
    }

    modal.classList.add('active');
}

// 关闭模态框
function closeFollowModal() {
    const modal = document.getElementById('followModal');
    modal.classList.remove('active');
}

// 切换关注状态
function toggleFollow(button) {
    if (button.textContent === '关注') {
        button.textContent = '已关注';
        button.classList.add('following');
    } else {
        button.textContent = '关注';
        button.classList.remove('following');
    }
}

// 标签页切换
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // 这里可以实现不同标签页内容的切换
        const tab = this.dataset.tab;
        if (tab === 'posts') {
            renderPosts();
        } else if (tab === 'media') {
            document.getElementById('postsList').innerHTML = `
                <div class="empty-state">
                    <i class="far fa-images"></i>
                    <p>暂无媒体内容</p>
                </div>
            `;
        } else if (tab === 'likes') {
            document.getElementById('postsList').innerHTML = `
                <div class="empty-state">
                    <i class="far fa-heart"></i>
                    <p>暂无喜欢的内容</p>
                </div>
            `;
        }
    });
});

// 发布按钮状态控制
const postInput = document.getElementById('postInput');
const postBtn = document.querySelector('.btn-post');

postInput.addEventListener('input', function() {
    postBtn.disabled = this.value.trim() === '';
});

// 点击模态框外部关闭
document.getElementById('followModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeFollowModal();
    }
});

// 推荐关注按钮
document.querySelectorAll('.widget .btn-follow').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.textContent === '关注') {
            this.textContent = '已关注';
            this.classList.add('following');
        } else {
            this.textContent = '关注';
            this.classList.remove('following');
        }
    });
});

// 页面加载完成后渲染帖子
document.addEventListener('DOMContentLoaded', function() {
    renderPosts();
});
