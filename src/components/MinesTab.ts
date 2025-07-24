import { Assets, Container } from 'pixi.js';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_THEME } from './constants/UIThemeColors';
import { UI_POS } from './constants/Positions';
import { addButtonReferences } from '../utils/gameButtonStateManager';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';
import { createText } from './commons';

export const createMinesTab = (appWidth: number, appHeight: number) => {
  const container = new Container();
  container.zIndex = 50;

  let currentMinesCount = GlobalState.getMinesCount();

  const spacing = appWidth * 0.12
  const minesTextY = GlobalState.smallScreen ? appHeight * 0.046 : appHeight * 0.037;

  // Function to calculate Y position based on current game state
  const calculateYPosition = () => {
    if (GlobalState.smallScreen) {
      if (GlobalState.getGameStarted()) {
        // Small screen + Game started
        return appHeight - UI_POS.SMALL_SCREEN_MINES_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Small screen + Game not started
        return appHeight - UI_POS.SMALL_SCREEN_MINES_TAB_Y * appHeight;
      }
    } else {
      if (GlobalState.getGameStarted()) {
        // Normal screen + Game started
        return appHeight - UI_POS.MINES_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Normal screen + Game not started
        return appHeight - UI_POS.MINES_TAB_Y * appHeight;
      }
    }
  };

  // Store button references for position updates
  let valueBarRef: any, minusButtonRef: any, plusButtonRef: any;

  // Function to update button positions
  const updateButtonPositions = () => {
    const y_pos = calculateYPosition();
    console.log(`MinesTab: Updating positions to y=${y_pos} (gameStarted=${GlobalState.getGameStarted()})`);

    if (valueBarRef) valueBarRef.y = y_pos;
    if (minusButtonRef) minusButtonRef.y = y_pos;
    if (plusButtonRef) plusButtonRef.y = y_pos;

    updateText(y_pos);
  };

  // Function to update the value bar label
  const updateValueBarLabel = () => {
    currentMinesCount = GlobalState.getMinesCount();
    if (valueBarRef && valueBarRef.children && valueBarRef.children[2]) { // Text is typically the third child
      const textChild = valueBarRef.children[2] as any;
      if (textChild.text !== undefined) {
        textChild.text = `${currentMinesCount}`;
      }
    }
  };

  // Function to update Text and text position on grid change
  const updateText = (y_pos: number) => {
    if (minesTextRef) {
      (minesTextRef as any).setText(`Total Mines (Max: ${GlobalState.getMaxMines()})`);
      (minesTextRef as any).setPosition(appWidth * 0.05, y_pos - minesTextY);
    }
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
    borderRadius: 5,
    texture: Assets.get('valueBar'),
    label: `${currentMinesCount}`,
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
    borderRadius: 5,
    texture: Assets.get('minusButton'),
    // label: '-',
    textColor: '#BEFF8E',
    // textColor: UI_THEME.INPUT_TEXT,
    onClick: () => {
      SoundManager.playBetDecrease();
      recordUserActivity(ActivityTypes.MINES_CHANGE);
      console.log('Minus button clicked');
      GlobalState.cycleMinesDown();
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
    borderRadius: 5,
    texture: Assets.get('plusButton'),
    // label: '+',
    textColor: '#BEFF8E',
    // textColor: UI_THEME.INPUT_TEXT,
    onClick: () => {
      SoundManager.playBetIncrease();
      recordUserActivity(ActivityTypes.MINES_CHANGE);
      console.log('Plus button clicked');
      GlobalState.cycleMinesUp();
      updateValueBarLabel();
    },
  });
  plusButtonRef = plusButton;

  // Create text 4% above valueBar
  const minesText = createText({
    x: appWidth * 0.05,
    y: y_pos - minesTextY,
    text: `Total Mines (Max: ${GlobalState.getMaxMines()})`,
    fontSize: Math.min(15, appHeight * 0.025),
    color: UI_THEME.INPUT_TEXT,
    anchor: { x: 0, y: 0.5 },
  });
  let minesTextRef = minesText;

  // Listen for grid dimension changes to update max mines
  GlobalState.addGridDimensionChangeListener((cols: number, rows: number) => {
    const maxMines = rows * cols - 1;
    // If current mines count exceeds new max, reset to max
    if (GlobalState.getMinesCount() > maxMines) {
      GlobalState.setMinesCount(maxMines);
      updateValueBarLabel();
    }
    updateText(y_pos);
  });

  // Add game state listeners to update positions when game starts/ends
  GlobalState.addGameStartedListener(() => {
    console.log('MinesTab: Game started - updating positions');
    updateButtonPositions();
    updateValueBarLabel();
  });

  GlobalState.addGameEndedListener(() => {
    console.log('MinesTab: Game ended - updating positions');
    updateButtonPositions();
  });

  // Register buttons with the button state manager
  addButtonReferences({
    minesTabButtons: {
      valueBar: valueBar,
      minusButton: minusButton,
      plusButton: plusButton
    }
  });

  container.addChild(valueBar);
  container.addChild(minusButton);
  container.addChild(plusButton);
  container.addChild(minesText);
  return container;
};

export default createMinesTab;
    