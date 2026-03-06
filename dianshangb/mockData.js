// 模拟商品数据
const productData = {
    id: 1,
    name: '时尚休闲运动鞋',
    price: 299,
    originalPrice: 599,
    description: '采用优质材料制作，舒适透气，适合日常穿着。多种颜色可选，满足你的个性需求。',
    images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop'
    ],
    specs: [
        {
            name: '颜色',
            options: [
                { id: 'color-1', name: '黑色', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop' },
                { id: 'color-2', name: '白色', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&h=100&fit=crop' },
                { id: 'color-3', name: '红色', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=100&fit=crop' }
            ]
        },
        {
            name: '尺码',
            options: [
                { id: 'size-1', name: '38' },
                { id: 'size-2', name: '39' },
                { id: 'size-3', name: '40' },
                { id: 'size-4', name: '41' },
                { id: 'size-5', name: '42' },
                { id: 'size-6', name: '43' }
            ]
        }
    ],
    stock: 999,
    sales: 2341,
    rating: 4.8
};
