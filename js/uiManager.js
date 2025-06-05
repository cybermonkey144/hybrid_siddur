const uiManager = {
    appContainer: document.getElementById('app-container'),
    mainMenuView: document.getElementById('main-menu-view'),
    nusachSelectionView: document.getElementById('nusach-selection-view'),
    prayerDisplayView: document.getElementById('prayer-display-view'),
    prayerTitleEl: document.getElementById('prayer-title'),
    prayerContentEl: document.getElementById('prayer-content'),
    loadingIndicator: document.getElementById('loading-indicator'),
    personalNusachSelect: document.getElementById('personal-nusach-select'),
    communityNusachSelect: document.getElementById('community-nusach-select'),
    errorMessageArea: document.getElementById('error-message-area'),

    showView(viewId) {
        [this.mainMenuView, this.nusachSelectionView, this.prayerDisplayView].forEach(view => {
            if (view) view.classList.add('hidden');
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        } else {
            console.error(`View with ID ${viewId} not found.`);
            this.displayError(`View with ID ${viewId} not found.`);
        }
    },

    populateNusachDropdowns(nusachimList, selectedPersonal, selectedCommunity) {
        this.personalNusachSelect.innerHTML = ''; // Clear existing options
        this.communityNusachSelect.innerHTML = ''; // Clear existing options

        nusachimList.forEach(nusach => {
            const optionPersonal = document.createElement('option');
            optionPersonal.value = nusach.id;
            optionPersonal.textContent = nusach.name;
            if (nusach.id === selectedPersonal) optionPersonal.selected = true;
            this.personalNusachSelect.appendChild(optionPersonal);

            const optionCommunity = document.createElement('option');
            optionCommunity.value = nusach.id;
            optionCommunity.textContent = nusach.name;
            if (nusach.id === selectedCommunity) optionCommunity.selected = true;
            this.communityNusachSelect.appendChild(optionCommunity);
        });
    },

    displayPrayerTitle(title) {
        this.prayerTitleEl.textContent = title;
    },

    clearPrayerContent() {
        this.prayerContentEl.innerHTML = '';
        this.hideError(); // Clear any previous errors
    },

    appendPrayerSegment(element) {
        if (element) { // Ensure element is not null or undefined
            this.prayerContentEl.appendChild(element);
        }
    },

    showLoading(isLoading) {
        this.loadingIndicator.classList.toggle('hidden', !isLoading);
    },

    displayError(message) {
        this.errorMessageArea.textContent = message;
        this.errorMessageArea.classList.remove('hidden');
        // Optionally hide after some time or provide a close button
    },

    hideError() {
        this.errorMessageArea.classList.add('hidden');
        this.errorMessageArea.textContent = '';
    }
};