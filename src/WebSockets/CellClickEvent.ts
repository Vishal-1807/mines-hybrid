import { GlobalState } from "../globals/gameState";
import { WebSocketService } from "./WebSocketService";
import { createSpriteFromLoadedAssets } from "../components/commons/Sprites";
import { Assets, Sprite } from "pixi.js";
import {
  hideGameButtons,
  showBetButton,
  enableCashoutButton,
  disableCashoutButton,
  disablePickRandomButton,
  enablePickRandomButton,
  disableGrid,
  enableGrid
} from "../utils/gameButtonVisibilityManager";
import { SoundManager } from "../utils/SoundManager";
import { GameEndEvent } from "./GameEndEvent";
import { sendCashoutEvent } from "./CashoutEvent";

/**
 * Replace cell button with static bomb image (for unrevealed mines)
 */
const replaceCellWithStaticBomb = async (row: number, col: number): Promise<void> => {
  try {
    // Get the grid reference from window (set in main.ts)
    const grid = (window as any).gameGrid;
    if (!grid) {
      console.warn('Grid reference not found, cannot replace cell');
      return;
    }

    // Get the grid cells
    const gridCells = grid.getGridCells();
    if (!gridCells[row] || !gridCells[row][col]) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return;
    }

    const cell = gridCells[row][col];
    const button = cell.button;
    const parent = button.parent;

    if (!parent) {
      console.warn('Cell button has no parent container');
      return;
    }

    // Get button properties for sprite positioning
    const buttonX = button.x;
    const buttonY = button.y;
    const buttonWidth = button.width;
    const buttonHeight = button.height;

    // Create static bomb sprite from the boom.png asset
    const bombTexture = Assets.get('bomb');
    if (!bombTexture) {
      console.error('Bomb texture not found in assets');
      return;
    }
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

    console.log(`💣 Replaced cell (${row}, ${col}) with static bomb image`);
  } catch (error) {
    console.error('Error replacing cell with static bomb:', error);
  }
};

/**
 * Replace cell button with appropriate sprite animation
 * Returns a promise that resolves when the animation completes (for bomb) or immediately (for diamond)
 */
const replaceCellWithAnimation = async (row: number, col: number, hitMine: boolean): Promise<void> => {
  try {
    // Get the grid reference from window (set in main.ts)
    const grid = (window as any).gameGrid;
    if (!grid) {
      console.warn('Grid reference not found, cannot replace cell');
      return;
    }

    // Get the grid cells
    const gridCells = grid.getGridCells();
    if (!gridCells[row] || !gridCells[row][col]) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return;
    }

    const cell = gridCells[row][col];
    const button = cell.button;
    const parent = button.parent;

    if (!parent) {
      console.warn('Cell button has no parent container');
      return;
    }

    // Get button properties for sprite positioning
    const buttonX = button.x;
    const buttonY = button.y;
    const buttonWidth = button.width;
    const buttonHeight = button.height;

    if (hitMine) {
      // Create bomb sprite (plays once)
      const bombSprite = await createSpriteFromLoadedAssets('bombSprite', {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        animationSpeed: 0.7,
        loop: false,
        autoplay: true,
        anchor: 0.5,
        animationName: 'boom'
      });

      // Replace button with bomb sprite
      parent.removeChild(button);
      parent.addChild(bombSprite);

      // Update cell references
      cell.button = bombSprite;
      cell.currentSprite = bombSprite;
      cell.isRevealed = true;

      console.log(`💥 Replaced cell (${row}, ${col}) with bomb animation`);

      // Return a promise that resolves when the bomb animation completes. that way it awaits until its done
      // Wait until bomb reveal is done(so dont resolve until animation is done)
      return new Promise<void>((resolve) => {
        bombSprite.onComplete = () => {
          console.log(`💥 Bomb animation completed for cell (${row}, ${col})`);
          resolve();
        };
      });
    } else {
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

      console.log(`💎 Replaced cell (${row}, ${col}) with diamond animation`);

      // For diamond animations, resolve immediately since they loop
      return Promise.resolve();
    }
  } catch (error) {
    console.error('Error replacing cell with animation:', error);
    return Promise.resolve(); // Resolve even on error to prevent hanging
  }
};

/**
 * Reveal all remaining cells when game ends (mine hit or cashout)
 * Shows bombs with boom.png static image and safe cells with diamond animation
 * Uses the game matrix to determine which cells are mines vs diamonds
 */
