// gameState.ts - Cleaned version with only necessary functions for main.ts

import { disableSettingButtons } from "../utils/gameButtonStateManager";
import { enableCashoutButton, showGameButtons, hideBetButton } from "../utils/gameButtonVisibilityManager";

// Create listeners arrays outside the exported object to keep them private
let gridDimensionChangeListeners: Array<(cols: number, rows: number) => void> = [];

// Global state variables
let gameStarted: boolean = false;
let gameStartedListeners: (() => void)[] = [];
let gameEndedListeners: (() => void)[] = [];
let balanceChangeListeners: ((newBalance: number) => void)[] = [];
let betStepsChangeListeners: ((newBetSteps: number[]) => void)[] = [];
let rewardChangeListeners: ((newReward: number) => void)[] = [];

// Pending game restoration listeners
let pendingGameRestoreListeners: Array<() => void> = [];
let pendingGameRestoreCompleteListeners: Array<() => void> = [];

// Layout constants
const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;
const DEFAULT_BALANCE = 1000000;
const DEFAULT_STAKE = 1.00;
const DEFAULT_TABLE_ID = "STGMN101";

//Grid Dimensions
let gridCols = DEFAULT_COLS;
let gridRows = DEFAULT_ROWS;


//Screen size
let smallScreen = false;

let betSteps: number[] = [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 2, 3, 4, 5, 6, 7, 8, 9, 10000,
];

// Mines state
let currentMinesCount = 1;

let minesClicked = 0;

// Clicked cells tracking for current round
let clickedCells: Set<string> = new Set();

const setGameState = () => {
    console.log(GlobalState.getMinesClickedCount(), "helloo");
    hideBetButton();
    showGameButtons();
    disableSettingButtons();
    if(GlobalState.getMinesClickedCount() >= 1){
        enableCashoutButton();
    }
}

const setGameStarted = (started: boolean) => {
    const wasStarted = gameStarted;
    gameStarted = started;
    console.log(`Game started state changed to: ${started}`);
    
    // Emit event when game becomes started (not when it becomes false)
    if (started && !wasStarted) {
        console.log(`Triggering ${gameStartedListeners.length} game started listeners`);
        gameStartedListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in game started listener:', error);
            }
        });
    }
    
    // Emit event when game ends (becomes false from true)
    if (!started && wasStarted) {
        console.log(`Triggering ${gameEndedListeners.length} game ended listeners`);
        gameEndedListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in game ended listener:', error);
            }
        });
    }
}

const getGameStarted = () => {
    return gameStarted;
}

const addGameStartedListener = (callback: () => void) => {
    gameStartedListeners.push(callback);
    console.log(`Added game started listener. Total listeners: ${gameStartedListeners.length}`);
    
    // Return unsubscribe function
    return () => {
        const index = gameStartedListeners.indexOf(callback);
        if (index > -1) {
            gameStartedListeners.splice(index, 1);
            console.log(`Removed game started listener. Remaining listeners: ${gameStartedListeners.length}`);
        }
    };
}

const addGameEndedListener = (callback: () => void) => {
    gameEndedListeners.push(callback);
    console.log(`Added game ended listener. Total listeners: ${gameEndedListeners.length}`);
    
    // Return unsubscribe function
    return () => {
        const index = gameEndedListeners.indexOf(callback);
        if (index > -1) {
            gameEndedListeners.splice(index, 1);
            console.log(`Removed game ended listener. Remaining listeners: ${gameEndedListeners.length}`);
        }
    };
}

const setBalance = (balance: number) => {
    const previousBalance = GlobalState.balance;
    GlobalState.balance = balance;
    console.log(`💳 Balance updated from ${previousBalance} to ${balance}`);
    
    // Trigger balance change listeners when balance changes
    if (previousBalance !== balance) {
        triggerBalanceChange(balance);
    }
};

const getBalance = () => {
    return GlobalState.balance;
};

const triggerBalanceChange = (newBalance: number) => {
    console.log(`💳 Triggering ${balanceChangeListeners.length} balance change listeners with balance: ${newBalance}`);
    balanceChangeListeners.forEach(listener => {
        try {
            listener(newBalance);
        } catch (error) {
            console.error('💳 Error in balance change listener:', error);
        }
    });
}

const addBalanceChangeListener = (callback: (newBalance: number) => void) => {
    balanceChangeListeners.push(callback);
    console.log(`💳 Added balance change listener. Total listeners: ${balanceChangeListeners.length}`);
    
    // Return unsubscribe function
    return () => {
        const index = balanceChangeListeners.indexOf(callback);
        if (index > -1) {
            balanceChangeListeners.splice(index, 1);
            console.log(`💳 Removed balance change listener. Remaining listeners: ${balanceChangeListeners.length}`);
        }
    };
}

