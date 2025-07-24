import { Container, Graphics, Text, Assets } from 'pixi.js';
import { createButton } from '../commons/Button';
import { UI_THEME } from '../constants/UIThemeColors';
import { SoundManager } from '../../utils/SoundManager';
import { ActivityTypes, recordUserActivity } from '../../utils/gameActivityManager';
import { createStyledPositionedContainer } from '../commons/PositionedContainer';
import { createText } from '../commons/Text';
import { GlobalState } from '../../globals/gameState';

export const createWinModal = (
  gameBoardWidth: number, 
  gameBoardHeight: number, 
  gameBoardContainer: any,
  onClose: () => void
) => {
  const popupContainer = new Container();
  
  // Calculate dimensions - width and height both set to screenWidth * 0.6
  const modalWidth = gameBoardWidth * 0.6;
  const modalHeight = gameBoardHeight * 0.3;
  
  // Get gameBoardContainer bounds for centering
  // const gameBoardBounds = gameBoardContainer.getActualBounds();
  
  // Calculate centered position
  const modalX = (gameBoardWidth - modalWidth) / 2;
  const modalY = (gameBoardHeight - modalHeight) / 2;
  
  // Position the container
  popupContainer.x = modalX;
  popupContainer.y = modalY;
  
  // Create background with GameEndPopup styling
  const background = new Graphics();
  background.roundRect(0, 0, modalWidth, modalHeight, 12);
  background.fill({ color: 0x000000, alpha: 0.8 }); // Fully opaque black (same as GameEndPopup)
  background.stroke({ color: 0x00FF00, width: 5 }); // Very thick green border (same as GameEndPopup)
  popupContainer.addChild(background);
  
  // Add inner glow effect (same as GameEndPopup)
  const innerGlow = new Graphics();
  innerGlow.roundRect(5, 5, modalWidth - 10, modalHeight - 10, 8);
  innerGlow.stroke({ color: 0x00FF00, width: 2, alpha: 0.5 });
  popupContainer.addChild(innerGlow);
  
  // Create title using your existing createText component
  const title = createText({
    x: modalWidth / 2,
    y: modalHeight * 0.30,
    text: 'You Won!',
    fontSize: Math.max(18, Math.min(28, modalWidth * 0.08)),
    color: 0x00FF00, // Green color (same as GameEndPopup multiplier text)
    anchor: { x: 0.5, y: 0.5 },
    fontWeight: 'bold'
  });
  popupContainer.addChild(title);
  
  // Create reward text using your existing createText component
  const rewardText = createText({
    x: modalWidth / 2,
    y: modalHeight * 0.60,
    text: 'Congratulations!',
    fontSize: Math.max(16, Math.min(24, modalWidth * 0.06)),
    color: 0xFFD700, // Gold color (same as GameEndPopup reward text)
    anchor: { x: 0.5, y: 0.5 },
    fontWeight: 'bold'
  });
  popupContainer.addChild(rewardText);
  
  // // Create close button using your existing createButton component
  // const closeButton = createButton({
  //   x: modalWidth / 2,
  //   y: modalHeight * 0.75,
  //   width: modalWidth * 0.3,
  //   height: modalHeight * 0.12,
  //   text: 'Close',
  //   fontSize: Math.max(14, Math.min(18, modalWidth * 0.04)),
  //   backgroundColor: '#2A4C58', // Using your existing UI theme colors
  //   textColor: '#FFFFFF',
  //   borderColor: '#00FF00', // Green border to match popup theme
  //   borderWidth: 2,
  //   borderRadius: 8,
  //   onClick: onClose
  // });
  // popupContainer.addChild(closeButton);
  

  // Initially hidden (like GameEndPopup)
  popupContainer.visible = false;
  popupContainer.alpha = 0;
  popupContainer.zIndex = 1000;
  
  // Show function with animation similar to GameEndPopup
  const showModal = (message?: string, reward?: number) => {
    // Play won sound (same as GameEndPopup)
    SoundManager.playGameComplete();
    
    // Update text content if provided
    if (message) {
      (rewardText as any).setText(message);
    }
    
    if (reward !== undefined) {
      (rewardText as any).setText(`You won: ${reward.toFixed(2)}`);
    }

    //update title with multiplier
    (title as any).setText(`You Won! x${GlobalState.getMultiplier()}`);
    
    // Show modal immediately (same as GameEndPopup debug mode)
    popupContainer.visible = true;
    popupContainer.alpha = 1.0;
    popupContainer.scale.set(1.0);
    
    console.log('🎉 WinModal: Modal shown successfully');
  };
  
  // Hide function
  const hideModal = () => {
    popupContainer.visible = false;
    popupContainer.alpha = 0;
  };
  
  return {
    container: popupContainer,
    showModal,
    hideModal
  };
};
