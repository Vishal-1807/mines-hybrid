// AudioSettingsSection.ts - Audio settings content section
import { Container, Text } from 'pixi.js';
import { UI_THEME } from '../../constants/UIThemeColors';
import { SettingsContentSection, SettingsPopupDimensions } from '../SettingsPopup';
import { SoundManager } from '../../../utils/SoundManager';
import createSlider from '../../commons/Slider';

export const createAudioSettingsSection = (): SettingsContentSection => {
  return {
    id: 'audio',
    title: 'Audio Settings',
    render: (container: Container, dimensions: SettingsPopupDimensions) => {
      const sliderWidth = Math.min(250, dimensions.contentWidth - 40);

      // Background Music Volume section
      const bgVolumeLabel = new Text('Background Music Volume', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      bgVolumeLabel.x = dimensions.contentX/4;
      bgVolumeLabel.y = 20;
      container.addChild(bgVolumeLabel);

      // Background volume value display
      const bgVolumeValue = new Text(`${Math.round(SoundManager.getMusicVolume() * 100)}%`, {
        fontFamily: 'GameFont',
        fontSize: 14,
        fill: 0xCAAD28,
        align: 'right'
      });
      bgVolumeValue.x = dimensions.contentX/4 + sliderWidth + 20;
      bgVolumeValue.y = 20;
      container.addChild(bgVolumeValue);

      // Background music volume slider
      const bgVolumeSlider = createSlider(
        sliderWidth,
        SoundManager.getMusicVolume(),
        (value: number) => {
          SoundManager.setMusicVolume(value);
          bgVolumeValue.text = `${Math.round(value * 100)}%`;
          console.log(`Background music volume set to: ${Math.round(value * 100)}%`);
        }
      );
      bgVolumeSlider.x = dimensions.contentX/4;
      bgVolumeSlider.y = 50;
      container.addChild(bgVolumeSlider);

      // SFX Volume section
      const sfxVolumeLabel = new Text('Sound Effects Volume', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      // sfxVolumeLabel.anchor.set(0.5, 0);
      sfxVolumeLabel.x = dimensions.contentX/4;
      sfxVolumeLabel.y = 100;
      container.addChild(sfxVolumeLabel);

      // SFX volume value display
      const sfxVolumeValue = new Text(`${Math.round(SoundManager.getSfxVolume() * 100)}%`, {
        fontFamily: 'GameFont',
        fontSize: 14,
        fill: 0xCAAD28,
        align: 'right'
      });
      sfxVolumeValue.x = dimensions.contentX/4 + sliderWidth + 20;
      sfxVolumeValue.y = 100;
      container.addChild(sfxVolumeValue);

      // SFX volume slider
      const sfxVolumeSlider = createSlider(
        sliderWidth,
        SoundManager.getSfxVolume(),
        (value: number) => {
          SoundManager.setSfxVolume(value);
          sfxVolumeValue.text = `${Math.round(value * 100)}%`;
          // Play a test sound to demonstrate the new volume
          // SoundManager.playUIClick();
          console.log(`SFX volume set to: ${Math.round(value * 100)}%`);
        }
      );
      sfxVolumeSlider.x = dimensions.contentX/4;
      sfxVolumeSlider.y = 130;
      container.addChild(sfxVolumeSlider);

      // Mute/Unmute info section
      const muteLabel = new Text('Audio Status', {
        fontFamily: 'GameFont',
        fontSize: 16,
        fill: 0xFFFFFF,
        align: 'left'
      });
      muteLabel.x = 20;
      muteLabel.y = 180;
      container.addChild(muteLabel);

      const muteStatus = new Text(SoundManager.isMuted() ? 'Muted' : 'Enabled', {
        fontFamily: 'GameFont',
        fontSize: 14,
        fill: SoundManager.isMuted() ? 0xFF6B6B : 0x4ECDC4,
        align: 'left'
      });
      muteStatus.x = 20;
      muteStatus.y = 210;
      container.addChild(muteStatus);

      // Note about audio controls
      const noteText = new Text('Tip: Use the sliders above to adjust volume levels.\nChanges are applied immediately.', {
        fontFamily: 'GameFont',
        fontSize: 12,
        fill: 0xAAAAAA,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: sliderWidth
      });
      noteText.x = 20;
      noteText.y = 250;
      container.addChild(noteText);
    },
    resize: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Handle resize if needed
      console.log('Audio settings section resized');
    }
  };
};

export default createAudioSettingsSection;