const getTableId = () => {
    return GlobalState.table_id;
};

const setGridDimensions = (cols: number, rows: number) => {
    console.log(cols, rows, 'grid dimensions for setting')
    const prevCols = GlobalState.gridCols;
    const prevRows = GlobalState.gridRows;
    
    GlobalState.gridCols = cols;
    GlobalState.gridRows = rows;
    
    console.log(`Grid dimensions updated: ${cols}x${rows} (previous: ${prevCols}x${prevRows})`);
    
    // Trigger listeners only if dimensions actually changed
    if (prevCols !== cols || prevRows !== rows) {
        console.log(`Triggering ${gridDimensionChangeListeners.length} grid dimension change listeners`);
        gridDimensionChangeListeners.forEach(listener => {
            try {
                listener(cols, rows);
            } catch (error) {
                console.error('Error in grid dimension change listener:', error);
            }
        });
    }
};

const getGridDimensions = () => {
    return `${GlobalState.gridCols}x${GlobalState.gridRows}`;
}

const addGridDimensionChangeListener = (callback: (cols: number, rows: number) => void) => {
    gridDimensionChangeListeners.push(callback);
    console.log(`Added grid dimension change listener. Total listeners: ${gridDimensionChangeListeners.length}`);
    
    // Return unsubscribe function
    return () => {
        const index = gridDimensionChangeListeners.indexOf(callback);
        if (index > -1) {
            gridDimensionChangeListeners.splice(index, 1);
            console.log(`Removed grid dimension change listener. Remaining listeners: ${gridDimensionChangeListeners.length}`);
        }
    };
};

const addRewardChangeListener = (callback: (reward: number) => void) => {
    rewardChangeListeners.push(callback);
    console.log(`Added reward change listener. Total listeners: ${rewardChangeListeners.length}`);
    
    // Return unsubscribe function
    return () => {
        const index = rewardChangeListeners.indexOf(callback);
        if (index > -1) {
            rewardChangeListeners.splice(index, 1);
            console.log(`Removed reward change listener. Remaining listeners: ${rewardChangeListeners.length}`);
        }
    };
};

const setStakeAmount = (amount: number) => {
    GlobalState.stakeAmount = amount;
    console.log(`Stake amount set to: ${amount}`);
};

const setBetSteps = (steps: number[]) => {
    if (steps && steps.length > 0) {
        betSteps = steps;

        // Ensure current index is valid with new bet steps
        if (GlobalState.currentBetIndex >= betSteps.length) {
            GlobalState.currentBetIndex = 0;
        }

        // IMPORTANT FIX: Update the stake amount to match the current bet index
        const newStakeAmount = betSteps[GlobalState.currentBetIndex];
        GlobalState.stakeAmount = newStakeAmount;
        console.log(`💰 Updated stake amount to: ${newStakeAmount} (from bet steps)`);

        // Notify all bet steps change listeners
        betStepsChangeListeners.forEach(listener => listener(betSteps));
    }
};

const getBetSteps = () :number[] => {
    return betSteps;
}

const addBetStepsChangeListener = (listener: (newBetSteps: number[]) => void) => {
    betStepsChangeListeners.push(listener);
};

const getStakeAmount = () => {
    return GlobalState.stakeAmount;
};

// Mines functions
const setMinesCount = (count: number) => {
    console.log(count, 'hello count');
    const maxMines = GlobalState.gridRows * GlobalState.gridCols - 1;
    console.log(maxMines, 'hello max mines');
    if (count >= 1 && count <= maxMines) {
        currentMinesCount = count;
        console.log(`Mines count set to: ${count}`);
    }
};

const getMinesCount = () => {
    return currentMinesCount;
};

const setMinesClickedCount = (count: number) => {
    minesClicked = count;
    console.log(`Mines clicked set to: ${count}`);
};

const mineClicked = () => {
    minesClicked++;
    console.log(`Mines clicked set to: ${minesClicked}`);
};

const getMinesClickedCount = () => {
    return minesClicked;
};

const resetMinesClickedCount = () => {
    minesClicked = 0;
    console.log(`Mines clicked reset to: ${minesClicked}`);
};

const getMaxMines = () => {
    return GlobalState.gridRows * GlobalState.gridCols - 1;
};

