import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
    // Функция для отображения звёздочек рейтинга
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('★');
            } else if (i === fullStars && hasHalfStar) {
                stars.push('½');
            } else {
                stars.push('☆');
            }
        }
        return stars.join(' ');
    };

    return (
        <div className="productRow">
            <div className="productImage">
                <img src={product.image} alt={product.name} />
            </div>
            <div className="productMain">
                <div className="productId">#{product.id}</div>
                <div className="productName">{product.name}</div>
                <div className="productCategory">{product.category}</div>
                <div className="productPrice">{product.price} ₽</div>
                <div className="productStock">в наличии: {product.stock}</div>
                <div className="productRating">
                    <span className="stars">{renderStars(product.rating)}</span>
                    <span className="ratingValue">({product.rating})</span>
                </div>
                <div className="productDescription">{product.description}</div>
            </div>
            <div className="productActions">
                <button className="btn" onClick={() => onEdit(product)}>
                    Редактировать
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}