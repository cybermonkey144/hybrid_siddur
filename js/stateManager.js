const stateManager = {
    currentPrayerId: null,
    selectedPersonalNusach: null,
    selectedCommunityNusach: null,

    saveNusachSelection(personalNusachId, communityNusachId) {
        this.selectedPersonalNusach = personalNusachId;
        this.selectedCommunityNusach = communityNusachId;
        try {
            localStorage.setItem('personalNusach', personalNusachId);
            localStorage.setItem('communityNusach', communityNusachId);
        } catch (e) {
            console.warn("Could not save Nusach selection to localStorage:", e);
        }
    },

    loadNusachSelection() {
        try {
            const personal = localStorage.getItem('personalNusach');
            const community = localStorage.getItem('communityNusach');
            if (personal) this.selectedPersonalNusach = personal;
            if (community) this.selectedCommunityNusach = community;

            // Set default if nothing stored or if stored value is no longer valid
            if (!this.selectedPersonalNusach && AVAILABLE_NUSACHIM.length > 0) {
                this.selectedPersonalNusach = AVAILABLE_NUSACHIM[0].id;
            }
            if (!this.selectedCommunityNusach && AVAILABLE_NUSACHIM.length > 0) {
                this.selectedCommunityNusach = AVAILABLE_NUSACHIM[0].id;
            }

        } catch (e) {
            console.warn("Could not load Nusach selection from localStorage:", e);
             // Set default if localStorage is inaccessible
            if (AVAILABLE_NUSACHIM.length > 0) {
                this.selectedPersonalNusach = this.selectedPersonalNusach || AVAILABLE_NUSACHIM[0].id;
                this.selectedCommunityNusach = this.selectedCommunityNusach || AVAILABLE_NUSACHIM[0].id;
            }
        }
        return {
            personal: this.selectedPersonalNusach,
            community: this.selectedCommunityNusach
        };
    }
};