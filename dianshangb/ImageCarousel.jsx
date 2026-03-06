// 图片轮播组件
const { useState } = React;

function ImageCarousel({ images }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) {
        return <div className="carousel-empty">暂无图片</div>;
    }

    return (
        <div className="carousel-container">
            <div className="main-image">
                <button className="carousel-arrow prev" onClick={goToPrevious}>
                    ‹
                </button>
                <img
                    src={images[currentIndex]}
                    alt={`商品图片 ${currentIndex + 1}`}
                    className="carousel-image"
                />
                <button className="carousel-arrow next" onClick={goToNext}>
                    ›
                </button>
            </div>
            <div className="thumbnails">
                {images.map((image, index) => (
                    <img
                        key={index}
                        src={image}
                        alt={`缩略图 ${index + 1}`}
                        className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                    />
                ))}
            </div>
        </div>
    );
}
