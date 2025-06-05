document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    registerServiceWorker();

    // Load initial selections
    const selections = stateManager.loadNusachSelection();
    uiManager.populateNusachDropdowns(AVAILABLE_NUSACHIM, selections.personal, selections.community);
    
    // Set initial view
    uiManager.showView('main-menu-view');

    // Event Listeners for Main Menu Prayer Buttons
    document.getElementById('shacharit-btn').addEventListener('click', () => selectPrayer('shacharit'));
    document.getElementById('mincha-btn').addEventListener('click', () => selectPrayer('mincha'));
    // Add more prayer button listeners here if new prayers are added

    // Event Listeners for Nusach Selection View
    uiManager.personalNusachSelect.addEventListener('change', (event) => {
        stateManager.saveNusachSelection(event.target.value, uiManager.communityNusachSelect.value);
    });
    uiManager.communityNusachSelect.addEventListener('change', (event) => {
        stateManager.saveNusachSelection(uiManager.personalNusachSelect.value, event.target.value);
    });

    document.getElementById('start-prayer-btn').addEventListener('click', handleStartPrayer);
    document.getElementById('back-to-main-menu-from-nusach-btn').addEventListener('click', () => {
        uiManager.showView('main-menu-view');
    });


    // Event Listener for Prayer Display View
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        uiManager.clearPrayerContent(); // Clear content when going back
        uiManager.displayPrayerTitle(''); // Clear title
        uiManager.showView('main-menu-view');
    });
}

function selectPrayer(prayerId) {
    stateManager.currentPrayerId = prayerId;
    // Refresh nusach dropdowns with currently selected values, in case they changed
    const selections = stateManager.loadNusachSelection(); // re-load to ensure current selections are up-to-date
    uiManager.populateNusachDropdowns(AVAILABLE_NUSACHIM, selections.personal, selections.community);
    uiManager.showView('nusach-selection-view');
}

async function handleStartPrayer() {
    uiManager.showLoading(true);
    uiManager.hideError(); // Clear previous errors
    uiManager.showView('prayer-display-view');

    const prayerId = stateManager.currentPrayerId;
    const personalNusachId = stateManager.selectedPersonalNusach;
    const communityNusachId = stateManager.selectedCommunityNusach;

    if (!prayerId || !personalNusachId || !communityNusachId) {
        uiManager.displayError("Prayer, personal nusach, or community nusach not selected.");
        uiManager.showLoading(false);
        uiManager.showView('nusach-selection-view'); // Go back to selection
        return;
    }

    const prayerData = await dataLoader.loadPrayerData(prayerId, personalNusachId, communityNusachId);

    if (prayerData) {
        const prayerDefinition = PRAYER_DEFINITIONS.find(p => p.id === prayerId);
        uiManager.displayPrayerTitle(prayerDefinition ? prayerDefinition.name : 'Prayer');
        prayerEngine.renderPrayer(prayerData);
    } else {
        // Error message should have been shown by dataLoader
        // Optionally, navigate back or show a more prominent error UI
        // uiManager.showView('nusach-selection-view'); // Or main menu
    }
    uiManager.showLoading(false);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}