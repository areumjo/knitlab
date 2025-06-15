import { useState, useCallback } from 'react';
import { ApplicationState, HistoryEntry } from '../types';
import { MAX_HISTORY_LENGTH } from '../constants';

export const useChartHistory = (initialState: ApplicationState) => {
  const [history, setHistory] = useState<HistoryEntry<ApplicationState>[]>([{ state: initialState, timestamp: Date.now() }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const recordChange = useCallback((newStateOrUpdater: ApplicationState | ((prevState: ApplicationState) => ApplicationState)) => {
    // `currentIndex` (from the hook's state) captured here is the index to branch from.
    const branchAtIndex = currentIndex;

    setHistory(prevHistory => {
      // Determine the state to base the new change on.
      const stateBeforeUpdate = prevHistory[branchAtIndex]?.state ?? initialState;

      // Calculate the new state.
      const newState = typeof newStateOrUpdater === 'function'
        ? (newStateOrUpdater as ((prevState: ApplicationState) => ApplicationState))(stateBeforeUpdate)
        : newStateOrUpdater;

      const newEntry = { state: newState, timestamp: Date.now() };

      // Create the new history array.
      const historyToKeep = prevHistory.slice(0, branchAtIndex + 1);
      let updatedHistory = [...historyToKeep, newEntry];

      // Handle history length limit.
      if (updatedHistory.length > MAX_HISTORY_LENGTH) {
        updatedHistory = updatedHistory.slice(updatedHistory.length - MAX_HISTORY_LENGTH);
      }

      // After `setHistory` schedules its update, `setCurrentIndex` will also be scheduled.
      // React batches these. The new index will be the last item of the `updatedHistory`.
      setCurrentIndex(updatedHistory.length - 1);

      return updatedHistory;
    });
  }, [currentIndex, initialState]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history.length]);

  const currentState = history[currentIndex]?.state;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const resetHistory = useCallback((newState: ApplicationState) => {
    setHistory([{ state: newState, timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  // This is typically for non-undoable changes or transient state updates.
  const updateCurrentState = useCallback((updater: (prevState: ApplicationState) => ApplicationState) => {
    setHistory(prevHistory => {
      // Safeguard: Ensure currentIndex is valid
      if (currentIndex < 0 || currentIndex >= prevHistory.length) {
        console.error(`Invalid currentIndex: ${currentIndex}. Cannot update state.`);
        return prevHistory; // Return the unchanged history
      }

      const newHistory = [...prevHistory];
      const updatedState = updater(newHistory[currentIndex].state);
      newHistory[currentIndex] = { state: updatedState, timestamp: Date.now() }; // Update timestamp

      return newHistory;
    });
  }, [currentIndex]);

  return { currentState, recordChange, undo, redo, canUndo, canRedo, resetHistory, updateCurrentState, history };
};
