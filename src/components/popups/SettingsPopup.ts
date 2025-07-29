// SettingsPopup.ts - Modular settings popup with responsive layout
import { Container, Graphics, Text, Assets } from 'pixi.js';
import { createButton } from '../commons/Button';
import { UI_THEME } from '../constants/UIThemeColors';
import { SoundManager } from '../../utils/SoundManager';
import { ActivityTypes, recordUserActivity } from '../../utils/gameActivityManager';

// Interface for settings button configuration
export interface SettingsButton {
  id: string;
  label: string;
  icon?: string;
  onClick?: (buttonId: string) => void;
}

// Interface for settings content sections
export interface SettingsContentSection {
  id: string;
  title?: string;
  render: (container: Container, dimensions: SettingsPopupDimensions) => void;
  resize?: (container: Container, dimensions: SettingsPopupDimensions) => void;
}

// Interface for popup dimensions
export interface SettingsPopupDimensions {
  screenWidth: number;
  screenHeight: number;
  popupWidth: number;
  popupHeight: number;
  popupX: number;
  popupY: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  isWideScreen: boolean;
  navigationHeight: number;
  navigationY: number;
}

interface SettingsPopupOptions {
  screenWidth: number;
  screenHeight: number;
  onClose: () => void;
  buttons?: SettingsButton[];
  contentSections?: SettingsContentSection[];
  defaultActiveSection?: string;
}

// Calculate responsive dimensions based on screen size
const calculateDimensions = (screenWidth: number, screenHeight: number): SettingsPopupDimensions => {
  // const isWideScreen = screenWidth > 700; change it if you want it to change
  const isWideScreen = false;
  
  // Popup size - responsive
  const popupWidth = Math.min(screenWidth * 0.9, isWideScreen ? 800 : 500);
  const popupHeight = Math.min(screenHeight * 0.85, isWideScreen ? 600 : 700);
  
  // Center popup
  const popupX = (screenWidth - popupWidth) / 2;
  const popupY = (screenHeight - popupHeight) / 2;
  
  // Navigation area
  const navigationHeight = isWideScreen ? popupHeight : 60;
  const navigationY = popupY + 20;
  
  // Content area
  const contentX = isWideScreen ? popupX + 200 : popupX; // Leave space for sidebar on wide screens
  const contentY = isWideScreen ? popupY + 20 : navigationY + navigationHeight + 10;
  const contentWidth = isWideScreen ? popupWidth - 240 : popupWidth - 10;
  const contentHeight = isWideScreen ? popupHeight - 40 : popupHeight - navigationHeight - 50;
  
  return {
    screenWidth,
    screenHeight,
    popupWidth,
    popupHeight,
    popupX,
    popupY,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
    isWideScreen,
    navigationHeight,
    navigationY
  };
};

