import { Assets, Container } from 'pixi.js';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_THEME } from './constants/UIThemeColors';
import { UI_POS } from './constants/Positions';
import { addButtonReferences } from '../utils/gameButtonStateManager';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';
import { createText } from './commons';

export const createBetTab = (appWidth: number, appHeight: number) => {
  const container = new Container();
  container.zIndex = 50;

  const betSteps = GlobalState.getBetSteps();
  let currentStakeAmount = GlobalState.getStakeAmount();

  const spacing = appWidth * 0.12

  const betAmountTextY = GlobalState.smallScreen ? appHeight * 0.046 : appHeight * 0.037;

  // Function to calculate Y position based on current game state
  const calculateYPosition = () => {
    if (GlobalState.smallScreen) {
      if (GlobalState.getGameStarted()) {
        // Small screen + Game started
        return appHeight - UI_POS.SMALL_SCREEN_BET_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Small screen + Game not started
        return appHeight - UI_POS.SMALL_SCREEN_BET_TAB_Y * appHeight;
      }
    } else {
      if (GlobalState.getGameStarted()) {
        // Normal screen + Game started
        return appHeight - UI_POS.BET_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Normal screen + Game not started
        return appHeight - UI_POS.BET_TAB_Y * appHeight;
      }
    }
  };

  // Store button references for position updates
  let valueBarRef: any, minusButtonRef: any, plusButtonRef: any, betAmountTextRef: any;

  // Function to update button positions
  const updateButtonPositions = () => {
    const y_pos = calculateYPosition();
    console.log(`BetTab: Updating positions to y=${y_pos} (gameStarted=${GlobalState.getGameStarted()})`);

    if (valueBarRef) valueBarRef.y = y_pos;
    if (minusButtonRef) minusButtonRef.y = y_pos;
    if (plusButtonRef) plusButtonRef.y = y_pos;

    updateTextPosition(y_pos);
  };

  // Function to update text position
  const updateTextPosition = (y_pos: number) => {
    if (betAmountTextRef) betAmountTextRef.setPosition(appWidth * 0.05, y_pos - betAmountTextY);
  };

  // Function to update the value bar label
  const updateValueBarLabel = () => {
    currentStakeAmount = GlobalState.getStakeAmount();
    if (valueBarRef && valueBarRef.children && valueBarRef.children[2]) { // Text is typically the third child
      const textChild = valueBarRef.children[2] as any;
      if (textChild.text !== undefined) {
        textChild.text = `${currentStakeAmount}`;
      }
    }
    recordUserActivity(ActivityTypes.BET_CHANGE);
  };

  // Calculate initial position
  let y_pos = calculateYPosition();

  const valueBar = createButton({
    x: appWidth / 2,
    y: y_pos,
    width: appWidth * 0.60,
    height: Math.max(30, appHeight * 0.04),
    color: UI_THEME.BET_VALUEBAR,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 3,
    label: `${currentStakeAmount}`,
    texture: Assets.get('valueBar'),  
    textColor: UI_THEME.VALUE_BAR_TEXT,
    textSize: Math.max(20, appHeight * 0.025),
    bold: true,
    onClick: () => {
      recordUserActivity(ActivityTypes.BUTTON_CLICK, { buttonName: 'valueBar' });
      console.log('ValueBar button clicked');
    },
  });
  valueBarRef = valueBar;

  const minusButton = createButton({
    x: spacing,
    y: y_pos,
    width: Math.max(30, appHeight * 0.04),
    height: Math.max(30, appHeight * 0.04),
    color: UI_THEME.BET_PLUS_MINUS,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 3,
    texture: Assets.get('minusButton'),
    // label: '-',
    textColor: UI_THEME.INPUT_TEXT,
    onClick: () => {
      SoundManager.playBetDecrease();
      console.log('Minus button clicked');
      GlobalState.cycleBetDown();
      updateValueBarLabel();
    },
  });
  minusButtonRef = minusButton;

  const plusButton = createButton({
    x: appWidth - spacing,
    y: y_pos,
    width: Math.max(30, appHeight * 0.04),
    height: Math.max(30, appHeight * 0.04),
    color: UI_THEME.BET_PLUS_MINUS,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 3,
    texture: Assets.get('plusButton'),
    // label: '+',
    textColor: UI_THEME.INPUT_TEXT,
    onClick: () => {
      SoundManager.playBetIncrease();
      console.log('Plus button clicked');
      GlobalState.cycleBetUp();
      updateValueBarLabel();
    },
  });
  plusButtonRef = plusButton;

  // Create text 4% above valueBar
  const betAmountText = createText({
    x: appWidth * 0.05,
    y: y_pos - betAmountTextY,
    text: `Bet Amount`,
    fontSize: Math.min(15, appHeight * 0.025),
    color: UI_THEME.INPUT_TEXT,
    anchor: { x: 0, y: 0.5 },
  });
  betAmountTextRef = betAmountText;

  // Add game state listeners to update positions when game starts/ends
  GlobalState.addGameStartedListener(() => {
    console.log('BetTab: Game started - updating positions');
    updateButtonPositions();
  });

  GlobalState.addGameEndedListener(() => {
    console.log('BetTab: Game ended - updating positions');
    updateButtonPositions();
  });

  // Register buttons with the button state manager
  addButtonReferences({
    betTabButtons: {
      valueBar: valueBar,
      minusButton: minusButton,
      plusButton: plusButton
    }
  });

  container.addChild(valueBar);
  container.addChild(minusButton);
  container.addChild(plusButton);
  container.addChild(betAmountText);

  return container;
};

export default createBetTab;