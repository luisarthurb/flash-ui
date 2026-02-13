/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { PaperSize } from './types';

export const PAPER_SIZES: PaperSize[] = [
    { name: 'A3', widthMm: 297, heightMm: 420, cssSize: 'A3', widthPx: 1123, heightPx: 1587 },
    { name: 'A4', widthMm: 210, heightMm: 297, cssSize: 'A4', widthPx: 794, heightPx: 1123 },
    { name: 'A5', widthMm: 148, heightMm: 210, cssSize: 'A5', widthPx: 559, heightPx: 794 },
    { name: 'Letter', widthMm: 216, heightMm: 279, cssSize: 'letter', widthPx: 816, heightPx: 1056 },
];

export const DEFAULT_PAPER_SIZE = PAPER_SIZES[1]; // A4

export const INITIAL_PLACEHOLDERS = [
    "Paste your burger menu list here...",
    "Create a sushi menu with price, desc, and images",
    "Design a coffee shop price list, use earthy tones",
    "Italian dinner menu: Pasta $18, Pizza $22...",
    "Cocktail bar menu, dark mode, neon accents",
    "Kids menu with fun icons and big fonts",
    "Paste excel data: Item | Price | Description"
];

export const PALETTE_PRESETS = [
    { name: "Warm Rustic", colors: { primary: "#8D6E63", secondary: "#D7CCC8", background: "#EFEBE9", text: "#3E2723" } },
    { name: "Fresh Organic", colors: { primary: "#66BB6A", secondary: "#C8E6C9", background: "#FAFAFA", text: "#1B5E20" } },
    { name: "Elegant Dark", colors: { primary: "#D4AF37", secondary: "#424242", background: "#121212", text: "#F5F5F5" } },
    { name: "Modern Minimal", colors: { primary: "#212121", secondary: "#9E9E9E", background: "#FFFFFF", text: "#000000" } },
    { name: "Vibrant Pop", colors: { primary: "#FF4081", secondary: "#FFEB3B", background: "#FFFFFF", text: "#212121" } },
    { name: "Soft Pastel", colors: { primary: "#F48FB1", secondary: "#CE93D8", background: "#FFF0F5", text: "#4A148C" } },
    { name: "Oceanic", colors: { primary: "#0288D1", secondary: "#B3E5FC", background: "#E1F5FE", text: "#01579B" } }
];

export const FONTS = [
    "Classic Serif (Elegant, Traditional)",
    "Clean Sans (Modern, Minimal)",
    "Handwritten (Casual, Friendly)",
    "Bold Display (Impactful, Loud)",
    "Monospace (Tech, Retro)"
];

