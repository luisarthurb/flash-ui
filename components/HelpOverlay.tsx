/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TUTORIAL_STEPS } from '../constants';

interface HelpOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const step = TUTORIAL_STEPS[currentStep];

    const updateSpotlight = useCallback(() => {
        if (!step) return;
        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setSpotlightRect(rect);
        } else {
            setSpotlightRect(null);
        }
    }, [step]);

    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(0);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        updateSpotlight();
        const handleResize = () => updateSpotlight();
        window.addEventListener('resize', handleResize);
        // Small delay to ensure DOM is ready
        const timer = setTimeout(updateSpotlight, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [isOpen, currentStep, updateSpotlight]);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSkip();
        }
    };

    const handleSkip = () => {
        try {
            localStorage.setItem('menuFlash_tutorialSeen', 'true');
        } catch (e) { /* ignore */ }
        onClose();
    };

    if (!isOpen || !step) return null;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!spotlightRect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }

        const padding = 16;

        if (step.position === 'top') {
            return {
                bottom: `${window.innerHeight - spotlightRect.top + padding}px`,
                left: `${spotlightRect.left + spotlightRect.width / 2}px`,
                transform: 'translateX(-50%)',
            };
        }

        // left
        return {
            top: `${spotlightRect.top + spotlightRect.height / 2}px`,
            right: `${window.innerWidth - spotlightRect.left + padding}px`,
            transform: 'translateY(-50%)',
        };
    };

    // Spotlight mask
    const getMaskStyle = (): React.CSSProperties => {
        if (!spotlightRect) return {};
        const pad = 8;
        const x = spotlightRect.left - pad;
        const y = spotlightRect.top - pad;
        const w = spotlightRect.width + pad * 2;
        const h = spotlightRect.height + pad * 2;
        const r = 12;

        return {
            maskImage: `url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='${window.innerWidth}' height='${window.innerHeight}'><rect width='100%' height='100%' fill='white'/><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${r}' fill='black'/></svg>`
            )}")`,
            WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='${window.innerWidth}' height='${window.innerHeight}'><rect width='100%' height='100%' fill='white'/><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${r}' fill='black'/></svg>`
            )}")`,
        };
    };

    return (
        <div className="help-overlay" ref={overlayRef}>
            <div className="help-overlay-bg" style={getMaskStyle()} onClick={handleSkip} />

            <div className="help-tooltip" style={getTooltipStyle()}>
                <div className="help-tooltip-step">
                    {currentStep + 1} / {TUTORIAL_STEPS.length}
                </div>
                <p className="help-tooltip-text">{step.text}</p>
                <div className="help-tooltip-actions">
                    <button className="help-skip-btn" onClick={handleSkip}>
                        Pular Tutorial
                    </button>
                    <button className="help-next-btn" onClick={handleNext}>
                        {currentStep < TUTORIAL_STEPS.length - 1 ? 'Próximo →' : 'Concluir ✓'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpOverlay;
