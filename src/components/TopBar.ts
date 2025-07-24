import { Container, Application } from 'pixi.js';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_THEME } from './constants/UIThemeColors';
import { addButtonReferences } from '../utils/gameButtonStateManager';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';
import { getSettingsPopupManager } from './popups/SettingsPopupManager';
import { refreshHistoryData } from './popups/settings/AccountSettingsSection';
import { Assets } from 'pixi.js';

export const createTopBar = (appWidth: number, appHeight: number, app: Application) => {
  const container = new Container();
  container.zIndex = 50;

  const balance = GlobalState.getBalance().toFixed(2);

  const balanceButton = createButton({
    x: appWidth / 2,
    y: 0.038*appHeight,
    width: appWidth * 0.55,
    height: Math.max(25, appHeight * 0.04),
    color: UI_THEME.BET_VALUEBAR,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 5,
    texture: Assets.get('balanceTab'),
    label: ''+balance,
    // fontFamily: 'GameFont',
    textSize: Math.max(20, appHeight * 0.025),
    textColor: UI_THEME.VALUE_BAR_TEXT,
    bold: true,
    onClick: () => {
      SoundManager.playUIClick();
      console.log('Balance button clicked');
      recordUserActivity(ActivityTypes.BUTTON_CLICK, { buttonName: 'balanceButton' });
    },
  });

  // Function to update balance display
  const updateBalanceDisplay = (newBalance: number) => {
    const formattedBalance = newBalance.toFixed(2);
    (balanceButton as any).setLabel('' + formattedBalance);
    console.log(`💳 TopBar: Balance display updated to ${formattedBalance}`);
  };

  // Listen for balance changes
  GlobalState.addBalanceChangeListener(updateBalanceDisplay);

  // Default click handler - can be overridden
  let clickHandler = () => {
    console.log('🏠 Home button clicked - no handler set');
    if (typeof (window as any).redirectToHome === 'function') {
        (window as any).redirectToHome();
    }
  };

  const homeButton = createButton({
    x: appWidth * 0.1,
    y: 0.038*appHeight,
    width: Math.max(25, appHeight * 0.04),
    height: Math.max(25, appHeight * 0.04),
    color: UI_THEME.BET_VALUEBAR,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 5,
    texture: Assets.get('home'),
    // label: '⌂',
    textColor: UI_THEME.INPUT_TEXT,
    textSize: appHeight * 0.04,
    onClick: () => {
      SoundManager.playUIClick();
      console.log('Home button clicked');
      recordUserActivity(ActivityTypes.BUTTON_CLICK, { buttonName: 'homeButton' });
      clickHandler();
    },
  });

  const settingsButton = createButton({
    x: appWidth - appWidth * 0.1,
    y: 0.038*appHeight,
    width: Math.max(25, appHeight * 0.04),
    height: Math.max(25, appHeight * 0.04),
    color: UI_THEME.BET_VALUEBAR,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 2,
    borderRadius: 5,
    texture: Assets.get('settings'),
    // label: '⚙',
    textColor: UI_THEME.INPUT_TEXT,
    textSize: appHeight * 0.04,
    onClick: () => {
      SoundManager.playUIClick();
      console.log('Settings button clicked');
      recordUserActivity(ActivityTypes.SETTINGS_OPEN);

      // Refresh history data before showing settings popup
      refreshHistoryData();

      // Show the new modular settings popup
      try {
        const settingsManager = getSettingsPopupManager(app);
        settingsManager.toggle();
      } catch (error) {
        console.error('Error opening settings popup:', error);
      }
    },
  });

  addButtonReferences({
    topBarButtons: {
      homeButton: homeButton,
      settingsButton: settingsButton
    }
  });

  container.addChild(balanceButton);
  container.addChild(homeButton);
  container.addChild(settingsButton);

  return container;
};

export default createTopBar;
