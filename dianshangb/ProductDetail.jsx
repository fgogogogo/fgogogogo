// 商品详情页主组件
const { useState } = React;

function ProductDetail({ product }) {
    const [selectedSpecs, setSelectedSpecs] = useState(null);

    const handleSpecChange = (specs) => {
        setSelectedSpecs(specs);
    };

    const handleAddToCart = (cartItem) => {
        console.log('添加到购物车:', cartItem);
        // 这里可以调用API将商品添加到购物车
    };

    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    return (
        <div className="product-detail">
            <div className="product-gallery">
                <ImageCarousel images={product.images} />
            </div>

            <div className="product-info">
                <h1 className="product-name">{product.name}</h1>

                <div className="product-price-box">
                    <div className="price-row">
                        <span className="price">¥{product.price}</span>
                        {discount > 0 && (
                            <span className="discount-tag">{discount}折</span>
                        )}
                    </div>
                    {product.originalPrice > product.price && (
                        <div className="original-price">原价：¥{product.originalPrice}</div>
                    )}
                </div>

                <div className="product-stats">
                    <span className="stat">销量：{product.sales}</span>
                    <span className="stat">库存：{product.stock}</span>
                    <span className="stat">评分：⭐ {product.rating}</span>
                </div>

                <div className="product-description">
                    <h2>商品介绍</h2>
                    <p>{product.description}</p>
                </div>

                <div className="product-specs">
                    <SpecSelector
                        specs={product.specs}
                        onSpecChange={handleSpecChange}
                    />
                </div>

                <div className="product-actions">
                    <CartButton
                        product={product}
                        selectedSpecs={selectedSpecs}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>
        </div>
    );
}
