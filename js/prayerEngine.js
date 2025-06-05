const prayerEngine = {
    renderPrayer(prayerData) {
        uiManager.clearPrayerContent();
        const { templateData, personalNusachData, communityNusachData } = prayerData;

        if (!templateData || !templateData.length) {
            uiManager.displayError("Prayer template is empty or invalid.");
            console.error("Prayer template is empty or invalid:", templateData);
            return;
        }
        if (!personalNusachData) {
            uiManager.displayError("Personal Nusach data is missing.");
            console.error("Personal Nusach data is missing:", personalNusachData);
            return;
        }
         if (!communityNusachData) {
            uiManager.displayError("Community Nusach data is missing.");
            console.error("Community Nusach data is missing:", communityNusachData);
            return;
        }

        for (const unit of templateData) {
            // unit.unit_id should now match keys like "modeh ani"
            const personalTextArray = personalNusachData[unit.unit_id]; // This is now an array of strings or undefined
            const communityTextArray = communityNusachData[unit.unit_id]; // This is now an array of strings or undefined
            
            const elementsToAppend = this.applyDisplayRule(unit, personalTextArray, communityTextArray);
            
            if (elementsToAppend && elementsToAppend.length > 0) {
                elementsToAppend.forEach(el => uiManager.appendPrayerSegment(el));
            }
        }
    },

    applyDisplayRule(unit, pTextArray, cTextArray) {
        const elements = [];

        // Join array segments into a single HTML string for rendering.
        // If an array is undefined or empty, the joined text will be undefined or an empty string.
        const pJoinedText = pTextArray && pTextArray.length > 0 ? pTextArray.join('<br>') : undefined;
        const cJoinedText = cTextArray && cTextArray.length > 0 ? cTextArray.join('<br>') : undefined;

        // Helper to create a styled text element from a joined string
        const createTextElement = (textString, baseClass, ...additionalClasses) => {
            if (!textString) return null; // if undefined or empty string after join
            const div = document.createElement('div');
            div.className = `text-segment ${baseClass} ${additionalClasses.join(' ')}`.trim();
            div.innerHTML = textString; // textString is already HTML (joined with <br>)
            return div;
        };

        switch (unit.display_rule) {
            case "personal_only":
                if (pJoinedText) elements.push(createTextElement(pJoinedText, 'personal-text', 'personal-only-text'));
                break;

            case "community_only":
                if (cJoinedText) elements.push(createTextElement(cJoinedText, 'community-text', 'community-only-text'));
                break;

            case "hybrid_default_personal":
                // Compare the content of the arrays for equality, not just the joined string,
                // to be more robust if one is undefined and the other an empty array leading to similar joined strings.
                // However, for simplicity with joined strings:
                if (pJoinedText && cJoinedText && pJoinedText === cJoinedText) {
                    elements.push(createTextElement(pJoinedText, 'common-text'));
                } else if (pJoinedText) {
                    elements.push(createTextElement(pJoinedText, 'personal-text'));
                } else if (cJoinedText) {
                    elements.push(createTextElement(cJoinedText, 'community-text', 'community-as-default-text'));
                }
                break;

            case "hybrid_default_community":
                if (pJoinedText && cJoinedText && pJoinedText === cJoinedText) {
                    elements.push(createTextElement(cJoinedText, 'common-text'));
                } else if (cJoinedText) {
                    elements.push(createTextElement(cJoinedText, 'community-text'));
                } else if (pJoinedText) {
                    elements.push(createTextElement(pJoinedText, 'personal-text', 'personal-as-default-text'));
                }
                break;

            case "show_both_highlight_differences":
                if (pJoinedText && cJoinedText && pJoinedText !== cJoinedText) {
                    const container = document.createElement('div');
                    container.className = 'text-segment conflicting-text-block';
                    
                    const pDiv = document.createElement('div');
                    pDiv.className = 'conflicting-text-personal personal-text';
                    pDiv.innerHTML = `<strong>Personal:</strong><br>${pJoinedText}`; // Added <br> for clarity
                    container.appendChild(pDiv);
                    
                    const cDiv = document.createElement('div');
                    cDiv.className = 'conflicting-text-community community-text';
                    cDiv.innerHTML = `<strong>Community:</strong><br>${cJoinedText}`; // Added <br> for clarity
                    container.appendChild(cDiv);
                    elements.push(container);

                } else if (pJoinedText && cJoinedText && pJoinedText === cJoinedText) { 
                    elements.push(createTextElement(pJoinedText, 'common-text'));
                } else if (pJoinedText) { 
                    elements.push(createTextElement(pJoinedText, 'personal-text', 'personal-only-text'));
                } else if (cJoinedText) { 
                    elements.push(createTextElement(cJoinedText, 'community-text', 'community-only-text'));
                }
                break;

            case "always_personal":
                if (pJoinedText) elements.push(createTextElement(pJoinedText, 'personal-text'));
                break;

            case "always_community":
                if (cJoinedText) elements.push(createTextElement(cJoinedText, 'community-text'));
                break;

            default:
                console.warn(`Unknown display_rule: ${unit.display_rule} for unit_id: ${unit.unit_id}`);
                if (pJoinedText) elements.push(createTextElement(pJoinedText, 'personal-text'));
                else if (cJoinedText) elements.push(createTextElement(cJoinedText, 'community-text'));
        }
        return elements;
    }
};