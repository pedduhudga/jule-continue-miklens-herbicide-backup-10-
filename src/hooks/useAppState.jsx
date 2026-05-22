import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const initialState = {
  auth: {
    user: null,
    token: null
  },
  currentPage: 'dashboard',
  ingredients: [],
  formulations: [],
  trials: [],
  organisations: [],
  projects: [],
  blocks: [],
  selectedTrials: [],
  photoQueue: [],
  croppedPhotosData: [],
  photoDeletionRequested: false,
  currentTrialIdForCamera: null,
  cameraMode: 'general',
  aiChatHistory: [],
  aiAttachedImage: { fileData: null, mimeType: null },
  settings: {
    apiKeys: [],
    currentApiKeyIndex: 0,
    scriptUrl: '',
    sheetId: '',
    folderId: '',
    autoAnalyzePhotos: true,
    openWeatherMapKey: '',
    agAnalyticsKey: '',
    qrCodeFields: { FormulationName: true, InvestigatorName: true, Date: true, Dosage: true, Location: false, Result: false, WeedSpecies: false, Weather: false },
    qrOnlineFields: { showInvestigator: true, showDate: true, showLocation: true, showDosage: true, showWeedSpecies: true, showResult: true, showWeather: true, showIngredients: false, showConclusion: true, showPhotos: true }
  },
  charts: {},
  efficacyDataForModal: [],
  bulkAnalysisState: {
    isRunning: false,
    isPaused: false,
    lastProcessedIndex: -1,
    trialsToProcess: [],
    totalToProcess: 0
  },
  backgroundQueue: new Map(),
  syncQueue: [],
  aiQueue: [],
  isAiQueueRunning: false,
  filterState: {
    search: '',
    formulationText: '',
    formulation: '',
    startDate: '',
    endDate: '',
    sortBy: 'date'
  },
  userAdminFilters: {
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'updated-desc'
  },
  userAdminTestResults: {},
  pendingUserBackupImportUserId: null
};

const AppStateContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      return { ...state, settings: newSettings };
    }
    case 'SET_AUTH':
      return { ...state, auth: { ...state.auth, ...action.payload } };
    case 'LOGOUT':
      return { ...state, auth: { user: null, token: null } };
    case 'SET_SYNC_QUEUE':
      localStorage.setItem('syncQueue', JSON.stringify(action.payload));
      return { ...state, syncQueue: action.payload };
    case 'ADD_SYNC_ITEM': {
      const newQueue = [...state.syncQueue, action.payload];
      localStorage.setItem('syncQueue', JSON.stringify(newQueue));
      return { ...state, syncQueue: newQueue };
    }
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        dispatch({ type: 'SET_STATE', payload: { settings: JSON.parse(savedSettings) } });
      }

      const savedSyncQueue = localStorage.getItem('syncQueue');
      if (savedSyncQueue) {
        dispatch({ type: 'SET_STATE', payload: { syncQueue: JSON.parse(savedSyncQueue) } });
      }
    } catch (e) {
      console.error('Failed to parse local storage data', e);
    }
  }, []);

  const updateState = useCallback((payload) => {
    dispatch({ type: 'SET_STATE', payload });
  }, []);

  const updateSettings = useCallback((payload) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload });
  }, []);

  const getAppState = useCallback(() => state, [state]);

  const value = {
    state,
    dispatch,
    updateState,
    updateSettings,
    getAppState
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
