// 购物车按钮组件
const { useState } = React;

function CartButton({ product, selectedSpecs, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');

    const handleQuantityChange = (delta) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= 99) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        // 检查是否选择了所有规格
        if (!selectedSpecs || Object.keys(selectedSpecs).length === 0) {
            setMessage('请先选择商品规格');
            setTimeout(() => setMessage(''), 2000);
            return;
        }

        const cartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            specs: selectedSpecs
        };

        if (onAddToCart) {
            onAddToCart(cartItem);
        }

        setMessage(`已添加 ${quantity} 件商品到购物车`);
        setTimeout(() => setMessage(''), 2000);
        setQuantity(1);
    };

    return (
        <div className="cart-actions">
            <div className="quantity-selector">
                <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                >
                    -
                </button>
                <input
                    type="number"
                    className="quantity-input"
                    value={quantity}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= 99) {
                            setQuantity(val);
                        }
                    }}
                    min="1"
                    max="99"
                />
                <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 99}
                >
                    +
                </button>
            </div>
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
                加入购物车
            </button>
            {message && <div className="cart-message">{message}</div>}
        </div>
    );
}
