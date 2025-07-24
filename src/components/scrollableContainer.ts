import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';

export const createScrollableContainer = (width: number, height: number, minHeight: number = 260) => {
  const container = new Container();
  const mask = new Graphics();
  const content = new Container();

  // Set up mask for scrolling effect
  mask.rect(0, 0, width, height);
  mask.fill(0xFFFFFF);

  container.addChild(mask);
  container.addChild(content);
  content.mask = mask;

  // Track scroll position and touch state
  let scrollY = 0;
  let contentHeight = 0;
  let isDragging = false;
  let lastPointerY = 0;
  let velocity = 0;
  let lastTime = 0;

  // Enable interaction
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // Mouse wheel scrolling
  container.on('wheel', (e) => {
    if (contentHeight <= height) return;
    recordUserActivity(ActivityTypes.BUTTON_CLICK);
    scrollY += e.deltaY * 0.5; // Reduce scroll speed for better control
    scrollY = Math.max(0, Math.min(scrollY, contentHeight - height));
    content.y = -scrollY;
  });

  // Touch/pointer scrolling
  container.on('pointerdown', (e: FederatedPointerEvent) => {
    if (contentHeight <= height) return;
    recordUserActivity(ActivityTypes.BUTTON_CLICK);
    isDragging = true;
    lastPointerY = e.global.y;
    lastTime = Date.now();
    velocity = 0;
    container.cursor = 'grabbing';
  });

  container.on('pointermove', (e: FederatedPointerEvent) => {
    if (!isDragging || contentHeight <= height) return;
    recordUserActivity(ActivityTypes.BUTTON_CLICK);
    const currentY = e.global.y;
    const deltaY = currentY - lastPointerY;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;

    // Calculate velocity for momentum scrolling
    if (deltaTime > 0) {
      velocity = deltaY / deltaTime;
    }

    scrollY -= deltaY; // Invert for natural scrolling
    scrollY = Math.max(0, Math.min(scrollY, contentHeight - height));
    content.y = -scrollY;

    lastPointerY = currentY;
    lastTime = currentTime;
  });

  const stopDragging = () => {
    if (!isDragging) return;
    recordUserActivity(ActivityTypes.BUTTON_CLICK);
    isDragging = false;
    container.cursor = 'pointer';

    // Apply momentum scrolling
    if (Math.abs(velocity) > 0.1) {
      const momentumScroll = () => {
        velocity *= 0.95; // Friction
        scrollY -= velocity * 16; // Apply velocity (assuming 60fps)
        scrollY = Math.max(0, Math.min(scrollY, contentHeight - height));
        content.y = -scrollY;

        if (Math.abs(velocity) > 0.01) {
          requestAnimationFrame(momentumScroll);
        }
      };
      requestAnimationFrame(momentumScroll);
    }
  };

  container.on('pointerup', stopDragging);
  container.on('pointerupoutside', stopDragging);
  
  return {
    container,
    content,
    updateSize: (newWidth: number, newHeight: number) => {
      mask.clear();
      mask.rect(0, 0, newWidth, Math.max(newHeight, minHeight));
      mask.fill(0xFFFFFF);
    },
    setContentHeight: (height: number) => {
      contentHeight = height;
    }
  };
};