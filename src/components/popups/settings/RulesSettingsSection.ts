// RulesSettingsSection.ts - Game rules content section
import { Container, Text } from 'pixi.js';
import { SettingsContentSection, SettingsPopupDimensions } from '../SettingsPopup';
import { createScrollableContainer } from '../../scrollableContainer';

export const createRulesSettingsSection = (): SettingsContentSection => {
  return {
    id: 'rules',
    title: 'Game Rules',
    render: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Create scrollable container for rules content
      const scrollableResult = createScrollableContainer(
        dimensions.contentWidth,
        dimensions.contentHeight - dimensions.popupHeight * 0.02,
        200
      );
      scrollableResult.container.x = -20;
      scrollableResult.container.y = 20;
      container.addChild(scrollableResult.container);

      // Get the content container from scrollable container
      const content = scrollableResult.content;
      content.width = dimensions.contentWidth;

      let yPosition = dimensions.contentY * 0.1;
      const lineHeight = 35;
      const sectionSpacing = dimensions.contentHeight * 0.08;

      // // Game Title
      // const titleText = new Text('Mines Game Rules', {
      //   fontFamily: 'GameFont',
      //   fontSize: 20,
      //   fill: 0xCAAD28,
      //   align: 'left'
      // });
      // titleText.x = 20;
      // titleText.y = yPosition;
      // content.addChild(titleText);
      // yPosition += sectionSpacing;

      // Objective section
      const objectiveTitle = new Text('Objective:', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      objectiveTitle.x = 20;
      objectiveTitle.y = yPosition;
      content.addChild(objectiveTitle);
      yPosition += lineHeight;

      const objectiveText = new Text('Find diamonds while avoiding mines to win multiplied rewards.', {
        fontFamily: 'GameFont',
        fontSize: 14,
        fill: 0xCCCCCC,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: dimensions.contentWidth - 40
      });
      objectiveText.x = 20;
      objectiveText.y = yPosition;
      content.addChild(objectiveText);
      yPosition += sectionSpacing;

      // How to Play section
      const howToPlayTitle = new Text('How to Play:', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      howToPlayTitle.x = 20;
      howToPlayTitle.y = yPosition;
      content.addChild(howToPlayTitle);
      yPosition += lineHeight;

      const rules = [
        '1. Choose your bet amount using the + and - buttons',
        '2. Select the number of mines (more mines = higher multiplier)',
        '3. Click "Place Bet" to start the game',
        '4. Click on cells to reveal diamonds or mines',
        '5. Each diamond found increases your potential winnings',
        '6. Click "Cashout" anytime to collect your current winnings',
        '7. Hit a mine and lose your bet - game over!'
      ];

      rules.forEach(rule => {
        const ruleText = new Text(rule, {
          fontFamily: 'GameFont',
          fontSize: 14,
          fill: 0xCCCCCC,
          align: 'left',
          wordWrap: true,
          wordWrapWidth: dimensions.contentWidth - 40
        });
        ruleText.x = 20;
        ruleText.y = yPosition;
        content.addChild(ruleText);
        yPosition += lineHeight;
      });
      yPosition += 15;

      // Multiplier section
      const multiplierTitle = new Text('Multipliers:', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      multiplierTitle.x = 20;
      multiplierTitle.y = yPosition;
      content.addChild(multiplierTitle);
      yPosition += lineHeight;

      const multiplierText = new Text('Your winnings multiply with each diamond found. More mines on the board means higher multipliers but greater risk!', {
        fontFamily: 'GameFont',
        fontSize: 14,
        fill: 0xCCCCCC,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: dimensions.contentWidth - 40
      });
      multiplierText.x = 20;
      multiplierText.y = yPosition;
      content.addChild(multiplierText);
      yPosition += sectionSpacing;

      // Strategy Tips section
      // const tipsTitle = new Text('Strategy Tips:', {
      //   fontFamily: 'GameFont',
      //   fontSize: 16,
      //   fill: 0xFFFFFF,
      //   align: 'left'
      // });
      // tipsTitle.x = 20;
      // tipsTitle.y = yPosition;
      // content.addChild(tipsTitle);
      // yPosition += lineHeight;

      // const tips = [
      //   '• Start with fewer mines to learn the game',
      //   '• Cashout early for guaranteed smaller wins',
      //   '• Higher mine counts offer bigger multipliers',
      //   '• Use "Pick Random" when unsure which cell to choose',
      //   '• Remember: greed can lead to losses!'
      // ];

      // tips.forEach(tip => {
      //   const tipText = new Text(tip, {
      //     fontFamily: 'GameFont',
      //     fontSize: 14,
      //     fill: 0x4ECDC4,
      //     align: 'left',
      //     wordWrap: true,
      //     wordWrapWidth: dimensions.contentWidth - 60
      //   });
      //   tipText.x = 20;
      //   tipText.y = yPosition;
      //   content.addChild(tipText);
      //   yPosition += lineHeight;
      // });

      // Update content height for scrolling
      scrollableResult.setContentHeight(yPosition + 20);
    },
    resize: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Handle resize if needed
      console.log('Rules settings section resized');
    }
  };
};

export default createRulesSettingsSection;
