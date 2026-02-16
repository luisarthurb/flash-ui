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
    { target: '.input-row', text: '✏️ Selecione um elemento no menu e digite para editar — ex: "adicionar logo no topo" ou "mais 4 itens de pizza"', position: 'top' as const },
];

export const INJECTED_EDITOR_SCRIPT = `
<script>
(function() {
    // ============================================================
    // 0. Force Scroll + Report Height + Canvas Setup
    // ============================================================
    var forceScrollCSS = document.createElement('style');
    forceScrollCSS.innerHTML = [
        'html, body { overflow-y: auto !important; overflow-x: hidden !important; min-height: 100% !important; position: relative; }',
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
        + '<button data-cmd="fontSize" data-val="5" title="Large">A+</button>'
        + '<div class="separator"></div>'
        + '<button id="btn-align-left" title="Left">L</button>'
        + '<button id="btn-align-center" title="Center">C</button>'
        + '<button id="btn-align-right" title="Right">R</button>';
    toolbar.style.cssText = 'position:fixed;display:none;background:#222;border-radius:8px;padding:4px;gap:4px;align-items:center;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);';
    var btnCSS = 'background:transparent;border:none;color:white;width:28px;height:28px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:serif;font-size:14px;';

    toolbar.querySelectorAll('button').forEach(function(b) {
        if (b.id.startsWith('btn-align')) return;
        b.style.cssText = btnCSS;
        b.onclick = function(e) { e.preventDefault(); document.execCommand(b.getAttribute('data-cmd'), false, b.getAttribute('data-val')); };
    });
    ['left','center','right'].forEach(function(align) {
        var btn = toolbar.querySelector('#btn-align-' + align);
        if (btn) {
            btn.style.cssText = btnCSS;
            btn.onclick = function(e) {
                e.preventDefault();
                document.execCommand('justify' + (align === 'center' ? 'Center' : (align === 'right' ? 'Right' : 'Left')));
            };
        }
    });
    var seps = toolbar.querySelectorAll('.separator');
    seps.forEach(function(s) { s.style.cssText = 'width:1px;height:16px;background:rgba(255,255,255,0.2);margin:0 4px;'; });
    document.body.appendChild(toolbar);

    function updateToolbarPos() {
        var sel = window.getSelection();
        if (sel.rangeCount > 0 && !sel.isCollapsed) {
            var rect = sel.getRangeAt(0).getBoundingClientRect();
            toolbar.style.display = 'flex';
            toolbar.style.top = (rect.top - 40) + 'px';
            toolbar.style.left = (rect.left + rect.width / 2 - toolbar.offsetWidth / 2) + 'px';
        } else {
            toolbar.style.display = 'none';
        }
    }
    document.addEventListener('selectionchange', updateToolbarPos);

    // ============================================================
    // 2. Image Editing Logic
    // ============================================================
    var imgToolbar = null;
    var activeImg = null;
    var imgDirty = false;
    document.addEventListener('click', function(e) {
        if (imgToolbar && !imgToolbar.contains(e.target) && e.target.tagName !== 'IMG') {
            imgToolbar.remove(); imgToolbar = null; activeImg = null;
            if (imgDirty) { imgDirty = false; syncHtmlBack(); }
        }
        if (e.target.tagName === 'IMG') {
            e.preventDefault(); e.stopPropagation();
            if (imgToolbar) imgToolbar.remove();
            activeImg = e.target;
            var img = e.target;
            var rect = img.getBoundingClientRect();
            imgToolbar = document.createElement('div');

            var curW = img.offsetWidth;
            imgToolbar.innerHTML =
                '<button id="btn-shrink" title="Diminuir" style="padding:4px 10px;background:rgba(255,255,255,0.1);color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;line-height:1;">−</button>' +
                '<span id="img-size-label" style="color:#aaa;font-size:11px;min-width:40px;text-align:center;">' + curW + 'px</span>' +
                '<button id="btn-grow" title="Aumentar" style="padding:4px 10px;background:rgba(255,255,255,0.1);color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;line-height:1;">+</button>' +
                '<div style="width:1px;height:16px;background:rgba(255,255,255,0.2);margin:0 2px;"></div>' +
                '<button id="btn-upload" title="Trocar imagem" style="padding:4px 10px;background:rgba(255,255,255,0.1);color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">\\ud83d\\udcc2</button>' +
                '<button id="btn-link" title="URL da imagem" style="padding:4px 10px;background:rgba(255,255,255,0.1);color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">\\ud83d\\udd17</button>';

            imgToolbar.style.cssText = 'position:fixed;top:' + (rect.top - 40) + 'px;left:' + (rect.left + rect.width / 2 - 130) + 'px;display:flex;gap:4px;align-items:center;background:rgba(0,0,0,0.92);padding:5px 8px;border-radius:8px;backdrop-filter:blur(8px);z-index:10000;box-shadow:0 4px 15px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.15);animation:fadeIn 0.2s ease;';
            // Keep toolbar in viewport
            if (rect.top - 40 < 5) imgToolbar.style.top = (rect.bottom + 6) + 'px';
            if (rect.left + rect.width / 2 - 130 < 5) imgToolbar.style.left = '5px';
            document.body.appendChild(imgToolbar);

            // Resize: shrink (−)
            imgToolbar.querySelector('#btn-shrink').onclick = function(ev) {
                ev.stopPropagation();
                var w = activeImg.offsetWidth;
                var newW = Math.max(30, Math.round(w * 0.8));
                activeImg.style.width = newW + 'px';
                activeImg.style.height = 'auto';
                document.getElementById('img-size-label').textContent = newW + 'px';
                imgDirty = true;
            };
            // Resize: grow (+)
            imgToolbar.querySelector('#btn-grow').onclick = function(ev) {
                ev.stopPropagation();
                var w = activeImg.offsetWidth;
                var newW = Math.round(w * 1.2);
                activeImg.style.width = newW + 'px';
                activeImg.style.height = 'auto';
                document.getElementById('img-size-label').textContent = newW + 'px';
                imgDirty = true;
            };
            // Upload: replace image from file
            imgToolbar.querySelector('#btn-upload').onclick = function(ev) {
                ev.stopPropagation();
                var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
                f.onchange = function(fev) {
                    var file = fev.target.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.onload = function(re) {
                            activeImg.src = re.target.result;
                            syncHtmlBack();
                        };
                        reader.readAsDataURL(file);
                    }
                };
                f.click();
                // Don't remove toolbar — let user see it still
            };
            // Link: change image URL
            imgToolbar.querySelector('#btn-link').onclick = function(ev) {
                ev.stopPropagation();
                var u = prompt('URL da imagem:', activeImg.src);
                if (u && u.trim()) {
                    activeImg.src = u.trim();
                    syncHtmlBack();
                }
                imgToolbar.remove(); imgToolbar = null; activeImg = null;
            };
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
            path.unshift(Array.from(node.parentElement.children).indexOf(node));
            node = node.parentElement;
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
        if (/^H[1-6]$/.test(tag)) return '\\ud83d\\udd24';
        if (tag === 'P' || tag === 'SPAN' || tag === 'A') return '\\ud83d\\udcdd';
        if (tag === 'IMG') return '\\ud83d\\uddbc';
        if (tag === 'HR') return '\\u2501';
        if (tag === 'TABLE' || tag === 'TR' || tag === 'TD' || tag === 'TH') return '\\ud83d\\udcca';
        if (tag === 'UL' || tag === 'OL' || tag === 'LI') return '\\ud83d\\udccb';
        return '\\ud83d\\udce6';
    }

    function buildTree(el, depth) {
        if (!el || depth > 6) return [];
        var nodes = [];
        var children = Array.from(el.children);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (['SCRIPT','STYLE','LINK','META'].indexOf(child.tagName) !== -1) continue;
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
            // Images default to absolute/free placement
            if (newEl.tagName === 'IMG') {
                newEl.style.position = 'absolute';
                newEl.style.left = '50px';
                newEl.style.top = (window.scrollY + 100) + 'px';
            }
            if (data.position === 'top') {
                document.body.insertBefore(newEl, document.body.firstChild);
            } else if (data.path && data.path.length > 0) {
                var ref = getElementByPath(data.path);
                if (ref && ref.parentElement) {
                    if (data.position === 'before') ref.parentElement.insertBefore(newEl, ref);
                    else ref.parentElement.insertBefore(newEl, ref.nextSibling);
                } else { document.body.appendChild(newEl); }
            } else {
                document.body.appendChild(newEl);
            }
            if (newEl.tagName !== 'IMG' && newEl.tagName !== 'HR') {
                newEl.setAttribute('contenteditable', 'true');
            }
            newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newEl.classList.add('tree-highlight');
            setTimeout(function() { newEl.classList.remove('tree-highlight'); }, 2000);
            sendTree(); syncHtmlBack();
            return;
        }

        // Return outerHTML for the element at path
        if (data.type === 'GET_ELEMENT_HTML') {
            var el = getElementByPath(data.path);
            if (el) {
                window.parent.postMessage({ type: 'ELEMENT_HTML_RESPONSE', path: data.path, html: el.outerHTML, tagName: el.tagName, snippet: (el.textContent || '').substring(0, 40) }, '*');
            }
            return;
        }

        // Replace element at path with new HTML
        if (data.type === 'EDIT_ELEMENT') {
            var el = getElementByPath(data.path);
            if (el && el.parentElement && data.html) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = data.html;
                // Insert all new nodes before the old one, then remove old
                while (wrapper.firstChild) {
                    el.parentElement.insertBefore(wrapper.firstChild, el);
                }
                el.remove();
                sendTree(); syncHtmlBack();
            }
            return;
        }
    });

    // Report element clicks to parent (for tree panel sync + contextual editing)
    document.addEventListener('click', function(e) {
        if (e.target.closest('#floating-toolbar')) return;
        if (e.target.closest('.drag-handle')) return;
        var tag = e.target.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        var target = e.target;
        // Walk up to a meaningful element for editing context
        while (target && target !== document.body && ['SPAN','B','I','U','EM','STRONG','A','BR','SMALL','SUB','SUP'].indexOf(target.tagName) !== -1) {
            target = target.parentElement;
        }
        var path = getElementPath(target);
        if (path.length > 0) {
            var snippet = (target.textContent || '').substring(0, 40);
            window.parent.postMessage({ type: 'ELEMENT_CLICKED', path: path, html: target.outerHTML, tagName: target.tagName, snippet: snippet }, '*');
        }
    });

    // ============================================================
    // 4. HYBRID DRAG & DROP (Sort + Free Placement)
    // ============================================================
    var dragStyle = document.createElement('style');
    dragStyle.innerHTML = [
        '.drag-handle { position:absolute; height:24px; background:#3b82f6; border-radius:6px; cursor:grab; display:flex; align-items:center; padding:0 4px; z-index:9998; box-shadow:0 2px 10px rgba(0,0,0,0.2); transform:translateY(-100%); margin-top:-4px; }',
        '.drag-handle:hover { background:#2563eb; }',
        '.drag-handle button { background:none; border:none; color:white; font-size:12px; cursor:pointer; padding:0 4px; display:flex; align-items:center; }',
        '.drag-handle .divider { width:1px; height:12px; background:rgba(255,255,255,0.3); margin:0 4px; }',
        '.drag-ghost { position:fixed; opacity:0.5; z-index:10000; pointer-events:none; border:2px dashed #3b82f6; background:white; max-height:100px; overflow:hidden; border-radius:6px; }',
        '.drag-indicator { position:absolute; height:3px; background:linear-gradient(90deg,#3b82f6,#60a5fa,#3b82f6); pointer-events:none; z-index:9997; display:none; border-radius:2px; box-shadow:0 0 8px rgba(59,130,246,0.4); }',
        '.drag-indicator::before,.drag-indicator::after { content:""; position:absolute; top:-4px; width:11px; height:11px; background:#3b82f6; border-radius:50%; border:2px solid white; }',
        '.drag-indicator::before { left:-5px; }',
        '.drag-indicator::after { right:-5px; }'
    ].join('\\n');
    document.head.appendChild(dragStyle);

    var dragHandle = null, selectedEl = null;
    var isDragging = false, dragMode = 'sort';
    var startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    var ghost = null, indicator = null, dropTarget = null, dropPos = 'after';

    function isAbsolute(el) { return window.getComputedStyle(el).position === 'absolute'; }

    function showHandle(el) {
        if (!el || el === document.body || ['SCRIPT','STYLE'].indexOf(el.tagName) !== -1) return;
        if (dragHandle && selectedEl === el) return;
        removeHandle();
        // Fix 3: Dismiss image toolbar when showing drag handle
        if (imgToolbar) { imgToolbar.remove(); imgToolbar = null; }

        selectedEl = el;
        el.style.outline = '2px solid rgba(59,130,246,0.5)';
        el.style.outlineOffset = '3px';

        dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';

        var abs = isAbsolute(el);
        var icon = abs ? '\\ud83d\\udd13' : '\\ud83d\\udd12';
        var modeTitle = abs ? 'Free Move (click to lock)' : 'Locked Flow (click to free)';

        dragHandle.innerHTML =
            '<div class="grip" style="cursor:grab;padding:0 4px;color:white;font-size:14px;letter-spacing:1px;">\\u2807\\u2807</div>' +
            '<div class="divider"></div>' +
            '<button id="btn-mode" title="' + modeTitle + '">' + icon + '</button>' +
            '<div class="divider"></div>' +
            '<button id="btn-del" title="Delete">\\ud83d\\uddd1\\ufe0f</button>';

        document.body.appendChild(dragHandle);
        updateHandlePos();

        // Mode Toggle: Free <-> Flow
        dragHandle.querySelector('#btn-mode').onclick = function(ev) {
            ev.stopPropagation();
            var currentlyAbs = isAbsolute(selectedEl);
            if (currentlyAbs) {
                // Switch back to flow
                selectedEl.style.position = '';
                selectedEl.style.left = ''; selectedEl.style.top = '';
                selectedEl.style.transform = '';
                selectedEl.style.width = '';
                selectedEl.style.margin = '';
            } else {
                // Fix 1: Use body-relative coordinates (not viewport)
                var rect = selectedEl.getBoundingClientRect();
                var bodyRect = document.body.getBoundingClientRect();
                // Fix 2: Move to body if nested inside a wrapper
                if (selectedEl.parentElement !== document.body) {
                    document.body.appendChild(selectedEl);
                }
                selectedEl.style.position = 'absolute';
                selectedEl.style.width = rect.width + 'px';
                selectedEl.style.left = (rect.left - bodyRect.left) + 'px';
                selectedEl.style.top = (rect.top - bodyRect.top) + 'px';
                selectedEl.style.margin = '0';
            }
            showHandle(selectedEl);
            syncHtmlBack();
        };

        // Delete
        dragHandle.querySelector('#btn-del').onclick = function(ev) {
            ev.stopPropagation();
            if (confirm('Delete element?')) {
                selectedEl.remove();
                removeHandle();
                sendTree();
                syncHtmlBack();
            }
        };

        // Drag start on grip
        var grip = dragHandle.querySelector('.grip');
        grip.addEventListener('mousedown', startDrag);
        grip.addEventListener('touchstart', startDrag, { passive: false });
    }

    function removeHandle() {
        if (dragHandle) { dragHandle.remove(); dragHandle = null; }
        if (selectedEl) { selectedEl.style.outline = ''; selectedEl.style.outlineOffset = ''; selectedEl = null; }
    }

    function updateHandlePos() {
        if (!selectedEl || !dragHandle) return;
        var r = selectedEl.getBoundingClientRect();
        dragHandle.style.top = (r.top + (window.scrollY || window.pageYOffset)) + 'px';
        dragHandle.style.left = (r.left + (window.scrollX || window.pageXOffset)) + 'px';
    }

    function startDrag(e) {
        e.preventDefault(); e.stopPropagation();
        if (!selectedEl) return;
        isDragging = true;

        dragMode = isAbsolute(selectedEl) ? 'free' : 'sort';

        var cX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        var cY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        startX = cX;
        startY = cY;

        // Pause contenteditable during drag
        document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
            el.setAttribute('data-ce-paused', '1');
            el.setAttribute('contenteditable', 'false');
        });

        // Fix 5: Hide outline during drag
        if (selectedEl) { selectedEl.style.outline = 'none'; selectedEl.style.outlineOffset = ''; }

        if (dragMode === 'free') {
            initialLeft = parseFloat(selectedEl.style.left || 0);
            initialTop = parseFloat(selectedEl.style.top || 0);
            // Fix 1: Use body-relative coords for free drag start
            if (isNaN(initialLeft)) {
                var bodyR = document.body.getBoundingClientRect();
                initialLeft = selectedEl.getBoundingClientRect().left - bodyR.left;
            }
            if (isNaN(initialTop)) {
                var bodyR2 = document.body.getBoundingClientRect();
                initialTop = selectedEl.getBoundingClientRect().top - bodyR2.top;
            }
        } else {
            ghost = selectedEl.cloneNode(true);
            ghost.className = 'drag-ghost';
            ghost.style.width = selectedEl.offsetWidth + 'px';
            ghost.style.position = 'fixed';
            document.body.appendChild(ghost);

            indicator = document.createElement('div');
            indicator.className = 'drag-indicator';
            document.body.appendChild(indicator);

            selectedEl.style.opacity = '0.3';
        }

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
        if (!isDragging) return;
        e.preventDefault();
        var cX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        var cY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        var dx = cX - startX;
        var dy = cY - startY;

        if (dragMode === 'free') {
            // DIRECT MOVE — element follows cursor in real time
            selectedEl.style.left = (initialLeft + dx) + 'px';
            selectedEl.style.top = (initialTop + dy) + 'px';
            updateHandlePos();
        } else {
            // SORT MODE — ghost follows cursor, indicator shows drop position
            if (ghost) {
                ghost.style.left = (cX + 5) + 'px';
                ghost.style.top = (cY + 5) + 'px';
            }

            var siblings = Array.from(document.body.children).filter(function(c) {
                return c !== selectedEl && c !== ghost && c !== indicator && c !== dragHandle
                    && ['SCRIPT','STYLE'].indexOf(c.tagName) === -1
                    && !isAbsolute(c)
                    && !c.classList.contains('drag-handle');
            });

            var best = null, minD = Infinity;
            for (var i = 0; i < siblings.length; i++) {
                var r = siblings[i].getBoundingClientRect();
                var mid = r.top + r.height / 2;
                var d = Math.abs(cY - mid);
                if (d < minD) { minD = d; best = siblings[i]; }
            }

            if (best) {
                var r = best.getBoundingClientRect();
                var isBefore = cY < (r.top + r.height / 2);
                dropTarget = best;
                dropPos = isBefore ? 'before' : 'after';

                // Fix 4: Use documentElement scroll for consistent indicator position
                var scrollT = document.documentElement.scrollTop || document.body.scrollTop || 0;
                var scrollL = document.documentElement.scrollLeft || document.body.scrollLeft || 0;
                indicator.style.display = 'block';
                indicator.style.top = (scrollT + (isBefore ? r.top : r.bottom)) + 'px';
                indicator.style.left = (scrollL + r.left) + 'px';
                indicator.style.width = r.width + 'px';
            }
        }

        // Auto-scroll
        if (cY < 60) window.scrollBy(0, -10);
        else if (cY > window.innerHeight - 60) window.scrollBy(0, 10);
    }

    function endDrag(e) {
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

        if (dragMode === 'free') {
            syncHtmlBack();
        } else {
            if (dropTarget && selectedEl) {
                if (dropPos === 'before') document.body.insertBefore(selectedEl, dropTarget);
                else document.body.insertBefore(selectedEl, dropTarget.nextSibling);
            }
            if (ghost) { ghost.remove(); ghost = null; }
            if (indicator) { indicator.remove(); indicator = null; }
            if (selectedEl) selectedEl.style.opacity = '1';
        }

        dropTarget = null;
        // Fix 5: Restore outline and handle after drag
        if (selectedEl) {
            selectedEl.style.outline = '2px solid rgba(59,130,246,0.5)';
            selectedEl.style.outlineOffset = '3px';
        }
        if (dragHandle) dragHandle.style.display = '';
        updateHandlePos();
        syncHtmlBack();
        sendTree();
    }

    // Show drag handle on element click
    document.addEventListener('click', function(e) {
        if (isDragging) return;
        if (e.target.closest('.drag-handle') || e.target.closest('#floating-toolbar')) return;
        var target = e.target;
        while (target && target !== document.body && ['DIV','P','H1','H2','H3','H4','H5','H6','IMG','UL','OL','TABLE','SECTION','HEADER','FOOTER','FIGURE','HR','BLOCKQUOTE'].indexOf(target.tagName) === -1) {
            target = target.parentElement;
        }
        if (target && target !== document.body) {
            showHandle(target);
        } else {
            removeHandle();
        }
    });

    window.addEventListener('scroll', function() {
        if (!isDragging) updateHandlePos();
    });

})();
</script>
`;