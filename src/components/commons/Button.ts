import { Container, Sprite, Graphics, Text, Texture, TextStyle } from 'pixi.js';

export interface ButtonOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: number | string;
  borderColor?: number | string;
  borderWidth?: number;
  borderRadius?: number;
  texture?: Sprite | Texture; // Updated to support both Sprite and Texture
  hoverTint?: number | string;
  disabled?: boolean;
  onClick?: () => void;
  label?: string | number;
  textColor?: number | string;
  visibility?: boolean;
  textSize?: number;
  selected?: boolean;
  selectedTint?: number | string;
  fontFamily?: string;
  anchor?: { x: number; y: number }; // New anchor option
  bold?: boolean;        // New option for bold text
  italic?: boolean;      // New option for italic text
}

/**
 * Converts a color (hex string or number) to a number for Pixi.js
 */
const parseColor = (color: number | string | undefined): number => {
  if (color === undefined) return 0x000000;
  if (typeof color === 'number') return color;
  const cleanColor = color.replace('#', '');
  const hex = cleanColor.length === 3 
    ? cleanColor.split('').map(c => c + c).join('')
    : cleanColor;
  return parseInt(hex, 16);
};

export function createButton(options: ButtonOptions = {}): Container {
  // Default values
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 50,
    color = 0xcccccc,
    borderColor = 0x000000,
    borderWidth = 2,
    borderRadius = 0,
    texture,
    hoverTint = 0xaaaaaa,
    disabled = false,
    onClick,
    label = '',
    textColor = 0x000000,
    visibility = true,
    textSize,
    selected = false,
    selectedTint,
    fontFamily = 'Arial',
    anchor = { x: 0.5, y: 0.5 }, // Default anchor
    bold = false,          // New default for bold
    italic = false,        // New default for italic
  } = options;

  // State
  let isDisabled = disabled;
  let isHovered = false;
  let isVisible = visibility;
  let isSelected = selected;
  let isPointerDown = false;
  let pointerDownPosition = { x: 0, y: 0 };
  const MOVEMENT_THRESHOLD = 10; // pixels
  let currentWidth = width;
  let currentHeight = height;
  let currentBold = bold;       // Track current bold state
  let currentItalic = italic;   // Track current italic state

  // Create container
  const button = new Container();
  button.visible = isVisible;

  // Set position
  button.position.set(x, y);

  const getOffsetX = () => -currentWidth * anchor.x;
  const getOffsetY = () => -currentHeight * anchor.y;

  // Create shadow for raised effect
  const shadow = new Graphics();
  const shadowOffset = 5;
  const shadowColor = 0x000000;
  const shadowAlpha = 0.3;

  const updateShadow = () => {
    shadow.clear();
    shadow.beginFill(shadowColor, shadowAlpha);
    shadow.drawRoundedRect(
      getOffsetX() + shadowOffset,
      getOffsetY() + shadowOffset,
      currentWidth,
      currentHeight,
      borderRadius
    );
    shadow.endFill();
  };

  updateShadow();
  shadow.zIndex = -1;
  shadow.visible = isVisible;

  // Create background
  let background: Sprite | Graphics;
  if (texture) {
    background = texture instanceof Sprite 
      ? texture 
      : new Sprite(texture as Texture);
    background.width = currentWidth;
    background.height = currentHeight;
    background.anchor.set(anchor.x, anchor.y);
  } else {
    background = new Graphics();
    background.beginFill(parseColor(color));
    background.lineStyle(borderWidth, parseColor(borderColor));
    background.drawRoundedRect(getOffsetX(), getOffsetY(), currentWidth, currentHeight, borderRadius);
    background.endFill();
  }
  background.zIndex = 0;
  background.visible = isVisible;

  // Add children with proper layering
  button.addChild(shadow);
  button.addChild(background);

  // Create text label with bold/italic support
  let text: Text | null = null;
  if (label !== undefined) {
    const textStyle = new TextStyle({
      fontFamily,
      fontSize: textSize || Math.min(currentWidth, currentHeight) * 0.4,
      fill: parseColor(textColor),
      align: 'center',
      fontWeight: currentBold ? 'bold' : 'normal',    // Apply bold
      fontStyle: currentItalic ? 'italic' : 'normal', // Apply italic
    });
    text = new Text(label.toString(), textStyle);
    text.anchor.set(anchor.x, anchor.y);
    text.position.set(0, 0);
    text.zIndex = 1;
    text.visible = isVisible;
    button.addChild(text);
  }

  // Enable sorting by zIndex
  button.sortableChildren = true;

  // Set container pivot to top-left (optional, since we use anchor)
  button.pivot.set(0, 0);

  // Enable interactivity
  button.interactive = true;
  button.cursor = 'pointer';

  // Apply selected state
  const applySelectedTint = () => {
    if (isSelected && isVisible && !isDisabled) {
      background.tint = selectedTint ? parseColor(selectedTint) : 0x66cc66;
    } else if (!isDisabled && isVisible) {
      background.tint = isHovered ? parseColor(hoverTint) : 0xffffff;
    }
  };

  // Event handlers
  const onPointerOver = () => {
    if (!isDisabled && isVisible) {
      isHovered = true;
      applySelectedTint();
    }
  };

  const onPointerOut = () => {
    if (!isDisabled && isVisible) {
      isHovered = false;
      applySelectedTint();
    }
  };

  const onPointerDown = (event: any) => {
    if (!isDisabled && isVisible) {
      isPointerDown = true;
      pointerDownPosition = { x: event.global.x, y: event.global.y };
    }
  };

  const onPointerUp = (event: any) => {
    if (!isDisabled && isVisible && isPointerDown && onClick) {
      const currentPosition = { x: event.global.x, y: event.global.y };
      const deltaX = Math.abs(currentPosition.x - pointerDownPosition.x);
      const deltaY = Math.abs(currentPosition.y - pointerDownPosition.y);

      // Only trigger click if pointer didn't move significantly (not scrolling)
      if (deltaX < MOVEMENT_THRESHOLD && deltaY < MOVEMENT_THRESHOLD) {
        onClick();
      }
    }
    isPointerDown = false;
  };

  const onPointerUpOutside = () => {
    // Reset pointer down state if pointer is released outside the button
    isPointerDown = false;
  };

  // Apply disabled state
  const setDisabled = (disable: boolean) => {
    isDisabled = disable;
    button.interactive = !disable && isVisible;
    button.cursor = disable ? 'default' : 'pointer';
    button.alpha = disable ? 0.5 : 1.0;
    shadow.visible = !disable && isVisible;

    // Reset hover state when disabling to prevent stuck hover appearance
    if (disable) {
      isHovered = false;
    }

    applySelectedTint();
  };

  // Apply visibility state
  const setVisibility = (visible: boolean) => {
    isVisible = visible;
    button.visible = isVisible;
    shadow.visible = isVisible;
    background.visible = isVisible;
    if (text) text.visible = isVisible;
    button.interactive = !isDisabled && isVisible;
    if (!visible) {
      isHovered = false;
    }
    applySelectedTint();
  };

  // Apply selected state
  const setSelected = (select: boolean) => {
    isSelected = select;
    applySelectedTint();
  };

  // Updated setLabel to preserve formatting
  const setLabel = (newLabel: string | number) => {
    if (text) {
      text.text = newLabel.toString();
      // Ensure formatting is maintained
      text.style.fontWeight = currentBold ? 'bold' : 'normal';
      text.style.fontStyle = currentItalic ? 'italic' : 'normal';
    }
  };

  const setTextColor = (newColor: string) => {
    if (text) {
      text.style.fill = parseColor(newColor);
    }
  };

  // Set texture function
  const setTexture = (newTexture: Sprite | Texture | null) => {
    // Remove current background
    button.removeChild(background);
    
    if (newTexture) {
      // Create new sprite background
      background = newTexture instanceof Sprite 
        ? newTexture 
        : new Sprite(newTexture as Texture);
      background.width = currentWidth;
      background.height = currentHeight;
      background.anchor.set(anchor.x, anchor.y);
    } else {
      // Create new graphics background
      background = new Graphics();
      background.beginFill(parseColor(color));
      background.lineStyle(borderWidth, parseColor(borderColor));
      background.drawRoundedRect(getOffsetX(), getOffsetY(), currentWidth, currentHeight, borderRadius);
      background.endFill();
    }
    
    background.zIndex = 0;
    background.visible = isVisible;
    button.addChild(background);
    
    // Re-sort children to maintain proper layering
    button.sortChildren();
    
    // Apply current tint state
    applySelectedTint();
  };

  // Get current texture
  const getTexture = (): Texture | null => {
    if (background instanceof Sprite) {
      return background.texture;
    }
    return null;
  };

  // New method to set bold
  const setBold = (isBold: boolean) => {
    currentBold = isBold;
    if (text) {
      text.style.fontWeight = currentBold ? 'bold' : 'normal';
    }
  };

  // New method to get bold state
  const getBold = () => currentBold;

  // New method to set italic
  const setItalic = (isItalic: boolean) => {
    currentItalic = isItalic;
    if (text) {
      text.style.fontStyle = currentItalic ? 'italic' : 'normal';
    }
  };

  // New method to get italic state
  const getItalic = () => currentItalic;

  // Position methods
  const setPosition = (newX: number, newY: number) => {
    button.position.set(newX, newY);
  };

  const getPosition = () => {
    return { x: button.position.x, y: button.position.y };
  };

  // Size methods
  const setSize = (newWidth: number, newHeight: number) => {
    currentWidth = newWidth;
    currentHeight = newHeight;
    
    if (background instanceof Sprite) {
      background.width = currentWidth;
      background.height = currentHeight;
    } else {
      // Redraw graphics background
      (background as Graphics).clear();
      (background as Graphics).beginFill(parseColor(color));
      (background as Graphics).lineStyle(borderWidth, parseColor(borderColor));
      (background as Graphics).drawRoundedRect(getOffsetX(), getOffsetY(), currentWidth, currentHeight, borderRadius);
      (background as Graphics).endFill();
    }
    
    // Update shadow
    updateShadow();
    
    // Update text size if no custom size was provided
    if (text && !textSize) {
      text.style.fontSize = Math.min(currentWidth, currentHeight) * 0.4;
    }
  };

  const getSize = () => {
    return { width: currentWidth, height: currentHeight };
  };

  // Initial states
  setDisabled(disabled);
  setVisibility(visibility);
  setSelected(selected);

  // Attach event listeners
  button.on('pointerover', onPointerOver);
  button.on('pointerout', onPointerOut);
  button.on('pointerdown', onPointerDown);
  button.on('pointerup', onPointerUp);
  button.on('pointerupoutside', onPointerUpOutside);

  // Expose public methods
  (button as any).setDisabled = setDisabled;
  (button as any).getDisabled = () => isDisabled;
  (button as any).setVisibility = setVisibility;
  (button as any).getVisibility = () => isVisible;
  (button as any).setSelected = setSelected;
  (button as any).getSelected = () => isSelected;
  (button as any).setLabel = setLabel;
  (button as any).setTextColor = setTextColor;
  (button as any).setPosition = setPosition;
  (button as any).getPosition = getPosition;
  (button as any).setTexture = setTexture;
  (button as any).getTexture = getTexture;
  (button as any).setSize = setSize;
  (button as any).getSize = getSize;
  (button as any).setBold = setBold;
  (button as any).getBold = getBold;
  (button as any).setItalic = setItalic;
  (button as any).getItalic = getItalic;

  return button;
}

export default createButton;
