export type MobileSonarDockSide = 'left' | 'right';

export const mobileSonarBreakpointQuery = '(max-width: 640px)';
export const mobileSonarControlGapPx = 10;
export const mobileSonarDragThresholdPx = 6;

export interface MobileSonarRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface MobileSonarBounds {
  width: number;
  height: number;
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
  expandedSize: number;
  surfaceScale: number;
  controlGap: number;
  lighthouseSafeZone?: MobileSonarRect;
}

export interface MobileSonarBubble {
  x: number;
  y: number;
  dockSide: MobileSonarDockSide;
}

export interface MobileSonarPoint {
  x: number;
  y: number;
}

export interface MobileSonarPlacement {
  bubble: MobileSonarBubble;
  panelLeft: number;
  panelTop: number;
  transformOriginX: number;
  transformOriginY: number;
}

export function defaultMobileSonarBubble(bounds: MobileSonarBounds): MobileSonarBubble {
  const radius = collapsedMobileSonarRadius(bounds);

  return {
    x: bounds.safeLeft + radius,
    y: bounds.height - bounds.safeBottom - radius,
    dockSide: 'left',
  };
}

export function clampMobileSonarBubble(
  point: MobileSonarPoint,
  dockSide: MobileSonarDockSide,
  bounds: MobileSonarBounds,
): MobileSonarBubble {
  const radius = collapsedMobileSonarRadius(bounds);

  return {
    x: clamp(point.x, bounds.safeLeft + radius, bounds.width - bounds.safeRight - radius),
    y: clamp(point.y, bounds.safeTop + radius, bounds.height - bounds.safeBottom - radius),
    dockSide,
  };
}

export function isMobileSonarDragDistance(
  deltaX: number,
  deltaY: number,
  threshold = mobileSonarDragThresholdPx,
): boolean {
  return Math.hypot(deltaX, deltaY) >= threshold;
}

export function mobileSonarBubbleRect(
  bubble: MobileSonarBubble,
  bounds: MobileSonarBounds,
): MobileSonarRect {
  const radius = collapsedMobileSonarRadius(bounds);

  return {
    left: bubble.x - radius,
    top: bubble.y - radius,
    right: bubble.x + radius,
    bottom: bubble.y + radius,
  };
}

export function mobileSonarPlacementForBubble(
  bubble: MobileSonarBubble,
  bounds: MobileSonarBounds,
): MobileSonarPlacement {
  const safePanelLeft =
    bubble.dockSide === 'left'
      ? bounds.safeLeft
      : bounds.width - bounds.safeRight - bounds.expandedSize;
  const panelLeft = clamp(
    safePanelLeft,
    bounds.safeLeft,
    bounds.width - bounds.safeRight - bounds.expandedSize,
  );
  const panelTop = clamp(
    bubble.y - bounds.expandedSize / 2,
    bounds.safeTop,
    bounds.height - bounds.safeBottom - bounds.expandedSize,
  );

  return {
    bubble,
    panelLeft,
    panelTop,
    transformOriginX: transformOriginForBubble(
      bubble.x - panelLeft,
      bounds.expandedSize,
      bounds.surfaceScale,
    ),
    transformOriginY: transformOriginForBubble(
      bubble.y - panelTop,
      bounds.expandedSize,
      bounds.surfaceScale,
    ),
  };
}

export function snapMobileSonarBubble(
  point: MobileSonarPoint,
  bounds: MobileSonarBounds,
): MobileSonarBubble {
  const dockSide: MobileSonarDockSide = point.x < bounds.width / 2 ? 'left' : 'right';
  const radius = collapsedMobileSonarRadius(bounds);
  const snapped = clampMobileSonarBubble(
    {
      x: dockSide === 'left' ? bounds.safeLeft + radius : bounds.width - bounds.safeRight - radius,
      y: point.y,
    },
    dockSide,
    bounds,
  );

  return dockSide === 'right' ? avoidLighthouseCollision(snapped, bounds) : snapped;
}

export function mobileSonarRectsOverlap(rect: MobileSonarRect, target: MobileSonarRect): boolean {
  return (
    rect.left < target.right &&
    rect.right > target.left &&
    rect.top < target.bottom &&
    rect.bottom > target.top
  );
}

function avoidLighthouseCollision(
  bubble: MobileSonarBubble,
  bounds: MobileSonarBounds,
): MobileSonarBubble {
  if (!bounds.lighthouseSafeZone) {
    return bubble;
  }

  const radius = collapsedMobileSonarRadius(bounds);
  const expandedZone = inflateRect(bounds.lighthouseSafeZone, bounds.controlGap);

  if (!mobileSonarRectsOverlap(mobileSonarBubbleRect(bubble, bounds), expandedZone)) {
    return bubble;
  }

  const minY = bounds.safeTop + radius;
  const maxY = bounds.height - bounds.safeBottom - radius;
  const aboveY = expandedZone.top - radius;
  const belowY = expandedZone.bottom + radius;
  const candidateY =
    aboveY >= minY
      ? aboveY
      : belowY <= maxY
        ? belowY
        : Math.abs(clamp(aboveY, minY, maxY) - bubble.y) <
            Math.abs(clamp(belowY, minY, maxY) - bubble.y)
          ? clamp(aboveY, minY, maxY)
          : clamp(belowY, minY, maxY);

  return {
    ...bubble,
    y: clamp(candidateY, minY, maxY),
  };
}

function collapsedMobileSonarRadius(bounds: MobileSonarBounds): number {
  return (bounds.expandedSize * bounds.surfaceScale) / 2;
}

function transformOriginForBubble(
  bubbleCoordinate: number,
  expandedSize: number,
  surfaceScale: number,
): number {
  const centerCoordinate = expandedSize / 2;
  const unscaledOrigin = (bubbleCoordinate - surfaceScale * centerCoordinate) / (1 - surfaceScale);

  return clamp(unscaledOrigin, 0, expandedSize);
}

function inflateRect(rect: MobileSonarRect, amount: number): MobileSonarRect {
  return {
    left: rect.left - amount,
    top: rect.top - amount,
    right: rect.right + amount,
    bottom: rect.bottom + amount,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }

  return Math.min(Math.max(value, min), max);
}
