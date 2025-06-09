
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
  }, [currentIndex, initialState]); // `initialState` is stable. `currentIndex` is the dependency.

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    // Check against the current history state length directly in the updater
    // to ensure it's based on the most up-to-date history.
    setHistory(currentHistory => {
        if (currentIndex < currentHistory.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
        return currentHistory;
    });
  }, [currentIndex]);

  const currentState = history[currentIndex]?.state;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const resetHistory = useCallback((newState: ApplicationState) => { // Changed to ApplicationState
    setHistory([{ state: newState, timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  // updateCurrentState is used to modify the current history entry without adding a new one.
  // This is typically for non-undoable changes or transient state updates.
  const updateCurrentState = useCallback((updater: (prevState: ApplicationState) => ApplicationState) => { // Changed to ApplicationState
    setHistory(prevHistory => {
        const newHistory = [...prevHistory];
        if (newHistory[currentIndex]) { // Ensure the current index is valid
            const updatedState = updater(newHistory[currentIndex].state);
            newHistory[currentIndex] = {state: updatedState, timestamp: Date.now()}; // Update timestamp
        }
        return newHistory;
    });
  }, [currentIndex]);


  return { currentState, recordChange, undo, redo, canUndo, canRedo, resetHistory, updateCurrentState, history };
};
