import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { Assets, Container } from 'pixi.js';
import { UI_THEME } from './constants/UIThemeColors';
import { UI_POS } from './constants/Positions';
import { sendRoundStartEvent } from '../WebSockets/PlaceBetEvent';
import { addButtonReferences, disableSettingButtons, enableSettingButtons } from '../utils/gameButtonStateManager';
import { clearAllSpritesAndRestoreCells } from '../WebSockets/CellClickEvent';
import { hideBetButton, showBetButton } from '../utils/gameButtonVisibilityManager';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';

export const createBetButton = (appWidth: number, appHeight: number) => {
  const container = new Container;
  container.zIndex = 50;

  const betButton = createButton({
    x: appWidth / 2,
    y: appHeight - UI_POS.BET_BUTTON_Y*appHeight ,
    width: appWidth * 0.850,
    height: Math.max(30, appHeight * 0.05),
    color: UI_THEME.BET_BUTTON,
    borderColor: 0x2C3E50,
    borderWidth: 2,
    borderRadius: 3,
    label: 'PLACE BET',
    textColor: UI_THEME.INPUT_TEXT_BUTTONS,
    texture: Assets.get('button'),
    visibility: true, // Initially visible, managed by gameButtonVisibilityManager
    bold: true,
    onClick: async () => {
      (window as any).winModal?.hideModal();
      SoundManager.playPlaceBet();
      recordUserActivity(ActivityTypes.GAME_START);
      console.log('Bet button clicked - starting round...');

      // Clear all sprites and restore cells from previous round
      clearAllSpritesAndRestoreCells();

      // Hide bet button immediately after pressing
      hideBetButton();

      // Disable all setting buttons to prevent changes during bet process
      disableSettingButtons();

      try {
        // Wait for successful bet placement
        await sendRoundStartEvent();
        console.log('Round started successfully');
        // Setting buttons remain disabled since game has started
        // Cashout and pick random buttons are shown by the PlaceBetEvent success handler
      } catch (error) {
        console.error('Failed to start round:', error);
        // Reset game state if round start failed
        GlobalState.setGameStarted(false);
        // Show bet button again on failure
        showBetButton();
        // Re-enable setting buttons since bet failed
        enableSettingButtons();
      }
    },
  });

  addButtonReferences({
    betButton: betButton,
  });

  container.addChild(betButton);

  return container;
};

export default createBetButton;
