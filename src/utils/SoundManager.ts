import { Howl, Howler } from 'howler';

let bgVolume = 0.0;
let sfxVolume = 0.0;
let isMuted = false;
const ASSET_BASE = 'https://s3.eu-west-2.amazonaws.com/static.inferixai.link/pixi-game-assets/mines/sounds/';
// const ASSET_BASE = 'sounds/';
// Store sound instances
const sounds: Record<string, Howl> = {};

export const SoundManager = {

  load() {
    const soundsToLoad = {
      bgMusic: `${ASSET_BASE}main_music.mp3`,
      diamond: `${ASSET_BASE}diamond_revel.mp3`,
      mine: `${ASSET_BASE}bomb_blast.mp3`,
      cashout: `${ASSET_BASE}collect.ogg`,
      placebet: `${ASSET_BASE}start.ogg`,
      minus: `${ASSET_BASE}betDecrease.ogg`,
      plus: `${ASSET_BASE}betIncrease.ogg`,
      won: `${ASSET_BASE}gameComplete.ogg`,
      click: `${ASSET_BASE}uiclick.ogg`
    };

    // Create Howl instances for each sound
    for (const [alias, path] of Object.entries(soundsToLoad)) {
      if (!sounds[alias]) {
        sounds[alias] = new Howl({
          src: [path],
          volume: alias === 'bgMusic' ? bgVolume : sfxVolume,
          loop: alias === 'bgMusic',
          autoplay: false,
          preload: true,
          onend: () => {
            console.log(`Sound ${alias} ended`);
          },
          onloaderror: (id, error) => {
            console.error(`Error loading sound ${alias}:`, error);
          }
        });
      }
    }
  },

  // New method to wait for all sounds to load
  loadAndWaitForCompletion(): Promise<void> {
    this.load();

    return new Promise((resolve) => {
      // Create an array to track loading status of each sound
      const soundsArray = Object.values(sounds);
      const totalSounds = soundsArray.length;
      let loadedCount = 0;

      // Function to check if all sounds are loaded
      const checkAllLoaded = () => {
        loadedCount++;
        console.log(`Sound loaded: ${loadedCount}/${totalSounds}`);
        if (loadedCount >= totalSounds) {
          console.log('All sounds loaded successfully');
          resolve();
        }
      };

      // Check if sounds are already loaded
      for (const sound of soundsArray) {
        if (sound.state() === 'loaded') {
          checkAllLoaded();
        } else {
          // Add load event listener
          sound.once('load', checkAllLoaded);

          // Also handle load errors to prevent hanging
          sound.once('loaderror', (_, error) => {
            console.error('Error loading sound:', error);
            checkAllLoaded(); // Count errors as "loaded" to avoid hanging
          });
        }
      }

      // Safety timeout to prevent hanging if some sounds fail to load
      setTimeout(() => {
        if (loadedCount < totalSounds) {
          console.warn(`Timeout reached. Only ${loadedCount}/${totalSounds} sounds loaded.`);
          resolve();
        }
      }, 30000); // 30 second timeout
    });
  },

  stopAllSoundsExceptBackground() {
    for (const [alias, sound] of Object.entries(sounds)) {
      if (alias !== 'bgMusic') {
        sound.stop();
      }
    }
  },

  playBackground(loop = true) {
    if (!isMuted && sounds.bgMusic) {
      sounds.bgMusic.loop(loop);
      sounds.bgMusic.volume(bgVolume);
      sounds.bgMusic.play();
    }
  },

  stopBackground() {
    if (sounds.bgMusic) {
      sounds.bgMusic.stop();
    }
  },

  updateBackgroundVolume() {
    if (sounds.bgMusic) {
      sounds.bgMusic.volume(bgVolume);
    }
  },

  setMusicVolume(vol: number) {
    bgVolume = vol;
    SoundManager.updateBackgroundVolume();
  },

  getMusicVolume(): number {
    return bgVolume;
  },

  setSfxVolume(vol: number) {
    sfxVolume = vol;
    // Update volume for all SFX sounds
    for (const [alias, sound] of Object.entries(sounds)) {
      if (alias !== 'bgMusic') {
        sound.volume(sfxVolume);
      }
    }
  },

  getSfxVolume(): number {
    return sfxVolume;
  },

  playUIClick() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.click) {
      sounds.click.volume(sfxVolume);
      sounds.click.play();
    }
  },

  playPlaceBet() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.placebet) {
      sounds.placebet.volume(sfxVolume);
      sounds.placebet.play();
    }
  },

  playCashout() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.cashout) {
      sounds.cashout.volume(sfxVolume);
      sounds.cashout.play();
    }
  },

  playBetIncrease() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.plus) {
      sounds.plus.volume(sfxVolume);
      sounds.plus.play();
    }
  },

  playBetDecrease() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.minus) {
      sounds.minus.volume(sfxVolume);
      sounds.minus.play();
    }
  },

  playBombExplode() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.mine) {
      sounds.mine.volume(sfxVolume);
      sounds.mine.play();
    }
  },

  playDiamondReveal() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.diamond) {
      sounds.diamond.volume(sfxVolume);
      sounds.diamond.play();
    }
  },

  playGameComplete() {
    SoundManager.stopAllSoundsExceptBackground();
    if (!isMuted && sounds.won) {
      sounds.won.volume(sfxVolume);
      sounds.won.play();
    }
  },

  mute() {
    isMuted = true;
    Howler.mute(true);
  },

  unmute() {
    isMuted = false;
    Howler.mute(false);
  },

  isMuted() {
    return isMuted;
  },

  // Complete cleanup of all sounds and resources
  cleanup() {
    console.log('Cleaning up all sound resources');

    // Stop all currently playing sounds
    Howler.stop();

    // Unload all sound resources to prevent memory leaks
    for (const [alias, sound] of Object.entries(sounds)) {
      sound.unload();
      delete sounds[alias];
    }

    // Additional cleanup
    Howler.unload();
  }
};

// Add event listener for page visibility changes to handle tab switching
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden (user switched tabs or minimized window)
    Howler.mute(true);
  } else {
    // Page is visible again
    if (!isMuted) {
      Howler.mute(false);
    }
  }
});

// Add event listener for page unload to ensure proper cleanup
window.addEventListener('beforeunload', () => {
  SoundManager.cleanup();
});