// Bet cycling functions
const cycleBetUp = () => {
    const betSteps = getBetSteps();
    GlobalState.currentBetIndex = (GlobalState.currentBetIndex + 1) % betSteps.length;
    const newStakeAmount = betSteps[GlobalState.currentBetIndex];
    GlobalState.stakeAmount = newStakeAmount;
    console.log(`💰 Cycled bet up to: ${newStakeAmount} (index: ${GlobalState.currentBetIndex})`);
    return newStakeAmount;
};

const cycleBetDown = () => {
    const betSteps = getBetSteps();
    GlobalState.currentBetIndex = (GlobalState.currentBetIndex - 1 + betSteps.length) % betSteps.length;
    const newStakeAmount = betSteps[GlobalState.currentBetIndex];
    GlobalState.stakeAmount = newStakeAmount;
    console.log(`💰 Cycled bet down to: ${newStakeAmount} (index: ${GlobalState.currentBetIndex})`);
    return newStakeAmount;
};

// Mines cycling functions
const cycleMinesUp = () => {
    const maxMines = getMaxMines();
    currentMinesCount = currentMinesCount >= maxMines ? 1 : currentMinesCount + 1;
    console.log(`⛏️ Cycled mines up to: ${currentMinesCount}`);
    return currentMinesCount;
};

const cycleMinesDown = () => {
    const maxMines = getMaxMines();
    currentMinesCount = currentMinesCount <= 1 ? maxMines : currentMinesCount - 1;
    console.log(`⛏️ Cycled mines down to: ${currentMinesCount}`);
    return currentMinesCount;
};

const setSmallScreen = (smallScreen: boolean) => {
    GlobalState.smallScreen = smallScreen;
    console.log(`Small screen set to: ${smallScreen}`);
};

const getSmallScreen = () => {
    return GlobalState.smallScreen;
};


const setRoundId = (roundId: string) => {
    GlobalState.roundId = roundId;
    console.log('Round ID set:', roundId);
};

const getRoundId = () => {
    return GlobalState.roundId;
};

const setCurrentRow = (row: number) => {
    console.log(`Setting current row to: ${row}`);
    GlobalState.current_row = row;
};

const getCurrentRow = () => {
    return GlobalState.current_row;
};

const setGameMatrix = (matrix: string[][]) => {
    GlobalState.game_matrix = matrix;
    console.log('Game matrix updated:', matrix);
};

const getGameMatrix = () => {
    return GlobalState.game_matrix;
};

const setReward = (newReward: number) => {
    GlobalState.reward = newReward;
    console.log(`Reward set to: ${newReward}`);
    rewardChangeListeners.forEach(listener => listener(newReward));
}

const getReward = () => {
    return GlobalState.reward;
}

const setMultiplier = (newMultiplier: number) => {
    GlobalState.multiplier = newMultiplier;
    console.log(`Multiplier set to: ${newMultiplier}`);
    // rewardChangeListeners.forEach(listener => listener(newMultiplier));
}

const getMultiplier = () => {
    return GlobalState.multiplier;
}

// Clicked cells management functions
const addClickedCell = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    clickedCells.add(cellKey);
    console.log(`🎯 Added clicked cell: ${cellKey}. Total clicked: ${clickedCells.size}`);
}

const isClickedCell = (row: number, col: number): boolean => {
    const cellKey = `${row}-${col}`;
    return clickedCells.has(cellKey);
}

const clearClickedCells = () => {
    const previousSize = clickedCells.size;
    clickedCells.clear();
    console.log(`🧹 Cleared ${previousSize} clicked cells`);
}

const getClickedCells = (): Set<string> => {
    return new Set(clickedCells); // Return a copy to prevent external modification
}

const getUnclickedCells = (): Array<{row: number, col: number}> => {
    const unclicked: Array<{row: number, col: number}> = [];
    const gridRows = GlobalState.gridRows;
    const gridCols = GlobalState.gridCols;

    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            if (!isClickedCell(row, col)) {
                unclicked.push({ row, col });
            }
        }
    }

    console.log(`🎲 Found ${unclicked.length} unclicked cells out of ${gridRows * gridCols} total`);
    return unclicked;
}

const setToken = (token: string) => {
    console.log('Setting token for React integration:', token);
    GlobalState.token = token;
}

const getToken = () => {
    return GlobalState.token;
}

