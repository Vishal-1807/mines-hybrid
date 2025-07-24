import { Container, Text, TextStyle } from 'pixi.js';

/**
 * Interface for Text creation options
 */
export interface TextOptions {
  x?: number; // Horizontal position
  y?: number; // Vertical position
  appWidth?: number; // Application width for centering
  appHeight?: number; // Application height for centering
  text?: string | number; // Text content
  fontSize?: number; // Font size
  color?: number | string; // Text color
  anchor?: { x: number; y: number }; // Anchor point for text alignment
  fontFamily?: string; // Font family
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'; // Font weight
  fontStyle?: 'normal' | 'italic' | 'oblique'; // Font style
  visibility?: boolean; // Visibility of the text
  zIndex?: number; // Layering order
}

/**
 * Converts a color (hex string or number) to a number for Pixi.js
 */
const parseColor = (color: number | string | undefined): number => {
  if (color === undefined) return 0xffffff; // Default to white
  if (typeof color === 'number') return color;
  const cleanColor = color.replace('#', '');
  const hex = cleanColor.length === 3 
    ? cleanColor.split('').map(c => c + c).join('') // Expand #FFF to #FFFFFF
    : cleanColor;
  return parseInt(hex, 16);
};

/**
 * Creates a Pixi.js Text object with customizable options
 */
export function createText(options: TextOptions = {}): Container {
  // Default values
  const {
    x = options.appWidth ? options.appWidth / 2 : 0, // Center if appWidth provided
    y = options.appHeight ? options.appHeight / 2 : 0, // Center if appHeight provided
    appWidth = 0,
    appHeight = 0,
    text = '',
    fontSize = 20,
    color = 0xffffff, // Default to white
    anchor = { x: 0.5, y: 0.5 }, // Default to centered
    fontFamily = 'Arial',
    fontWeight = 'normal',
    fontStyle = 'normal',
    visibility = true, // Default to visible
    zIndex = 0,
  } = options;

  // Create container
  const container = new Container();
  container.visible = visibility; // Set initial visibility
  container.zIndex = zIndex;

  // Create text style
  const style = new TextStyle({
    fontFamily,
    fontSize,
    fill: parseColor(color),
    fontWeight,
    fontStyle,
    align: 'center',
  });

  // Create text
  const textObj = new Text(text.toString(), style);
  textObj.position.set(x, y);
  textObj.anchor.set(anchor.x, anchor.y);
  textObj.zIndex = zIndex;
  textObj.visible = visibility; // Sync text visibility with container

  // Add text to container
  container.addChild(textObj);

  // Enable sorting by zIndex
  container.sortableChildren = true;

  // Public methods
  (container as any).setText = (newText: string | number) => {
    textObj.text = newText.toString();
  };
  (container as any).getText = () => textObj.text;
  (container as any).setVisible = (isVisible: boolean) => {
    container.visible = isVisible;
    textObj.visible = isVisible;
  };
  (container as any).getVisible = () => container.visible;
  (container as any).setPosition = (newX: number, newY: number) => {
    textObj.position.set(newX, newY);
  };
  (container as any).getPosition = () => ({ x: textObj.position.x, y: textObj.position.y });

  return container;
}

export default createText;