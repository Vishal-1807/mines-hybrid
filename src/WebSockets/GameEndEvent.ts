import { GlobalState } from "../globals/gameState";
import { WebSocketService } from "./WebSocketService";
import { revealAllRemainingCells } from "./CellClickEvent";
import { hideGameButtons, showBetButton } from "../utils/gameButtonVisibilityManager";
import loadGridFromMatrix from "../components/Grid";

export const GameEndEvent = async (bombEnd: boolean = false) => {
  if(!GlobalState.getGameStarted?.()){
    console.warn('Game not started, cannot send cashout event');
    return;
  }
  // Wait for WebSocket to connect
  const ws = WebSocketService.getInstance();

  
  const handleResponse = async (res: any) => {
    if (res?.status === '200 OK') {
      // Hide game buttons and show bet button
      hideGameButtons();

      //set Congratulation text to GlobalState.getReward()
      if(!bombEnd){
        (window as any).winModal?.showModal(`You won: ${GlobalState.getReward()}`);
        setTimeout(() => {
          (window as any).winModal?.hideModal();
        }, 2000);
      }

      GlobalState.setGameMatrix(res.revealedMatrix); 
      // GlobalState.setGameStarted(false);
      // GlobalState.setBalance(res.balance);

      GlobalState.resetMinesClickedCount();

      // Reveal all remaining cells when cashout is successful
      // await revealAllRemainingCells();

      // showBetButton();

      console.log('✅ Round ended successfully', res);
    } else {
      console.error('❌ Failed to end round:', res);
    }
  };

  ws.once('mines_round_end', handleResponse);

  ws.send('mines_round_end', {
    operation: 'mines_round_end',
    data: {
      eventType: 'round_end',
      roundId: GlobalState.getRoundId(),
      tableId: GlobalState.getTableId(),
    }
  });
}