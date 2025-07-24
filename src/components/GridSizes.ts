import { Assets, Container } from 'pixi.js';
import { UI_THEME } from './constants/UIThemeColors';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_POS } from './constants/Positions';
import { addButtonReferences } from '../utils/gameButtonStateManager';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';
import { createText } from './commons';

export const createGridSizesTab = (appWidth: number, appHeight: number) => {
  const container = new Container();
  container.zIndex = 50;

  const gridSizes = [
    { cols: 3, rows: 3, texture: 'grid3x3' },
    { cols: 4, rows: 4, texture: 'grid4x4' },
    { cols: 5, rows: 5, texture: 'grid5x5' },
  ];

  const spacing = appWidth * 0.05;
  const gridTextY = GlobalState.smallScreen ? appHeight * 0.046 : appHeight * 0.039;

  // Store button references for updating selection states
  let buttons: { [key: string]: any } = {};

  // Function to calculate Y position based on current game state
  const calculateYPosition = () => {
    if (GlobalState.smallScreen) {
      if (GlobalState.getGameStarted()) {
        // Small screen + Game started
        return appHeight - UI_POS.SMALL_SCREEN_GRID_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Small screen + Game not started
        return appHeight - UI_POS.SMALL_SCREEN_GRID_TAB_Y * appHeight;
      }
    } else {
      if (GlobalState.getGameStarted()) {
        // Normal screen + Game started
        return appHeight - UI_POS.GRID_TAB_Y_GAME_STARTED * appHeight;
      } else {
        // Normal screen + Game not started
        return appHeight - UI_POS.GRID_TAB_Y * appHeight;
      }
    }
  };

  // Function to update button positions
  const updateButtonPositions = () => {
    const y_pos = calculateYPosition();
    console.log(`GridSizes: Updating positions to y=${y_pos} (gameStarted=${GlobalState.getGameStarted()})`);

    if (buttons['3x3']) buttons['3x3'].y = y_pos;
    if (buttons['4x4']) buttons['4x4'].y = y_pos;
    if (buttons['5x5']) buttons['5x5'].y = y_pos;

    updateTextPosition(y_pos);
  };

  // Function to update text position
  const updateTextPosition = (y_pos: number) => {
    if (gridTextRef) (gridTextRef as any).setPosition(appWidth * 0.05, y_pos - gridTextY); // appHeight * 0.04);
  };

  // Function to update button selection states
  const updateButtonSelections = () => {
    const currentDimensions = GlobalState.getGridDimensions();
    // run loop of buttons to set all buttons scale to 1
    for (const button of Object.values(buttons)) {
      button.setTexture(Assets.get('gridSizeTabUnselected'));
      button.scale.set(1);
      button.setTextColor(UI_THEME.INPUT_TEXT);
    }
    // set the scale of the current button to 1.2
    buttons[currentDimensions]?.scale.set(1.1);
    buttons[currentDimensions]?.setTexture(Assets.get('gridSizeTabSelected'));
    buttons[currentDimensions]?.setTextColor(UI_THEME.INPUT_TEXT_BUTTONS);
    // buttons['3x3']?.setSelected(currentDimensions === '3x3');
    // buttons['4x4']?.setSelected(currentDimensions === '4x4');
    // buttons['5x5']?.setSelected(currentDimensions === '5x5');
  };

  // Calculate initial position
  let y_pos = calculateYPosition();

  const button_3x3 = createButton({
    x: appWidth / 4 - spacing,
    y: y_pos,
    width: Math.max(70, appWidth * 0.25),
    height: Math.max(30, appHeight * 0.05),
    color: UI_THEME.GRID_BUTTON,
    borderColor: UI_THEME.GRID_BUTTON_BORDER,
    borderWidth: 2,
    borderRadius: 5,
    label: '3x3',
    texture: GlobalState.getGridDimensions() === '3x3' ? Assets.get('gridSizeTabSelected') : Assets.get('gridSizeTabUnselected'),
    textColor: UI_THEME.INPUT_TEXT_BUTTONS,
    bold: true,
    // textColor: '#BEFF8E',
    // selected: GlobalState.getGridDimensions() === '3x3',
    // selectedTint: UI_THEME.GRID_BUTTON_SELECTED,
    onClick: () => {
      SoundManager.playUIClick();
      recordUserActivity(ActivityTypes.GRID_CHANGE);
      console.log('3x3 button clicked');
      GlobalState.setGridDimensions(3, 3);
      updateButtonSelections();
    },
  });
  buttons['3x3'] = button_3x3;

  const button_4x4 = createButton({
    x: appWidth / 2,
    y: y_pos,
    width: Math.max(70, appWidth * 0.25),
    height: Math.max(30, appHeight * 0.05),
    color: UI_THEME.GRID_BUTTON,
    borderColor: UI_THEME.GRID_BUTTON_BORDER,
    borderWidth: 2,
    borderRadius: 5,
    label: '4x4',
    texture: GlobalState.getGridDimensions() === '4x4' ? Assets.get('gridSizeTabSelected') : Assets.get('gridSizeTabUnselected'),
    textColor: UI_THEME.INPUT_TEXT,
    bold: true,
    // selected: GlobalState.getGridDimensions() === '4x4',
    // selectedTint: UI_THEME.GRID_BUTTON_SELECTED,
    onClick: () => {
      SoundManager.playUIClick();
      recordUserActivity(ActivityTypes.GRID_CHANGE);
      console.log('4x4 button clicked');
      GlobalState.setGridDimensions(4, 4);
      updateButtonSelections();
    },
  });
  buttons['4x4'] = button_4x4;

  const button_5x5 = createButton({
    x: appWidth - appWidth / 4 + spacing,
    y: y_pos,
    width: Math.max(70, appWidth * 0.25),
    height: Math.max(30, appHeight * 0.05),
    color: UI_THEME.GRID_BUTTON,
    borderColor: UI_THEME.GRID_BUTTON_BORDER,
    borderWidth: 2,
    borderRadius: 5,
    label: '5x5',
    texture: GlobalState.getGridDimensions() === '5x5' ? Assets.get('gridSizeTabSelected') : Assets.get('gridSizeTabUnselected'),
    textColor: UI_THEME.INPUT_TEXT,
    bold: true,
    // selected: GlobalState.getGridDimensions() === '5x5',
    // selectedTint: UI_THEME.GRID_BUTTON_SELECTED,
    onClick: () => {
      SoundManager.playUIClick();
      recordUserActivity(ActivityTypes.GRID_CHANGE);
      console.log('5x5 button clicked');
      GlobalState.setGridDimensions(5, 5);
      updateButtonSelections();
    },
  });
  buttons['5x5'] = button_5x5;

  // Create text 4% above valueBar
  const gridText = createText({
    x: appWidth * 0.05,
    y: y_pos - gridTextY,
    text: `Grid Size`,
    fontSize: Math.min(15, appHeight * 0.025),
    color: UI_THEME.INPUT_TEXT,
    anchor: { x: 0, y: 0.5 },
  });
  let gridTextRef = gridText;

  // Add grid dimension change listener to update button selections
  GlobalState.addGridDimensionChangeListener((cols: number, rows: number) => {
    console.log(`Grid size changed to ${cols}x${rows}, updating button selections`);
    updateButtonSelections();
  });

  // Add game state listeners to update positions when game starts/ends
  GlobalState.addGameStartedListener(() => {
    console.log('GridSizes: Game started - updating positions');
    updateButtonPositions();
  });

  GlobalState.addGameEndedListener(() => {
    console.log('GridSizes: Game ended - updating positions');
    updateButtonPositions();
  });

  // Register buttons with the button state manager
  addButtonReferences({
    gridSizeButtons: {
      button_3x3: button_3x3,
      button_4x4: button_4x4,
      button_5x5: button_5x5
    }
  });

  container.addChild(button_3x3);
  container.addChild(button_4x4);
  container.addChild(button_5x5);
  container.addChild(gridText);

  return container;
}

export default createGridSizesTab;



    