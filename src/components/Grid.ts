import { Container, Assets, Sprite } from 'pixi.js';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_THEME } from './constants/UIThemeColors';
import { sendCellClickEvent } from '../WebSockets/CellClickEvent';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { createSpriteFromLoadedAssets } from './commons/Sprites';
import { createText } from './commons';

export interface GridOptions {
  appWidth: number;
  appHeight: number;
  maxGridWidth?: number;
  maxGridHeight?: number;
}

export interface GridCell {
  row: number;
  col: number;
  button: Container;
  originalButton: Container; // Store reference to original button
  currentSprite?: Container; // Store reference to current sprite if replaced
  isRevealed: boolean;
  isMine: boolean;
  isFlag: boolean;
}

export const createGrid = (options: GridOptions) => {
  const {
    appWidth,
    appHeight,
    maxGridWidth = appWidth * 0.95,
    maxGridHeight = appHeight * 0.5
  } = options;

  const container = new Container();
  container.zIndex = 10;

  // Initialize with current GlobalState dimensions (may be different from default if game is being restored)
  let currentGridSize = { rows: GlobalState.gridRows, cols: GlobalState.gridCols };
  console.log(`🎮 Grid component initialized with size: ${currentGridSize.cols}x${currentGridSize.rows}`);
  let gridCells: GridCell[][] = [];
  let gridContainer: Container | null = null;

  // Function to calculate optimal button size and spacing
  const calculateGridLayout = (rows: number, cols: number) => {
    const padding = 1; // Padding around the grid
    const spacing = 5; // Fixed spacing between buttons

    // Calculate available space
    const availableWidth = maxGridWidth - (padding * 2);
    const availableHeight = maxGridHeight - (padding * 2);

    // Calculate button size based on available space and grid dimensions
    const maxButtonWidth = (availableWidth - (spacing * (cols - 1))) / cols;
    const maxButtonHeight = (availableHeight - (spacing * (rows - 1))) / rows;

    // Use the smaller dimension to keep buttons square
    const buttonSize = Math.min(maxButtonWidth, maxButtonHeight);

    // Calculate actual grid dimensions
    const totalGridWidth = (buttonSize * cols) + (spacing * (cols - 1));
    const totalGridHeight = (buttonSize * rows) + (spacing * (rows - 1));

    console.log(`Grid Layout - ${cols}x${rows}:`, {
      maxGridWidth,
      maxGridHeight,
      availableWidth,
      availableHeight,
      buttonSize: Math.floor(buttonSize),
      totalGridWidth,
      totalGridHeight
    });

    return {
      buttonSize: Math.floor(buttonSize), // Ensure integer pixel values
      spacing,
      totalWidth: totalGridWidth,
      totalHeight: totalGridHeight
    };
  };

  // Function to create a single grid cell button
  const createGridCell = (row: number, col: number, x: number, y: number, size: number): GridCell => {
    const button = createButton({
      x,
      y,
      width: size,
      height: size,
      color: UI_THEME.GRID_BUTTON,
      borderColor: UI_THEME.GRID_BUTTON_BORDER,
      borderWidth: 2,
      borderRadius: 4,
      hoverTint: UI_THEME.GRID_CELL_HOVER_TINT,
      texture: Sprite.from(Assets.get('gridCell')),
      onClick: () => {
        recordUserActivity(ActivityTypes.CELL_CLICK);
        console.log(`Grid cell clicked: row ${row}, col ${col}`);
        handleCellClick(row, col);
      }
    });

    return {
      row,
      col,
      button,
      originalButton: button, // Store reference to original button
      currentSprite: undefined,
      isRevealed: false,
      isMine: false,
      isFlag: false
    };
  };

  // Function to handle cell clicks
  const handleCellClick = async (row: number, col: number) => {
    const cell = gridCells[row][col];
    console.log(GlobalState.getGameStarted?.());
    if(!GlobalState.getGameStarted?.()){
      console.warn('Game not started, cannot send cell click event');
      return;
    }
    console.log('Sending cell click event', row, col);
    await sendCellClickEvent(row, col);
    // if (cell.isRevealed || cell.isFlag) {
    //   return; // Already revealed or flagged
    // }

    // // For now, just reveal the cell
    // // TODO: Implement mine logic, cascading reveals, etc.
    // cell.isRevealed = true;
    
    // // Change button appearance to show it's revealed
    // const button = cell.button as any;
    // if (button.children && button.children[1]) { // Background is typically the second child
    //   button.children[1].tint = UI_THEME.BUTTON_PRESSED;
    // }
  };

  // Function to generate the grid based on current size
  const generateGrid = () => {
    // Clear existing grid
    if (gridContainer) {
      container.removeChild(gridContainer);
    }

    gridContainer = new Container();
    const layout = calculateGridLayout(currentGridSize.rows, currentGridSize.cols);

    const gridWidth = layout.buttonSize * currentGridSize.cols;
    const gridHeight = layout.buttonSize * currentGridSize.rows;

    // Set pivot to the center of the grid's dimensions
    gridContainer.pivot.set(layout.totalWidth / 2, layout.totalHeight / 2);

    gridCells = [];

    // Create grid cells with relative positioning (starting from 0,0)
    for (let row = 0; row < currentGridSize.rows; row++) {
      gridCells[row] = [];
      for (let col = 0; col < currentGridSize.cols; col++) {
        // Position cells relative to the grid container (starting from 0,0)
        const x = col * (layout.buttonSize + layout.spacing);
        const y = row * (layout.buttonSize + layout.spacing);

        const cell = createGridCell(row, col, x, y, layout.buttonSize);
        gridCells[row][col] = cell;
        gridContainer.addChild(cell.button);
      }
    }

    // Center the grid container on the stage
    const offset = {3: gridWidth / 6.2, 4: gridWidth / 8.2, 5: gridWidth / 10.2}
    gridContainer.x = appWidth / 2 + offset[currentGridSize.rows];
    gridContainer.y = appHeight / 2 + offset[currentGridSize.rows];

    container.addChild(gridContainer);
    console.log(`Grid generated: ${currentGridSize.rows}x${currentGridSize.cols}`, {
      gridContainerX: gridContainer.x,
      gridContainerY: gridContainer.y,
      totalWidth: layout.totalWidth,
      totalHeight: layout.totalHeight
    });
  };

  // Function to update grid size
  const updateGridSize = (rows: number, cols: number) => {
    currentGridSize = { rows, cols };
    generateGrid();
  };

  // Listen for grid dimension changes from GlobalState
  GlobalState.addGridDimensionChangeListener((cols: number, rows: number) => {
    console.log(`Grid size change received: ${cols}x${rows}`);
    updateGridSize(rows, cols);
  });

  // Generate initial grid
  generateGrid();

  // Function to get world position of a cell
  const getCellWorldPosition = (row: number, col: number) => {
    if (!gridContainer || !gridCells[row] || !gridCells[row][col]) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return { x: 0, y: 0 };
    }

    const cell = gridCells[row][col];
    const button = cell.button;

    // Get the button's local position within the grid container
    const localX = button.x + button.width / 2; // Center of button
    const localY = button.y + button.height / 2; // Center of button

    // Convert to world coordinates by adding grid container's position
    const worldX = gridContainer.x + localX - gridContainer.pivot.x;
    const worldY = gridContainer.y + localY - gridContainer.pivot.y;

    return { x: worldX, y: worldY };
  };

  // Function to restore all cells to their original button state
  const restoreAllCells = () => {
    console.log('🔄 Rebuilding grid from scratch to ensure clean state');

    // Simply regenerate the entire grid - this is cleaner and more reliable
    // than trying to restore individual cell states
    generateGrid();
  };

  // Function to enable/disable all grid cells
  const setGridInteractive = (interactive: boolean): void => {
    if (!gridCells) {
      console.warn('Grid not initialized, cannot set interactivity');
      return;
    }

    let count = 0;
    for (let row = 0; row < gridCells.length; row++) {
      for (let col = 0; col < gridCells[row].length; col++) {
        const cell = gridCells[row][col];
        if (cell && cell.button) {
          const button = cell.button as any;
          if (button.setDisabled) {
            button.setDisabled(!interactive);
            count++;
          }
        }
      }
    }
    console.log(`🎮 Grid: ${interactive ? 'Enabled' : 'Disabled'} ${count} grid cells`);
  };

  // Helper function to load a cell with static bomb image
  const loadCellWithStaticBomb = async (row: number, col: number): Promise<void> => {
    try {
      const cell = gridCells[row][col];
      const button = cell.button;
      const parent = button.parent;

      if (!parent) {
        console.warn('Cell button has no parent container');
        return;
      }

      // Get button position and size
      const buttonX = button.x;
      const buttonY = button.y;
      const buttonWidth = button.width;
      const buttonHeight = button.height;

      // Create static bomb sprite
      const bombTexture = Assets.get('bomb');
      const bombSprite = new Sprite(bombTexture);

      // Position and size the sprite to match the button
      bombSprite.x = buttonX;
      bombSprite.y = buttonY;
      bombSprite.width = buttonWidth;
      bombSprite.height = buttonHeight;
      bombSprite.anchor.set(0.5);

      // Replace button with static bomb sprite
      parent.removeChild(button);
      parent.addChild(bombSprite);

      // Update cell references
      cell.button = bombSprite;
      cell.currentSprite = bombSprite;
      cell.isRevealed = true;

      console.log(`💣 Loaded cell (${row}, ${col}) with static bomb image`);
    } catch (error) {
      console.error('Error loading cell with static bomb:', error);
    }
  };

  // Helper function to load a cell with diamond animation
  const loadCellWithDiamondAnimation = async (row: number, col: number): Promise<void> => {
    try {
      const cell = gridCells[row][col];
      const button = cell.button;
      const parent = button.parent;

      if (!parent) {
        console.warn('Cell button has no parent container');
        return;
      }

      // Get button position and size
      const buttonX = button.x;
      const buttonY = button.y;
      const buttonWidth = button.width;
      const buttonHeight = button.height;

      // Create diamond sprite (loops)
      const diamondSprite = await createSpriteFromLoadedAssets('diamondSprite', {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        animationSpeed: 0.25,
        loop: true,
        autoplay: true,
        anchor: 0.5,
        animationName: 'diamond'
      });

      // Replace button with diamond sprite
      parent.removeChild(button);
      parent.addChild(diamondSprite);

      // Update cell references
      cell.button = diamondSprite;
      cell.currentSprite = diamondSprite;
      cell.isRevealed = true;

      console.log(`💎 Loaded cell (${row}, ${col}) with diamond animation`);
    } catch (error) {
      console.error('Error loading cell with diamond animation:', error);
    }
  };

  // Function to load grid state from revealed matrix (for game restoration)
  const loadGridFromMatrix = async (): Promise<void> => {
    try {
      if (!gridCells) {
        console.warn('Grid not initialized, cannot load from matrix');
        return;
      }

      const gameMatrix = GlobalState.getGameMatrix();

      if (!gameMatrix || gameMatrix.length === 0) {
        console.warn('Game matrix not available, cannot load grid');
        return;
      }

      console.log('🔄 Loading grid from revealed matrix:', gameMatrix);
      // console.log('🎯 Clicked cells:', Array.from(clickedCells));

      let loadedCount = 0;

      console.log(GlobalState.gridRows, GlobalState.gridCols, 'grid dimensions for load');

      // Iterate through all cells in the grid
      for (let row = 0; row < GlobalState.gridRows; row++) {
        for (let col = 0; col < GlobalState.gridCols; col++) {
          const cellKey = `${row}-${col}`;

          // Only load cells that were previously clicked
          // if (clickedCells.has(cellKey)) {
            // Check if we have matrix data for this cell
            if (gameMatrix[row] && gameMatrix[row][col] !== undefined) {
              const cellValue = gameMatrix[row][col];

              console.log(`🔄 Loading cell (${row}, ${col}) with value: "${cellValue}"`);

              if (cellValue === 'MINE') {
                // Load mine cell with static bomb image
                await loadCellWithStaticBomb(row, col);
                loadedCount++;
              } else if (cellValue === 'DIAMOND') {
                // Load diamond cell with animation
                await loadCellWithDiamondAnimation(row, col);
                loadedCount++;
              }

              // Small delay between loads for visual effect
              if (loadedCount % 3 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          // }
        }
      }

      console.log(`✅ Loaded ${loadedCount} cells from revealed matrix`);
    } catch (error) {
      console.error('Error loading grid from matrix:', error);
    }
  };

  // Expose public methods
  const gridAPI = {
    container,
    updateGridSize,
    getCurrentGridSize: () => currentGridSize,
    getGridCells: () => gridCells,
    regenerateGrid: generateGrid,
    getCellWorldPosition,
    restoreAllCells,
    setGridInteractive,
    loadGridFromMatrix
  };

  return gridAPI;
};

export default createGrid;