// Function to add pending game restore listener
const addPendingGameRestoreListener = (listener: () => void) => {
    pendingGameRestoreListeners.push(listener);
    console.log(`Added pending game restore listener. Total listeners: ${pendingGameRestoreListeners.length}`);

    // Return unsubscribe function
    return () => {
        const index = pendingGameRestoreListeners.indexOf(listener);
        if (index > -1) {
            pendingGameRestoreListeners.splice(index, 1);
            console.log(`Removed pending game restore listener. Remaining listeners: ${pendingGameRestoreListeners.length}`);
        }
    };
};

// Function to add pending game restore completion listener
const addPendingGameRestoreCompleteListener = (listener: () => void) => {
    pendingGameRestoreCompleteListeners.push(listener);
    console.log(`Added pending game restore complete listener. Total listeners: ${pendingGameRestoreCompleteListeners.length}`);

    // Return unsubscribe function
    return () => {
        const index = pendingGameRestoreCompleteListeners.indexOf(listener);
        if (index > -1) {
            pendingGameRestoreCompleteListeners.splice(index, 1);
            console.log(`Removed pending game restore complete listener. Remaining listeners: ${pendingGameRestoreCompleteListeners.length}`);
        }
    };
};

// Function to trigger pending game restore
const triggerPendingGameRestore = async () => {
    console.log('🔄 Triggering pending game restore');

    try {
        // Notify all listeners that game restoration is starting
        console.log(`🔄 Notifying ${pendingGameRestoreListeners.length} restore listeners`);
        pendingGameRestoreListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in pending game restore listener:', error);
            }
        });

        // Wait a bit for listeners to process
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the grid reference from window (set in main.ts)
        const grid = (window as any).gameGrid;
        if (grid && grid.loadGridFromMatrix) {
            console.log('🎮 Loading grid from revealed matrix...');
            await grid.loadGridFromMatrix();
            console.log('✅ Grid loaded successfully from matrix');
        } else {
            console.warn('⚠️ Grid reference or loadGridFromMatrix function not found');
        }

        // Notify all listeners that game restoration is complete
        console.log(`✅ Notifying ${pendingGameRestoreCompleteListeners.length} restore complete listeners`);
        pendingGameRestoreCompleteListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Error in pending game restore complete listener:', error);
            }
        });

        console.log('🎉 Pending game restore completed successfully');
    } catch (error) {
        console.error('❌ Error during pending game restore:', error);

        // Still notify completion listeners even on error to prevent hanging
        pendingGameRestoreCompleteListeners.forEach(listener => {
            try {
                listener();
            } catch (listenerError) {
                console.error('Error in pending game restore complete listener (error case):', listenerError);
            }
        });
    }
};

export const GlobalState = {
    // Core state
    token: null as string | null,
    current_row: DEFAULT_ROWS - 1, // Start at bottom row
    game_matrix: [] as string[][],
    gridCols: DEFAULT_COLS,
    gridRows: DEFAULT_ROWS,
    multiplier: 1,
    setMultiplier,
    getMultiplier,

    //screen size
    smallScreen: false,
    setSmallScreen,
    getSmallScreen,
    
    // Game state
    balance: DEFAULT_BALANCE,
    stakeAmount: DEFAULT_STAKE,
    roundId: null as string | null,
    reward: 0,
    
    // Table data
    table_id: DEFAULT_TABLE_ID,
    
    // Token functions
    getToken,
    setToken,

    //Bet Steps
    currentBetIndex: 0,
    setBetSteps,
    getBetSteps,
    addBetStepsChangeListener,
    cycleBetUp,
    cycleBetDown,

    // Mines
    setMinesCount,
    getMinesCount,
    getMaxMines,
    cycleMinesUp,
    cycleMinesDown,
    setMinesClickedCount,
    mineClicked,
    getMinesClickedCount,
    resetMinesClickedCount,
    
    // Game state functions
    setGameState,
    setGameStarted,
    getGameStarted,
    addGameStartedListener,
    addGameEndedListener,
    
    // Balance functions
    setBalance,
    getBalance,
    addBalanceChangeListener,
    
    // Reward functions
    addRewardChangeListener,

    // Grid functions
    setGridDimensions,
    getGridDimensions,
    addGridDimensionChangeListener,
    
    // Game data functions
    getTableId,
    setStakeAmount,
    getStakeAmount,
    setRoundId,
    getRoundId,
    setCurrentRow,
    getCurrentRow,
    setGameMatrix,
    getGameMatrix,
    setReward,
    getReward,
    
    // Extensibility placeholders
    addPendingGameRestoreListener,
    addPendingGameRestoreCompleteListener,
    triggerPendingGameRestore,

    // Clicked cells management
    addClickedCell,
    isClickedCell,
    clearClickedCells,
    getClickedCells,
    getUnclickedCells,
};