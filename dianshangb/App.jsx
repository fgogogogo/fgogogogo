// React应用主组件
const { useState } = React;

function App() {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        setCartItems([...cartItems, item]);
    };

    const handleAddToCart = (cartItem) => {
        addToCart(cartItem);
        console.log('当前购物车:', [...cartItems, cartItem]);
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="container">
                    <h1>🛍️ 电商平台</h1>
                    <nav className="nav">
                        <a href="#" className="active">商品详情</a>
                        <a href="#">购物车 ({cartItems.length})</a>
                        <a href="#">我的</a>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                <div className="container">
                    <ProductDetail
                        product={productData}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </main>

            <footer className="app-footer">
                <div className="container">
                    <p>&copy; 2024 电商平台 - React商品详情页示例</p>
                </div>
            </footer>
        </div>
    );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
