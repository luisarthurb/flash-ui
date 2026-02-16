/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PaperSize } from '../types';
import { ITEMS_PER_PAGE_LIMITS } from '../constants';

interface QuantitySelectorProps {
    value: number;
    onChange: (value: number) => void;
    paperSize: PaperSize;
    disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ value, onChange, paperSize, disabled }) => {
    const limits = ITEMS_PER_PAGE_LIMITS[paperSize.name] || { min: 1, max: 20, default: 8 };
    const isAtMin = value <= limits.min;
    const isAtMax = value >= limits.max;

    const handleDecrement = () => {
        if (!isAtMin) onChange(value - 1);
    };

    const handleIncrement = () => {
        if (!isAtMax) onChange(value + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseInt(e.target.value, 10);
        if (!isNaN(num)) {
            onChange(Math.max(limits.min, Math.min(limits.max, num)));
        }
    };

    return (
        <div className="items-per-page-input" title={`Itens por Página (máx ${limits.max} para ${paperSize.name})`}>
            <button
                className="qty-btn"
                onClick={handleDecrement}
                disabled={disabled || isAtMin}
                aria-label="Diminuir"
            >
                −
            </button>
            <input
                type="number"
                className="qty-value"
                value={value}
                onChange={handleInputChange}
                min={limits.min}
                max={limits.max}
                disabled={disabled}
            />
            <button
                className="qty-btn"
                onClick={handleIncrement}
                disabled={disabled || isAtMax}
                aria-label="Aumentar"
            >
                +
            </button>
            <span className="qty-label">Itens/Pág</span>
        </div>
    );
};

export default QuantitySelector;
