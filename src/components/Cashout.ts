import { Container } from 'pixi.js';
import { createButton } from './commons/Button';
import { GlobalState } from '../globals/gameState';
import { UI_THEME } from './constants/UIThemeColors';
import { UI_POS } from './constants/Positions';
import { sendCashoutEvent } from '../WebSockets/CashoutEvent';
import { ActivityTypes, recordUserActivity } from '../utils/gameActivityManager';
import { SoundManager } from '../utils/SoundManager';
import { createText } from './commons/Text';
import { Assets } from 'pixi.js';

export const createCashoutButton = (appWidth: number, appHeight: number) => {
  const container = new Container();
  container.zIndex = 50;

  // Function to update text when reward changes
  const updateRewardText = () => {
    if (rewardText) {
      (rewardText as any).setText(`Reward: ${GlobalState.getReward()}`);
    }
    if (roundIdText) {
      (roundIdText as any).setText(`Round ID: ${GlobalState.getRoundId()}`);
    }
  };

  const cashoutButton = createButton({
    x: appWidth / 2,
    y: appHeight - UI_POS.CASHOUT_BUTTON_Y*appHeight,
    width: appWidth * 0.90,
    height: Math.max(30, appHeight * 0.05),
    color: UI_THEME.BET_BUTTON,
    borderColor: 0x2C3E50,
    borderWidth: 2,
    borderRadius: 3,
    texture: Assets.get('button'),
    label: 'CASHOUT',
    textColor: UI_THEME.INPUT_TEXT_BUTTONS,
    visibility: false, // Initially hidden, managed by gameButtonVisibilityManager
    bold: true,
    onClick: () => {
      SoundManager.playCashout();
      sendCashoutEvent(); // Send cashout event
      recordUserActivity(ActivityTypes.CASHOUT);
      console.log('Cashout button clicked');
      // GlobalState.setGameStarted(false);
    },
  });

  // Add text(createText) to show res.reward after every click 4% above cashout button
  const rewardText = createText({
    x: appWidth * 0.05,
    y: cashoutButton.y - appHeight * 0.04,
    text: `Reward: ${GlobalState.getReward()}`,
    fontSize: Math.min(15, appHeight * 0.025),
    color: UI_THEME.INPUT_TEXT,
    anchor: { x: 0, y: 0.5 },
    visibility: false, // Initially hidden, managed by gameButtonVisibilityManager
  });

  const roundIdText = createText({
    x: appWidth * 0.02,
    y: cashoutButton.y - appHeight * 0.07,
    text: `Round ID: ${GlobalState.getRoundId()}`,
    fontSize: Math.min(15, appHeight * 0.025),
    color: UI_THEME.INPUT_TEXT,
    anchor: { x: 0, y: 0.5 },
    visibility: false, // Initially hidden, managed by gameButtonVisibilityManager
  });

  container.addChild(cashoutButton);
  container.addChild(rewardText);
  // container.addChild(roundIdText); //uncomment for testing purposes
  // update reward when reward changes
  GlobalState.addRewardChangeListener(() => {
    updateRewardText();
  });

  // Add game started listener to show reward text
  GlobalState.addGameStartedListener(() => {
    (rewardText as any).setText(`Reward: ${GlobalState.getReward()}`);
    (rewardText as any).setVisible(true);
    (roundIdText as any).setVisible(true);
  });

  // Add game ended listener to hide reward text
  GlobalState.addGameEndedListener(() => {
    (rewardText as any).setVisible(false);
    (roundIdText as any).setVisible(false);
  });

  return container;
};

export default createCashoutButton;