export const createSettingsPopup = ({
  screenWidth,
  screenHeight,
  onClose,
  buttons = [],
  contentSections = [],
  defaultActiveSection
}: SettingsPopupOptions) => {
  const container = new Container();
  container.zIndex = 300; // Higher than existing popups
  
  // State management
  let activeSection = defaultActiveSection || (contentSections.length > 0 ? contentSections[0].id : '');
  let activeSectionContainer: Container | null = null;
  let navigationContainer: Container | null = null;
  let contentContainer: Container | null = null;
  
  let dimensions = calculateDimensions(screenWidth, screenHeight);
  
  // Background overlay
  const backgroundOverlay = new Graphics();
  backgroundOverlay.rect(0, 0, screenWidth, screenHeight);
  backgroundOverlay.fill({ color: 0x000000, alpha: 0.7 });
  backgroundOverlay.eventMode = 'static';
  backgroundOverlay.on('pointerdown', onClose);
  container.addChild(backgroundOverlay);
  
  // Main popup panel
  const popupPanel = new Graphics();
  popupPanel.roundRect(dimensions.popupX, dimensions.popupY, dimensions.popupWidth, dimensions.popupHeight, 12);
  popupPanel.fill({ color: 0x1A2C38 });
  popupPanel.stroke({ color: 0x2A4C58, width: 2 });
  popupPanel.eventMode = 'static';
  popupPanel.on('pointerdown', (e) => { e.stopPropagation(); });
  container.addChild(popupPanel);
  
  // Close button
  const closeButton = createButton({
    x: dimensions.popupX + dimensions.popupWidth - 40,
    y: dimensions.popupY + 20,
    width: 25,
    height: 25,
    color: UI_THEME.BET_VALUEBAR,
    borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
    borderWidth: 1,
    borderRadius: 15,
    texture: Assets.get('closeButton'),
    // label: '✕',
    textColor: UI_THEME.INPUT_TEXT,
    textSize: 16,
    onClick: () => {
      recordUserActivity(ActivityTypes.SETTINGS_CLOSE, { section: activeSection });
      SoundManager.playUIClick();
      onClose();
    }
  });
  container.addChild(closeButton);
  
  // Function to render navigation (sidebar or top bar)
  const renderNavigation = () => {
    if (navigationContainer) {
      container.removeChild(navigationContainer);
    }
    
    navigationContainer = new Container();
    
    if (dimensions.isWideScreen) {
      // Render as sidebar
      renderSidebar();
    } else {
      // Render as top bar
      renderTopBar();
    }
    
    container.addChild(navigationContainer);
  };
  
  // Render sidebar for wide screens
  const renderSidebar = () => {
    if (!navigationContainer) return;
    
    const sidebarX = dimensions.popupX + 20;
    const sidebarY = dimensions.popupY + 20;
    const sidebarWidth = 160;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    
    buttons.forEach((button, index) => {
      const buttonY = sidebarY + (index * (buttonHeight + buttonSpacing));
      const isActive = activeSection === button.id;
      
      const navButton = createButton({
        x: sidebarX,
        y: buttonY,
        width: sidebarWidth,
        height: buttonHeight,
        color: isActive ? UI_THEME.BET_TAB_BORDERCOLOR : UI_THEME.BET_VALUEBAR,
        borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
        borderWidth: 1,
        borderRadius: 5,
        label: button.label,
        textColor: UI_THEME.INPUT_TEXT,
        textSize: 14,
        onClick: () => {
          SoundManager.playUIClick();
          if (activeSection !== button.id) {
            activeSection = button.id;
            renderNavigation();
            renderContent();
            button.onClick?.(button.id);
            recordUserActivity(ActivityTypes.SETTINGS_OPEN, { section: button.id });
          }
        }
      });
      
      navigationContainer!.addChild(navButton);
    });
  };
  
  // Render top bar for narrow screens
  const renderTopBar = () => {
    if (!navigationContainer) return;
    
    const barX = dimensions.popupX + dimensions.popupWidth / 5;
    const barY = dimensions.navigationY + dimensions.navigationHeight * 0.8;
    const totalWidth = dimensions.popupWidth - 40;
    const buttonWidth = Math.min(60, totalWidth / Math.max(buttons.length, 1) - 10);
    const buttonHeight = 60;
    
    buttons.forEach((button, index) => {
      const buttonX = barX + (index * (buttonWidth + 50));
      const isActive = activeSection === button.id;
      
      const navButton = createButton({
        x: buttonX,
        y: barY,
        width: buttonWidth,
        height: buttonHeight,
        color: isActive ? UI_THEME.BET_TAB_BORDERCOLOR : UI_THEME.BET_VALUEBAR,
        borderColor: UI_THEME.BET_TAB_BORDERCOLOR,
        borderWidth: 1,
        borderRadius: 5,
        texture: Assets.get(button.label),
        // label: button.label,
        textColor: UI_THEME.INPUT_TEXT,
        textSize: 12,
        onClick: () => {
          SoundManager.playUIClick();
          if (activeSection !== button.id) {
            activeSection = button.id;
            renderNavigation();
            renderContent();
            button.onClick?.(button.id);
            recordUserActivity(ActivityTypes.SETTINGS_OPEN, { section: button.id });
          }
        }
      });
      
      navigationContainer!.addChild(navButton);
    });
  };
  
  // Function to render active content
  const renderContent = () => {
    if (contentContainer) {
      container.removeChild(contentContainer);
    }
    
    contentContainer = new Container();
    
    // Find active content section
    const activeContentSection = contentSections.find(section => section.id === activeSection);
    if (activeContentSection) {
      activeSectionContainer = new Container();
      
      // Add title if provided
      if (activeContentSection.title) {
        const title = new Text(activeContentSection.title, {
          // fontFamily: 'GameFont',
          fontSize: Math.min(24, dimensions.contentHeight * 0.08),
          fill: 0xFFFFFF,
          align: 'left',
          fontWeight: 'bold'
        });
        title.x = dimensions.contentX+20;
        title.y = dimensions.contentY + 20;
        activeSectionContainer.addChild(title);
      }
      
      // Create content area
      const sectionContentContainer = new Container();
      sectionContentContainer.x = dimensions.contentX + dimensions.popupWidth * 0.04;
      sectionContentContainer.y = dimensions.contentY + (activeContentSection.title ? 60 : 0);
      
      // Render custom content
      activeContentSection.render(sectionContentContainer, {
        ...dimensions,
        contentY: sectionContentContainer.y,
        contentHeight: dimensions.contentHeight - (activeContentSection.title ? 40 : 0)
      });
      
      activeSectionContainer.addChild(sectionContentContainer);
      contentContainer.addChild(activeSectionContainer);
    }
    
    container.addChild(contentContainer);
  };
  
  // Resize function
  const resize = (newWidth: number, newHeight: number) => {
    dimensions = calculateDimensions(newWidth, newHeight);
    
    // Update background
    backgroundOverlay.clear();
    backgroundOverlay.rect(0, 0, newWidth, newHeight);
    backgroundOverlay.fill({ color: 0x000000, alpha: 0.7 });
    
    // Update popup panel
    popupPanel.clear();
    popupPanel.roundRect(dimensions.popupX, dimensions.popupY, dimensions.popupWidth, dimensions.popupHeight, 12);
    popupPanel.fill({ color: 0x1A2C38 });
    popupPanel.stroke({ color: 0x2A4C58, width: 2 });
    
    // Update close button
    (closeButton as any).x = dimensions.popupX + dimensions.popupWidth - 40;
    (closeButton as any).y = dimensions.popupY + 10;
    
    // Re-render navigation and content
    renderNavigation();
    renderContent();
  };
  
  // Initialize
  renderNavigation();
  renderContent();
  
  // Public API
  const popupAPI = {
    resize,
    setActiveSection: (sectionId: string) => {
      if (contentSections.find(s => s.id === sectionId)) {
        activeSection = sectionId;
        renderNavigation();
        renderContent();
      }
    },
    getActiveSection: () => activeSection,
    addSection: (section: SettingsContentSection) => {
      contentSections.push(section);
      if (!activeSection) {
        activeSection = section.id;
      }
      renderNavigation();
      renderContent();
    },
    removeSection: (sectionId: string) => {
      const index = contentSections.findIndex(s => s.id === sectionId);
      if (index > -1) {
        contentSections.splice(index, 1);
        if (activeSection === sectionId && contentSections.length > 0) {
          activeSection = contentSections[0].id;
        }
        renderNavigation();
        renderContent();
      }
    }
  };
  
  (container as any).resize = resize;
  (container as any).api = popupAPI;
  
  return container;
};

export default createSettingsPopup;