export const INJECTED_EDITOR_SCRIPT = `
<script>
(function() {
    // 1. Floating Toolbar for Text
    const toolbar = document.createElement('div');
    toolbar.id = 'floating-toolbar';
    toolbar.innerHTML = \`
        <button data-cmd="bold" title="Bold"><b>B</b></button>
        <button data-cmd="italic" title="Italic"><i>I</i></button>
        <button data-cmd="underline" title="Underline"><u>U</u></button>
        <div class="separator"></div>
        <button data-cmd="fontSize" data-val="3" title="Normal">A</button>
        <button data-cmd="fontSize" data-val="5" title="Large">A+</button>
    \`;
    toolbar.style.cssText = \`
        position: fixed; display: none; background: #222; border-radius: 8px;
        padding: 4px; gap: 4px; align-items: center; z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
    \`;
    const btnStyle = \`
        background: transparent; border: none; color: white; width: 28px; height: 28px;
        border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-family: serif; font-size: 14px;
    \`;
    toolbar.querySelectorAll('button').forEach(b => {
        b.style.cssText = btnStyle;
        b.onmouseover = () => b.style.background = 'rgba(255,255,255,0.1)';
        b.onmouseout = () => b.style.background = 'transparent';
        b.onclick = (e) => {
            e.preventDefault();
            const cmd = b.getAttribute('data-cmd');
            const val = b.getAttribute('data-val');
            document.execCommand(cmd, false, val);
        };
    });
    toolbar.querySelector('.separator').style.cssText = 'width: 1px; height: 16px; background: rgba(255,255,255,0.2); margin: 0 4px;';
    document.body.appendChild(toolbar);

    const updatePosition = () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            toolbar.style.display = 'flex';
            toolbar.style.top = (rect.top - 40) + 'px';
            toolbar.style.left = (rect.left + (rect.width/2) - (toolbar.offsetWidth/2)) + 'px';
        } else {
            toolbar.style.display = 'none';
        }
    };
    document.addEventListener('selectionchange', updatePosition);

    // 2. Image Editing Logic
    let imgToolbar = null;

    document.addEventListener('click', (e) => {
        // Close existing image toolbar if clicking elsewhere
        if (imgToolbar && !imgToolbar.contains(e.target) && e.target.tagName !== 'IMG') {
            imgToolbar.remove();
            imgToolbar = null;
        }

        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove previous if exists
            if (imgToolbar) imgToolbar.remove();

            const img = e.target;
            const rect = img.getBoundingClientRect();

            imgToolbar = document.createElement('div');
            imgToolbar.innerHTML = \`
                <button id="btn-ai-edit" style="padding: 6px 12px; background: linear-gradient(135deg, #4285f4, #9b59b6); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,0.2);">✨ AI Edit</button>
                <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2); margin: 0 4px;"></div>
                <button id="btn-link" style="padding: 6px 12px; background: transparent; color: #ccc; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🔗 Link</button>
                <button id="btn-upload" style="padding: 6px 12px; background: transparent; color: #ccc; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">📂 Upload</button>
            \`;
            
            imgToolbar.style.cssText = \`
                position: fixed; 
                top: \${rect.top + 10}px; 
                left: \${rect.right - 220}px; 
                display: flex; gap: 4px; align-items: center;
                background: rgba(0,0,0,0.9); 
                padding: 6px; 
                border-radius: 8px; 
                backdrop-filter: blur(8px);
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                animation: fadeIn 0.2s ease;
            \`;

            // Adjust position if off-screen
            if (rect.right - 220 < 0) imgToolbar.style.left = (rect.left + 10) + 'px';

            document.body.appendChild(imgToolbar);

            // AI Edit Handler
            const aiBtn = imgToolbar.querySelector('#btn-ai-edit');
            aiBtn.onclick = () => {
                const p = prompt("How should AI edit this product? (e.g. 'put it on a marble table', 'add soft morning light')\\n\\nNOTE: The product texture will be preserved.");
                if(p) {
                    // Visual feedback
                    img.style.opacity = '0.5';
                    img.style.filter = 'grayscale(100%) blur(2px)';
                    img.style.transition = 'all 0.5s';
                    
                    window.parent.postMessage({
                        type: 'AI_IMAGE_EDIT',
                        prompt: p,
                        src: img.src
                    }, '*');
                    
                    imgToolbar.remove();
                    imgToolbar = null;
                }
            };
            aiBtn.onmouseover = () => aiBtn.style.opacity = '0.9';

            // Link Handler
            const linkBtn = imgToolbar.querySelector('#btn-link');
            linkBtn.onclick = () => {
                let u = prompt('Image URL:', img.src);
                if(u) img.src = u;
                imgToolbar.remove(); 
                imgToolbar = null;
            };
            linkBtn.onmouseover = () => linkBtn.style.color = 'white';
            linkBtn.onmouseout = () => linkBtn.style.color = '#ccc';

            // Upload Handler
            const uploadBtn = imgToolbar.querySelector('#btn-upload');
            uploadBtn.onclick = () => {
                 const f = document.createElement('input'); 
                 f.type='file'; f.accept='image/*';
                 f.onchange = (ev) => {
                    const file = ev.target.files[0];
                    if(file){
                        const r = new FileReader();
                        r.onload = (re) => img.src = re.target.result;
                        r.readAsDataURL(file);
                    }
                 };
                 f.click();
                 imgToolbar.remove(); 
                 imgToolbar = null;
            };
            uploadBtn.onmouseover = () => uploadBtn.style.color = 'white';
            uploadBtn.onmouseout = () => uploadBtn.style.color = '#ccc';
        }
    });

    // Add CSS animation for toolbar
    const style = document.createElement('style');
    style.innerHTML = \`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }\`;
    document.head.appendChild(style);

})();
</script>
`;