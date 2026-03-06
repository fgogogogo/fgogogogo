// 模拟数据
const posts = [
    {
        id: 1,
        user: {
            name: '张三',
            handle: '@zhangsan',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        },
        content: '今天天气真好！决定去公园散步，享受阳光 🌞 #生活 #快乐时光',
        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600',
        time: '2小时前',
        likes: 45,
        comments: 12,
        shares: 5,
        liked: false
    },
    {
        id: 2,
        user: {
            name: '张三',
            handle: '@zhangsan',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        },
        content: '刚完成了一个新项目，感觉很有成就感！感谢团队的支持 🎉 #工作 #团队',
        image: null,
        time: '5小时前',
        likes: 89,
        comments: 23,
        shares: 8,
        liked: false
    },
    {
        id: 3,
        user: {
            name: '张三',
            handle: '@zhangsan',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        },
        content: '分享一张我最近拍摄的照片 📷 摄影 #艺术 #风景',
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600',
        time: '1天前',
        likes: 156,
        comments: 34,
        shares: 15,
        liked: false
    },
    {
        id: 4,
        user: {
            name: '张三',
            handle: '@zhangsan',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        },
        content: '读到一本好书，强烈推荐给大家！《认知觉醒》真的很有启发 📚 #阅读 #成长',
        image: null,
        time: '2天前',
        likes: 67,
        comments: 18,
        shares: 9,
        liked: false
    }
];

const followingUsers = [
    { id: 1, name: '李华', handle: '@lihua', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily' },
    { id: 2, name: '王五', handle: '@wangwu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max' },
    { id: 3, name: '赵六', handle: '@zhaoliu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna' },
    { id: 4, name: '孙七', handle: '@sunqi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: 5, name: '周八', handle: '@zhouba', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' }
];

const followerUsers = [
    { id: 6, name: '陈九', handle: '@chenjiu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana' },
    { id: 7, name: '吴十', handle: '@wushi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Edward' },
    { id: 8, name: '郑十一', handle: '@zhengshiyi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona' },
    { id: 9, name: '刘十二', handle: '@liushier', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George' },
    { id: 10, name: '黄十三', handle: '@huangshisan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah' }
];

const suggestedUsers = [
    { id: 11, name: '林小明', handle: '@linxiaoming', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isaac' },
    { id: 12, name: '郭小红', handle: '@guoxiaohong', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia' }
];

// 渲染帖子函数
function renderPosts() {
    const postsFeed = document.getElementById('postsFeed');

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">
                    <img src="${post.user.avatar}" alt="${post.user.name}">
                </div>
                <div class="post-user-info">
                    <div class="post-user-name">${post.user.name}</div>
                    <div class="post-user-handle">${post.user.handle} · ${post.time}</div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.image ? `
                <div class="post-image">
                    <img src="${post.image}" alt="帖子图片">
                </div>
            ` : ''}
            <div class="post-actions">
                <div class="post-action ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <span>${post.liked ? '❤️' : '🤍'}</span>
                    <span>${post.likes}</span>
                </div>
                <div class="post-action">
                    <span>💬</span>
                    <span>${post.comments}</span>
                </div>
                <div class="post-action">
                    <span>🔄</span>
                    <span>${post.shares}</span>
                </div>
                <div class="post-action">
                    <span>🔖</span>
                </div>
            </div>
        `;
        postsFeed.appendChild(postElement);
    });
}

// 渲染用户列表函数
function renderUserList(users, containerId, showFollowBtn = true) {
    const container = document.getElementById(containerId);

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div class="user-item-avatar">
                <img src="${user.avatar}" alt="${user.name}">
            </div>
            <div class="user-item-info">
                <div class="user-item-name">${user.name}</div>
                <div class="user-item-handle">${user.handle}</div>
            </div>
            ${showFollowBtn ? `
                <button class="follow-btn" onclick="toggleFollow(this, '${user.name}')">关注</button>
            ` : ''}
        `;
        container.appendChild(userElement);
    });
}

// 切换点赞状态
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;

        // 重新渲染帖子
        const postsFeed = document.getElementById('postsFeed');
        postsFeed.innerHTML = '';
        renderPosts();
    }
}

