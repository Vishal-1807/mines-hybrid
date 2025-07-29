import { Application, Assets, Sprite } from 'pixi.js'
import { hideSplash, loadAssets, setupSplashVideoLoadDetection } from './loader';
import { GlobalState } from './globals/gameState';
import { WebSocketService } from './WebSockets/WebSocketService';
import { getUIVisibilityManager } from './utils/uiVisibilityManager';
import { initializeGameButtonManager } from './utils/gameButtonVisibilityManager';
import { initializeActivityManager, resumeActivityTimer } from './utils/gameActivityManager';
import { initializeButtonStateManager, setupGameStateListeners } from './utils/gameButtonStateManager';
import { SoundManager } from './utils/SoundManager';
import { initializeSettingsPopupManager, getSettingsPopupManager } from './components/popups/SettingsPopupManager';
import { createGameContainer } from './components/gameContainer';
import {UI_THEME} from './components/constants/UIThemeColors';
import { createBetButton, createGridSizesTab, createBetTab, createMinesTab, 
          createGrid, createTopBar, createCashoutButton, createPickRandomButton } from './components';
import {
  createSimplePositionedContainer,
  createStyledPositionedContainer,
  createScrollablePositionedContainer
} from './components/commons/PositionedContainer';
import { createWinModal } from './components/popups/WinModal';
import {REACT_MODE} from './components/constants/ReactMode';


// 🔧 CONFIGURATION: Change this to switch between modes
const USE_REACT_MODE = REACT_MODE; // Set to false for local mode

