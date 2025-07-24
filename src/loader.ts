import { Assets } from 'pixi.js';

export async function loadAssets() {
    const ASSET_BASE = '';
    // const ASSET_BASE = 'https://s3.eu-west-2.amazonaws.com/static.inferixai.link/pixi-game-assets/mines/'
    
    // Load all assets including the font file
    await Assets.load([
        { alias: 'gridCell', src: `${ASSET_BASE}assets/GridCell.png` },
        { alias: 'diamondSprite', src: `${ASSET_BASE}sprites/diamond.json` },
        { alias: 'bomb', src: `${ASSET_BASE}assets/boom.png` },
        { alias: 'bombSprite', src: `${ASSET_BASE}sprites/bomb.json` },
        { alias: 'balanceTab', src: `${ASSET_BASE}assets/BalanceTab.png` },
        { alias: 'valueBar', src: `${ASSET_BASE}assets/ValueBar.png` },
        { alias: 'home', src: `${ASSET_BASE}assets/Home.png` },
        { alias : 'settings', src: `${ASSET_BASE}assets/Settings.png` },
        { alias: 'button', src: `${ASSET_BASE}assets/Button.png` },
        { alias: 'topBar', src: `${ASSET_BASE}assets/TopBar.png` },
        { alias: 'controlsBar', src: `${ASSET_BASE}assets/ControlsBar.png` },
        { alias: 'plusButton', src: `${ASSET_BASE}assets/PlusButton.png` },
        { alias: 'minusButton', src: `${ASSET_BASE}assets/MinusButton.png` },
        { alias: 'gridSizeTabSelected', src: `${ASSET_BASE}assets/GridSizeTabSelected.png` },
        { alias: 'gridSizeTabUnselected', src: `${ASSET_BASE}assets/GridSizeTabUnselected.png` },
        { alias: 'closeButton', src: `${ASSET_BASE}assets/CloseButton.png` },
        { alias: 'Sound', src: `${ASSET_BASE}assets/Sound.png` },
        { alias : 'Rules', src: `${ASSET_BASE}assets/Rules.png` },
        { alias: 'History', src: `${ASSET_BASE}assets/History.png` }
    ]);

    console.log('All assets loaded successfully');

    // Debug: Check if controlsBar asset loaded
    const controlsBarAsset = Assets.get('controlsBar');
    console.log('🎨 ControlsBar asset loaded:', controlsBarAsset);
    console.log('🎨 ControlsBar asset type:', typeof controlsBarAsset);
    if (controlsBarAsset) {
        console.log('🎨 ControlsBar dimensions:', controlsBarAsset.width, 'x', controlsBarAsset.height);
    }

    // Register the custom font for use in PIXI Text
    try {
        // Use the direct path to the font file
        const fontUrl = `${ASSET_BASE}assets/gameFont.ttf`;
        const fontFace = new FontFace('GameFont', `url(${fontUrl})`);
        
        await fontFace.load();
        document.fonts.add(fontFace);
        
        console.log('✅ Custom font "GameFont" loaded and registered successfully');
        
        // Verify the font is available
        await document.fonts.ready;
        const isAvailable = document.fonts.check('16px GameFont');
        console.log('Font availability check:', isAvailable);
        
    } catch (fontError) {
        console.warn('⚠️ Failed to load custom font "GameFont":', fontError);
        console.log('Will fallback to system fonts');
    }
}

export function hideSplash() {
    const splash = document.getElementById('splash');
    if (splash) splash.remove();
}