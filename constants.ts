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

export const TUTORIAL_STEPS = [
    { target: '.paper-size-select', text: '📄 Selecione o tamanho do papel para impressão.', position: 'top' as const },
    { target: '.style-select', text: '🎨 Escolha cores e fontes para o seu menu.', position: 'top' as const },
    { target: '.send-button', text: '✨ Escreva seus itens de menu e clique para gerar!', position: 'left' as const },
];

export const INJECTED_EDITOR_SCRIPT = `
<script>
(function() {
    // ============================================================
    // 0. Force Scroll + Report Height
    // ============================================================
    var forceScrollCSS = document.createElement('style');
    forceScrollCSS.innerHTML = [
        'html, body { overflow-y: auto !important; overflow-x: hidden !important; min-height: 100% !important; }',
        '@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }',
        '@keyframes elementHighlight {',
        '  0% { outline: 2px dashed #3b82f6; outline-offset: 2px; }',
        '  50% { outline: 2px dashed #60a5fa; outline-offset: 4px; }',
        '  100% { outline: 2px dashed transparent; outline-offset: 2px; }',
        '}',
        '.tree-highlight { animation: elementHighlight 2s ease forwards; }'
    ].join('\\n');
    document.head.appendChild(forceScrollCSS);

    function reportHeight() {
        var h = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        window.parent.postMessage({ type: 'CONTENT_HEIGHT', height: h }, '*');
    }
    // Report height on load and after any change
    reportHeight();
    window.addEventListener('load', reportHeight);
    var heightObserver = new MutationObserver(function() { setTimeout(reportHeight, 50); });
    heightObserver.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    window.addEventListener('resize', reportHeight);

    // ============================================================
    // 1. Floating Toolbar for Text
    // ============================================================
    var toolbar = document.createElement('div');
    toolbar.id = 'floating-toolbar';
    toolbar.innerHTML = '<button data-cmd="bold" title="Bold"><b>B</b></button>'
        + '<button data-cmd="italic" title="Italic"><i>I</i></button>'
        + '<button data-cmd="underline" title="Underline"><u>U</u></button>'
        + '<div class="separator"></div>'
        + '<button data-cmd="fontSize" data-val="3" title="Normal">A</button>'
        + '<button data-cmd="fontSize" data-val="5" title="Large">A+</button>';
    toolbar.style.cssText = 'position:fixed;display:none;background:#222;border-radius:8px;padding:4px;gap:4px;align-items:center;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);';
    var btnCSS = 'background:transparent;border:none;color:white;width:28px;height:28px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:serif;font-size:14px;';
    toolbar.querySelectorAll('button').forEach(function(b) {
        b.style.cssText = btnCSS;
        b.onmouseover = function() { b.style.background = 'rgba(255,255,255,0.1)'; };
        b.onmouseout = function() { b.style.background = 'transparent'; };
        b.onclick = function(e) {
            e.preventDefault();
            document.execCommand(b.getAttribute('data-cmd'), false, b.getAttribute('data-val'));
        };
    });
    var sep = toolbar.querySelector('.separator');
    if (sep) sep.style.cssText = 'width:1px;height:16px;background:rgba(255,255,255,0.2);margin:0 4px;';
    document.body.appendChild(toolbar);

    function updateToolbarPos() {
        var sel = window.getSelection();
        if (sel.rangeCount > 0 && !sel.isCollapsed) {
            var rect = sel.getRangeAt(0).getBoundingClientRect();
            toolbar.style.display = 'flex';
            toolbar.style.top = (rect.top - 40) + 'px';
            toolbar.style.left = (rect.left + rect.width/2 - toolbar.offsetWidth/2) + 'px';
        } else {
            toolbar.style.display = 'none';
        }
    }
    document.addEventListener('selectionchange', updateToolbarPos);

    // ============================================================
    // 2. Image Editing Logic
    // ============================================================
    var imgToolbar = null;

    document.addEventListener('click', function(e) {
        if (imgToolbar && !imgToolbar.contains(e.target) && e.target.tagName !== 'IMG') {
            imgToolbar.remove();
            imgToolbar = null;
        }

        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            if (imgToolbar) imgToolbar.remove();

            var img = e.target;
            var rect = img.getBoundingClientRect();

            imgToolbar = document.createElement('div');
            imgToolbar.innerHTML = '<button id="btn-ai-edit" style="padding:6px 12px;background:linear-gradient(135deg,#4285f4,#9b59b6);color:white;border:none;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:bold;border:1px solid rgba(255,255,255,0.2);">✨ AI Edit</button>'
                + '<div style="width:1px;height:16px;background:rgba(255,255,255,0.2);margin:0 4px;"></div>'
                + '<button id="btn-link" style="padding:6px 12px;background:transparent;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:12px;">🔗 Link</button>'
                + '<button id="btn-upload" style="padding:6px 12px;background:transparent;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:12px;">📂 Upload</button>';

            imgToolbar.style.cssText = 'position:fixed;top:' + (rect.top + 10) + 'px;left:' + (rect.right - 220) + 'px;display:flex;gap:4px;align-items:center;background:rgba(0,0,0,0.9);padding:6px;border-radius:8px;backdrop-filter:blur(8px);z-index:10000;box-shadow:0 4px 15px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);animation:fadeIn 0.2s ease;';
            if (rect.right - 220 < 0) imgToolbar.style.left = (rect.left + 10) + 'px';
            document.body.appendChild(imgToolbar);

            var aiBtn = imgToolbar.querySelector('#btn-ai-edit');
            aiBtn.onclick = function() {
                var p = prompt("How should AI edit this product?");
                if (p) {
                    img.style.opacity = '0.5';
                    img.style.filter = 'grayscale(100%) blur(2px)';
                    img.style.transition = 'all 0.5s';
                    window.parent.postMessage({ type: 'AI_IMAGE_EDIT', prompt: p, src: img.src }, '*');
                    imgToolbar.remove(); imgToolbar = null;
                }
            };

            var linkBtn = imgToolbar.querySelector('#btn-link');
            linkBtn.onclick = function() {
                var u = prompt('Image URL:', img.src);
                if (u) img.src = u;
                imgToolbar.remove(); imgToolbar = null;
            };
            linkBtn.onmouseover = function() { linkBtn.style.color = 'white'; };
            linkBtn.onmouseout = function() { linkBtn.style.color = '#ccc'; };

            var uploadBtn = imgToolbar.querySelector('#btn-upload');
            uploadBtn.onclick = function() {
                var f = document.createElement('input');
                f.type = 'file'; f.accept = 'image/*';
                f.onchange = function(ev) {
                    var file = ev.target.files[0];
                    if (file) {
                        var r = new FileReader();
                        r.onload = function(re) { img.src = re.target.result; };
                        r.readAsDataURL(file);
                    }
                };
                f.click();
                imgToolbar.remove(); imgToolbar = null;
            };
            uploadBtn.onmouseover = function() { uploadBtn.style.color = 'white'; };
            uploadBtn.onmouseout = function() { uploadBtn.style.color = '#ccc'; };
        }
    });

    // ============================================================
    // 3. Element Tree Communication (postMessage API)
    // ============================================================
    var MEANINGFUL_TAGS = ['H1','H2','H3','H4','H5','H6','P','DIV','IMG','HR','SECTION','TABLE','UL','OL','LI','SPAN','A','HEADER','FOOTER','NAV','ARTICLE','MAIN','FIGURE','FIGCAPTION','BLOCKQUOTE','TR','TD','TH','THEAD','TBODY'];
    var SKIP_IDS = ['floating-toolbar'];

    function getElementPath(el) {
        var path = [];
        var node = el;
        while (node && node !== document.body && node.parentElement) {
            var parent = node.parentElement;
            var siblings = Array.from(parent.children);
            path.unshift(siblings.indexOf(node));
            node = parent;
        }
        return path;
    }

    function getElementByPath(path) {
        var el = document.body;
        for (var i = 0; i < path.length; i++) {
            if (!el || !el.children || path[i] >= el.children.length) return null;
            el = el.children[path[i]];
        }
        return el;
    }

    function getTextSnippet(el) {
        if (el.tagName === 'IMG') return '[Image]';
        if (el.tagName === 'HR') return '[Divider]';
        var text = '';
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) text += el.childNodes[i].textContent;
        }
        text = text.trim();
        if (!text) text = (el.textContent || '').trim();
        return text.substring(0, 50) || ('[' + el.tagName.toLowerCase() + ']');
    }

    function getTagLabel(tag) {
        if (/^H[1-6]$/.test(tag)) return '🔤';
        if (tag === 'P' || tag === 'SPAN' || tag === 'A') return '📝';
        if (tag === 'IMG') return '🖼';
        if (tag === 'HR') return '━';
        if (tag === 'TABLE' || tag === 'TR' || tag === 'TD' || tag === 'TH') return '📊';
        if (tag === 'UL' || tag === 'OL' || tag === 'LI') return '📋';
        return '📦';
    }

    function buildTree(el, depth) {
        if (!el || depth > 6) return [];
        var nodes = [];
        var children = Array.from(el.children);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'LINK' || child.tagName === 'META') continue;
            if (SKIP_IDS.indexOf(child.id) !== -1) continue;
            var tag = child.tagName;
            var isMeaningful = MEANINGFUL_TAGS.indexOf(tag) !== -1;
            var childTree = buildTree(child, depth + 1);
            if (isMeaningful || childTree.length > 0) {
                nodes.push({
                    tag: tag.toLowerCase(),
                    label: getTagLabel(tag),
                    text: getTextSnippet(child),
                    path: getElementPath(child),
                    childCount: child.children.length,
                    children: childTree,
                    depth: depth
                });
            }
        }
        return nodes;
    }

    function sendTree() {
        window.parent.postMessage({ type: 'TREE_DATA', tree: buildTree(document.body, 0) }, '*');
    }

    function syncHtmlBack() {
        window.parent.postMessage({ type: 'HTML_SYNC', html: document.documentElement.outerHTML }, '*');
        reportHeight();
    }

    window.addEventListener('message', function(e) {
        var data = e.data;
        if (!data || !data.type) return;

        if (data.type === 'GET_TREE') { sendTree(); return; }

        if (data.type === 'SELECT_ELEMENT') {
            var el = getElementByPath(data.path);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.remove('tree-highlight');
                void el.offsetWidth;
                el.classList.add('tree-highlight');
                setTimeout(function() { el.classList.remove('tree-highlight'); }, 2000);
            }
            return;
        }

        if (data.type === 'DELETE_ELEMENT') {
            var el = getElementByPath(data.path);
            if (el && el.parentElement) { el.remove(); sendTree(); syncHtmlBack(); }
            return;
        }

        if (data.type === 'MOVE_ELEMENT') {
            var el = getElementByPath(data.path);
            if (!el || !el.parentElement) return;
            var parent = el.parentElement;
            if (data.direction === 'up') {
                var prev = el.previousElementSibling;
                if (prev) parent.insertBefore(el, prev);
            } else if (data.direction === 'down') {
                var next = el.nextElementSibling;
                if (next) parent.insertBefore(next, el);
            }
            sendTree(); syncHtmlBack();
            return;
        }

        if (data.type === 'INSERT_ELEMENT') {
            var html = data.html;
            if (!html) return;
            var temp = document.createElement('div');
            temp.innerHTML = html;
            var newEl = temp.firstElementChild;
            if (!newEl) return;
            if (data.position === 'top') {
                document.body.insertBefore(newEl, document.body.firstChild);
            } else if (data.path && data.path.length > 0) {
                var ref = getElementByPath(data.path);
                if (ref && ref.parentElement) {
                    if (data.position === 'before') ref.parentElement.insertBefore(newEl, ref);
                    else ref.parentElement.insertBefore(newEl, ref.nextSibling);
                } else {
                    document.body.appendChild(newEl);
                }
            } else {
                document.body.appendChild(newEl);
            }
            // Make new element editable
            if (newEl.tagName !== 'IMG' && newEl.tagName !== 'HR') {
                newEl.setAttribute('contenteditable', 'true');
            }
            newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newEl.classList.add('tree-highlight');
            setTimeout(function() { newEl.classList.remove('tree-highlight'); }, 2000);
            sendTree(); syncHtmlBack();
            return;
        }
    });

    // Report element clicks to parent
    document.addEventListener('click', function(e) {
        if (e.target.closest('#floating-toolbar')) return;
        if (e.target.closest('.drag-handle')) return;
        var tag = e.target.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        var path = getElementPath(e.target);
        if (path.length > 0) {
            window.parent.postMessage({ type: 'ELEMENT_CLICKED', path: path }, '*');
        }
    });

    // ============================================================
    // 4. Canva-Style Drag & Drop
    // ============================================================
    var dragStyle = document.createElement('style');
    dragStyle.innerHTML = [
        '.drag-handle { position:absolute; width:24px; height:24px; background:#3b82f6; border-radius:6px; cursor:grab; display:flex; align-items:center; justify-content:center; z-index:9998; box-shadow:0 2px 10px rgba(59,130,246,0.5); transition:transform 0.15s,opacity 0.15s; opacity:0.9; }',
        '.drag-handle:hover { opacity:1; transform:scale(1.15); background:#2563eb; }',
        '.drag-handle:active { cursor:grabbing; }',
        '.drag-handle svg { width:14px; height:14px; fill:white; pointer-events:none; }',
        '.drag-ghost { position:fixed; pointer-events:none; z-index:10000; opacity:0.65; border:2px solid #3b82f6; border-radius:8px; background:rgba(255,255,255,0.95); box-shadow:0 12px 40px rgba(0,0,0,0.25); max-height:100px; overflow:hidden; transform:rotate(1deg); }',
        '.drag-indicator { position:absolute; height:3px; background:linear-gradient(90deg,#3b82f6,#60a5fa,#3b82f6); border-radius:2px; z-index:9997; pointer-events:none; box-shadow:0 0 12px rgba(59,130,246,0.4); }',
        '.drag-indicator::before,.drag-indicator::after { content:""; position:absolute; top:-4px; width:11px; height:11px; background:#3b82f6; border-radius:50%; border:2px solid white; }',
        '.drag-indicator::before { left:-5px; }',
        '.drag-indicator::after { right:-5px; }',
        '.dragging-source { opacity:0.3 !important; outline:2px dashed rgba(59,130,246,0.4) !important; outline-offset:2px !important; }',
        '.drag-selected { outline:2px solid rgba(59,130,246,0.5) !important; outline-offset:3px !important; position:relative; }',
        '.drop-flash { animation:dropFlash 0.6s ease forwards; }',
        '@keyframes dropFlash { 0%{outline:3px solid #22c55e;outline-offset:2px;} 100%{outline:3px solid transparent;outline-offset:8px;} }'
    ].join('\\n');
    document.head.appendChild(dragStyle);

    var dragHandle = null;
    var selectedEl = null;
    var isDragging = false;
    var draggedEl = null;
    var dragGhost = null;
    var dragIndicator = null;
    var dropTarget = null;
    var dropPos = 'after';

    var GRIP_SVG = '<svg viewBox="0 0 24 24"><circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/></svg>';

    function findDraggable(el) {
        var n = el;
        while (n && n !== document.body) {
            if (n.parentElement === document.body) return n;
            var t = n.tagName;
            var blocks = ['DIV','SECTION','TABLE','FIGURE','HEADER','FOOTER','NAV','ARTICLE','UL','OL','BLOCKQUOTE','HR'];
            var containers = ['DIV','SECTION','BODY','MAIN','ARTICLE'];
            if (blocks.indexOf(t) !== -1 && n.parentElement && containers.indexOf(n.parentElement.tagName) !== -1) return n;
            var inlines = ['H1','H2','H3','H4','H5','H6','P','IMG'];
            if (inlines.indexOf(t) !== -1) return n;
            n = n.parentElement;
        }
        return el;
    }

    function showHandle(el) {
        removeHandle();
        if (!el || el === document.body || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
        selectedEl = el;
        el.classList.add('drag-selected');
        dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = GRIP_SVG;
        dragHandle.title = 'Drag to reposition';
        document.body.appendChild(dragHandle);
        placeHandle(el);
        dragHandle.addEventListener('mousedown', startDrag);
        dragHandle.addEventListener('touchstart', startDrag, { passive: false });
    }

    function placeHandle(el) {
        if (!dragHandle || !el) return;
        var r = el.getBoundingClientRect();
        var sT = window.scrollY || window.pageYOffset;
        var sL = window.scrollX || window.pageXOffset;
        dragHandle.style.top = (r.top + sT - 2) + 'px';
        dragHandle.style.left = Math.max(4, r.left + sL - 30) + 'px';
    }

    function removeHandle() {
        if (dragHandle) { dragHandle.remove(); dragHandle = null; }
        if (selectedEl) { selectedEl.classList.remove('drag-selected'); selectedEl = null; }
    }

    function startDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        draggedEl = selectedEl;
        if (!draggedEl) return;
        isDragging = true;
        draggedEl.classList.add('dragging-source');

        // Pause contenteditable
        document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
            el.setAttribute('data-ce-paused', '1');
            el.setAttribute('contenteditable', 'false');
        });

        // Create ghost
        var rect = draggedEl.getBoundingClientRect();
        dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.innerHTML = draggedEl.outerHTML;
        dragGhost.style.width = Math.min(rect.width, 400) + 'px';
        dragGhost.style.left = rect.left + 'px';
        dragGhost.style.top = rect.top + 'px';
        document.body.appendChild(dragGhost);

        // Create indicator
        dragIndicator = document.createElement('div');
        dragIndicator.className = 'drag-indicator';
        dragIndicator.style.display = 'none';
        document.body.appendChild(dragIndicator);

        if (dragHandle) dragHandle.style.display = 'none';

        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', moveDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        } else {
            document.addEventListener('mousemove', moveDrag);
            document.addEventListener('mouseup', endDrag);
        }
    }

    function moveDrag(e) {
        if (!isDragging || !draggedEl) return;
        e.preventDefault();
        var cX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        var cY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        // Move ghost
        if (dragGhost) {
            dragGhost.style.left = (cX - dragGhost.offsetWidth / 2) + 'px';
            dragGhost.style.top = (cY - 25) + 'px';
        }

        // Find drop target
        var parent = draggedEl.parentElement;
        if (!parent) return;
        var siblings = Array.from(parent.children).filter(function(c) {
            return c !== draggedEl && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE'
                && !c.classList.contains('drag-handle')
                && !c.classList.contains('drag-indicator')
                && !c.classList.contains('drag-ghost');
        });
        var closest = null;
        var bestDist = Infinity;
        var before = true;
        for (var i = 0; i < siblings.length; i++) {
            var r = siblings[i].getBoundingClientRect();
            var mid = r.top + r.height / 2;
            var d = Math.abs(cY - mid);
            if (d < bestDist) { bestDist = d; closest = siblings[i]; before = cY < mid; }
        }
        if (closest) {
            dropTarget = closest;
            dropPos = before ? 'before' : 'after';
            var r = closest.getBoundingClientRect();
            var sT = window.scrollY || window.pageYOffset;
            var sL = window.scrollX || window.pageXOffset;
            var y = before ? r.top : r.bottom;
            dragIndicator.style.display = 'block';
            dragIndicator.style.top = (y + sT - 1) + 'px';
            dragIndicator.style.left = (r.left + sL) + 'px';
            dragIndicator.style.width = r.width + 'px';
        }

        // Auto-scroll
        if (cY < 60) window.scrollBy(0, -10);
        else if (cY > window.innerHeight - 60) window.scrollBy(0, 10);
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('touchend', endDrag);

        // Restore contenteditable
        document.querySelectorAll('[data-ce-paused]').forEach(function(el) {
            el.setAttribute('contenteditable', 'true');
            el.removeAttribute('data-ce-paused');
        });

        if (draggedEl) draggedEl.classList.remove('dragging-source');

        if (dropTarget && draggedEl && dropTarget !== draggedEl) {
            var p = dropTarget.parentElement;
            if (p) {
                if (dropPos === 'before') p.insertBefore(draggedEl, dropTarget);
                else p.insertBefore(draggedEl, dropTarget.nextSibling);
                draggedEl.classList.add('drop-flash');
                var movedEl = draggedEl;
                setTimeout(function() { movedEl.classList.remove('drop-flash'); }, 600);
                syncHtmlBack();
                sendTree();
            }
        }

        if (dragGhost) { dragGhost.remove(); dragGhost = null; }
        if (dragIndicator) { dragIndicator.remove(); dragIndicator = null; }
        dropTarget = null;
        draggedEl = null;
        removeHandle();
    }

    // Show drag handle on click (not during drag)
    document.addEventListener('click', function(e) {
        if (isDragging) return;
        if (e.target.closest('#floating-toolbar') || e.target.closest('.drag-handle')) return;
        if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'STYLE') return;
        var d = findDraggable(e.target);
        if (d && d !== document.body) showHandle(d);
    });

    // Keep handle positioned on scroll
    window.addEventListener('scroll', function() {
        if (selectedEl && dragHandle && !isDragging) placeHandle(selectedEl);
    });

})();
</script>
`;