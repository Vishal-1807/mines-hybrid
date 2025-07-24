// HistorySection.ts - Game history content section

import { Container, Text, Graphics, Rectangle } from 'pixi.js';
import { SettingsContentSection, SettingsPopupDimensions } from '../SettingsPopup';
import { SoundManager } from '../../../utils/SoundManager';
import { ActivityTypes, recordUserActivity } from '../../../utils/gameActivityManager';
import { loadHistoryPage } from '../../../WebSockets/loadHistory';

// History data interfaces
export interface HistoryItem {
  id: string;
  betAmount: number;
  profit: number;
  won: number;
  endTime: string;
  gameMatrix?: string[][];
  revealedCells?: { row: number; col: number }[];
  gridSize?: number;
  // Add these for compatibility with settings.ts
  roundId?: string;
  currency?: string;
  revealedMatrix?: string[][];
}

export interface HistoryResponse {
  status: string;
  errorDescription: string;
  history: HistoryItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

// Utility function to format date/time
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// State management for history
let currentHistoryData: HistoryResponse | null = null;
let shouldRefreshHistory = true;
let renderActiveContent: (() => void) | null = null;

/**
 * Force refresh history data on next render
 * This function can be called externally to trigger a history refresh
 */
export const refreshHistoryData = () => {
  console.log('📊 History refresh requested');
  shouldRefreshHistory = true;
};

// Calculate optimal popup dimensions based on matrix size
const calculateMatrixPopupDimensions = (matrix: string[][], screenWidth: number, screenHeight: number) => {
  if (!matrix || matrix.length === 0) {
    // Fallback dimensions if no matrix
    return {
      popupWidth: Math.min(400, screenWidth * 0.8),
      popupHeight: Math.min(300, screenHeight * 0.6),
      cellSize: 30,
      spacing: 1.2
    };
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  // Base cell size - responsive to screen size and grid size
  let baseCellSize = Math.min(screenWidth, screenHeight) * 0.06;

  // Adjust cell size based on grid dimensions
  if (rows > 5 || cols > 5) {
    baseCellSize *= 0.7; // Smaller cells for larger grids
  } else if (rows <= 3 && cols <= 3) {
    baseCellSize *= 1.2; // Larger cells for smaller grids
  }

  const cellSize = Math.max(20, Math.min(50, baseCellSize)); // Min 20px, max 50px
  const spacing = 1.4; // Space between cells

  // Calculate grid dimensions
  const gridWidth = cols * cellSize * spacing;
  const gridHeight = rows * cellSize * spacing;

  // Add padding for title, info, and margins
  const titleHeight = 80;
  const infoHeight = 80;
  const margins = 60;
  const closeButtonSpace = 40;

  const popupWidth = Math.max(300, gridWidth + margins);
  const popupHeight = Math.max(200, gridHeight + titleHeight + infoHeight + margins + closeButtonSpace);

  // Ensure popup doesn't exceed screen bounds
  const maxWidth = screenWidth * 0.95;
  const maxHeight = screenHeight * 0.9;

  return {
    popupWidth: Math.min(popupWidth, maxWidth),
    popupHeight: Math.min(popupHeight, maxHeight),
    cellSize,
    spacing,
    gridWidth,
    gridHeight,
    titleHeight,
    infoHeight
  };
};

// Enhanced matrix popup with grid display and responsive sizing
const createMatrixPopup = (historyItem: HistoryItem, onClose: () => void, screenWidth = 1200, screenHeight = 800): Container => {
  const popupContainer = new Container();

  // Semi-transparent background overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenWidth, screenHeight);
  overlay.fill({ color: 0x000000, alpha: 0.7 });
  overlay.eventMode = 'static';
  popupContainer.addChild(overlay);

  // Get matrix data
  const matrix = historyItem.revealedMatrix || historyItem.gameMatrix;

  // Calculate optimal dimensions based on matrix
  const dimensions = calculateMatrixPopupDimensions(matrix || [], screenWidth, screenHeight);

  // Popup background with calculated dimensions
  const popupBg = new Graphics();
  popupBg.rect(0, 0, dimensions.popupWidth, dimensions.popupHeight);
  popupBg.fill({ color: 0x2C3E50, alpha: 0.95 });
  popupBg.stroke({ color: 0x4A90E2, width: 3 });

  // Center positioning
  popupBg.x = (screenWidth - dimensions.popupWidth) / 2;
  popupBg.y = (screenHeight - dimensions.popupHeight) / 2;
  popupContainer.addChild(popupBg);

  // Title
  const title = new Text({
    text: 'Game Matrix',
    style: {
      fontFamily: 'Roboto',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    }
  });
  title.anchor.set(0.5, 0);
  title.x = popupBg.x + dimensions.popupWidth / 2;
  title.y = popupBg.y + 20;
  popupContainer.addChild(title);

  // Game info
  const gameInfo = new Text({
    text: `Bet: ${historyItem.betAmount} | Profit: ${historyItem.profit >= 0 ? '+' : ''}${historyItem.profit.toFixed(2)} | Won: ${historyItem.won.toFixed(2)}`,
    style: {
      fontFamily: 'Roboto',
      fontSize: Math.min(16, dimensions.popupWidth * 0.04), // Responsive font size
      fill: 0xBDC3C7
    }
  });
  gameInfo.anchor.set(0.5, 0);
  gameInfo.x = popupBg.x + dimensions.popupWidth / 2;
  gameInfo.y = popupBg.y + dimensions.titleHeight * 0.6;
  popupContainer.addChild(gameInfo);

  // Round info
  const roundInfo = new Text({
    text: `Round ID: ${historyItem.roundId || historyItem.id}`,
    style: {
      fontFamily: 'Roboto',
      fontSize: Math.min(13, dimensions.popupWidth * 0.03), // Responsive font size
      fill: 0xBDC3C7
    }
  });
  roundInfo.anchor.set(0.5, 0);
  roundInfo.x = popupBg.x + dimensions.popupWidth / 2;
  roundInfo.y = popupBg.y + dimensions.titleHeight;
  popupContainer.addChild(roundInfo);

  // Matrix visualization - Enhanced grid display with responsive sizing
  if (matrix) {
    const originalRows = matrix.length;
    const originalCols = matrix[0].length;

    // Transpose matrix for better mobile visibility if rows > cols (like settings.ts)
    let displayMatrix: string[][];

    if (originalRows > originalCols) {
      displayMatrix = [];
      for (let col = 0; col < originalCols; col++) {
        displayMatrix[col] = [];
        for (let row = 0; row < originalRows; row++) {
          displayMatrix[col][row] = matrix[row][col];
        }
      }
    } else {
      displayMatrix = matrix;
    }

    // Use calculated dimensions for positioning
    const cellSize = dimensions.cellSize;
    const spacing = dimensions.spacing;

    // Center the matrix within the popup
    const matrixStartX = popupBg.x + (dimensions.popupWidth - dimensions.gridWidth) / 2;
    const matrixStartY = popupBg.y + dimensions.titleHeight + dimensions.infoHeight + 20;

    displayMatrix.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellX = matrixStartX + colIndex * (cellSize * spacing);
        const cellY = matrixStartY + rowIndex * (cellSize * spacing);

        // Cell background circle with responsive sizing
        const cellCircle = new Graphics();
        const circleRadius = cellSize * 0.5; // Responsive radius
        cellCircle.circle(cellSize / 2, cellSize / 2, circleRadius);

        // Enhanced color coding matching settings.ts
        switch (cell) {
          case 'SAFE':
          case 'DIAMOND':
            cellCircle.fill({ color: 0x0E212E, alpha: 0.8 });
            break;
          case 'MINE':
            cellCircle.fill({ color: 0xE74C3C, alpha: 0.8 });
            break;
          case 'MINE_HIT':
            cellCircle.fill({ color: 0xE74C3C, alpha: 0.8 });
            break;
          case 'HIDDEN':
          default:
            cellCircle.fill({ color: 0x7F8C8D, alpha: 0.3 });
            break;
        }

        cellCircle.stroke({ color: 0xFFFFFF, width: 1 });
        cellCircle.x = cellX;
        cellCircle.y = cellY;
        // popupContainer.addChild(cellCircle); // Re-enabled background circles

        // Enhanced symbols matching settings.ts
        if (cell === 'MINE_HIT') {
          // Show X emoji for the mine that was actually hit
          const mineHitText = new Text({
            text: '❌',
            style: {
              fontFamily: 'Arial',
              fontSize: 18,
              fill: 0xFFFFFF
            }
          });
          mineHitText.anchor.set(0.5);
          mineHitText.x = cellX + cellSize / 2;
          mineHitText.y = cellY + cellSize / 2;
          popupContainer.addChild(mineHitText);
        } else if (cell === 'MINE') {
          // Show bomb emoji for other mines
          const mineText = new Text({
            text: '💣',
            style: {
              fontFamily: 'Arial',
              fontSize: 20,
              fill: 0xFFFFFF
            }
          });
          mineText.anchor.set(0.5);
          mineText.x = cellX + cellSize / 2;
          mineText.y = cellY + cellSize / 2;
          popupContainer.addChild(mineText);
        } else if (cell === 'SAFE') {
          // Show checkmark for safe cells
          const safeText = new Text({
            text: '✓',
            style: {
              fontFamily: 'Roboto',
              fontSize: 18,
              fill: 0xFFFFFF,
              fontWeight: 'bold'
            }
          });
          safeText.anchor.set(0.5);
          safeText.x = cellX + cellSize / 2;
          safeText.y = cellY + cellSize / 2;
          popupContainer.addChild(safeText);
        } else if (cell === 'DIAMOND') {
          // Show diamond emoji for diamond cells
          const diamondText = new Text({
            text: '💎',
            style: {
              fontFamily: 'Arial',
              fontSize: 20,
              fill: 0xFFFFFF
            }
          });
          diamondText.anchor.set(0.5);
          diamondText.x = cellX + cellSize / 2;
          diamondText.y = cellY + cellSize / 2;
          popupContainer.addChild(diamondText);
        }
      });
    });
  }

  // Close button
  const closeButton = new Graphics();
  closeButton.circle(0, 0, 15);
  closeButton.fill({ color: 0xE74C3C, alpha: 0.8 });
  closeButton.stroke({ color: 0xFFFFFF, width: 2 });
  closeButton.x = popupBg.x + dimensions.popupWidth - 25;
  closeButton.y = popupBg.y + 25;
  closeButton.eventMode = 'static';
  closeButton.cursor = 'pointer';
  popupContainer.addChild(closeButton);

  // Close button X
  const closeX = new Text({
    text: '×',
    style: {
      fontFamily: 'Roboto',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    }
  });
  closeX.anchor.set(0.5);
  closeX.x = closeButton.x;
  closeX.y = closeButton.y;
  popupContainer.addChild(closeX);

  // Close button events
  closeButton.on('pointerdown', () => {
    onClose();
  });

  overlay.on('pointerdown', () => {
    onClose();
  });

  return popupContainer;
};

