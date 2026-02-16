import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [rating, setRating] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        if (!open) return;
        
        setName(initialProduct?.name ?? "");
        setCategory(initialProduct?.category ?? "");
        setDescription(initialProduct?.description ?? "");
        setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
        setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");
        setRating(initialProduct?.rating != null ? String(initialProduct.rating) : "5.0");
        setImage(initialProduct?.image ?? "");
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === "edit" ? "Редактирование карточки питомца" : "Создание карточки питомца";

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedPrice = Number(price);
        const parsedStock = Number(stock);
        const parsedRating = Number(rating);
        const trimmedImage = image.trim();
        
        if (!trimmedName) {
            alert("Введите название (имя)");
            return;
        }
        
        if (!trimmedCategory) {
            alert("Введите категорию");
            return;
        }
        
        if (!trimmedDescription) {
            alert("Введите описание");
            return;
        }
        
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            alert("Введите корректную цену");
            return;
        }
        
        if (!Number.isFinite(parsedStock) || parsedStock < 0) {
            alert("Введите корректное количество");
            return;
        }

        if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            alert("Введите корректный рейтинг (от 0 до 5)");
            return;
        }
        
        onSubmit({
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDescription,
            price: parsedPrice,
            stock: parsedStock,
            rating: parsedRating,
            image: trimmedImage || undefined
        });
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        X
                    </button>
                </div>
                
                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название (имя)
                        <input 
                            className="input" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="..." 
                            autoFocus 
                        />
                    </label>
                    
                    <label className="label">
                        Категория
                        <input 
                            className="input" 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            placeholder="..." 
                        />
                    </label>
                    
                    <label className="label">
                        Описание
                        <input 
                            className="input" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="..." 
                        />
                    </label>
                    
                    <label className="label">
                        Цена
                        <input 
                            className="input" 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)} 
                            placeholder="..." 
                            inputMode="numeric" 
                        />
                    </label>
                    
                    <label className="label">
                        Количество в питомнике
                        <input 
                            className="input" 
                            value={stock} 
                            onChange={(e) => setStock(e.target.value)} 
                            placeholder="..." 
                            inputMode="numeric" 
                        />
                    </label>

                    <label className="label">
                        Рейтинг (от 0 до 5)
                        <input 
                            className="input" 
                            value={rating} 
                            onChange={(e) => setRating(e.target.value)} 
                            placeholder="..." 
                            inputMode="decimal" 
                        />
                    </label>

                    <label className="label">
                        Ссылка на фото
                        <input 
                            className="input" 
                            value={image} 
                            onChange={(e) => setImage(e.target.value)} 
                            placeholder="/images/bonifacia.jpg или https://..." 
                        />
                    </label>
                    
                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}