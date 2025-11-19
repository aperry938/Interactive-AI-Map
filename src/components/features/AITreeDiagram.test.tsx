import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AITreeDiagram from './AITreeDiagram';
import type { TreeNode } from '../../types';
import * as d3 from 'd3';

// Mock D3 zoom to avoid JSDOM issues
vi.mock('d3', async () => {
    const actual = await vi.importActual('d3');
    return {
        ...actual,
        zoom: () => {
            const zoomFn = () => { };
            zoomFn.scaleExtent = () => zoomFn;
            zoomFn.on = () => zoomFn;
            zoomFn.transform = () => { };
            return zoomFn;
        },
        zoomIdentity: {
            translate: () => ({
                scale: () => ({})
            })
        }
    };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

const mockData: TreeNode = {
    id: "root",
    name: "Root Node",
    children: [
        { id: "child1", name: "Child 1" },
        { id: "child2", name: "Child 2" }
    ]
};

describe('AITreeDiagram', () => {
    it('renders without crashing', () => {
        // Mock clientWidth/Height for the container
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 });

        render(
            <div style={{ width: '500px', height: '500px' }}>
                <AITreeDiagram
                    data={mockData}
                    searchTerm=""
                    onNodeSelect={() => { }}
                    resetViewToggle={false}
                    masteredNodes={[]}
                />
            </div>
        );

        const svg = document.querySelector('svg');
        expect(svg).toBeTruthy();
    });

    it('renders node names', async () => {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 });

        render(
            <div style={{ width: '500px', height: '500px' }}>
                <AITreeDiagram
                    data={mockData}
                    searchTerm=""
                    onNodeSelect={() => { }}
                    resetViewToggle={false}
                    masteredNodes={[]}
                />
            </div>
        );

        // Wait for D3 to render
        // Since we mocked zoom, the effect should run. 
        // However, D3 selects and appends. 
        // We might need to check if the text nodes are actually created.
        // screen.debug(); 

        // Note: With D3 and React, sometimes it's better to test the side effects or just that the container exists.
        // If text finding fails, we might need to relax this test or improve the mock.
        expect(screen.getByText('Root Node')).toBeTruthy();
    });
});