// Helper function to create touch-scrollable content
const createTouchScrollableContent = (
  container: Container,
  contentContainer: Container,
  dimensions: { width: number; height: number },
  contentHeight: number
) => {
  // Only add scrolling if content is taller than container
  if (contentHeight <= dimensions.height) {
    return;
  }

  const maxScrollY = contentHeight - dimensions.height;
  let currentScrollY = 0;

  // Touch/drag scrolling variables
  let isDragging = false;
  let lastPointerY = 0;
  let velocity = 0;
  let lastMoveTime = 0;
  let inertiaAnimationId: number | null = null;

  // Create scrollbar
  const scrollBarWidth = 8;
  const thumbHeight = Math.max(30, (dimensions.height / contentHeight) * dimensions.height);

  // Scroll track
  const scrollTrack = new Graphics();
  scrollTrack.rect(dimensions.width - scrollBarWidth, 0, scrollBarWidth, dimensions.height);
  scrollTrack.fill({ color: 0x2C3E50, alpha: 0.5 });
  container.addChild(scrollTrack);

  // Scroll thumb
  const scrollThumb = new Graphics();
  scrollThumb.rect(0, 0, scrollBarWidth - 4, thumbHeight);
  scrollThumb.fill({ color: 0x4A90E2, alpha: 0.8 });
  scrollThumb.x = dimensions.width - scrollBarWidth + 2;
  scrollThumb.y = 0;
  scrollThumb.eventMode = 'static';
  scrollThumb.cursor = 'pointer';
  container.addChild(scrollThumb);

  // Update scroll position function
  const updateScrollPosition = (newScrollY: number, updateThumb = true) => {
    currentScrollY = Math.max(0, Math.min(maxScrollY, newScrollY));
    contentContainer.y = -currentScrollY;

    if (updateThumb) {
      const maxThumbY = dimensions.height - thumbHeight;
      const progress = maxScrollY > 0 ? currentScrollY / maxScrollY : 0;
      scrollThumb.y = progress * maxThumbY;
    }
  };

  // Inertia scrolling
  const applyInertia = () => {
    if (Math.abs(velocity) < 0.5) {
      velocity = 0;
      inertiaAnimationId = null;
      return;
    }

    currentScrollY += velocity;
    velocity *= 0.95;
    
    if (currentScrollY < 0) {
      currentScrollY = 0;
      velocity = 0;
    } else if (currentScrollY > maxScrollY) {
      currentScrollY = maxScrollY;
      velocity = 0;
    }

    updateScrollPosition(currentScrollY);
    inertiaAnimationId = requestAnimationFrame(applyInertia);
  };

  // Touch/mouse events for content area
  container.eventMode = 'static';
  container.hitArea = new Rectangle(0, 0, dimensions.width - scrollBarWidth, dimensions.height);

  // Event handlers
  const handlePointerDown = (event: any) => {
    if (inertiaAnimationId) {
      cancelAnimationFrame(inertiaAnimationId);
      inertiaAnimationId = null;
    }

    isDragging = true;
    lastPointerY = event.global.y;
    velocity = 0;
    lastMoveTime = Date.now();
    event.preventDefault?.();
    event.stopPropagation?.();
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const deltaY = lastPointerY - event.global.y;
    const timeDelta = currentTime - lastMoveTime;

    if (timeDelta > 0) {
      velocity = deltaY / timeDelta * 16;
    }

    updateScrollPosition(currentScrollY + deltaY);
    lastPointerY = event.global.y;
    lastMoveTime = currentTime;
    event.preventDefault?.();
    event.stopPropagation?.();
  };

  const handlePointerUp = (event: any) => {
    if (!isDragging) return;
    isDragging = false;

    if (Math.abs(velocity) > 1) {
      inertiaAnimationId = requestAnimationFrame(applyInertia);
    }

    event.preventDefault?.();
    event.stopPropagation?.();
  };

  // Add event listeners
  container.on('pointerdown', handlePointerDown);
  container.on('pointermove', handlePointerMove);
  container.on('pointerup', handlePointerUp);
  container.on('pointercancel', handlePointerUp);

  // Wheel scrolling
  container.on('wheel', (event: any) => {
    if (inertiaAnimationId) {
      cancelAnimationFrame(inertiaAnimationId);
      inertiaAnimationId = null;
    }

    const delta = event.deltaY || 0;
    updateScrollPosition(currentScrollY + delta * 0.5);
    event.preventDefault();
  });
};

