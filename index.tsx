/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, PaperSize } from './types';
import { INITIAL_PLACEHOLDERS, PALETTE_PRESETS, FONTS, INJECTED_EDITOR_SCRIPT, PAPER_SIZES, DEFAULT_PAPER_SIZE } from './constants';
import { generateId } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import PrintPreviewModal from './components/PrintPreviewModal';
import ElementTreePanel, { TreeNode } from './components/ElementTreePanel';
import HelpOverlay from './components/HelpOverlay';
import {
    ThinkingIcon,
    CodeIcon,
    SparklesIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    GridIcon,
    PrinterIcon,
    UploadIcon,
    ImageIcon,
    TreeIcon,
    TextIcon,
    DividerIcon
} from './components/Icons';

function App() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
    const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);

    const [inputValue, setInputValue] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Advanced Style State
    const [selectedFont, setSelectedFont] = useState<string>('');
    const [paletteName, setPaletteName] = useState<string>('Custom');
    const [colors, setColors] = useState({
        primary: '#000000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#000000'
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);

    const [drawerState, setDrawerState] = useState<{
        isOpen: boolean;
        mode: 'code' | 'variations' | null;
        title: string;
        data: any;
    }>({ isOpen: false, mode: null, title: '', data: null });

    const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
    const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);
    const [printPreviewState, setPrintPreviewState] = useState<{ isOpen: boolean; html: string }>({ isOpen: false, html: '' });

    // Element Tree Panel state
    const [isTreeOpen, setIsTreeOpen] = useState(false);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [selectedElementPath, setSelectedElementPath] = useState<number[] | null>(null);

    // Contextual element editing state
    const [selectedElementInfo, setSelectedElementInfo] = useState<{
        path: number[];
        html: string;
        tagName: string;
        snippet: string;
    } | null>(null);
    const [isEditingElement, setIsEditingElement] = useState(false);

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridScrollRef = useRef<HTMLDivElement>(null);

    // Auto-open tutorial on first visit
    useEffect(() => {
        try {
            if (!localStorage.getItem('menuFlash_tutorialSeen')) {
                const timer = setTimeout(() => setShowTutorial(true), 1500);
                return () => clearTimeout(timer);
            }
        } catch (e) { /* ignore */ }
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Fix for mobile: reset scroll when focusing an item
    useEffect(() => {
        if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
            if (gridScrollRef.current) {
                gridScrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }
    }, [focusedArtifactIndex]);

    // Cycle placeholders
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.target.value);
        // Auto-resize
        event.target.style.height = 'auto';
        event.target.style.height = `${Math.min(event.target.scrollHeight, 150)}px`;
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                event.preventDefault(); // Prevent pasting binary text
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setSelectedImage(e.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                }
                return; // Take first image
            }
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Preset Selection Handler
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        setPaletteName(name);
        const preset = PALETTE_PRESETS.find(p => p.name === name);
        if (preset) {
            setColors(preset.colors);
        }
    };

    const handleColorChange = (key: keyof typeof colors, val: string) => {
        setColors(prev => ({ ...prev, [key]: val }));
        setPaletteName('Custom');
    };

    // --- AI Image Editing Logic ---
    const handleImageEdit = useCallback(async (editPrompt: string, imageSrc: string) => {
        if (!process.env.API_KEY) {
            alert("API Key missing");
            return;
        }
        setIsLoading(true);

        try {
            // 1. Get Base64
            let base64Data = '';
            let mimeType = 'image/jpeg';

            if (imageSrc.startsWith('data:')) {
                const parts = imageSrc.split(',');
                mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                base64Data = parts[1];
            } else {
                try {
                    const resp = await fetch(imageSrc);
                    const blob = await resp.blob();
                    mimeType = blob.type;
                    base64Data = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    alert("Could not access this image. It might be protected (CORS). Try uploading it manually first.");
                    setIsLoading(false);
                    return;
                }
            }

            // 2. Call Gemini
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        {
                            text: `Task: Edit this product image.
User Request: "${editPrompt}"
STRICT CONSTRAINT: Keep the main product/subject EXACTLY as it is in the original image. Do not change its texture, label, shape, or core details. It is critical to preserve the product authenticity. Only modify the background, lighting, or environment to match the user request.` }
                    ]
                }
            });

            // 3. Extract Result
            let newImageSrc = null;
            if (result.candidates?.[0]?.content?.parts) {
                for (const part of result.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImageSrc = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }

            // 4. Update Artifact HTML
            if (newImageSrc) {
                setSessions(prev => prev.map((sess, i) => {
                    if (i !== currentSessionIndex) return sess;
                    return {
                        ...sess,
                        artifacts: sess.artifacts.map((art, j) => {
                            // Check if focused, or update all if multiple (simplification: update focused or find by unique ID)
                            // Since we don't have unique IDs per image element easily, we replace the exact string source.
                            // If the same image appears twice, both get updated, which is usually desired behavior.
                            if (j === focusedArtifactIndex || focusedArtifactIndex === null) {
                                const newHtml = art.html.replace(imageSrc, newImageSrc);
                                return { ...art, html: newHtml };
                            }
                            return art;
                        })
                    };
                }));
            } else {
                console.log(result);
                alert("AI processed the request but didn't return an image. Try a different prompt.");
            }

        } catch (e) {
            console.error("Image edit error", e);
            alert("Failed to edit image. " + (e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionIndex, focusedArtifactIndex]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!event.data || !event.data.type) return;
            switch (event.data.type) {
                case 'AI_IMAGE_EDIT': {
                    const { prompt, src } = event.data;
                    handleImageEdit(prompt, src);
                    break;
                }
                case 'TREE_DATA': {
                    setTreeData(event.data.tree || []);
                    break;
                }
                case 'HTML_SYNC': {
                    // Sync the iframe HTML back to React state
                    if (focusedArtifactIndex !== null && event.data.html) {
                        setSessions(prev => prev.map((sess, i) =>
                            i === currentSessionIndex ? {
                                ...sess,
                                artifacts: sess.artifacts.map((art, j) =>
                                    j === focusedArtifactIndex ? { ...art, html: event.data.html } : art
                                )
                            } : sess
                        ));
                    }
                    break;
                }
                case 'ELEMENT_CLICKED': {
                    if (event.data.path) {
                        if (isTreeOpen) setSelectedElementPath(event.data.path);
                        // Store element info for contextual editing
                        if (focusedArtifactIndex !== null && event.data.html) {
                            setSelectedElementInfo({
                                path: event.data.path,
                                html: event.data.html,
                                tagName: event.data.tagName || 'ELEMENT',
                                snippet: event.data.snippet || ''
                            });
                        }
                    }
                    break;
                }
                case 'CONTENT_HEIGHT': {
                    // Auto-resize the focused iframe to match content
                    if (focusedArtifactIndex !== null && event.data.height) {
                        const currentSession = sessions[currentSessionIndex];
                        if (currentSession) {
                            const artifact = currentSession.artifacts[focusedArtifactIndex];
                            const iframes = document.querySelectorAll('iframe');
                            iframes.forEach((iframe) => {
                                if (iframe.title === artifact.id) {
                                    iframe.style.height = event.data.height + 'px';
                                }
                            });
                        }
                    }
                    break;
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleImageEdit, focusedArtifactIndex, currentSessionIndex, isTreeOpen]);


    const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
        let buffer = '';
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (typeof text !== 'string') continue;
            buffer += text;
            let braceCount = 0;
            let start = buffer.indexOf('{');
            while (start !== -1) {
                braceCount = 0;
                let end = -1;
                for (let i = start; i < buffer.length; i++) {
                    if (buffer[i] === '{') braceCount++;
                    else if (buffer[i] === '}') braceCount--;
                    if (braceCount === 0 && i > start) {
                        end = i;
                        break;
                    }
                }
                if (end !== -1) {
                    const jsonString = buffer.substring(start, end + 1);
                    try {
                        yield JSON.parse(jsonString);
                        buffer = buffer.substring(end + 1);
                        start = buffer.indexOf('{');
                    } catch (e) {
                        start = buffer.indexOf('{', start + 1);
                    }
                } else {
                    break;
                }
            }
        }
    };

    const handlePrint = () => {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || focusedArtifactIndex === null) return;
        const artifact = currentSession.artifacts[focusedArtifactIndex];

        // Get the current HTML from the iframe (captures user edits)
        const iframes = document.querySelectorAll('iframe');
        let currentHtml = artifact.html;
        iframes.forEach((iframe) => {
            if (iframe.title === artifact.id && iframe.contentDocument) {
                currentHtml = iframe.contentDocument.documentElement.outerHTML;
            }
        });

        setPrintPreviewState({ isOpen: true, html: currentHtml });
    };

    // Helper to inject the editor script before the closing body tag
    const injectHtml = (html: string) => {
        if (!html) return html;
        if (html.includes('</body>')) {
            return html.replace('</body>', `${INJECTED_EDITOR_SCRIPT}</body>`);
        }
        return html + INJECTED_EDITOR_SCRIPT;
    };

    const handleGenerateVariations = useCallback(async () => {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || focusedArtifactIndex === null) return;
        const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

        setIsLoading(true);
        setComponentVariations([]);
        setDrawerState({ isOpen: true, mode: 'variations', title: 'Menu Variations', data: currentArtifact.id });

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
You are a Michelin-star Menu Designer. Generate 3 DISTINCT VISUAL VARIATIONS of the menu provided in the previous turn.

**TASK:**
Create high-fidelity HTML/CSS menus. 
The user must be able to PRINT these to PDF.
Focus on typography, whitespace, and paper texture simulation.

**VARIATION TYPES:**
1. "Minimalist Fine Dining" (Serif fonts, lots of whitespace, elegant lines).
2. "Modern Bistro" (Bold sans-serif, grid layout, perhaps a border).
3. "Thematic/Creative" (Based on the food items - e.g. if Italian, use warm tones; if Sushi, use Zen styling).

**REQUIRED functionality in HTML:**
- \`<body contenteditable="true">\` so user can click and edit ANY text.
- Do NOT add external script tags for interactivity, I will inject them.
- \`@media print\` css to hide backgrounds/margins if needed and ensure 100% width.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Style Name", "html": "..." }\`
        `.trim();

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: [{ text: `Original Request: ${currentSession.prompt}` }] },
                    { role: 'model', parts: [{ text: "Acknowledged." }] },
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                config: { temperature: 1.2 }
            });

            for await (const variation of parseJsonStream(responseStream)) {
                if (variation.name && variation.html) {
                    // Inject the script here before saving
                    const finalHtml = injectHtml(variation.html);
                    setComponentVariations(prev => [...prev, { ...variation, html: finalHtml }]);
                }
            }
        } catch (e: any) {
            console.error("Error generating variations:", e);
        } finally {
            setIsLoading(false);
        }
    }, [sessions, currentSessionIndex, focusedArtifactIndex]);

    const applyVariation = (html: string) => {
        if (focusedArtifactIndex === null) return;
        setSessions(prev => prev.map((sess, i) =>
            i === currentSessionIndex ? {
                ...sess,
                artifacts: sess.artifacts.map((art, j) =>
                    j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
                )
            } : sess
        ));
        setDrawerState(s => ({ ...s, isOpen: false }));
    };

    const handleShowCode = () => {
        const currentSession = sessions[currentSessionIndex];
        if (currentSession && focusedArtifactIndex !== null) {
            const artifact = currentSession.artifacts[focusedArtifactIndex];
            setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
        }
    };

    // --- Element Tree Panel Handlers ---
    const sendToFocusedIframe = useCallback((message: any) => {
        if (focusedArtifactIndex === null) return;
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession) return;
        const artifact = currentSession.artifacts[focusedArtifactIndex];
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
            if (iframe.title === artifact.id && iframe.contentWindow) {
                iframe.contentWindow.postMessage(message, '*');
            }
        });
    }, [focusedArtifactIndex, sessions, currentSessionIndex]);

    const handleOpenTree = useCallback(() => {
        setIsTreeOpen(true);
        setSelectedElementPath(null);
        // Request tree data from iframe
        setTimeout(() => sendToFocusedIframe({ type: 'GET_TREE' }), 100);
    }, [sendToFocusedIframe]);

    const handleTreeSelect = useCallback((path: number[]) => {
        setSelectedElementPath(path);
        sendToFocusedIframe({ type: 'SELECT_ELEMENT', path });
    }, [sendToFocusedIframe]);

    const handleTreeDelete = useCallback((path: number[]) => {
        sendToFocusedIframe({ type: 'DELETE_ELEMENT', path });
        setSelectedElementPath(null);
    }, [sendToFocusedIframe]);

    const handleTreeMove = useCallback((path: number[], direction: 'up' | 'down') => {
        sendToFocusedIframe({ type: 'MOVE_ELEMENT', path, direction });
    }, [sendToFocusedIframe]);

    const handleTreeInsert = useCallback((html: string, position: 'top' | 'after', path?: number[]) => {
        sendToFocusedIframe({ type: 'INSERT_ELEMENT', html, position, path: path || undefined });
    }, [sendToFocusedIframe]);

    // Contextual element editing via AI
    const handleEditElement = useCallback(async (instruction: string) => {
        if (!selectedElementInfo || !instruction.trim() || isEditingElement) return;
        setIsEditingElement(true);
        setInputValue('');

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error('API_KEY is not configured.');
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
You are editing a SPECIFIC element in a restaurant menu HTML document.

**CURRENT ELEMENT HTML:**
${selectedElementInfo.html}

**USER INSTRUCTION:**
"${instruction}"

**STRICT RULES:**
1. Return ONLY the edited HTML fragment — no markdown, no code fences, no explanation.
2. Keep the same general styling (inline styles, classes) unless the user asks to change it.
3. All text elements MUST have contenteditable="true".
4. If the user says "add" something, ADD it to the existing content, don't replace everything.
5. If the user says "remove" or "delete", remove only what they specify.
6. Preserve the existing structure and formatting as much as possible.
7. Return clean HTML that can be directly inserted into the document.
            `.trim();

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { role: 'user', parts: [{ text: prompt }] }
            });

            let editedHtml = (response.text || '').trim();
            if (editedHtml.startsWith('```html')) editedHtml = editedHtml.substring(7).trimStart();
            if (editedHtml.startsWith('```')) editedHtml = editedHtml.substring(3).trimStart();
            if (editedHtml.endsWith('```')) editedHtml = editedHtml.substring(0, editedHtml.length - 3).trimEnd();

            if (editedHtml) {
                sendToFocusedIframe({ type: 'EDIT_ELEMENT', path: selectedElementInfo.path, html: editedHtml });
                setSelectedElementInfo(null);
            }
        } catch (e: any) {
            console.error('Error editing element:', e);
        } finally {
            setIsEditingElement(false);
        }
    }, [selectedElementInfo, isEditingElement, sendToFocusedIframe]);

    const handleSendMessage = useCallback(async (manualPrompt?: string) => {
        const promptToUse = manualPrompt || inputValue;
        const trimmedInput = promptToUse.trim();

        if (!trimmedInput || isLoading) return;

        // If an element is selected in focus mode, edit that element instead
        if (focusedArtifactIndex !== null && selectedElementInfo) {
            handleEditElement(trimmedInput);
            return;
        }

        if (!manualPrompt) setInputValue('');
        if (!manualPrompt) setSelectedImage(null);

        setIsLoading(true);
        const baseTime = Date.now();
        const sessionId = generateId();

        const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
            id: `${sessionId}_${i}`,
            styleName: 'Designing...',
            html: '',
            status: 'streaming',
        }));

        const newSession: Session = {
            id: sessionId,
            prompt: trimmedInput,
            timestamp: baseTime,
            artifacts: placeholderArtifacts,
            paperSize: selectedPaperSize
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length);
        setFocusedArtifactIndex(null);
        setSelectedElementInfo(null);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

            const contentParts: any[] = [{ text: trimmedInput }];
            if (selectedImage) {
                const base64Data = selectedImage.split(',')[1];
                contentParts.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }
                });
            }

            const stylePrompt = `
You are a world-class Menu Designer. Analyze the user's input.

**USER PREFERENCES:**
- Typography Preference: ${selectedFont || "Decide based on content"}
- **STRICT COLOR PALETTE:**
  - Primary (Headings/Accents): ${colors.primary}
  - Secondary (Subtitles/Borders): ${colors.secondary}
  - Background: ${colors.background}
  - Text: ${colors.text}

**GOAL:**
Generate 3 creative, print-ready menu design concepts using the EXACT colors provided above.

**STRICT RULES:**
1. Use the EXACT items provided by the user.
2. ${selectedImage ? `A REFERENCE IMAGE IS PROVIDED. This is CRITICAL:
   - Design 1 MUST be an almost EXACT replica of the reference image's layout, typography, spacing, visual hierarchy, and overall composition. Copy the structure faithfully.
   - Design 2 should be a close variation of the reference, keeping the same spirit but with minor creative differences.
   - Design 3 can be a more creative interpretation, but still clearly inspired by the reference.` : 'Create 3 distinct, creative design variations.'}
3. Return ONLY a raw JSON array of 3 descriptive style names (e.g. ["Elegant Serif Layout", "Modern Grid with Photos", "Rustic Paper Texture"]).
        `.trim();

            // 1. Generate Styles
            const styleResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    role: 'user',
                    parts: [
                        ...contentParts,
                        { text: stylePrompt }
                    ]
                }
            });

            let generatedStyles: string[] = [];
            const styleText = styleResponse.text || '[]';
            const jsonMatch = styleText.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                try {
                    generatedStyles = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.warn("Failed to parse styles, using fallbacks");
                }
            }

            if (!generatedStyles || generatedStyles.length < 3) {
                generatedStyles = [
                    "Classic Elegant Menu",
                    "Modern Visual Grid",
                    "Bold Typographic Layout"
                ];
            }

            generatedStyles = generatedStyles.slice(0, 3);

            setSessions(prev => prev.map(s => {
                if (s.id !== sessionId) return s;
                return {
                    ...s,
                    artifacts: s.artifacts.map((art, i) => ({
                        ...art,
                        styleName: generatedStyles[i]
                    }))
                };
            }));

            // 2. Generate HTML for each
            const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
                try {
                    const prompt = `
You are a Menu Printing Expert. Generate HTML/CSS for a restaurant menu.

**INPUT DATA:**
"${trimmedInput}"

**DESIGN DIRECTION:** ${styleInstruction}
${selectedImage ? `
**⚠️ REFERENCE IMAGE PROVIDED — THIS IS THE HIGHEST PRIORITY:**
A reference image has been provided. You MUST closely replicate:
- The EXACT layout structure (columns, spacing, alignment, positioning)
- The typography scale and hierarchy (title size, category headers, item text, price alignment)
- The overall visual composition (where elements are placed on the page)
- The decorative elements style (illustrations, borders, dividers, logos)
- The spacing and whitespace patterns
The generated menu should look like a near-identical twin of the reference image, adapted only for the user's content and colors below.
` : ''}
**USER CONSTRAINTS (YOU MUST COMPLY):**
- **BACKGROUND COLOR:** ${colors.background}
- **PRIMARY COLOR (Headings/Accents):** ${colors.primary}
- **SECONDARY COLOR:** ${colors.secondary}
- **TEXT COLOR:** ${colors.text}
- **TYPOGRAPHY:** ${selectedFont ? `Strictly use "${selectedFont}" fonts.` : "Use fonts matching the style."}

**CRITICAL TECHNICAL REQUIREMENTS:**
1. **EDITABILITY**: All text elements (titles, prices, descriptions) MUST have \`contenteditable="true"\`.
2. **IMAGES**: If the user didn't provide image URLs, use placeholder images (e.g. via unsplash source). ${selectedPaperSize.name === 'A5' ? 'Use SMALL, compact images (max 120px wide) since this is a small A5 format.' : selectedPaperSize.name === 'A3' ? 'Use LARGE, high-quality images since this is a big A3 format.' : 'Use medium-sized images appropriate for the format.'}
3. **PRINT READY**: 
   - **Paper Size: ${selectedPaperSize.name} (${selectedPaperSize.widthMm}mm × ${selectedPaperSize.heightMm}mm)**
   - Set \`@page { margin: 0; size: ${selectedPaperSize.cssSize}; }\` in CSS.
   - Set \`html, body { width: ${selectedPaperSize.widthPx}px; margin: 0 auto; }\` for exact dimensions.
   - Use high-contrast text for print legibility.
4. **LAYOUT**: Ensure prices are aligned clearly. Use dots/leaders if it's a list style.

Return ONLY RAW HTML. No markdown.
          `.trim();

                    const responseStream = await ai.models.generateContentStream({
                        model: 'gemini-3-flash-preview',
                        contents: [
                            { role: "user", parts: [...contentParts, { text: prompt }] }
                        ],
                    });

                    let accumulatedHtml = '';
                    for await (const chunk of responseStream) {
                        const text = chunk.text;
                        if (typeof text === 'string') {
                            accumulatedHtml += text;
                            setSessions(prev => prev.map(sess =>
                                sess.id === sessionId ? {
                                    ...sess,
                                    artifacts: sess.artifacts.map(art =>
                                        art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                    )
                                } : sess
                            ));
                        }
                    }

                    let finalHtml = accumulatedHtml.trim();
                    if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                    if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                    if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                    // Inject Editor Script
                    finalHtml = injectHtml(finalHtml);

                    setSessions(prev => prev.map(sess =>
                        sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art =>
                                art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                            )
                        } : sess
                    ));

                } catch (e: any) {
                    console.error('Error generating artifact:', e);
                    setSessions(prev => prev.map(sess =>
                        sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art =>
                                art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message}</div>`, status: 'error' } : art
                            )
                        } : sess
                    ));
                }
            };

            await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

        } catch (e) {
            console.error("Fatal error in generation process", e);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, selectedImage, isLoading, sessions.length, colors, selectedFont, focusedArtifactIndex, selectedElementInfo, handleEditElement]);

    const handleSurpriseMe = () => {
        const currentPrompt = placeholders[placeholderIndex];
        setInputValue(currentPrompt);
        handleSendMessage(currentPrompt);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !isLoading && !isEditingElement) {
            event.preventDefault();
            handleSendMessage();
        } else if (event.key === 'Tab' && !inputValue && !isLoading) {
            event.preventDefault();
            setInputValue(placeholders[placeholderIndex]);
        } else if (event.key === 'Escape' && selectedElementInfo) {
            setSelectedElementInfo(null);
        }
    };

    const nextItem = useCallback(() => {
        if (focusedArtifactIndex !== null) {
            if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
        } else {
            if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
        }
    }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

    const prevItem = useCallback(() => {
        if (focusedArtifactIndex !== null) {
            if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
        } else {
            if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
        }
    }, [currentSessionIndex, focusedArtifactIndex]);

    const isLoadingDrawer = isLoading && drawerState.mode === 'variations' && componentVariations.length === 0;

    const hasStarted = sessions.length > 0 || isLoading;
    const currentSession = sessions[currentSessionIndex];

    let canGoBack = false;
    let canGoForward = false;

    if (hasStarted) {
        if (focusedArtifactIndex !== null) {
            canGoBack = focusedArtifactIndex > 0;
            canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
        } else {
            canGoBack = currentSessionIndex > 0;
            canGoForward = currentSessionIndex < sessions.length - 1;
        }
    }

    return (
        <>
            <HelpOverlay
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />

            <ElementTreePanel
                isOpen={isTreeOpen}
                onClose={() => setIsTreeOpen(false)}
                treeData={treeData}
                selectedPath={selectedElementPath}
                onSelectElement={handleTreeSelect}
                onDeleteElement={handleTreeDelete}
                onMoveElement={handleTreeMove}
                onInsertElement={handleTreeInsert}
            />

            <PrintPreviewModal
                html={printPreviewState.html}
                paperSize={currentSession?.paperSize || selectedPaperSize}
                isOpen={printPreviewState.isOpen}
                onClose={() => setPrintPreviewState({ isOpen: false, html: '' })}
            />

            <a href="https://x.com/ammaar" target="_blank" rel="noreferrer" className={`creator-credit ${hasStarted ? 'hide-on-mobile' : ''}`}>
                created by @ammaar
            </a>

            <SideDrawer
                isOpen={drawerState.isOpen}
                onClose={() => setDrawerState(s => ({ ...s, isOpen: false }))}
                title={drawerState.title}
            >
                {isLoadingDrawer && (
                    <div className="loading-state">
                        <ThinkingIcon />
                        Designing variations...
                    </div>
                )}

                {drawerState.mode === 'code' && (
                    <pre className="code-block"><code>{drawerState.data}</code></pre>
                )}

                {drawerState.mode === 'variations' && (
                    <div className="sexy-grid">
                        {componentVariations.map((v, i) => (
                            <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                                <div className="sexy-preview">
                                    <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" />
                                </div>
                                <div className="sexy-label">{v.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </SideDrawer>

            <div className="immersive-app">
                <DottedGlowBackground
                    gap={24}
                    radius={1.5}
                    color="rgba(255, 255, 255, 0.02)"
                    glowColor="rgba(255, 255, 255, 0.15)"
                    speedScale={0.5}
                />

                <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                    <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                        <div className="empty-content">
                            <h1>Menu Flash</h1>
                            <p>Instant, printable restaurant menus from your text.</p>
                            <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}>
                                <SparklesIcon /> Try Example
                            </button>
                        </div>
                    </div>

                    {sessions.map((session, sIndex) => {
                        let positionClass = 'hidden';
                        if (sIndex === currentSessionIndex) positionClass = 'active-session';
                        else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                        else if (sIndex > currentSessionIndex) positionClass = 'future-session';

                        return (
                            <div key={session.id} className={`session-group ${positionClass}`}>
                                <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                    {session.artifacts.map((artifact, aIndex) => {
                                        const isFocused = focusedArtifactIndex === aIndex;

                                        return (
                                            <ArtifactCard
                                                key={artifact.id}
                                                artifact={artifact}
                                                isFocused={isFocused}
                                                onClick={() => setFocusedArtifactIndex(aIndex)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {canGoBack && (
                    <button className="nav-handle left" onClick={prevItem} aria-label="Previous">
                        <ArrowLeftIcon />
                    </button>
                )}
                {canGoForward && (
                    <button className="nav-handle right" onClick={nextItem} aria-label="Next">
                        <ArrowRightIcon />
                    </button>
                )}

                <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                    <div className="action-buttons">
                        <button onClick={() => { setFocusedArtifactIndex(null); setSelectedElementInfo(null); }}>
                            <GridIcon /> Grid
                        </button>
                        <button onClick={handleGenerateVariations} disabled={isLoading}>
                            <SparklesIcon /> Variations
                        </button>
                        <button onClick={handlePrint} className="print-btn">
                            <PrinterIcon /> Print PDF
                        </button>
                        <button onClick={handleShowCode}>
                            <CodeIcon /> Source
                        </button>
                        <button onClick={() => sendToFocusedIframe({ type: 'INSERT_ELEMENT', html: '<p contenteditable="true" style="padding: 8px 16px; margin: 8px 0; font-size: 16px; line-height: 1.6;">New text block — click to edit</p>' })}>
                            <TextIcon /> Text
                        </button>
                        <button onClick={() => {
                            const url = prompt('Image URL (or leave empty for placeholder):');
                            const src = url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
                            sendToFocusedIframe({ type: 'INSERT_ELEMENT', html: '<img src="' + src + '" style="max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 8px;" />' });
                        }}>
                            <ImageIcon /> Image
                        </button>
                        <button onClick={() => sendToFocusedIframe({ type: 'INSERT_ELEMENT', html: '<hr style="border: none; border-top: 2px solid currentColor; margin: 16px 0; opacity: 0.3;" />' })}>
                            <DividerIcon /> Divider
                        </button>
                        <button onClick={handleOpenTree} className="elements-btn">
                            <TreeIcon /> Elements
                        </button>
                        <button onClick={() => setShowTutorial(true)} className="help-trigger-btn" title="Ajuda">
                            ?
                        </button>
                    </div>
                    <div className="active-prompt-label">
                        Edit text directly on the page. Click images to change URL.
                    </div>
                </div>

                <div className="floating-input-container">
                    <div className={`input-wrapper ${isLoading ? 'loading' : ''} ${inputValue.length > 50 ? 'expanded' : ''}`}>

                        <div className="controls-row">
                            <select
                                className="style-select paper-size-select"
                                value={selectedPaperSize.name}
                                onChange={(e) => {
                                    const size = PAPER_SIZES.find(s => s.name === e.target.value);
                                    if (size) setSelectedPaperSize(size);
                                }}
                                disabled={isLoading}
                                title="Paper Size"
                            >
                                {PAPER_SIZES.map(s => <option key={s.name} value={s.name}>📄 {s.name}</option>)}
                            </select>

                            <select
                                className="style-select"
                                value={paletteName}
                                onChange={handlePresetChange}
                                disabled={isLoading}
                            >
                                <option value="Custom">Custom Colors</option>
                                {PALETTE_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>

                            <div className="color-pickers-group">
                                <div className="color-picker-item" title="Background Color">
                                    <input type="color" value={colors.background} onChange={(e) => handleColorChange('background', e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="color-picker-item" title="Text Color">
                                    <input type="color" value={colors.text} onChange={(e) => handleColorChange('text', e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="color-picker-item" title="Primary (Heading) Color">
                                    <input type="color" value={colors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="color-picker-item" title="Secondary (Accent) Color">
                                    <input type="color" value={colors.secondary} onChange={(e) => handleColorChange('secondary', e.target.value)} disabled={isLoading} />
                                </div>
                            </div>

                            <select
                                className="style-select"
                                value={selectedFont}
                                onChange={(e) => setSelectedFont(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Aa Auto Font</option>
                                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <div className="input-main-row">
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleImageSelect}
                            />

                            {(!inputValue && !isLoading && !isEditingElement && !selectedImage && !selectedElementInfo) && (
                                <div className="animated-placeholder" key={placeholderIndex}>
                                    <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                                </div>
                            )}

                            {selectedElementInfo && focusedArtifactIndex !== null && (
                                <div className="element-edit-hint">
                                    <span>✏️ Editing: &lt;{selectedElementInfo.tagName.toLowerCase()}&gt; {selectedElementInfo.snippet ? `"${selectedElementInfo.snippet}${selectedElementInfo.snippet.length >= 40 ? '...' : ''}"` : ''}</span>
                                    <button onClick={() => setSelectedElementInfo(null)} title="Cancel editing" className="element-edit-dismiss">✕</button>
                                </div>
                            )}

                            {!isLoading && !isEditingElement ? (
                                <div className="input-row">
                                    <button
                                        className={`attach-button ${selectedImage ? 'active' : ''}`}
                                        onClick={() => selectedImage ? clearImage() : fileInputRef.current?.click()}
                                        title={selectedImage ? "Remove image" : "Upload reference style"}
                                    >
                                        {selectedImage ? (
                                            <div className="img-preview" style={{ backgroundImage: `url(${selectedImage})` }}>
                                                <span className="remove-x">×</span>
                                            </div>
                                        ) : (
                                            <UploadIcon />
                                        )}
                                    </button>
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onPaste={handlePaste}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading || isEditingElement}
                                        rows={1}
                                        placeholder={selectedElementInfo ? 'Descreva a alteração... ex: "adicionar logo no topo"' : (!selectedImage ? '' : 'Add your menu items or paste an image...')}
                                    />
                                </div>
                            ) : (
                                <div className="input-generating-label">
                                    <span className="generating-prompt-text">{isEditingElement ? 'Editando elemento...' : 'Designing Menu...'}</span>
                                    <ThinkingIcon />
                                </div>
                            )}
                            <button className="send-button" onClick={() => handleSendMessage()} disabled={(isLoading || isEditingElement) || !inputValue.trim()}>
                                <ArrowUpIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}