import {
  MobileSonarBounds,
  MobileSonarPlacement,
  MobileSonarRect,
  clampMobileSonarBubble,
  defaultMobileSonarBubble,
  isMobileSonarDragDistance,
  mobileSonarBubbleRect,
  mobileSonarDragThresholdPx,
  mobileSonarPlacementForBubble,
  mobileSonarRectsOverlap,
  snapMobileSonarBubble,
} from './mobile-sonar-placement';

describe('mobile sonar placement', () => {
  it('preserves the actual bubble position even when the panel avoids the lighthouse', () => {
    const bounds = {
      ...bounds390,
      lighthouseSafeZone: { left: 336, right: 378, top: 401, bottom: 443 },
    };
    for (const y of [350, 422, 480, 760, 999]) {
      const bubble = clampMobileSonarBubble({ x: 350, y }, 'right', bounds);
      const placement = mobileSonarPlacementForBubble(bubble, bounds);
      const renderedY =
        placement.panelTop +
        placement.transformOriginY * (1 - bounds.surfaceScale) +
        (bounds.expandedSize / 2) * bounds.surfaceScale;
      expect(renderedY).toBeCloseTo(bubble.y);
      expectPanelInside(placement, bounds);
    }
  });
  it('keeps the expanded right-docked panel clear of a vertically centered lighthouse', () => {
    const bounds = {
      ...bounds390,
      lighthouseSafeZone: { left: 336, right: 378, top: 401, bottom: 443 },
    };
    const placement = mobileSonarPlacementForBubble(
      snapMobileSonarBubble({ x: 350, y: 422 }, bounds),
      bounds,
    );
    expectPanelInside(placement, bounds);
    expect(
      mobileSonarRectsOverlap(
        {
          left: placement.panelLeft,
          right: placement.panelLeft + bounds.expandedSize,
          top: placement.panelTop,
          bottom: placement.panelTop + bounds.expandedSize,
        },
        bounds.lighthouseSafeZone,
      ),
    ).toBe(false);
  });
  it('defaults the collapsed sonar to a vertically centered left dock', () => {
    const bubble = defaultMobileSonarBubble(bounds390);
    const placement = mobileSonarPlacementForBubble(bubble, bounds390);

    expect(bubble.dockSide).toBe('left');
    expect(bubble.x).toBeCloseTo(43.46);
    expect(bubble.y).toBeCloseTo(422);
    expect(placement.panelLeft).toBe(12);
    expect(placement.panelTop).toBe(279);
    expectPanelInside(placement, bounds390);
  });

  it('distinguishes a tap from a drag with a small movement threshold', () => {
    expect(isMobileSonarDragDistance(3, 4)).toBe(false);
    expect(isMobileSonarDragDistance(mobileSonarDragThresholdPx, 0)).toBe(true);
  });

  it('clamps the dragged bubble inside the usable viewport', () => {
    const bubble = clampMobileSonarBubble({ x: -120, y: 980 }, 'left', bounds390);

    expect(bubble.x).toBeCloseTo(43.46);
    expect(bubble.y).toBeCloseTo(796.54);
    expectRectInside(mobileSonarBubbleRect(bubble, bounds390), bounds390);
  });

  it('snaps release points to the nearest horizontal dock side', () => {
    const leftBubble = snapMobileSonarBubble({ x: 90, y: 320 }, bounds390);
    const rightBubble = snapMobileSonarBubble({ x: 320, y: 320 }, bounds390);

    expect(leftBubble.dockSide).toBe('left');
    expect(leftBubble.x).toBeCloseTo(43.46);
    expect(rightBubble.dockSide).toBe('right');
    expect(rightBubble.x).toBeCloseTo(346.54);
  });

  it('expands inward from either dock side and keeps the panel inside the viewport', () => {
    const leftPlacement = mobileSonarPlacementForBubble(
      snapMobileSonarBubble({ x: 80, y: 420 }, bounds390),
      bounds390,
    );
    const rightPlacement = mobileSonarPlacementForBubble(
      snapMobileSonarBubble({ x: 320, y: 420 }, bounds390),
      bounds390,
    );

    expect(leftPlacement.panelLeft).toBe(12);
    expect(rightPlacement.panelLeft).toBe(92);
    expectPanelInside(leftPlacement, bounds390);
    expectPanelInside(rightPlacement, bounds390);
  });

  it('corrects very high and very low expanded panels back into the viewport', () => {
    const highPlacement = mobileSonarPlacementForBubble(
      clampMobileSonarBubble({ x: 43.46, y: 0 }, 'left', bounds390),
      bounds390,
    );
    const lowPlacement = mobileSonarPlacementForBubble(
      clampMobileSonarBubble({ x: 43.46, y: 999 }, 'left', bounds390),
      bounds390,
    );

    expect(highPlacement.panelTop).toBe(16);
    expect(lowPlacement.panelTop).toBe(542);
    expectPanelInside(highPlacement, bounds390);
    expectPanelInside(lowPlacement, bounds390);
  });

  it('keeps a right-docked sonar clear of the lighthouse safe zone', () => {
    const bubble = snapMobileSonarBubble({ x: 360, y: 830 }, bounds390);

    expect(bubble.dockSide).toBe('right');
    expect(bubble.y).toBeCloseTo(744.54);
    expect(
      mobileSonarRectsOverlap(mobileSonarBubbleRect(bubble, bounds390), {
        left: 326,
        top: 776,
        right: 388,
        bottom: 838,
      }),
    ).toBe(false);
  });

  it('keeps the same constraints on narrower mobile viewports', () => {
    const leftPlacement = mobileSonarPlacementForBubble(
      defaultMobileSonarBubble(bounds360),
      bounds360,
    );
    const rightPlacement = mobileSonarPlacementForBubble(
      snapMobileSonarBubble({ x: 320, y: 790 }, bounds360),
      bounds360,
    );

    expect(leftPlacement.panelLeft).toBe(12);
    expect(leftPlacement.panelTop).toBe(272);
    expect(rightPlacement.panelLeft).toBe(92);
    expect(rightPlacement.bubble.y).toBeCloseTo(703.84);
    expectPanelInside(leftPlacement, bounds360);
    expectPanelInside(rightPlacement, bounds360);
  });
});

