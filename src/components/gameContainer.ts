import { Container, Graphics, Application } from 'pixi.js';

interface GameContainerConfig {
  app: Application;
  minWidth?: number;
  maxWidth?: number;
  backgroundColor?: string;
}

interface GameContainerResult {
  container: Container;
  gameArea: Container;
  updateDimensions: (screenWidth: number, screenHeight: number) => void;
  getGameAreaBounds: () => { width: number; height: number; x: number; y: number };
}

/**
 * Creates a centered game container with constrained width
 */
export const createGameContainer = (config: GameContainerConfig): GameContainerResult => {
  const {
    app,
    minWidth = 340,
    maxWidth = 500,
    backgroundColor = '#1A2C38'
  } = config;

  // Main container that holds everything
  const mainContainer = new Container();
  mainContainer.sortableChildren = true;

  // Background graphics for the game area
  const background = new Graphics();
  
  // Game area container where actual game content goes
  const gameArea = new Container();
  gameArea.sortableChildren = true;

  // Add background and game area to main container
  mainContainer.addChild(background);
  mainContainer.addChild(gameArea);

  // Add main container to app stage
  app.stage.addChild(mainContainer);

  /**
   * Updates the container dimensions and centers it
   */
  const updateDimensions = (screenWidth: number, screenHeight: number) => {
    // Calculate container width within constraints
    let containerWidth = Math.min(Math.max(screenWidth * 0.95, minWidth), maxWidth);

    // Ensure we don't exceed screen width with minimal margin
    const minMargin = 0; // Minimum margin on each side for mobile
    if (containerWidth > screenWidth - minMargin) {
      containerWidth = screenWidth - minMargin;
    }

    // For very narrow screens, use full width with minimal margins
    if (screenWidth < 360) {
      containerWidth = screenWidth; // 2px margin on each side for very narrow screens
    }

    // Container height can be full screen height or adjusted as needed
    const containerHeight = screenHeight; // 2px margin top/bottom

    // Center the container horizontally
    const containerX = Math.max(0, (screenWidth - containerWidth) / 2);
    const containerY = 0; // change if margin needed at top and bottom

    // Update main container position
    mainContainer.x = containerX;
    mainContainer.y = containerY;

    // Clear and redraw background
    background.clear();
    background.rect(0, 0, containerWidth, containerHeight);
    background.fill(backgroundColor);

    // Update game area bounds (this is where your game content goes)
    gameArea.x = 0;
    gameArea.y = 0;

    console.log(`📐 Game container updated: ${containerWidth}x${containerHeight} at (${containerX}, ${containerY}), screen: ${screenWidth}x${screenHeight}`);

    // Debug log for mobile issues
    if (screenWidth < 400) {
      console.log(`📱 Mobile screen detected: containerX=${containerX}, containerWidth=${containerWidth}, screenWidth=${screenWidth}`);
    }
  };

  /**
   * Returns the current bounds of the game area
   */
  const getGameAreaBounds = () => {
    // Use the background dimensions as they represent the actual container size
    const backgroundBounds = background.getBounds();
    return {
      width: backgroundBounds.width || maxWidth,
      height: backgroundBounds.height || app.screen.height,
      x: mainContainer.x,
      y: mainContainer.y
    };
  };

  // Initialize with current screen dimensions
  updateDimensions(app.screen.width, app.screen.height);

  return {
    container: mainContainer,
    gameArea,
    updateDimensions,
    getGameAreaBounds
  };
};

/**
 * Alternative version with border/frame styling
 */
export const createStyledGameContainer = (config: GameContainerConfig & {
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}): GameContainerResult => {
  const {
    app,
    minWidth = 340,
    maxWidth = 500,
    backgroundColor = '#1A2C38',
    borderColor = '#2A4C58',
    borderWidth = 2,
    borderRadius = 8
  } = config;

  const mainContainer = new Container();
  mainContainer.sortableChildren = true;

  // Background with border
  const background = new Graphics();
  const gameArea = new Container();
  gameArea.sortableChildren = true;

  mainContainer.addChild(background);
  mainContainer.addChild(gameArea);
  app.stage.addChild(mainContainer);

  const updateDimensions = (screenWidth: number, screenHeight: number) => {
    let containerWidth = Math.min(Math.max(screenWidth * 0.95, minWidth), maxWidth);
    
    if (containerWidth > screenWidth - 4) {
      containerWidth = screenWidth - 4;
    }

    const containerHeight = screenHeight - 8; // 4px margin top/bottom
    const containerX = (screenWidth - containerWidth) / 2;
    const containerY = 4; // 4px margin from top

    mainContainer.x = containerX;
    mainContainer.y = containerY;

    // Draw background with border
    background.clear();
    
    // Border
    background.roundRect(0, 0, containerWidth, containerHeight, borderRadius);
    background.fill(borderColor);
    
    // Inner background
    const innerPadding = borderWidth;
    background.roundRect(
      innerPadding, 
      innerPadding, 
      containerWidth - (innerPadding * 2), 
      containerHeight - (innerPadding * 2), 
      borderRadius - innerPadding
    );
    background.fill(backgroundColor);

    // Update game area (with padding for border)
    gameArea.x = borderWidth;
    gameArea.y = borderWidth;

    console.log(`📐 Styled game container updated: ${containerWidth}x${containerHeight} at (${containerX}, ${containerY})`);
  };

  const getGameAreaBounds = () => {
    return {
      width: background.width - (borderWidth * 2),
      height: background.height - (borderWidth * 2),
      x: mainContainer.x + borderWidth,
      y: mainContainer.y + borderWidth
    };
  };

  updateDimensions(app.screen.width, app.screen.height);

  return {
    container: mainContainer,
    gameArea,
    updateDimensions,
    getGameAreaBounds
  };
};