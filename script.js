// script.js
(function() {
    'use strict';

    // 0. Configuration / Constants
    const PRAYERS = [
        { id: 'shacharit', name: 'Shacharit (שחרית)', templateFile: 'shacharit_template.json' },
        { id: 'mincha', name: 'Mincha (מנחה)', templateFile: 'mincha_template.json' },
        { id: 'maariv', name: 'Maariv (מעריב)', templateFile: 'maariv_template.json' },
        // Example: { id: 'psukei_dezimra', name: 'Psukei D\'Zimra (פסוקי דזמרה)', templateFile: 'psukei_dezimra_template.json' },
    ];

    const NUSACHIM = [
        { id: 'ashkenaz', name: 'Ashkenaz (אשכנז)', dataFile: 'ashkenaz.json' },
        { id: 'sephard', name: 'Sephard (ספרד)', dataFile: 'sephard.json' },
        { id: 'edot_hamizrach', name: 'Edot HaMizrach (עדות המזרח)', dataFile: 'edot_hamizrach.json' },
        // Example: { id: 'ari', name: 'Ari (אר"י)', dataFile: 'ari.json' },
    ];

    const DATA_PATH_TEMPLATES = 'data/templates/';
    const DATA_PATH_NUSACHIM = 'data/nusachim/';

    // 1. DOM Element References
    const mainMenuNav = document.getElementById('main-menu-view');
    const nusachSelectionNav = document.getElementById('nusach-selection-view');
    const prayerDisplayNav = document.getElementById('prayer-display-view');

    const prayerListUl = document.getElementById('prayer-list');
    const personalNusachSelect = document.getElementById('personal-nusach-select');
    const communityNusachSelect = document.getElementById('community-nusach-select');
    const startPrayerBtn = document.getElementById('start-prayer-btn');
    const prayerContentArea = document.getElementById('prayer-content-area');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const selectedPrayerTitle = document.getElementById('selected-prayer-title');
    const prayerViewTitle = document.getElementById('prayer-view-title');


    // 2. State Variables
    let currentView = 'main-menu'; // 'main-menu', 'nusach-selection', 'prayer-display'
    let selectedPrayerId = null;
    let selectedPersonalNusachId = null;
    let selectedCommunityNusachId = null;

    // 3. View Management Functions
    function showView(viewName) {
        mainMenuNav.style.display = 'none';
        nusachSelectionNav.style.display = 'none';
        prayerDisplayNav.style.display = 'none';
        backToMenuBtn.style.display = 'none';

        currentView = viewName;

        if (viewName === 'main-menu') {
            mainMenuNav.style.display = 'block';
        } else if (viewName === 'nusach-selection') {
            nusachSelectionNav.style.display = 'block';
            backToMenuBtn.style.display = 'inline-block'; // or 'block'
        } else if (viewName === 'prayer-display') {
            prayerDisplayNav.style.display = 'block';
            backToMenuBtn.style.display = 'inline-block'; // or 'block'
        }
    }

    // 4. Data Fetching Functions
    async function fetchData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            prayerContentArea.innerHTML = `<p style="color:red;">Error loading data: ${error.message}. Please check console.</p>`;
            return null; // Or throw error to be caught by caller
        }
    }

    // 5. Core Logic / Rendering Functions
    function populatePrayerList() {
        prayerListUl.innerHTML = ''; // Clear existing
        PRAYERS.forEach(prayer => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = prayer.name;
            button.dataset.prayerId = prayer.id;
            button.addEventListener('click', handlePrayerSelection);
            li.appendChild(button);
            prayerListUl.appendChild(li);
        });
    }

    function populateNusachDropdowns() {
        [personalNusachSelect, communityNusachSelect].forEach(selectElement => {
            selectElement.innerHTML = ''; // Clear existing
            NUSACHIM.forEach(nusach => {
                const option = document.createElement('option');
                option.value = nusach.id;
                option.textContent = nusach.name;
                selectElement.appendChild(option);
            });
        });
        // Set default selections if desired, e.g., from localStorage
        if (NUSACHIM.length > 0) {
            personalNusachSelect.value = NUSACHIM[0].id;
            communityNusachSelect.value = NUSACHIM[0].id;
        }
    }

    async function renderPrayer() {
        if (!selectedPrayerId || !selectedPersonalNusachId || !selectedCommunityNusachId) {
            prayerContentArea.innerHTML = '<p>Error: Prayer or Nusach not selected.</p>';
            return;
        }

        prayerContentArea.innerHTML = '<p>Loading prayer...</p>'; // Loading indicator

        const prayerConfig = PRAYERS.find(p => p.id === selectedPrayerId);
        const personalNusachConfig = NUSACHIM.find(n => n.id === selectedPersonalNusachId);
        const communityNusachConfig = NUSACHIM.find(n => n.id === selectedCommunityNusachId);

        if (!prayerConfig || !personalNusachConfig || !communityNusachConfig) {
            prayerContentArea.innerHTML = '<p>Error: Invalid configuration.</p>';
            return;
        }

        const prayerTitle = prayerConfig.name;
        prayerViewTitle.textContent = prayerTitle;

        const [templateData, personalNusachData, communityNusachData] = await Promise.all([
            fetchData(DATA_PATH_TEMPLATES + prayerConfig.templateFile),
            fetchData(DATA_PATH_NUSACHIM + personalNusachConfig.dataFile),
            fetchData(DATA_PATH_NUSACHIM + communityNusachConfig.dataFile)
        ]);

        if (!templateData || !personalNusachData || !communityNusachData) {
            // Error already logged by fetchData, message shown in prayerContentArea
            return;
        }

        prayerContentArea.innerHTML = ''; // Clear loading message

        templateData.forEach(unit => {
            const unitId = unit.unit_id;
            const displayRule = unit.display_rule;
            const sectionName = unit.section_name;

            if (sectionName) {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'section-name-display';
                sectionDiv.textContent = sectionName;
                prayerContentArea.appendChild(sectionDiv);
            }

            const personalUnitText = personalNusachData[unitId];
            const communityUnitText = communityNusachData[unitId];
            let textToRender = '';
            let cssClass = 'hybrid-text'; // Default class

            switch (displayRule) {
                case 'personal':
                    textToRender = personalUnitText;
                    if (personalUnitText && personalUnitText !== communityUnitText) {
                        cssClass = 'personal-only';
                    }
                    break;
                case 'community':
                    textToRender = communityUnitText;
                    if (communityUnitText && communityUnitText !== personalUnitText) {
                        cssClass = 'community-only';
                    }
                    break;
                case 'hybrid_default_personal':
                    if (personalUnitText) {
                        textToRender = personalUnitText;
                        if (personalUnitText !== communityUnitText) {
                             cssClass = 'personal-only';
                        } // else it's same, hybrid-text is fine
                    } else if (communityUnitText) {
                        textToRender = communityUnitText;
                        cssClass = 'community-only'; // Fallback to community, distinctly community
                    }
                    break;
                case 'hybrid_default_community':
                    if (communityUnitText) {
                        textToRender = communityUnitText;
                        if (communityUnitText !== personalUnitText) {
                            cssClass = 'community-only';
                        } // else it's same, hybrid-text is fine
                    } else if (personalUnitText) {
                        textToRender = personalUnitText;
                        cssClass = 'personal-only'; // Fallback to personal, distinctly personal
                    }
                    break;
                default:
                    textToRender = `Unknown rule: ${displayRule}`;
                    cssClass = 'error-text';
            }

            if (textToRender) {
                const unitDiv = document.createElement('div');
                unitDiv.className = `prayer-unit ${cssClass}`;
                unitDiv.textContent = textToRender; // Use textContent to prevent XSS from data
                prayerContentArea.appendChild(unitDiv);
            } else if (!sectionName) { // Avoid empty divs if only section name was present
                // Optionally log missing text for a unit if it's unexpected
                // console.warn(`No text found for unit_id: ${unitId} with rule: ${displayRule}`);
            }
        });
    }


    // 6. Event Handlers
    function handlePrayerSelection(event) {
        selectedPrayerId = event.target.dataset.prayerId;
        const prayer = PRAYERS.find(p => p.id === selectedPrayerId);
        if (prayer) {
            selectedPrayerTitle.textContent = `Select Nusach for ${prayer.name}`;
            showView('nusach-selection');
        }
    }

    function handleStartPrayer() {
        selectedPersonalNusachId = personalNusachSelect.value;
        selectedCommunityNusachId = communityNusachSelect.value;

        // Store choices (optional)
        // localStorage.setItem('personalNusach', selectedPersonalNusachId);
        // localStorage.setItem('communityNusach', selectedCommunityNusachId);

        renderPrayer();
        showView('prayer-display');
    }

    function handleBackToMenu() {
        if (currentView === 'prayer-display') {
            showView('nusach-selection');
        } else if (currentView === 'nusach-selection') {
            showView('main-menu');
        }
        // Optionally clear prayer content or reset selections here
        prayerContentArea.innerHTML = '';
    }

    // 7. Event Listener Setup
    function setupEventListeners() {
        if (startPrayerBtn) {
            startPrayerBtn.addEventListener('click', handleStartPrayer);
        } else {
            console.error("Start Prayer Button not found!");
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', handleBackToMenu);
        } else {
            console.error("Back to Menu Button not found!");
        }
        // Prayer list buttons have listeners added dynamically in populatePrayerList
    }

    // 8. Initialization Function (init)
    function init() {
        populatePrayerList();
        populateNusachDropdowns();
        setupEventListeners();
        showView('main-menu'); // Start at the main menu

        // Restore last choices (optional)
        // const savedPersonalNusach = localStorage.getItem('personalNusach');
        // const savedCommunityNusach = localStorage.getItem('communityNusach');
        // if (savedPersonalNusach) personalNusachSelect.value = savedPersonalNusach;
        // if (savedCommunityNusach) communityNusachSelect.value = savedCommunityNusach;
    }

    // 9. PWA Service Worker Registration
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    // Run init when DOM is ready and register Service Worker
    document.addEventListener('DOMContentLoaded', () => {
        init();
        registerServiceWorker();
    });

})();