// Create pagination controls function
const createPaginationControls = (
  pagination: { totalRecords: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean },
  onPageChange: (page: number) => void,
  dimensions: { width: number; height: number }
): Container => {
  const paginationContainer = new Container();
  const controlHeight = dimensions.height * 0.8;
  const buttonSize = dimensions.height * 0.4;
  const spacing = 8;

  // Background for pagination controls
  const bg = new Graphics();
  bg.rect(0, dimensions.height - dimensions.height * 0.4, dimensions.width, controlHeight);
  bg.fill({ color: 0x2C3E50, alpha: 0.8 });
  paginationContainer.addChild(bg);

  // Calculate button positions
  const totalButtonsWidth = (buttonSize * 4) + (spacing * 3);
  const startX = (dimensions.width - totalButtonsWidth) / 1.7;

  // Page info text
  const pageInfo = new Text({
    text: `Page ${pagination.page} of ${pagination.totalPages} (${pagination.totalRecords} total)`,
    style: {
      fontFamily: 'Roboto',
      fontSize: 12,
      fill: 0xFFFFFF,
      align: 'center'
    }
  });
  pageInfo.anchor.set(0.5, 0);
  pageInfo.x = dimensions.width * 0.2;
  pageInfo.y = dimensions.height - dimensions.height * 0.1;
  paginationContainer.addChild(pageInfo);

  // Helper function to create pagination button
  const createPaginationButton = (
    text: string,
    x: number,
    enabled: boolean,
    onClick: () => void
  ): Container => {
    const buttonContainer = new Container();
    buttonContainer.x = x;
    buttonContainer.y = dimensions.height - dimensions.height * 0.2;

    const button = new Graphics();
    button.roundRect(0, 0, buttonSize, buttonSize, 5);

    if (enabled) {
      button.fill({ color: 0x4A90E2, alpha: 0.8 });
      button.stroke({ color: 0xFFFFFF, width: 1 });
      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerdown', (event: any) => {
        event.stopPropagation();
        console.log(`🔘 Pagination button clicked: ${text}`);
        onClick();
      });

      // Hover effects
      button.on('pointerover', () => {
        button.clear();
        button.roundRect(0, 0, buttonSize, buttonSize, 5);
        button.fill({ color: 0x5BA0F2, alpha: 1 });
        button.stroke({ color: 0xFFFFFF, width: 2 });
      });

      button.on('pointerout', () => {
        button.clear();
        button.roundRect(0, 0, buttonSize, buttonSize, 5);
        button.fill({ color: 0x4A90E2, alpha: 0.8 });
        button.stroke({ color: 0xFFFFFF, width: 1 });
      });
    } else {
      button.fill({ color: 0x7F8C8D, alpha: 0.5 });
      button.stroke({ color: 0xBDC3C7, width: 1 });
    }

    buttonContainer.addChild(button);

    // Button text
    const buttonText = new Text({
      text: text,
      style: {
        fontFamily: 'Roboto',
        fontSize: 12,
        fill: enabled ? 0xFFFFFF : 0x95A5A6,
        align: 'center',
        fontWeight: 'bold'
      }
    });
    buttonText.anchor.set(0.5);
    buttonText.x = buttonSize / 2;
    buttonText.y = buttonSize / 2;
    buttonContainer.addChild(buttonText);

    return buttonContainer;
  };

  // Create buttons with proper callbacks
  const firstButton = createPaginationButton(
    '⏮',
    startX,
    pagination.page > 1,
    () => {
      recordUserActivity(ActivityTypes.BUTTON_CLICK);
      console.log(`🔘 First page clicked - going to page 1`);
      onPageChange(1);
    }
  );
  paginationContainer.addChild(firstButton);

  const prevButton = createPaginationButton(
    '◀',
    startX + buttonSize + spacing,
    pagination.page > 1,
    () => {
      recordUserActivity(ActivityTypes.BUTTON_CLICK);
      console.log(`🔘 Previous page clicked - going to page ${pagination.page - 1}`);
      onPageChange(pagination.page - 1);
    }
  );
  paginationContainer.addChild(prevButton);

  const nextButton = createPaginationButton(
    '▶',
    startX + (buttonSize + spacing) * 2,
    pagination.hasNextPage,
    () => {
      recordUserActivity(ActivityTypes.BUTTON_CLICK);
      console.log(`🔘 Next page clicked - going to page ${pagination.page + 1}`);
      onPageChange(pagination.page + 1);
    }
  );
  paginationContainer.addChild(nextButton);

  const lastButton = createPaginationButton(
    '⏭',
    startX + (buttonSize + spacing) * 3,
    pagination.hasNextPage,
    () => {
      recordUserActivity(ActivityTypes.BUTTON_CLICK);
      console.log(`🔘 Last page clicked - going to page ${pagination.totalPages}`);
      onPageChange(pagination.totalPages);
    }
  );
  paginationContainer.addChild(lastButton);

  return paginationContainer;
};

