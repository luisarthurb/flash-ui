/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { TrashIcon, MoveUpIcon, MoveDownIcon, TypeIcon, MinusIcon, ImagePlusIcon, PlusIcon, CrownIcon, LayersIcon } from './Icons';

export interface TreeNode {
    tag: string;
    label: string;
    text: string;
    path: number[];
    childCount: number;
    children: TreeNode[];
    depth: number;
}

interface ElementTreePanelProps {
    isOpen: boolean;
    onClose: () => void;
    treeData: TreeNode[];
    selectedPath: number[] | null;
    onSelectElement: (path: number[]) => void;
    onDeleteElement: (path: number[]) => void;
    onMoveElement: (path: number[], direction: 'up' | 'down') => void;
    onInsertElement: (html: string, position: 'top' | 'after', path?: number[]) => void;
}

const pathEquals = (a: number[] | null, b: number[]): boolean => {
    if (!a) return false;
    return a.length === b.length && a.every((v, i) => v === b[i]);
};

const TreeNodeRow: React.FC<{
    node: TreeNode;
    selectedPath: number[] | null;
    onSelect: (path: number[]) => void;
    onDelete: (path: number[]) => void;
    onMove: (path: number[], direction: 'up' | 'down') => void;
}> = ({ node, selectedPath, onSelect, onDelete, onMove }) => {
    const isSelected = pathEquals(selectedPath, node.path);
    const indent = Math.min(node.depth, 4) * 16;

    return (
        <>
            <div
                className={`tree-node ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${12 + indent}px` }}
                onClick={() => onSelect(node.path)}
            >
                <span className="tree-node-tag">{node.label}</span>
                <span className="tree-node-text">
                    <span className="tree-node-tag-name">{node.tag}</span>
                    {node.text}
                </span>
                <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="tree-action-btn move"
                        onClick={() => onMove(node.path, 'up')}
                        title="Move Up"
                    >
                        <MoveUpIcon />
                    </button>
                    <button
                        className="tree-action-btn move"
                        onClick={() => onMove(node.path, 'down')}
                        title="Move Down"
                    >
                        <MoveDownIcon />
                    </button>
                    <button
                        className="tree-action-btn delete"
                        onClick={() => onDelete(node.path)}
                        title="Delete"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
            {node.children.map((child, i) => (
                <TreeNodeRow
                    key={`${child.path.join('-')}-${i}`}
                    node={child}
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onMove={onMove}
                />
            ))}
        </>
    );
};

const ELEMENT_TEMPLATES = [
    {
        name: 'Text Block',
        icon: <TypeIcon />,
        html: '<p contenteditable="true" style="margin: 8px 0; padding: 4px;">New text block — click to edit</p>'
    },
    {
        name: 'Heading',
        icon: <span style={{ fontWeight: 700, fontSize: '14px' }}>H</span>,
        html: '<h2 contenteditable="true" style="margin: 16px 0 8px; padding: 4px;">New Category</h2>'
    },
    {
        name: 'Menu Item',
        icon: <LayersIcon />,
        html: '<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 6px 4px; border-bottom: 1px dotted #ccc;"><span contenteditable="true" style="font-weight: 500;">Item Name</span><span contenteditable="true" style="font-weight: 600;">$0.00</span></div>'
    },
    {
        name: 'Divider',
        icon: <MinusIcon />,
        html: '<hr style="margin: 16px 0; border: none; border-top: 1px solid #ddd;" />'
    },
    {
        name: 'Image',
        icon: <ImagePlusIcon />,
        upload: true,
        html: '' // handled via file upload
    },
    {
        name: 'Logo',
        icon: <CrownIcon />,
        upload: true,
        isLogo: true,
        html: '' // handled via file upload
    }
];

const ElementTreePanel: React.FC<ElementTreePanelProps> = ({
    isOpen,
    onClose,
    treeData,
    selectedPath,
    onSelectElement,
    onDeleteElement,
    onMoveElement,
    onInsertElement
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingInsertRef = useRef<{ isLogo: boolean } | null>(null);

    if (!isOpen) return null;

    const handleImageUpload = (isLogo: boolean) => {
        pendingInsertRef.current = { isLogo };
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingInsertRef.current) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
            const { isLogo } = pendingInsertRef.current!;
            if (isLogo) {
                const html = `<img src="${src}" alt="Logo" style="display: block; margin: 16px auto; max-width: 200px; height: auto;" />`;
                onInsertElement(html, 'top');
            } else {
                const html = `<img src="${src}" alt="Menu image" style="display: block; margin: 12px auto; max-width: 300px; height: auto; border-radius: 8px;" />`;
                onInsertElement(html, 'after', selectedPath || undefined);
            }
            pendingInsertRef.current = null;
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddElement = (template: typeof ELEMENT_TEMPLATES[0]) => {
        if (template.upload) {
            handleImageUpload(!!template.isLogo);
        } else {
            onInsertElement(template.html, 'after', selectedPath || undefined);
        }
    };

    return (
        <div className="element-tree-overlay" onClick={onClose}>
            <div className="element-tree-panel" onClick={(e) => e.stopPropagation()}>
                <div className="element-tree-header">
                    <h2>Elements</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>

                <div className="element-tree-body">
                    {treeData.length === 0 ? (
                        <div className="tree-empty">
                            <p>No elements found. Generate a menu first.</p>
                        </div>
                    ) : (
                        treeData.map((node, i) => (
                            <TreeNodeRow
                                key={`${node.path.join('-')}-${i}`}
                                node={node}
                                selectedPath={selectedPath}
                                onSelect={onSelectElement}
                                onDelete={onDeleteElement}
                                onMove={onMoveElement}
                            />
                        ))
                    )}
                </div>

                <div className="add-element-toolbar">
                    <div className="add-element-label">
                        <PlusIcon /> Add Element
                    </div>
                    <div className="add-element-buttons">
                        {ELEMENT_TEMPLATES.map((t) => (
                            <button
                                key={t.name}
                                className="add-element-btn"
                                onClick={() => handleAddElement(t)}
                                title={t.name}
                            >
                                {t.icon}
                                <span>{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default ElementTreePanel;