const bounds390: MobileSonarBounds = {
  width: 390,
  height: 844,
  safeLeft: 12,
  safeRight: 12,
  safeTop: 16,
  safeBottom: 16,
  expandedSize: 286,
  surfaceScale: 0.22,
  controlGap: 10,
  lighthouseSafeZone: { left: 336, top: 786, right: 378, bottom: 828 },
};

const bounds360: MobileSonarBounds = {
  width: 360,
  height: 800,
  safeLeft: 12,
  safeRight: 12,
  safeTop: 16,
  safeBottom: 16,
  expandedSize: 256,
  surfaceScale: 0.22,
  controlGap: 10,
  lighthouseSafeZone: { left: 306, top: 742, right: 348, bottom: 784 },
};

function expectPanelInside(placement: MobileSonarPlacement, bounds: MobileSonarBounds): void {
  expectRectInside(
    {
      left: placement.panelLeft,
      top: placement.panelTop,
      right: placement.panelLeft + bounds.expandedSize,
      bottom: placement.panelTop + bounds.expandedSize,
    },
    bounds,
  );
}

function expectRectInside(rect: MobileSonarRect, bounds: MobileSonarBounds): void {
  expect(rect.left).toBeGreaterThanOrEqual(bounds.safeLeft);
  expect(rect.top).toBeGreaterThanOrEqual(bounds.safeTop);
  expect(rect.right).toBeLessThanOrEqual(bounds.width - bounds.safeRight);
  expect(rect.bottom).toBeLessThanOrEqual(bounds.height - bounds.safeBottom);
}