export const createAccountSettingsSection = (): SettingsContentSection => {
  // Add matrix popup state
  let currentMatrixPopup: Container | null = null;

  return {
    id: 'account',
    title: 'Game History',
    render: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Store reference to this render function for re-rendering
      renderActiveContent = () => {
        console.log(`📊 Re-rendering history content with data:`, {
          page: currentHistoryData?.page,
          totalPages: currentHistoryData?.totalPages,
          recordCount: currentHistoryData?.history?.length || 0
        });
        createAccountSettingsSection().render(container, dimensions);
      };

      // Show loading indicator while fetching
      const showLoadingIndicator = () => {
        container.removeChildren();
        const loadingText = new Text({
          text: 'Loading history...',
          style: {
            fontFamily: 'Roboto',
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'center'
          }
        });
        loadingText.anchor.set(0.5);
        loadingText.x = dimensions.contentWidth / 2;
        loadingText.y = dimensions.contentHeight / 2;
        container.addChild(loadingText);
      };

      // Show error message if loading fails
      const showErrorMessage = (error: any) => {
        container.removeChildren();
        const errorText = new Text({
          text: `Failed to load history: ${error.message || 'Unknown error'}`,
          style: {
            fontFamily: 'Roboto',
            fontSize: 16,
            fill: 0xFF6B6B,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: dimensions.contentWidth - 40
          }
        });
        errorText.anchor.set(0.5);
        errorText.x = dimensions.contentWidth / 2;
        errorText.y = dimensions.contentHeight / 2 - 20;
        container.addChild(errorText);

        // Add retry button
        const retryButton = new Graphics();
        retryButton.rect(0, 0, 100, 35);
        retryButton.fill({ color: 0x4A90E2, alpha: 0.8 });
        retryButton.stroke({ color: 0xFFFFFF, width: 2 });
        retryButton.x = (dimensions.contentWidth - 100) / 2;
        retryButton.y = dimensions.contentHeight / 2 + 20;
        retryButton.eventMode = 'static';
        retryButton.cursor = 'pointer';

        const retryText = new Text({
          text: 'Retry',
          style: {
            fontFamily: 'Roboto',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
          }
        });
        retryText.anchor.set(0.5);
        retryText.x = retryButton.x + 50;
        retryText.y = retryButton.y + 17.5;

        retryButton.on('pointerdown', () => {
          shouldRefreshHistory = true;
          renderActiveContent?.();
        });

        container.addChild(retryButton);
        container.addChild(retryText);
      };

      // Generate dummy data with enhanced matrix for testing
      const generateDummyHistoryData = (): HistoryResponse => {
        const dummyHistory: HistoryItem[] = [];
        for (let i = 0; i < 8; i++) {
          const betAmount = Math.floor(Math.random() * 100) + 10;
          const won = Math.random() > 0.5 ? betAmount * (1 + Math.random() * 2) : 0;
          const profit = won - betAmount;

          // Create more realistic matrix data
          const matrixTypes = [
            [
              ['SAFE', 'MINE', 'SAFE', 'SAFE'],
              ['SAFE', 'SAFE', 'MINE', 'SAFE'],
              ['MINE', 'SAFE', 'SAFE', 'SAFE'],
              ['SAFE', 'SAFE', 'SAFE', 'MINE']
            ],
            [
              ['SAFE', 'SAFE', 'MINE'],
              ['MINE', 'SAFE', 'SAFE'],
              ['SAFE', 'MINE', 'SAFE']
            ],
            [
              ['SAFE', 'MINE', 'SAFE', 'SAFE', 'MINE'],
              ['SAFE', 'SAFE', 'SAFE', 'MINE', 'SAFE'],
              ['MINE', 'SAFE', 'SAFE', 'SAFE', 'SAFE']
            ]
          ];

          const randomMatrix = matrixTypes[Math.floor(Math.random() * matrixTypes.length)];

          dummyHistory.push({
            id: `dummy_${i}`,
            roundId: `round_${Date.now()}_${i}`,
            betAmount,
            profit,
            won,
            endTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            gameMatrix: randomMatrix,
            revealedMatrix: randomMatrix, // For compatibility with settings.ts
            revealedCells: [
              { row: 0, col: 0 },
              { row: 1, col: 1 }
            ],
            gridSize: randomMatrix.length,
            currency: 'USD'
          });
        }

        return {
          status: 'RS_OK',
          errorDescription: '',
          history: dummyHistory,
          totalRecords: dummyHistory.length,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          hasNextPage: false
        };
      };

      // Enhanced page change handler with better error handling
      const handlePageChange = async (newPage: number) => {
        recordUserActivity(ActivityTypes.SETTINGS_OPEN, { action: 'page_change', page: newPage });
        console.log(`📊 Page change requested: ${newPage}`);
        try {
          showLoadingIndicator();
          const data = await loadHistoryPage(newPage, 10);
          console.log('📊 Page history data loaded:', data);
          currentHistoryData = data;
          renderHistoryTable(currentHistoryData);
        } catch (error) {
          console.error('📊 Failed to load page history:', error);
          showErrorMessage(error);
        }
      };

      // Main render function that creates the table
      const renderHistoryTable = (historyData: HistoryResponse) => {
        container.removeChildren();
        console.log(`📊 Creating table with history data:`, {
          page: historyData?.page,
          totalPages: historyData?.totalPages,
          hasNextPage: historyData?.hasNextPage,
          recordCount: historyData?.history?.length || 0
        });

        const table = createEnhancedHistoryTableWithPagination({
          width: dimensions.contentWidth,
          height: dimensions.contentHeight,
          historyResponse: historyData,
          onViewMatrix: (historyItem: HistoryItem) => {
            SoundManager.playUIClick();
            recordUserActivity(ActivityTypes.SETTINGS_OPEN, { action: 'view_matrix' });
            console.log('View matrix clicked for item:', historyItem);
            
            // Close existing popup if any
            if (currentMatrixPopup) {
              container.parent.removeChild(currentMatrixPopup);
              currentMatrixPopup = null;
            }

            // Create new matrix popup with enhanced grid display
            currentMatrixPopup = createMatrixPopup(
              historyItem,
              () => {
                if (currentMatrixPopup) {
                  container.parent.removeChild(currentMatrixPopup);
                  currentMatrixPopup = null;
                }
              },
              window.innerWidth || 1200,
              window.innerHeight || 800
            );

            // Add to parent container
            container.parent.addChild(currentMatrixPopup);
          },
          onPageChange: handlePageChange,
          columns: [
            { width: 0.20, align: 'left' },
            { width: 0.25, align: 'right' },
            { width: 0.25, align: 'right' },
            { width: 0.20, align: 'right' },
            { width: 0.05, align: 'center' }
          ],
          rowHeight: Math.max(30, dimensions.contentHeight * 0.08),
          headerHeight: Math.max(35, dimensions.contentHeight * 0.09),
          fontSize: 12,
          headerFontSize: 13,
          alternateRowColors: true,
          scrollBarWidth: 18
        });

        container.addChild(table);
      };

      // Check if we need to refresh history data
      if (shouldRefreshHistory) {
        console.log('📊 Loading history data...');
        shouldRefreshHistory = false;
        showLoadingIndicator();
        loadHistoryPage(1, 10)
          .then((data) => {
            console.log('📊 Fresh history data loaded:', data);
            currentHistoryData = data;
            renderHistoryTable(currentHistoryData);
          })
          .catch((error) => {
            console.error('📊 Failed to load fresh history:', error);
            // Fallback to dummy data if API fails
            console.log('📊 Falling back to dummy data due to API error');
            currentHistoryData = generateDummyHistoryData();
            renderHistoryTable(currentHistoryData);
          });
      } else {
        console.log('📊 Using cached history data');
        if (currentHistoryData) {
          renderHistoryTable(currentHistoryData);
        } else {
          // Try to load data if no cache exists
          shouldRefreshHistory = true;
          // Recursively call to trigger the loading logic above
          createAccountSettingsSection().render(container, dimensions);
        }
      }
    },
    resize: (_container: Container, _dimensions: SettingsPopupDimensions) => {
      // Handle resize if needed
      console.log('History section resized');
    }
  };
};