export const revealAllRemainingCells = async (): Promise<void> => {
  try {
    // Get the grid reference from window (set in main.ts)
    const grid = (window as any).gameGrid;
    if (!grid) {
      console.warn('Grid reference not found, cannot reveal cells');
      return;
    }

    // Get the grid cells and game matrix
    const gridCells = grid.getGridCells();
    const gameMatrix = GlobalState.getGameMatrix();

    if (!gameMatrix || gameMatrix.length === 0) {
      console.warn('Game matrix not available, cannot reveal cells');
      return;
    }

    console.log(`🔍 Revealing all remaining cells using game matrix:`, gameMatrix);
    console.log(`💣 Will use static boom.png for MINE cells, diamond animation for DIAMOND cells`);

    const revealPromises: Promise<void>[] = [];
    let revealedCount = 0;

    // Iterate through all cells in the grid
    for (let row = 0; row < gridCells.length; row++) {
      for (let col = 0; col < gridCells[row].length; col++) {
        const cell = gridCells[row][col];

        // Skip cells that are already revealed (have sprites)
        if (cell.isRevealed || cell.currentSprite) {
          continue;
        }

        // Check if we have matrix data for this cell
        if (gameMatrix[row] && gameMatrix[row][col] !== undefined) {
          const cellValue = gameMatrix[row][col];

          console.log(`🔍 Cell (${row}, ${col}) has value: "${cellValue}"`);

          // Create a promise for each reveal operation
          const revealPromise = (async () => {
            if (cellValue === 'MINE') {
              // Use static bomb image for mines
              await replaceCellWithStaticBomb(row, col);
            } else if (cellValue === 'DIAMOND') {
              // Use diamond animation for safe cells
              await replaceCellWithAnimation(row, col, false);
            }
            revealedCount++;
          })();

          // Add a small delay between starting reveals for visual effect
          if (revealedCount > 0 && revealedCount % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          revealPromises.push(revealPromise);
        }
      }
    }

    // Wait for all reveal operations to complete
    await Promise.all(revealPromises);
    console.log(`💥 Revealed ${revealedCount} remaining cells based on game matrix`);
  } catch (error) {
    console.error('Error revealing all remaining cells:', error);
  }
};

/**
 * Clear all sprites and restore original cell buttons when round ends
 */
export const clearAllSpritesAndRestoreCells = (): void => {
  try {
    // Get the grid reference from window (set in main.ts)
    const grid = (window as any).gameGrid;
    if (!grid) {
      console.warn('Grid reference not found, cannot restore cells');
      return;
    }

    // Call the grid's restore function
    grid.restoreAllCells();

    console.log('🧹 All sprites cleared and cells restored for new round');
  } catch (error) {
    console.error('Error clearing sprites and restoring cells:', error);
  }
};

export const sendCellClickEvent = async (row: number, col: number) => {
  if(!GlobalState.getGameStarted?.()){
    console.warn('Game not started, cannot send cell click event');
    return;
  }

  // Disable UI elements during cell click processing
  disableCashoutButton();
  disablePickRandomButton();
  disableGrid();
  console.log('🔒 UI locked during cell click processing');

  // Wait for WebSocket to connect
  const ws = WebSocketService.getInstance();

  console.log('Clicking cell ', row, col);

  return new Promise((resolve, reject) => {

    const handleResponse = async (res: any) => {
      if (res?.status === '200 OK') {
        console.log('Cell click event sent successfully', res);

        GlobalState.mineClicked();
        GlobalState.setMultiplier(res.currentMultiplier);

        // Track this cell as clicked
        GlobalState.addClickedCell(row, col);

        if(res.revealedMatrix){
          GlobalState.setGameMatrix(res.revealedMatrix);
        }
        if(res.reward !== undefined){
          GlobalState.setReward(res.reward);
        }

        GlobalState.setBalance(res.balance);

        // Replace cell with appropriate animation and wait for completion
        await replaceCellWithAnimation(row, col, res.hitMine);

        if(res.hitMine){
          console.log('💥 MINE HIT - Animation completed, now revealing remaining cells');

          // Reveal all remaining cells after bomb animation completes
          // wait until it reveals all cells
          await revealAllRemainingCells();

          // Hide game buttons and show bet button
          hideGameButtons();

          // Handle game end logic
          await GameEndEvent(true); //sending bombEnd paramter true to not show win Modal
          GlobalState.setGameStarted(false);

          // Play mine sound
          SoundManager.playBombExplode();

          // show bet button after a set timeout
          showBetButton();
        }
        else{
          // Play diamond sound
          SoundManager.playDiamondReveal();
          console.log('SAFE CELL REVEALED');

          // Enable cashout button if this is the first successful cell click
          const minesClickedCount = GlobalState.getMinesClickedCount();
          if(minesClickedCount === GlobalState.gridCols*GlobalState.gridRows - GlobalState.getMinesCount()){
            console.log('💰 Cashout button enabled after first cell click');
            await sendCashoutEvent();
            return;
          }
          if (minesClickedCount >= 1) {
            enableCashoutButton();
            console.log('💰 Cashout button enabled after first cell click');
          }

          // Re-enable UI elements after successful cell click
          enablePickRandomButton();
          enableGrid();

          console.log('🔓 UI unlocked after successful cell click');
        }

        resolve(res);
      } else {
        console.error('Failed to send cell click event:', res);

        // Re-enable UI elements on error
        enablePickRandomButton();
        enableGrid();

        // Re-enable cashout if it was previously enabled
        const minesClickedCount = GlobalState.getMinesClickedCount();
        if (minesClickedCount >= 1) {
          enableCashoutButton();
        }

        console.log('🔓 UI unlocked after cell click error');
        reject(res);
      }
    };

    ws.once('mines_select', handleResponse);

    ws.send('mines_select', {
      operation: 'mines_select',
      data: {
        row,
        col,
        tableId: GlobalState.getTableId(),
        roundId: GlobalState.getRoundId(),
      },
    });
  });

}