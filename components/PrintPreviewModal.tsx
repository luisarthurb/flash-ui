/**
 * PrintPreviewModal - Shows a full-screen preview of the menu at exact paper dimensions
 * and allows generating a PDF via the browser's native print dialog (Save as PDF).
 */
import React, { useRef, useState } from 'react';
import { PaperSize } from '../types';

interface PrintPreviewModalProps {
    html: string;
    paperSize: PaperSize;
    isOpen: boolean;
    onClose: () => void;
}

const PrintPreviewModal = ({ html, paperSize, isOpen, onClose }: PrintPreviewModalProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    // Strip editor scripts and toolbar from HTML
    const cleanHtmlForPrint = (rawHtml: string) => {
        return rawHtml
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/contenteditable="true"/gi, '')
            .replace(/contenteditable="false"/gi, '');
    };

    const handleDownloadPdf = async () => {
        setIsGenerating(true);
        try {
            const cleanedHtml = cleanHtmlForPrint(html);

            // Inject print-optimized CSS into the HTML
            const printCss = `
                <style>
                    @page { 
                        size: ${paperSize.cssSize}; 
                        margin: 0; 
                    }
                    html, body { 
                        width: ${paperSize.widthPx}px;
                        margin: 0 auto;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    #floating-toolbar { display: none !important; }
                    * { 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @media print {
                        html, body {
                            width: ${paperSize.widthPx}px;
                        }
                    }
                </style>
            `;

            // Inject the print CSS
            let printHtml = cleanedHtml;
            if (printHtml.includes('</head>')) {
                printHtml = printHtml.replace('</head>', `${printCss}</head>`);
            } else if (printHtml.includes('<body')) {
                printHtml = printHtml.replace('<body', `${printCss}<body`);
            } else {
                printHtml = printCss + printHtml;
            }

            // Open a new window with the clean HTML and trigger print
            const printWindow = window.open('', '_blank', `width=${paperSize.widthPx},height=${paperSize.heightPx}`);
            if (!printWindow) {
                alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
                setIsGenerating(false);
                return;
            }

            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();

            // Wait for images to load, then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    setIsGenerating(false);
                }, 800);
            };

            // Fallback if onload doesn't fire
            setTimeout(() => {
                if (isGenerating) {
                    printWindow.print();
                    setIsGenerating(false);
                }
            }, 3000);

        } catch (e: any) {
            console.error('Print error:', e);
            alert('Failed to open print dialog: ' + e.message);
            setIsGenerating(false);
        }
    };

    // Clean HTML for preview iframe
    const previewHtml = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/contenteditable="true"/gi, 'contenteditable="false"')
        .replace(
            '</head>',
            `<style>
                @page { size: ${paperSize.cssSize}; margin: 0; }
                html, body { 
                    width: ${paperSize.widthPx}px; 
                    margin: 0 auto;
                    overflow-x: hidden;
                }
                #floating-toolbar { display: none !important; }
            </style></head>`
        );

    return (
        <div className="print-preview-overlay" onClick={onClose}>
            <div className="print-preview-container" onClick={(e) => e.stopPropagation()}>
                <div className="print-preview-header">
                    <div className="print-preview-title">
                        <span className="print-preview-icon">📄</span>
                        <span>Print Preview</span>
                        <span className="print-preview-size-badge">{paperSize.name} — {paperSize.widthMm}×{paperSize.heightMm}mm</span>
                    </div>
                    <div className="print-preview-actions">
                        <button
                            className="print-preview-btn cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="print-preview-btn download"
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>⏳ Opening Print...</>
                            ) : (
                                <>🖨️ Print / Save PDF</>
                            )}
                        </button>
                    </div>
                </div>
                <div className="print-preview-body">
                    <div
                        className="print-preview-page"
                        style={{
                            width: `${paperSize.widthPx}px`,
                            aspectRatio: `${paperSize.widthMm} / ${paperSize.heightMm}`,
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            srcDoc={previewHtml}
                            title="print-preview"
                            sandbox="allow-same-origin"
                            className="print-preview-iframe"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;