// Common game initialization logic
const initializeGame = async (app: Application, container?: HTMLDivElement) => {
  // Enable sorting for z-index to work properly
  app.stage.sortableChildren = true;

  //set urls, fetch from window (only if not already set in React mode)
  if (!GlobalState.getS3Url()) {
    const fetchUrls = async () => {
      GlobalState.setS3Url((window as any).s3url);
      GlobalState.setApiUrl((window as any).apiUrl);
      GlobalState.setWebSocketUrl((window as any).websocketUrl);
    }

    await fetchUrls();
    console.log(GlobalState.getS3Url(), GlobalState.getApiUrl(), GlobalState.getWebSocketUrl(), "urls fetched");
  } else {
    console.log('🌐 URLs already set from React mode initialization');
  }

  // Initialize UI Visibility Manager for showing/hiding UI elements
  const uiVisibilityManager = getUIVisibilityManager({
    animationDuration: 300,
    debugMode: true,
    fadeEffect: true
  });

  // Load game assets
  await loadAssets();
  
  // Initialize WebSocket connection
  const ws = await WebSocketService.getInstance();

  // Initialize activity manager for handling user inactivity
  const initActivityManager = () => {
    const activityManager = initializeActivityManager({
      timeoutMinutes: 2,
      debugMode: false,
      excludeFromTimer: []
    });

    console.log('🕐 Activity manager initialized with 2-minute timeout');
    return activityManager;
  };

  const activityManager = initActivityManager();

  // Initialize Settings Popup Manager
  initializeSettingsPopupManager(app);
  console.log('⚙️ Settings popup manager initialized');

  // Start activity timer after initialization
  setTimeout(() => {
    resumeActivityTimer();
    console.log('🕐 Activity timer started after initialization');
  }, 1000);

  // TODO: Create your game components here
  // Example:
  // const background = createBackground(app.screen.width, app.screen.height);
  // app.stage.addChild(background);
  
  // STEP 1: Get player balance
  console.log('📡 STEP 1: Requesting balance...');
  const getBalance = (): Promise<void> => {
    return new Promise((resolve) => {
      ws.on('getbalance', (res) => {
        if (res?.balance !== undefined) {
          GlobalState.setBalance(res.balance);
          console.log('💰 Balance retrieved:', res.balance);
          resolve();
        }
      });
      ws.send('getbalance', { operation: 'getbalance' });
    });
  };

  // STEP 2: Check for pending/active games
  const checkAndHandlePendingGames = async (): Promise<boolean> => {
    console.log('🔍 STEP 2: Checking pending games...');
    return await checkPendingGames(removeSplashScreen);
  };

  // STEP 3: Initialize game UI components
  let gameContainer: any = null;
  const initializeGameUI = (): void => {
    console.log('🎮 STEP 3: Initializing game UI...');

    GlobalState.setSmallScreen(app.screen.height < 750);

    gameContainer = createGameContainer({
      app,
      minWidth: 340,
      maxWidth: app.screen.width < 500 ? app.screen.width : 500,
      backgroundColor: '#1A2C38'
    });

    // Add background image to the game container (behind all other containers)
    const bgTexture = Assets.get('bg');
    if (bgTexture) {
      const bgSprite = new Sprite(bgTexture);
      const bounds = gameContainer.getGameAreaBounds();
      bgSprite.width = bounds.width;
      bgSprite.height = app.screen.height + app.screen.height*0.06; //because the image is not proper, 
      // we are increasing its height and setting its y to start at -70.
      // So the grid is centered

      // Position the background at the top-left of the game area
      bgSprite.x = 0;
      bgSprite.y = -app.screen.height*0.06;

      // Set z-index to be behind all other containers
      bgSprite.zIndex = -1;

      // Add to game area
      gameContainer.gameArea.addChild(bgSprite);

      // Store reference for resize handling
      (gameContainer as any).backgroundSprite = bgSprite;

      // console.log('🖼️ Background image added to game container with dimensions:', targetWidth, 'x', targetHeight);
    } else {
      console.warn('⚠️ Background texture not found');
    }
  
    // Get the game area bounds
    const bounds = gameContainer.getGameAreaBounds();
    console.log('📐 Game area bounds:', bounds);
  
    // Example 1: Create a header container at 0% from top with 60px height
    const headerContainer = createSimplePositionedContainer(
      bounds.width,
      bounds.height,
      '9%',     // height in pixels
      0,      // 0% from top
      '#1A2C38', // background color
      Assets.get('topBar'),
    );

    // Example 2: Create a game board area at 20% from top with 50% height (percentage height!)
    // Make background transparent so the bg.png shows through
    const gameBoardContainer = createStyledPositionedContainer(
      bounds.width,
      bounds.height,
      '50%',  // height as percentage of container height
      8,     // 8% from top
      0x000000, // transparent background (will be set to alpha 0)
      '#304553', // border color
      3,      // border width
      8,       // border radius
      // Assets.get('controlsBar')
    );

    // Make the game board background transparent so bg.png shows through
    if (gameBoardContainer.container.children[0]) {
      (gameBoardContainer.container.children[0] as any).alpha = 0;
    }

    // Example 3: Create a footer/controls area at 80% from top with 15% height (percentage height!) - now scrollable
    console.log('🎨 Controls bar texture:', Assets.get('controlsBar')); // Debug log
    const controlsContainer = createScrollablePositionedContainer(
      bounds.width,
      GlobalState.smallScreen ? bounds.height + app.screen.height*0.04 : bounds.height,
      '42%',  // height as percentage of container height
      58,     // 58% from top
      800,    // scroll height - content can be up to 800px tall
      UI_THEME.CONTROL_BACKGROUND, // background
      '#304553', // border color
      3,      // border width
      8,      // border radius
      GlobalState.smallScreen? true : false, //scrollable based on screen size
      Assets.get('controlsBar'), // background texture
      // 'cover' // texture fit mode
    );
    gameContainer.gameArea.sortableChildren = true;
    // Add containers to the game area
    gameContainer.gameArea.addChild(headerContainer.container);
    gameContainer.gameArea.addChild(gameBoardContainer.container);
    gameContainer.gameArea.addChild(controlsContainer.container);
    gameContainer.gameArea.sortChildren();
  
    // Example: Add content to the containers
    addContentToContainers(headerContainer, gameBoardContainer, controlsContainer);
  
    // Store references for resize handling
    (gameContainer as any).headerContainer = headerContainer;
    (gameContainer as any).gameBoardContainer = gameBoardContainer;
    (gameContainer as any).controlsContainer = controlsContainer;
  };

  const addContentToContainers = (header: any, gameBoard: any, controls: any) => {
    // Add content to header
    const topBar = createTopBar(gameContainer.gameArea.width, gameContainer.gameArea.height, app);
    header.contentArea.addChild(topBar);
    topBar.zIndex = 50;
  
    // Add content to game board
    const gameBoardBounds = gameBoard.getActualBounds();
    const grid = createGrid({
      appWidth: gameBoardBounds.width,
      appHeight: gameBoardBounds.height,
      maxGridWidth: gameBoardBounds.width * 0.95,
      maxGridHeight: gameBoardBounds.height * 0.9
    });
    gameBoard.contentArea.addChild(grid.container);

    // Create and add WinModal (initially hidden)
    const winModal = createWinModal(
      gameBoardBounds.width,
      gameBoardBounds.height,
      gameContainer, // Pass the game container or main container
      () => {
        // onClose callback if needed
      }
    );
    gameBoard.contentArea.addChild(winModal.container);

    // Store grid and win modal references globally for access from other components
    (window as any).gameGrid = grid;
    (window as any).winModal = winModal;

    // Add grid restoration listener for pending game restoration
    GlobalState.addPendingGameRestoreListener(() => {
      console.log('🎮 Grid restoration listener triggered - preparing for game state restoration');

      // Ensure grid is ready for restoration
      if (grid && grid.loadGridFromMatrix) {
        console.log('✅ Grid is ready for matrix loading');
      } else {
        console.warn('⚠️ Grid or loadGridFromMatrix function not available');
      }
    });

    // Add content to controls (contentArea automatically points to scrollable content when scrolling is enabled)
    const betButton = createBetButton(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(betButton);
    betButton.zIndex = 50;

    const cashoutButton = createCashoutButton(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(cashoutButton);
    cashoutButton.zIndex = 50;

    const pickRandomButton = createPickRandomButton(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(pickRandomButton);
    pickRandomButton.zIndex = 50;

    // Initialize centralized game button management
    initializeGameButtonManager({
      betButton,
      cashoutButton,
      pickRandomButton
    });

    const gridSizesTab = createGridSizesTab(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(gridSizesTab);

    const betTab = createBetTab(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(betTab);

    const minesTab = createMinesTab(gameContainer.gameArea.width, gameContainer.gameArea.height);
    controls.contentArea.addChild(minesTab);

    // Initialize button state manager after all components are created
    // (Components register themselves with the manager during creation)
    initializeButtonStateManager({
      betButton,
      cashoutButton,
      pickRandomButton
    });

    // Setup automatic game state listeners for button state management
    setupGameStateListeners();

    // Function to update scroll height based on minesTab position
    const updateScrollHeight = () => {
      // Get the minesTab's bounds to find its bottom position
      const minesTabBounds = minesTab.getBounds();
      const minesTabBottomY = minesTabBounds.y + minesTabBounds.height;

      // Set content height to extend to the minesTab's bottom position plus some padding
      const scrollContentHeight = minesTabBottomY - 250; // Add or remove padding as needed

      // Get controls container bounds for comparison
      const controlsBounds = controls.getActualBounds();

      console.log(`📏 Controls scroll height calculation:`);
      console.log(`   - MinesTab bottom position: ${minesTabBottomY}px`);
      console.log(`   - Calculated scroll content height: ${scrollContentHeight}px`);
      console.log(`   - Controls container height: ${controlsBounds.height}px`);
      console.log(`   - Small screen: ${GlobalState.smallScreen}`);
      console.log(`   - Scrollable: ${GlobalState.smallScreen ? 'YES' : 'NO'}`);

      if (controls.setScrollHeight) {
        controls.setScrollHeight(scrollContentHeight);
      }
    };

    // Calculate scroll height after adding all elements
    setTimeout(updateScrollHeight, 100);

    // Store references for later access
    (gameContainer as any).grid = grid;
    (gameContainer as any).minesTab = minesTab;
    (gameContainer as any).updateScrollHeight = updateScrollHeight;
  };

  // STEP 4: Remove splash screen
  let splashRemoved = false;
  const removeSplashScreen = (): void => {
    if (splashRemoved) {
      console.log('🎨 Splash screen already removed, skipping...');
      return;
    }
    console.log('🎨 Removing splash screen...');
    hideSplash();
    splashRemoved = true;
    console.log('✅ Splash screen removed');
  };

  // STEP 5: Initialize sound system
  const initializeSounds = () => {
    console.log('🔊 Initializing sounds...');
    SoundManager.loadAndWaitForCompletion().then(() => {
      console.log('✅ Sounds loaded and ready');
    });
  }

  // Execute the main initialization flow
  const executeMainFlow = async (): Promise<void> => {
    try {
      // Step 1: Get player balance
      await getBalance();

      // Step 2: Check for pending games
      const hasPendingGame = await checkAndHandlePendingGames();

      // Step 2.5: Set grid dimensions BEFORE initializing UI if pending game exists
      if(hasPendingGame){
        console.log(`🎮 Setting grid dimensions before UI initialization: ${GlobalState.gridCols}x${GlobalState.gridRows}`);
        GlobalState.setGridDimensions(GlobalState.gridCols, GlobalState.gridRows);
      }

      // Step 3: Initialize game UI (now with correct grid dimensions if pending game exists)
      await initializeGameUI();

      // Step 3.5: Complete game restoration if pending game exists
      if(hasPendingGame){
        console.log('🎮 Completing game restoration after UI initialization...');
        GlobalState.setGameState();
        await (window as any).gameGrid.loadGridFromMatrix();
        GlobalState.setGameStarted(true);
      }

      // Step 4: Initialize sounds
      await initializeSounds();

      // Step 5: Remove splash screen (since we're not checking for pending games for now)
      console.log('🎨 Removing splash screen...');
      hideSplash();
      SoundManager.playBackground(); // Uncomment when ready to play background music

      console.log('✅ Main initialization flow completed successfully');

    } catch (error) {
      console.error('❌ Error in main initialization flow:', error);
      // Fallback: still initialize UI and remove splash
      initializeGameUI();
      hideSplash();
    }
  };

  // Listen for pending game restoration completion
  GlobalState.addPendingGameRestoreCompleteListener(() => {
    console.log('🎨 Pending game restoration completed - removing splash screen');
    setTimeout(() => {
      hideSplash();
    }, 100);
  });

  // Start the main initialization flow
  executeMainFlow();

  // Handle window resize events
  const resize = () => {
    const newWidth = app.screen.width;
    const newHeight = app.screen.height;

    // Update game container dimensions
    if (gameContainer && typeof gameContainer.updateDimensions === 'function') {
      gameContainer.updateDimensions(newWidth, newHeight);

      // Get updated bounds
      const bounds = gameContainer.getGameAreaBounds();

      // Update background sprite scaling and positioning
      if ((gameContainer as any).backgroundSprite) {
        const bgSprite = (gameContainer as any).backgroundSprite;
        const bgTexture = bgSprite.texture;

        // Set background width to gameContainer width and height to screen height
        const targetWidth = bounds.width;
        const targetHeight = newHeight; // Use screen height

        const scaleX = targetWidth / bgTexture.width;
        const scaleY = targetHeight / bgTexture.height;

        // bgSprite.scale.set(scaleX, scaleY);

        // Position at top-left
        bgSprite.x = 0;
        bgSprite.y = 0;
      }

      // Update positioned containers
      if ((gameContainer as any).headerContainer) {
        (gameContainer as any).headerContainer.updateDimensions(bounds.width, bounds.height);
      }
      if ((gameContainer as any).gameBoardContainer) {
        (gameContainer as any).gameBoardContainer.updateDimensions(bounds.width, bounds.height);

        // Re-apply transparency to game board background after resize
        if ((gameContainer as any).gameBoardContainer.container.children[0]) {
          ((gameContainer as any).gameBoardContainer.container.children[0] as any).alpha = 0;
        }
      }
      if ((gameContainer as any).controlsContainer) {
        (gameContainer as any).controlsContainer.updateDimensions(bounds.width, bounds.height);

        // Update scroll height after resize to maintain minesTab scroll boundary
        if ((gameContainer as any).updateScrollHeight) {
          setTimeout(() => {
            (gameContainer as any).updateScrollHeight();
          }, 100);
        }
      }
    }

    // Handle settings popup resize
    try {
      const settingsManager = getSettingsPopupManager();
      settingsManager.handleResize();
    } catch (error) {
      // Settings manager not initialized yet, ignore
    }

    console.log(`📐 Window resized to ${newWidth}x${newHeight}`);
  };

  // Debounced resize handler
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      resize();
    }, 50);
  });

  return { app, resize };
};

// React mode initialization (for embedded use)
const initReactMode = async (container: HTMLDivElement) => {
  console.log('🔧 Starting in REACT MODE');

  // Get authentication token from session storage
  const token = sessionStorage.getItem('token') || "";
  if (token) {
    console.log("Token retrieved from session storage:", token);
    GlobalState.setToken(token);
  } else {
    console.warn("No token found in session storage");
  }

  // Fetch URLs first to get S3 URL for splash screen
  const fetchUrls = async () => {
    GlobalState.setS3Url((window as any).s3url);
    GlobalState.setApiUrl((window as any).apiUrl);
    GlobalState.setWebSocketUrl((window as any).websocketUrl);
  }

  await fetchUrls();
  console.log('🌐 URLs fetched for React mode:', GlobalState.getS3Url());

  // Create splash screen overlay with gameContainer dimensions
  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.style.position = 'absolute';
  splash.style.top = '0';
  splash.style.left = '50%';
  splash.style.transform = 'translateX(-50%)';
  splash.style.width = 'min(max(95vw, 340px), 500px)';
  splash.style.height = '100vh';
  splash.style.background = 'black';
  splash.style.zIndex = '10';
  splash.style.display = 'flex';
  splash.style.alignItems = 'center';
  splash.style.justifyContent = 'center';
  splash.style.pointerEvents = 'none';

  // Handle very narrow screens (same logic as gameContainer)
  if (container.clientWidth < 360) {
    splash.style.width = '100vw';
    splash.style.left = '0';
    splash.style.transform = 'none';
  }

  // Create splash video element
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';

  const source = document.createElement('source');
  // Use S3 URL fetched from window
  source.src = GlobalState.getS3Url() + 'mines-field/assets/minesSplash.mp4';
  source.type = 'video/mp4';

  video.appendChild(source);
  splash.appendChild(video);
  container.appendChild(splash);

  setupSplashVideoLoadDetection();

  // Initialize PIXI Application
  const app = new Application();
  await app.init({
    background: '#080f16', // TODO: Change to your game's background color
    autoStart: true,
    width: container.clientWidth,
    height: container.clientHeight,
    resolution: window.devicePixelRatio || 1,
    antialias: true,
  });

  // Set canvas styles for proper rendering
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = '0';
  app.canvas.style.left = '0';
  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';
  app.canvas.style.zIndex = '1';
  app.canvas.style.overflow = 'hidden';
  app.canvas.style.display = 'block';

  // Set container styles
  container.style.overflow = 'hidden';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.display = 'block';
  container.style.position = 'relative';

  container.appendChild(app.canvas);

  await initializeGame(app, container);
};

// Local mode initialization (for standalone development)
const initLocalMode = async () => {
  console.log('🔧 Starting in LOCAL MODE');
  
  const app = new Application();
  await app.init({
    background: '#080f16', // TODO: Change to your game's background color
    autoStart: true,
    resizeTo: window,
  });
  document.body.appendChild(app.canvas);

  // Set canvas styles
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = '0';
  app.canvas.style.left = '0';
  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';
  app.canvas.style.zIndex = '1';
  app.canvas.style.overflow = 'hidden';
  app.canvas.style.display = 'block';

  await initializeGame(app);
};

// Main entry point - switches based on USE_REACT_MODE flag
if (USE_REACT_MODE) {
  // Attach React mode function to window for React to call
  (window as any).startPixiGame = initReactMode;
} else {
  // Initialize local mode immediately
  initLocalMode();
}

// Function to check for pending/active games and restore them
const checkPendingGames = async (removeSplashScreen: () => void): Promise<boolean> => {
  const ws = WebSocketService.getInstance();

  return new Promise<boolean>((resolve) => {
    console.log('🔍 === CHECKING PENDING GAMES ===');
    
    // TODO: Replace with your game's load operation
    ws.send('mines_game_load', {
      operation: 'mines_game_load',
      data: {
        tableId: GlobalState.getTableId(),
      },
    });
    
    ws.on('mines_game_load', (res) => {     
      if (res?.status === '400') {
        console.log('✅ No pending game found - clean state');
        resolve(false); // No pending game
      }
      else if (res?.status === '200 OK') {
        console.log('🎮 200 OK response received');
        
        if(res?.hasExistingGame){
          console.log('🎮 Existing game found - processing restoration...');
          console.log('🎮 Restoration data:', res);
          GlobalState.gridCols = parseInt(res?.gridOption?.split('x')[0]);
          GlobalState.gridRows = parseInt(res?.gridOption?.split('x')[1]);
          GlobalState.setRoundId(res?.roundId);
          GlobalState.setReward(res?.currentWinning || 0);
          GlobalState.setStakeAmount(res?.betAmount || 1);
          GlobalState.setMinesCount(res?.mineCount);
          GlobalState.setGameMatrix(res?.revealedMatrix);
          //set mines clicked to 0 if res.revealedCount doesnt exist
          GlobalState.setMinesClickedCount(res?.revealedCount || 0);

          // TODO: Implement your game's restoration logic here
          // Example restoration steps:
          // 1. Validate the game state
          // 2. Restore game variables
          // 3. Restore UI state
          // 4. Restore game board/components
          
          // Check if game is valid and should be restored
          const hasValidRoundId = res?.roundId && res?.roundId !== null && res?.roundId !== '';
          
          if (!hasValidRoundId) {
            console.log('🎮 Game appears to be completed or invalid - starting fresh');
            resolve(false);
            return;
          }

          console.log('🎮 Valid active game found - proceeding with restoration...');

          // TODO: Restore your game state here
          // Example:
          // GlobalState.setRoundId(res?.roundId);
          // GlobalState.setGameStarted(true);
          // etc.

          // Delay visual restoration to ensure all state is set
          setTimeout(() => {
            console.log('🎨 Triggering game restoration...');
            
            if (GlobalState.triggerPendingGameRestore) {
              console.log('🎨 Calling triggerPendingGameRestore()');
              GlobalState.triggerPendingGameRestore();
            } else {
              console.error('⚠️ GlobalState.triggerPendingGameRestore not available!');
              // Fallback: remove splash screen
              setTimeout(() => {
                removeSplashScreen();
              }, 100);
            }
          }, 500);

          resolve(true);
        } else {
          console.log('🔍 No existing game found');
          resolve(false);
        }
      } else {
        console.warn('⚠️ Unknown response status:', res?.status);
        resolve(false);
      }
    });
  });
};