// 切换关注状态
function toggleFollow(btn, userName) {
    if (btn.textContent === '关注') {
        btn.textContent = '已关注';
        btn.classList.add('following');

        // 更新关注数
        const followingCount = document.getElementById('followingCount');
        const currentCount = parseInt(followingCount.textContent.replace(',', ''));
        followingCount.textContent = (currentCount + 1).toLocaleString();

        // 显示通知
        showNotification(`已关注 ${userName}`);
    } else {
        btn.textContent = '关注';
        btn.classList.remove('following');

        // 更新关注数
        const followingCount = document.getElementById('followingCount');
        const currentCount = parseInt(followingCount.textContent.replace(',', ''));
        followingCount.textContent = (currentCount - 1).toLocaleString();

        // 显示通知
        showNotification(`已取消关注 ${userName}`);
    }
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 标签切换功能
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // 这里可以添加过滤帖子的逻辑
    });
});

// 发布新动态
const postInput = document.querySelector('.post-input');
const postBtn = document.querySelector('.post-btn');

postBtn.addEventListener('click', function() {
    const content = postInput.value.trim();
    if (content) {
        const newPost = {
            id: Date.now(),
            user: {
                name: '张三',
                handle: '@zhangsan',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
            },
            content: content,
            image: null,
            time: '刚刚',
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false
        };

        posts.unshift(newPost);
        const postsFeed = document.getElementById('postsFeed');
        postsFeed.innerHTML = '';
        renderPosts();

        postInput.value = '';
        showNotification('动态发布成功！');

        // 更新动态数
        const postsCount = document.getElementById('postsCount');
        const currentCount = parseInt(postsCount.textContent);
        postsCount.textContent = currentCount + 1;
    }
});

// 点击统计数据打开模态框
document.querySelectorAll('.stat-item').forEach((item, index) => {
    item.addEventListener('click', function() {
        const modal = document.getElementById('usersModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalUserList = document.getElementById('modalUserList');

        modalUserList.innerHTML = '';

        const titles = ['动态列表', '粉丝列表', '关注列表'];
        const dataLists = [[], followerUsers, followingUsers];

        modalTitle.textContent = titles[index];

        if (index === 0) {
            // 显示动态统计
            modalUserList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>总共 ${postsCount.textContent} 条动态</h3>
                    <p>点击帖子标签查看筛选后的动态</p>
                </div>
            `;
        } else {
            renderUserList(dataLists[index], 'modalUserList', false);
        }

        modal.classList.add('active');
    });
});

// 关闭模态框
document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('usersModal').classList.remove('active');
});

document.getElementById('usersModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// "查看全部"链接点击事件
document.querySelectorAll('.view-all').forEach((link, index) => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const modal = document.getElementById('usersModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalUserList = document.getElementById('modalUserList');

        modalUserList.innerHTML = '';

        const titles = ['关注列表', '粉丝列表', '推荐关注'];
        const dataLists = [followingUsers, followerUsers, suggestedUsers];

        modalTitle.textContent = titles[index];
        renderUserList(dataLists[index], 'modalUserList', index === 2);

        modal.classList.add('active');
    });
});

// 查看全部粉丝/关注
function showAllUsers(type) {
    const modal = document.getElementById('usersModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalUserList = document.getElementById('modalUserList');

    modalUserList.innerHTML = '';

    if (type === 'followers') {
        modalTitle.textContent = '粉丝列表';
        renderUserList(followerUsers, 'modalUserList', false);
    } else if (type === 'following') {
        modalTitle.textContent = '关注列表';
        renderUserList(followingUsers, 'modalUserList', false);
    }

    modal.classList.add('active');
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    renderPosts();
    renderUserList(followingUsers, 'followingList');
    renderUserList(followerUsers, 'followersList');
    renderUserList(suggestedUsers, 'suggestedUsers');
});
