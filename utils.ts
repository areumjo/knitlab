import { SelectionRect, Layer, KeyDefinition } from './types';
import { KEY_ID_EMPTY, calculateFootprint, doFootprintsOverlap } from './constants';

// Helper to create a union of two rectangles
export const unionRects = (rect1: SelectionRect, rect2: SelectionRect): SelectionRect => {
    return {
        start: {
            x: Math.min(rect1.start.x, rect2.start.x),
            y: Math.min(rect1.start.y, rect2.start.y),
        },
        end: {
            x: Math.max(rect1.end.x, rect2.end.x),
            y: Math.max(rect1.end.y, rect2.end.y),
        },
    };
};

export const getExpandedSelection = (
    rawSelection: SelectionRect | null,
    activeLayer: Layer | undefined,
    keyPalette: KeyDefinition[],
    chartRows: number,
    chartCols: number
): SelectionRect | null => {
    if (!rawSelection || !activeLayer) return rawSelection;

    const normalizedRawSel = {
        start: {
            x: Math.min(rawSelection.start.x, rawSelection.end.x),
            y: Math.min(rawSelection.start.y, rawSelection.end.y)
        },
        end: {
            x: Math.max(rawSelection.start.x, rawSelection.end.x),
            y: Math.max(rawSelection.start.y, rawSelection.end.y)
        }
    };
    
    let expandedRect = { ...normalizedRawSel };
    let changedInPass = true;
    const maxPasses = Math.max(5, activeLayer.keyPlacements.length / 2); // Safety for very complex overlaps
    let currentPass = 0;

    while (changedInPass && currentPass < maxPasses) {
        changedInPass = false;
        currentPass++;

        for (const placement of activeLayer.keyPlacements) {
            const keyDef = keyPalette.find(k => k.id === placement.keyId);
            if (!keyDef || (keyDef.width === 1 && keyDef.height === 1) || keyDef.id === KEY_ID_EMPTY) continue;

            const keyFootprintRect: SelectionRect = {
                start: placement.anchor,
                end: { 
                    x: placement.anchor.x + keyDef.width - 1, 
                    y: placement.anchor.y + keyDef.height - 1 
                }
            };
            
            const keyFootprintForOverlap = calculateFootprint(placement.anchor, keyDef);
            const expandedRectForOverlap = {
                minR: expandedRect.start.y, maxR: expandedRect.end.y,
                minC: expandedRect.start.x, maxC: expandedRect.end.x
            };

            if (doFootprintsOverlap(expandedRectForOverlap, keyFootprintForOverlap)) {
                const newUnion = unionRects(expandedRect, keyFootprintRect);
                if (newUnion.start.x !== expandedRect.start.x || 
                    newUnion.start.y !== expandedRect.start.y ||
                    newUnion.end.x !== expandedRect.end.x ||
                    newUnion.end.y !== expandedRect.end.y) {
                    expandedRect = newUnion;
                    changedInPass = true;
                }
            }
        }
    }
    // Clamp to grid boundaries
    expandedRect.start.x = Math.max(0, expandedRect.start.x);
    expandedRect.start.y = Math.max(0, expandedRect.start.y);
    expandedRect.end.x = Math.min(chartCols - 1, expandedRect.end.x);
    expandedRect.end.y = Math.min(chartRows - 1, expandedRect.end.y);
    
    return expandedRect;
};