// Enhanced history table creation function with scrolling and pagination functionality
const createEnhancedHistoryTableWithPagination = (options: {
  width: number;
  height: number;
  historyResponse: HistoryResponse;
  onViewMatrix: (historyItem: HistoryItem) => void;
  onPageChange: (page: number) => void;
  columns: { width: number; align: string }[];
  rowHeight: number;
  headerHeight: number;
  fontSize: number;
  headerFontSize: number;
  alternateRowColors: boolean;
  scrollBarWidth: number;
}) => {
  const {
    width,
    height,
    historyResponse,
    onViewMatrix,
    onPageChange,
    columns,
    rowHeight,
    headerHeight,
    fontSize,
    headerFontSize,
    alternateRowColors
  } = options;

  console.log(`📊 Creating table with pagination. Current page: ${historyResponse?.page}, Total pages: ${historyResponse?.totalPages}`);

  const mainContainer = new Container();
  const paginationHeight = height * 0.2;
  const tableHeight = height - paginationHeight;

  // Transform data for table display
  const transformedData = [
    { datetime: 'Date/Time', bet: 'Bet', profit: 'Profit', won: 'Won', view: '' },
    ...(historyResponse.history || []).map((item: HistoryItem) => ({
      datetime: formatDateTime(item.endTime),
      bet: `${item.betAmount}`,
      profit: `${item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}`,
      won: `${item.won.toFixed(2)}`,
      view: '👁️'
    }))
  ];

  // Create table container with scrolling
  const tableContainer = new Container();
  const contentContainer = new Container();

  // Create mask for table content
  const maskWidth = width - 10;
  const mask = new Graphics();
  mask.rect(0, 0, maskWidth, tableHeight);
  mask.fill(0xFFFFFF);
  tableContainer.addChild(mask);
  contentContainer.mask = mask;

  // Draw table header
  const headerContainer = new Container();
  let headerX = 0;

  const headerBg = new Graphics();
  headerBg.rect(0, 0, maskWidth, headerHeight);
  headerBg.fill({ color: 0x34495E, alpha: 0.9 });
  headerContainer.addChild(headerBg);

  const headerRow = transformedData[0];
  Object.values(headerRow).forEach((cellValue: any, colIndex: number) => {
    const colWidth = maskWidth * columns[colIndex].width;
    const headerText = new Text({
      text: String(cellValue),
      style: {
        fontFamily: 'Roboto',
        fontSize: headerFontSize,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        align: columns[colIndex].align as any
      }
    });

    if (columns[colIndex].align === 'center') {
      headerText.anchor.set(0.5, 0.5);
      headerText.x = headerX + colWidth / 2;
    } else if (columns[colIndex].align === 'right') {
      headerText.anchor.set(1, 0.5);
      headerText.x = headerX + colWidth - 10;
    } else {
      headerText.anchor.set(0, 0.5);
      headerText.x = headerX + 10;
    }

    headerText.y = headerHeight / 2;
    headerContainer.addChild(headerText);
    headerX += colWidth;
  });

  // Draw table rows
  const rowsContainer = new Container();
  rowsContainer.y = headerHeight;

  transformedData.slice(1).forEach((row: any, rowIndex: number) => {
    const rowContainer = new Container();
    rowContainer.y = rowIndex * rowHeight;

    const rowBg = new Graphics();
    rowBg.rect(0, 0, maskWidth, rowHeight);
    rowBg.fill({
      color: alternateRowColors && rowIndex % 2 === 1 ? 0x2C3E50 : 0x34495E,
      alpha: 0.3
    });
    rowContainer.addChild(rowBg);

    let cellX = 0;
    Object.entries(row).forEach(([key, cellValue]: [string, any], colIndex: number) => {
      const colWidth = maskWidth * columns[colIndex].width;

      if (key === 'view') {
        const eyeButton = new Container();
        eyeButton.eventMode = 'static';
        eyeButton.cursor = 'pointer';

        const buttonBg = new Graphics();
        buttonBg.circle(0, 0, Math.min(rowHeight * 0.3, 15));
        buttonBg.fill({ color: 0x4A90E2, alpha: 0.8 });
        buttonBg.stroke({ color: 0xFFFFFF, width: 1 });
        eyeButton.addChild(buttonBg);

        const eyeText = new Text({
          text: '👁️',
          style: {
            fontFamily: 'Arial',
            fontSize: Math.min(fontSize, 12),
            fill: 0xFFFFFF
          }
        });
        eyeText.anchor.set(0.5);
        eyeButton.addChild(eyeText);

        eyeButton.x = cellX + colWidth / 2;
        eyeButton.y = rowHeight / 2;

        // Enhanced click handler with popup
        eyeButton.on('pointerdown', (event: any) => {
          recordUserActivity(ActivityTypes.BUTTON_CLICK);
          event.stopPropagation();
          if (historyResponse.history && historyResponse.history[rowIndex]) {
            onViewMatrix(historyResponse.history[rowIndex]);
          }
        });

        rowContainer.addChild(eyeButton);
      } else {
        let textColor = 0xFFFFFF;
        if (key === 'profit') {
          const profitValue = parseFloat(String(cellValue).replace(/[^\d.-]/g, ''));
          textColor = profitValue >= 0 ? 0x2ECC71 : 0xE74C3C;
        }

        const cellText = new Text({
          text: String(cellValue),
          style: {
            fontFamily: 'Roboto',
            fontSize: fontSize,
            fill: textColor,
            align: columns[colIndex].align as any
          }
        });

        if (columns[colIndex].align === 'center') {
          cellText.anchor.set(0.5, 0.5);
          cellText.x = cellX + colWidth / 2;
        } else if (columns[colIndex].align === 'right') {
          cellText.anchor.set(1, 0.5);
          cellText.x = cellX + colWidth - 10;
        } else {
          cellText.anchor.set(0, 0.5);
          cellText.x = cellX + 10;
        }

        cellText.y = rowHeight / 2;
        rowContainer.addChild(cellText);
      }

      cellX += colWidth;
    });

    rowsContainer.addChild(rowContainer);
  });

  contentContainer.addChild(headerContainer);
  contentContainer.addChild(rowsContainer);
  tableContainer.addChild(contentContainer);

  // Add scrolling functionality
  const totalTableHeight = headerHeight + (transformedData.length - 1) * rowHeight;
  if (totalTableHeight > tableHeight) {
    createTouchScrollableContent(
      tableContainer,
      contentContainer,
      { width: maskWidth, height: tableHeight },
      totalTableHeight
    );
  }

  mainContainer.addChild(tableContainer);

  // Add pagination controls
  const paginationControls = createPaginationControls(
    {
      totalRecords: historyResponse?.totalRecords || 0,
      page: historyResponse?.page || 1,
      pageSize: historyResponse?.pageSize || 10,
      totalPages: historyResponse?.totalPages || 1,
      hasNextPage: historyResponse?.hasNextPage || false
    },
    (page: number) => {
      console.log(`📊 Pagination callback triggered for page: ${page}`);
      if (onPageChange) {
        onPageChange(page);
      } else {
        console.error('📊 No onPageChange callback provided!');
      }
    },
    { width: width, height: paginationHeight * 0.5 }
  );

  paginationControls.y = tableHeight;
  mainContainer.addChild(paginationControls);

  return mainContainer;
};

export default createAccountSettingsSection;
