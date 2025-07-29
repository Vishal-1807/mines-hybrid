import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { Assets, Container } from 'pixi.js';
import { UI_THEME } from './constants/UIThemeColors';
import { UI_POS } from './constants/Positions';
import { sendCellClickEvent } from '../WebSockets/CellClickEvent';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';

/**
 * Pick a random unclicked cell and trigger its click event
 */

function getSecureRandomIndex(arrayLength) {
  if (arrayLength <= 0) throw new Error('Array length must be positive');
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  // Get a uniformly distributed index in 0 ... arrayLength - 1
  return array[0] % arrayLength;
}

const pickRandomCell = async (): Promise<void> => {
  try {
    // Check if game is started
    if (!GlobalState.getGameStarted?.()) {
      console.warn('🎲 Game not started, cannot pick random cell');
      return;
    }

    // Get all unclicked cells
    const unclickedCells = GlobalState.getUnclickedCells();

    if (unclickedCells.length === 0) {
      console.warn('🎲 No unclicked cells available');
      return;
    }

    // Pick a random cell from unclicked cells
    const randomIndex = getSecureRandomIndex(unclickedCells.length);
    const selectedCell = unclickedCells[randomIndex];

    console.log(`🎲 Picking random cell: row ${selectedCell.row}, col ${selectedCell.col} (${randomIndex + 1}/${unclickedCells.length} available)`);

    // Send cell click event for the selected cell
    await sendCellClickEvent(selectedCell.row, selectedCell.col);

  } catch (error) {
    console.error('🎲 Error in pickRandomCell:', error);
  }
};

export const createPickRandomButton = (appWidth: number, appHeight: number) => {
  const container = new Container();
  container.zIndex = 50;

  const pickRandomButton = createButton({
      x: appWidth / 2,
      y: appHeight - UI_POS.PICK_RANDOM_BUTTON_Y*appHeight,
      width: appWidth * 0.90,
      height: Math.max(30, appHeight * 0.05),
      color: UI_THEME.RANDOM_BUTTON,
      borderColor: 0x2C3E50,
      borderWidth: 2,
      borderRadius: 3,
      texture: Assets.get('button'),
      textColor: UI_THEME.INPUT_TEXT_BUTTONS,
      label: 'PICK RANDOM',
      visibility: false, // Initially hidden, managed by gameButtonVisibilityManager
      bold: true,
      onClick: async () => {
        SoundManager.playUIClick();
        recordUserActivity(ActivityTypes.BUTTON_CLICK, { buttonName: 'pickRandomButton' });
        console.log('Pick Random button clicked');
        await pickRandomCell();
      },
    });

    container.addChild(pickRandomButton);

    return container;
  };
  
  export default createPickRandomButton;