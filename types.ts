/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  status: 'streaming' | 'complete' | 'error';
}

export interface PaperSize {
  name: string;
  widthMm: number;
  heightMm: number;
  cssSize: string;
  widthPx: number;
  heightPx: number;
}

export interface Session {
  id: string;
  prompt: string;
  timestamp: number;
  artifacts: Artifact[];
  paperSize: PaperSize;
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }