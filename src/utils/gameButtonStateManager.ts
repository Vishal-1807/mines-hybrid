/**
 * Centralized Game Button State Manager
 * Handles enabling/disabling of all game buttons based on game events
 * Prevents users from changing settings during gameplay
 */

import { Container } from 'pixi.js';
import { GlobalState } from '../globals/gameState';

// Interface for all button references that need state management
interface GameButtonReferences {
  // Setting buttons that should be disabled during gameplay
  gridSizeButtons?: {
    button_3x3?: Container;
    button_4x4?: Container;
    button_5x5?: Container;
  };
  betTabButtons?: {
    valueBar?: Container;
    minusButton?: Container;
    plusButton?: Container;
  };
  minesTabButtons?: {
    valueBar?: Container;
    minusButton?: Container;
    plusButton?: Container;
  };
  topBarButtons?: {
    homeButton?: Container;
    settingsButton?: Container;
  };
  
  // Action buttons that have different behavior
  betButton?: Container;
  cashoutButton?: Container;
  pickRandomButton?: Container;
  homeButton?: Container; // If exists
}

// Global state
let buttonReferences: GameButtonReferences = {};
let isInitialized = false;

/**
 * Initialize the button state manager with all button references
 */
export const initializeButtonStateManager = (buttons: GameButtonReferences): void => {
  if (isInitialized) {
    console.warn('🔘 ButtonStateManager: Already initialized, updating references...');
  }

  buttonReferences = { ...buttonReferences, ...buttons };
  isInitialized = true;
  
  console.log('🔘 ButtonStateManager: Initialized with button references:', {
    gridSizeButtons: !!buttons.gridSizeButtons,
    betTabButtons: !!buttons.betTabButtons,
    minesTabButtons: !!buttons.minesTabButtons,
    betButton: !!buttons.betButton,
    topBarButtons: !!buttons.topBarButtons,
    cashoutButton: !!buttons.cashoutButton,
    pickRandomButton: !!buttons.pickRandomButton,
    homeButton: !!buttons.homeButton
  });
};

/**
 * Add or update button references (for components created later)
 */
export const addButtonReferences = (buttons: Partial<GameButtonReferences>): void => {
  buttonReferences = { ...buttonReferences, ...buttons };
  console.log('🔘 ButtonStateManager: Added/updated button references');
};

/**
 * Helper function to safely set button disabled state
 */
const setButtonDisabled = (button: Container | undefined, disabled: boolean): void => {
  if (button && typeof (button as any).setDisabled === 'function') {
    (button as any).setDisabled(disabled);
  }
};

/**
 * Helper function to safely get button disabled state
 */
const getButtonDisabled = (button: Container | undefined): boolean => {
  if (button && typeof (button as any).getDisabled === 'function') {
    return (button as any).getDisabled();
  }
  return false;
};

/**
 * Disable all setting buttons (called when bet button is clicked)
 * Excludes: home, cashout, pickRandom buttons
 */
export const disableSettingButtons = (): void => {
  console.log('🔘 ButtonStateManager: Disabling all setting buttons...');

  let disabledCount = 0;

  // Disable grid size buttons
  if (buttonReferences.gridSizeButtons) {
    const { button_3x3, button_4x4, button_5x5 } = buttonReferences.gridSizeButtons;
    setButtonDisabled(button_3x3, true);
    setButtonDisabled(button_4x4, true);
    setButtonDisabled(button_5x5, true);
    disabledCount += 3;
  }

  // Disable bet tab buttons
  if (buttonReferences.betTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.betTabButtons;
    setButtonDisabled(valueBar, true);
    setButtonDisabled(minusButton, true);
    setButtonDisabled(plusButton, true);
    disabledCount += 3;
  }

  // Disable mines tab buttons
  if (buttonReferences.minesTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.minesTabButtons;
    setButtonDisabled(valueBar, true);
    setButtonDisabled(minusButton, true);
    setButtonDisabled(plusButton, true);
    disabledCount += 3;
  }

  // Disable top bar buttons
  if (buttonReferences.topBarButtons) {
    const { homeButton, settingsButton } = buttonReferences.topBarButtons;
    setButtonDisabled(homeButton, true);
    setButtonDisabled(settingsButton, true);
    disabledCount += 2;
  }

  // // Disable bet button
  // if (buttonReferences.betButton) {
  //   setButtonDisabled(buttonReferences.betButton, true);
  //   disabledCount += 1;
  // }

  console.log(`🔘 ButtonStateManager: ${disabledCount} setting buttons disabled`);
};

/**
 * Enable all setting buttons (called when bet fails or game ends)
 */
export const enableSettingButtons = (): void => {
  console.log('🔘 ButtonStateManager: Enabling all setting buttons...');

  let enabledCount = 0;

  // Enable grid size buttons
  if (buttonReferences.gridSizeButtons) {
    const { button_3x3, button_4x4, button_5x5 } = buttonReferences.gridSizeButtons;
    setButtonDisabled(button_3x3, false);
    setButtonDisabled(button_4x4, false);
    setButtonDisabled(button_5x5, false);
    enabledCount += 3;
  }

  // Enable bet tab buttons
  if (buttonReferences.betTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.betTabButtons;
    setButtonDisabled(valueBar, false);
    setButtonDisabled(minusButton, false);
    setButtonDisabled(plusButton, false);
    enabledCount += 3;
  }

  // Enable mines tab buttons
  if (buttonReferences.minesTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.minesTabButtons;
    setButtonDisabled(valueBar, false);
    setButtonDisabled(minusButton, false);
    setButtonDisabled(plusButton, false);
    enabledCount += 3;
  }

  // Enable top bar buttons
  if (buttonReferences.topBarButtons) {
    const { homeButton, settingsButton } = buttonReferences.topBarButtons;
    setButtonDisabled(homeButton, false);
    setButtonDisabled(settingsButton, false);
    enabledCount += 2;
  }

  // // Enable bet button
  // if (buttonReferences.betButton) {
  //   setButtonDisabled(buttonReferences.betButton, false);
  //   enabledCount += 1;
  // }

  console.log(`🔘 ButtonStateManager: ${enabledCount} setting buttons enabled`);
};

/**
 * Get current state of all buttons (for debugging)
 */
export const getButtonStates = (): Record<string, boolean> => {
  const states: Record<string, boolean> = {};

  // Grid size buttons
  if (buttonReferences.gridSizeButtons) {
    const { button_3x3, button_4x4, button_5x5 } = buttonReferences.gridSizeButtons;
    states['gridSize_3x3'] = getButtonDisabled(button_3x3);
    states['gridSize_4x4'] = getButtonDisabled(button_4x4);
    states['gridSize_5x5'] = getButtonDisabled(button_5x5);
  }

  // Bet tab buttons
  if (buttonReferences.betTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.betTabButtons;
    states['betTab_valueBar'] = getButtonDisabled(valueBar);
    states['betTab_minus'] = getButtonDisabled(minusButton);
    states['betTab_plus'] = getButtonDisabled(plusButton);
  }

  // Mines tab buttons
  if (buttonReferences.minesTabButtons) {
    const { valueBar, minusButton, plusButton } = buttonReferences.minesTabButtons;
    states['minesTab_valueBar'] = getButtonDisabled(valueBar);
    states['minesTab_minus'] = getButtonDisabled(minusButton);
    states['minesTab_plus'] = getButtonDisabled(plusButton);
  }

  // Top bar buttons
  if (buttonReferences.topBarButtons) {
    const { homeButton, settingsButton } = buttonReferences.topBarButtons;
    states['topBar_home'] = getButtonDisabled(homeButton);
    states['topBar_settings'] = getButtonDisabled(settingsButton);
  }

  // Bet button
  if (buttonReferences.betButton) {
    states['betButton'] = getButtonDisabled(buttonReferences.betButton);
  }

  return states;
};

/**
 * Setup automatic listeners for game state changes
 */
export const setupGameStateListeners = (): void => {
  // Listen for game end to re-enable setting buttons
  GlobalState.addGameEndedListener(() => {
    console.log('🔘 ButtonStateManager: Game ended - enabling setting buttons');
    logButtonStates(); // Log states before enabling
    enableSettingButtons();
    logButtonStates(); // Log states after enabling
  });

  console.log('🔘 ButtonStateManager: Game state listeners registered');
};

/**
 * Debug function to log current button states
 */
export const logButtonStates = (): void => {
  const states = getButtonStates();
  console.log('🔘 ButtonStateManager: Current button states:', states);

  const disabledButtons = Object.entries(states).filter(([_, disabled]) => disabled);
  const enabledButtons = Object.entries(states).filter(([_, disabled]) => !disabled);

  console.log(`🔘 Disabled buttons (${disabledButtons.length}):`, disabledButtons.map(([name]) => name));
  console.log(`🔘 Enabled buttons (${enabledButtons.length}):`, enabledButtons.map(([name]) => name));
};

/**
 * Cleanup function
 */
export const destroyButtonStateManager = (): void => {
  buttonReferences = {};
  isInitialized = false;
  console.log('🔘 ButtonStateManager: Destroyed');
};
