import { GlobalState } from "../globals/gameState";
import { WebSocketService } from "./WebSocketService";
import { enableGrid, enablePickRandomButton, showGameButtons } from "../utils/gameButtonVisibilityManager";

export const sendPlaceBetEvent = async () => {
  // Wait for WebSocket to connect
  const ws = WebSocketService.getInstance();

  console.log('Placing bet...');

  return new Promise((resolve, reject) => {
    const handleResponse = (res: any) => {
      if (res?.status === '200 OK') {
        // Only set game started on successful bet placement and remove win modal if in case it exists
        GlobalState.setReward(0);
        GlobalState.setGameStarted(true);
        GlobalState.setBalance(res.balance);

        // Clear clicked cells for new round
        GlobalState.clearClickedCells();

        // Reset mines clicked count for new round
        GlobalState.resetMinesClickedCount();

        // Enable grid and pick random button
        enableGrid();
        enablePickRandomButton();

        // Show cashout and pick random buttons after successful bet
        showGameButtons();

        console.log('✅ Bet placed successfully - game started', res);
        resolve(res);
      } else {
        console.error('❌ Failed to place bet:', res);
        // Ensure game state is reset on failure
        GlobalState.setGameStarted(false);
        reject(new Error(res));
      }
    };
      ws.once('mines_placebet', handleResponse);

      ws.send('mines_placebet', {
        operation: 'mines_placebet',
        data: {
          roundId: GlobalState.getRoundId(),
          tableId: GlobalState.getTableId(),
          stakeAmount: String(GlobalState.getStakeAmount()),
          gridOption: GlobalState.getGridDimensions(),
          mineCount: GlobalState.getMinesCount(),
        }
      });
    });
}

export const sendRoundStartEvent = async () => {
  // Early validation - check balance before making any WebSocket calls
  if (GlobalState.getStakeAmount() > GlobalState.getBalance()) {
    if (typeof window.openLowBalancePopup === 'function') {
      window.openLowBalancePopup();
    }
    console.log('Low balance popup triggered - stopping game initialization');
    return false; // Return false to indicate failure
  }

  const ws = WebSocketService.getInstance();
  console.log('Starting round...');
  return new Promise((resolve, reject) => {
    const handleResponse = async (res: any) => {
      if (res?.status === '200 OK') {
        GlobalState.setRoundId(res.roundId);
        console.log('✅ Round started successfully, now placing bet...', res);

        try {
          // Wait for bet placement to complete
          await sendPlaceBetEvent();
          resolve(res);
        } catch (betError) {
          console.error('❌ Bet placement failed after round start:', betError);
          reject(new Error(betError));
        }
      } else {
        console.error('❌ Failed to start round:', res);
        reject(new Error(res));
      }
    };
    ws.once('mines_round_start', handleResponse);
    ws.send('mines_round_start', {
      operation: 'mines_round_start',
      data: {
        eventType: 'round_start',
        tableId: GlobalState.getTableId(),
      }
    });
  });
}
      
