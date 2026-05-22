// src/services/db.js

const OFFLINE_ACTIONS = [
    'addTrial', 'createTrialRecord', 'updateTrialRecord', 'updateTrialStatus',
    'addFormulation', 'addIngredient', 'finalizeTrial', 'addBatchTrials',
    'updateProject', 'addBlock'
];

export async function apiCall(action, payload = {}, showOverlay = true, getAppState) {
    const state = getAppState ? getAppState() : null;

    if (!state || !state.settings || !state.settings.scriptUrl) {
        console.warn('API call attempted without proper state/settings configured:', action);
        return { _errType: 'config', message: 'Application settings not configured.' };
    }

    const queueItem = (errType, msg) => {
        if (OFFLINE_ACTIONS.includes(action)) {
            const queuedAction = {
                id: Date.now().toString(),
                action: action,
                payload: payload,
                timestamp: new Date().toISOString(),
                status: 'pending',
                attempts: 0
            };
            return { success: true, offline: true, _queuedAction: queuedAction, ...payload };
        }
        return { _errType: errType, message: msg };
    };

    const isOnline = getAppState().isOnline !== false;
    if (!isOnline) {
        return queueItem('network', 'Offline');
    }

    const getEffectiveFolderId = () => {
        if (state.auth && state.auth.user && state.auth.user.personalDriveFolderId) {
            return state.auth.user.personalDriveFolderId;
        }
        return state.settings.folderId;
    };

    if (window.google && window.google.script && typeof window.google.script.run === 'object') {
        return new Promise((resolve) => {
            if (showOverlay) if(getAppState().platformAdapter?.showLoading) getAppState().platformAdapter.showLoading(true);
            try {
                const fullPayload = {
                    ...payload,
                    spreadsheetId: state.settings.sheetId,
                    folderId: getEffectiveFolderId(),
                    auth: state.auth
                };
                window.google.script.run
                    .withSuccessHandler((response) => resolve(response))
                    .withFailureHandler((error) => resolve(queueItem('server', error?.message || String(error))))
                    .handleRequest({ action, payload: fullPayload });
            } catch (err) {
                resolve(queueItem('client', err?.message || String(err)));
            } finally {
                if (showOverlay) if(getAppState().platformAdapter?.showLoading) getAppState().platformAdapter.showLoading(false);
            }
        });
    }

    if (showOverlay) if(getAppState().platformAdapter?.showLoading) getAppState().platformAdapter.showLoading(true);

    try {
        const fullPayload = {
            ...payload,
            spreadsheetId: state.settings.sheetId,
            folderId: getEffectiveFolderId()
        };
        const res = await fetch(String(state.settings.scriptUrl).replace(/\s/g, ''), {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, payload: fullPayload, auth: state.auth }),
        });

        if (!res.ok) return queueItem('network', `HTTP ${res.status}: ${res.statusText}`);

        const text = await res.text();
        let result;
        try { result = JSON.parse(text); } catch (e) { return { _errType: 'parse', message: "Invalid JSON from server" }; }

        const errorMsg = result.message || (result.data && result.data.message);
        const isError = result.status === 'error' || (result.data && result.data.status === 'error') || result.success === false || (result.data && result.data.success === false);

        if (isError) return { _errType: 'server', message: errorMsg || 'Unknown server error' };

        return result.data !== undefined ? result.data : result;
    } catch (error) {
        return queueItem('fetch', error.message);
    } finally {
        if (showOverlay) if(getAppState().platformAdapter?.showLoading) getAppState().platformAdapter.showLoading(false);
    }
}

export const getTrials = (payload, getAppState) => apiCall('getTrials', payload, true, getAppState);
export const addTrial = (payload, getAppState) => apiCall('addTrial', payload, true, getAppState);
export const updateTrial = (payload, getAppState) => apiCall('updateTrialRecord', payload, true, getAppState);
export const deleteTrial = (payload, getAppState) => apiCall('deleteTrialRecord', payload, true, getAppState);
export const getProjects = (payload, getAppState) => apiCall('getProjects', payload, true, getAppState);
export const addProject = (payload, getAppState) => apiCall('addProject', payload, true, getAppState);
export const updateProject = (payload, getAppState) => apiCall('updateProject', payload, true, getAppState);
export const addBlock = (payload, getAppState) => apiCall('addBlock', payload, true, getAppState);
export const addFormulation = (payload, getAppState) => apiCall('addFormulation', payload, true, getAppState);
export const addIngredient = (payload, getAppState) => apiCall('addIngredient', payload, true, getAppState);
export const finalizeTrial = (payload, getAppState) => apiCall('finalizeTrial', payload, true, getAppState);
export const addBatchTrials = (payload, getAppState) => apiCall('addBatchTrials', payload, true, getAppState);
export const updateTrialStatus = (payload, getAppState) => apiCall('updateTrialStatus', payload, true, getAppState);
export const upsertEmbedding = (payload, getAppState) => apiCall('upsertEmbedding', payload, true, getAppState);
export const loadSmartIndex = (payload, getAppState) => apiCall('loadSmartIndex', payload, true, getAppState);
export const clearSmartEmbeddings = (payload, getAppState) => apiCall('clearSmartEmbeddings', payload, true, getAppState);

export const getFormulations = (payload, getAppState) => apiCall('getFormulations', payload, true, getAppState);
export const deleteFormulation = (payload, getAppState) => apiCall('deleteFormulation', payload, true, getAppState);
export const getIngredients = (payload, getAppState) => apiCall('getIngredients', payload, true, getAppState);
export const deleteIngredient = (payload, getAppState) => apiCall('deleteIngredient', payload, true, getAppState);
export const getOrganisations = (payload, getAppState) => apiCall('getOrganisations', payload, true, getAppState);
export const addOrganisation = (payload, getAppState) => apiCall('addOrganisation', payload, true, getAppState);
export const deleteOrganisation = (payload, getAppState) => apiCall('deleteOrganisation', payload, true, getAppState);
export const deleteProject = (payload, getAppState) => apiCall('deleteProject', payload, true, getAppState);

export const loginUser = (payload, getAppState) => apiCall('login', payload, true, getAppState);
export const getUsers = (payload, getAppState) => apiCall('getUsersList', payload, true, getAppState);
export const updateUser = (payload, getAppState) => apiCall('adminUpdateUserConfig', payload, true, getAppState);
