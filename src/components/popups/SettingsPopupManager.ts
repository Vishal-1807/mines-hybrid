// SettingsPopupManager.ts - Manages the settings popup lifecycle
import { Application, Container } from 'pixi.js';
import { createSettingsPopup, SettingsButton, SettingsContentSection } from './SettingsPopup';
import { ActivityTypes, recordUserActivity } from '../../utils/gameActivityManager';
import { createAudioSettingsSection } from './settings/AudioSettingsSection';
import { createRulesSettingsSection } from './settings/RulesSettingsSection';
import { createAccountSettingsSection } from './settings/AccountSettingsSection';

class SettingsPopupManager {
  private app: Application;
  private currentPopup: Container | null = null;
  private isVisible: boolean = false;
  
  // Default settings sections
  private defaultButtons: SettingsButton[] = [
    {
      id: 'audio',
      label: 'Sound',
      onClick: (id) => recordUserActivity(ActivityTypes.SETTINGS_OPEN, { section: id })
    },
    {
      id: 'rules',
      label: 'Rules',
      onClick: (id) => recordUserActivity(ActivityTypes.SETTINGS_OPEN, { section: id })
    },
    {
      id: 'account',
      label: 'History',
      onClick: (id) => recordUserActivity(ActivityTypes.SETTINGS_OPEN, { section: id })
    }
  ];
  
  private defaultContentSections: SettingsContentSection[] = [
    createAudioSettingsSection(),
    createRulesSettingsSection(),
    createAccountSettingsSection()
  ];
  
  constructor(app: Application) {
    this.app = app;
  }
  
  /**
   * Show the settings popup
   */
  show(customButtons?: SettingsButton[], customContentSections?: SettingsContentSection[]) {
    if (this.isVisible) {
      console.log('Settings popup is already visible');
      return;
    }
    
    const buttons = customButtons || this.defaultButtons;
    const contentSections = customContentSections || this.defaultContentSections;
    
    this.currentPopup = createSettingsPopup({
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      onClose: () => this.hide(),
      buttons,
      contentSections,
      defaultActiveSection: buttons.length > 0 ? buttons[0].id : undefined
    });
    
    this.app.stage.addChild(this.currentPopup);
    this.isVisible = true;
    
    recordUserActivity(ActivityTypes.SETTINGS_OPEN);
    console.log('Settings popup shown');
  }
  
  /**
   * Hide the settings popup
   */
  hide() {
    if (!this.isVisible || !this.currentPopup) {
      console.log('Settings popup is not visible');
      return;
    }
    
    this.app.stage.removeChild(this.currentPopup);
    this.currentPopup = null;
    this.isVisible = false;
    
    recordUserActivity(ActivityTypes.SETTINGS_CLOSE);
    console.log('Settings popup hidden');
  }
  
  /**
   * Toggle the settings popup visibility
   */
  toggle(customButtons?: SettingsButton[], customContentSections?: SettingsContentSection[]) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(customButtons, customContentSections);
    }
  }
  
  /**
   * Check if popup is currently visible
   */
  isPopupVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Handle screen resize
   */
  handleResize() {
    if (this.isVisible && this.currentPopup) {
      const resizeFunction = (this.currentPopup as any).resize;
      if (resizeFunction) {
        resizeFunction(this.app.screen.width, this.app.screen.height);
      }
    }
  }
  
  /**
   * Set active section programmatically
   */
  setActiveSection(sectionId: string) {
    if (this.isVisible && this.currentPopup) {
      const api = (this.currentPopup as any).api;
      if (api && api.setActiveSection) {
        api.setActiveSection(sectionId);
      }
    }
  }
  
  /**
   * Get current active section
   */
  getActiveSection(): string | null {
    if (this.isVisible && this.currentPopup) {
      const api = (this.currentPopup as any).api;
      if (api && api.getActiveSection) {
        return api.getActiveSection();
      }
    }
    return null;
  }
  
  /**
   * Add a new section dynamically
   */
  addSection(section: SettingsContentSection) {
    if (this.isVisible && this.currentPopup) {
      const api = (this.currentPopup as any).api;
      if (api && api.addSection) {
        api.addSection(section);
      }
    }
  }
  
  /**
   * Remove a section dynamically
   */
  removeSection(sectionId: string) {
    if (this.isVisible && this.currentPopup) {
      const api = (this.currentPopup as any).api;
      if (api && api.removeSection) {
        api.removeSection(sectionId);
      }
    }
  }
}

// Singleton instance
let settingsPopupManagerInstance: SettingsPopupManager | null = null;

/**
 * Get the singleton SettingsPopupManager instance
 */
export const getSettingsPopupManager = (app?: Application): SettingsPopupManager => {
  if (!settingsPopupManagerInstance && app) {
    settingsPopupManagerInstance = new SettingsPopupManager(app);
  }
  
  if (!settingsPopupManagerInstance) {
    throw new Error('SettingsPopupManager not initialized. Call getSettingsPopupManager(app) first.');
  }
  
  return settingsPopupManagerInstance;
};

/**
 * Initialize the settings popup manager
 */
export const initializeSettingsPopupManager = (app: Application): SettingsPopupManager => {
  return getSettingsPopupManager(app);
};

export default SettingsPopupManager;
