const dataLoader = {
    async fetchJson(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch or parse JSON from ${filePath}:`, error);
            uiManager.displayError(`Failed to load data from ${filePath}. Please check your connection or try again.`);
            return null; // Return null to indicate failure
        }
    },

    async loadPrayerData(prayerId, personalNusachId, communityNusachId) {
        uiManager.showLoading(true);
        uiManager.hideError();

        const prayerDefinition = PRAYER_DEFINITIONS.find(p => p.id === prayerId);
        if (!prayerDefinition) {
            console.error(`Prayer definition not found for ID: ${prayerId}`);
            uiManager.displayError(`Prayer definition for ${prayerId} not found.`);
            uiManager.showLoading(false);
            return null;
        }

        const templatePath = prayerDefinition.template;
        const personalNusachPath = `data/nusachim/${personalNusachId}.json`;
        const communityNusachPath = `data/nusachim/${communityNusachId}.json`;

        try {
            const [templateData, personalNusachData, communityNusachData] = await Promise.all([
                this.fetchJson(templatePath),
                this.fetchJson(personalNusachPath),
                this.fetchJson(communityNusachPath)
            ]);

            // Check if any fetch failed (fetchJson returns null on error)
            if (templateData === null || personalNusachData === null || communityNusachData === null) {
                // Error message is already displayed by fetchJson
                uiManager.showLoading(false);
                return null;
            }
            
            uiManager.showLoading(false);
            return { templateData, personalNusachData, communityNusachData };

        } catch (error) { // Catch any unexpected error from Promise.all itself
            console.error("Error in loadPrayerData Promise.all:", error);
            uiManager.displayError("An unexpected error occurred while loading prayer data.");
            uiManager.showLoading(false);
            return null;
        }
    }
};