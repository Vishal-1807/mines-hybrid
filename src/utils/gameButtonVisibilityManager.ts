/**
 * Centralized game button visibility management
 * Simple and straightforward implementation
 */

import { Container } from 'pixi.js';

// Interface for button references
interface GameButtonReferences {
  betButton?: Container;
  cashoutButton?: Container;
  pickRandomButton?: Container;
  rewardText?: Container;
}

// Global state
let buttonReferences: GameButtonReferences = {};
let isInitialized = false;

/**
 * Helper function to get the actual button from container
 */
const getButtonFromContainer = (container: Container): any => {
  return container.children[0];
};

/**
 * Hide bet button immediately
 */
export const hideBetButton = (): void => {
  const { betButton } = buttonReferences;
  if (betButton) {
    const actualButton = getButtonFromContainer(betButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(false);
      console.log('🎮 Bet button hidden');
    }
  }
};

/**
 * Show bet button (on bet failure or game end)
 */
export const showBetButton = (): void => {
  const { betButton } = buttonReferences;
  if (betButton) {
    const actualButton = getButtonFromContainer(betButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(true);
      actualButton.setDisabled(false);
      console.log('🎮 Bet button shown');
    }
  }
};

/**
 * Show cashout and pick random buttons (on successful bet)
 */
export const showGameButtons = (): void => {
  const { cashoutButton, pickRandomButton, rewardText } = buttonReferences;

  if (cashoutButton) {
    const actualButton = getButtonFromContainer(cashoutButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(true);
      // Initially disable cashout until first cell is clicked
      actualButton.setDisabled(true);
      console.log('🎮 Cashout button shown (disabled)');
    }
  }

  if (pickRandomButton) {
    const actualButton = getButtonFromContainer(pickRandomButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(true);
      console.log('🎮 Pick random button shown');
    }
  }

  if (rewardText) {
    const actualText = getButtonFromContainer(rewardText);
    if (actualText?.setVisibility) {
      actualText.setVisibility(true);
      console.log('🎮 Reward text shown');
    }
  }
};

/**
 * Hide cashout and pick random buttons (on game end)
 */
export const hideGameButtons = (): void => {
  const { cashoutButton, pickRandomButton, rewardText } = buttonReferences;

  if (cashoutButton) {
    const actualButton = getButtonFromContainer(cashoutButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(false);
      console.log('🎮 Cashout button hidden');
    }
  }

  if (pickRandomButton) {
    const actualButton = getButtonFromContainer(pickRandomButton);
    if (actualButton?.setVisibility) {
      actualButton.setVisibility(false);
      console.log('🎮 Pick random button hidden');
    }
  }

  if (rewardText) {
    const actualText = getButtonFromContainer(rewardText);
    if (actualText?.setVisibility) {
      actualText.setVisibility(false);
      console.log('🎮 Reward text hidden');
    }
  }
};

/**
 * Initialize button manager with references
 */
export const initializeGameButtonManager = (buttons: GameButtonReferences): void => {
  if (isInitialized) {
    console.warn('🎮 GameButtonManager: Already initialized');
    return;
  }

  buttonReferences = buttons;
  isInitialized = true;

  // Set initial state - show bet button, hide others
  showBetButton();
  hideGameButtons();

  console.log('🎮 GameButtonManager: Initialized');
};

/**
 * Enable cashout button (after first cell click)
 */
export const enableCashoutButton = (): void => {
  const { cashoutButton } = buttonReferences;
  if (cashoutButton) {
    const actualButton = getButtonFromContainer(cashoutButton);
    if (actualButton?.setDisabled) {
      actualButton.setDisabled(false);
      console.log('🎮 Cashout button enabled');
    }
  }
};

/**
 * Disable cashout button
 */
export const disableCashoutButton = (): void => {
  const { cashoutButton } = buttonReferences;
  if (cashoutButton) {
    const actualButton = getButtonFromContainer(cashoutButton);
    if (actualButton?.setDisabled) {
      actualButton.setDisabled(true);
      console.log('🎮 Cashout button disabled');
    }
  }
};

/**
 * Enable pick random button
 */
export const enablePickRandomButton = (): void => {
  const { pickRandomButton } = buttonReferences;
  if (pickRandomButton) {
    const actualButton = getButtonFromContainer(pickRandomButton);
    if (actualButton?.setDisabled) {
      actualButton.setDisabled(false);
      console.log('🎮 Pick random button enabled');
    }
  }
};

/**
 * Disable pick random button
 */
export const disablePickRandomButton = (): void => {
  const { pickRandomButton } = buttonReferences;
  if (pickRandomButton) {
    const actualButton = getButtonFromContainer(pickRandomButton);
    if (actualButton?.setDisabled) {
      actualButton.setDisabled(true);
      console.log('🎮 Pick random button disabled');
    }
  }
};

/**
 * Disable grid cells
 */
export const disableGrid = (): void => {
  const grid = (window as any).gameGrid;
  if (grid && grid.setGridInteractive) {
    grid.setGridInteractive(false);
  }
};

/**
 * Enable grid cells
 */
export const enableGrid = (): void => {
  const grid = (window as any).gameGrid;
  if (grid && grid.setGridInteractive) {
    grid.setGridInteractive(true);
  }
};

// Export types
export type { GameButtonReferences };
