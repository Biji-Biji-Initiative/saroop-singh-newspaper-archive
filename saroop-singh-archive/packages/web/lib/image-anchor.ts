export type NormalizedPoint = { x: number; y: number };

export function containedImageBox(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
) {
  if (![frameWidth, frameHeight, imageWidth, imageHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { left: (frameWidth - width) / 2, top: (frameHeight - height) / 2, width, height };
}

export function framePointToImageAnchor(
  pointX: number,
  pointY: number,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): NormalizedPoint | null {
  const box = containedImageBox(frameWidth, frameHeight, imageWidth, imageHeight);
  if (!box) return null;
  const x = (pointX - box.left) / box.width;
  const y = (pointY - box.top) / box.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export function imageAnchorToFramePercent(
  anchor: NormalizedPoint,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): NormalizedPoint | null {
  if (anchor.x < 0 || anchor.x > 1 || anchor.y < 0 || anchor.y > 1) return null;
  const box = containedImageBox(frameWidth, frameHeight, imageWidth, imageHeight);
  if (!box) return null;
  return {
    x: ((box.left + anchor.x * box.width) / frameWidth) * 100,
    y: ((box.top + anchor.y * box.height) / frameHeight) * 100,
  };
}
