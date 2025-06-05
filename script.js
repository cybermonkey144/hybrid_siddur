document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let currentPrayer = null; // e.g., 'shacharit'
    let personalNusach = null;
    let communityNusach = null;
    let prayerDataCache = {}; // To cache loaded JSON files (templates and nusachim)

    // --- Configuration ---
    const supportedNusachim = [
        { id: 'ashkenaz', name: 'Ashkenaz' },
        { id: 'sefard', name: 'Sefard' },
        { id: 'edot_hamizrach', name: 'Edot HaMizrach (Sefaradi)' }
        // Add more Nusachim here
    ];

    const prayerTemplates = {
        'shacharit': 'data/templates/shacharit_template.json',
        'mincha': 'data/templates/mincha_template.json',
        'maariv': 'data/templates/maariv_template.json'
        // Add more prayers here
    };

    // --- UI Element References ---
    const views = {
        mainMenu: document.getElementById('main-menu-view'),
        nusachSelection: document.getElementById('nusach-selection-view'),
        prayerDisplay: document.getElementById('prayer-display-view')
    };
    const prayerSelectionMenu = document.getElementById('prayer-selection-menu');
    const personalNusachSelect = document.getElementById('personal-nusach-select');
    const communityNusachSelect = document.getElementById('community-nusach-select');
    const startPrayerButton = document.getElementById('start-prayer-button');
    const prayerContentArea = document.getElementById('prayer-content-area');
    const currentPrayerTitle = document.getElementById('current-prayer-title');
    const backToMenuButtons = document.querySelectorAll('.back-to-menu-button');


    // --- Initialization ---
    function init() {
        populateNusachDropdowns();
        setupEventListeners();
        navigateTo('mainMenu'); // Start at the main menu
    }

    function populateNusachDropdowns() {
        supportedNusachim.forEach(nusach => {
            const optionPersonal = new Option(nusach.name, nusach.id);
            const optionCommunity = new Option(nusach.name, nusach.id);
            personalNusachSelect.add(optionPersonal);
            communityNusachSelect.add(optionCommunity);
        });
        // Set default selections if desired
        if (supportedNusachim.length > 0) {
            personalNusachSelect.value = supportedNusachim[0].id;
            communityNusachSelect.value = supportedNusachim[0].id;
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Prayer selection buttons (if dynamically generated, use event delegation on prayerSelectionMenu)
        document.querySelectorAll('#prayer-selection-menu button').forEach(button => {
            button.addEventListener('click', (event) => {
                currentPrayer = event.target.dataset.prayer;
                navigateTo('nusachSelection');
            });
        });

        startPrayerButton.addEventListener('click', () => {
            personalNusach = personalNusachSelect.value;
            communityNusach = communityNusachSelect.value;
            if (currentPrayer && personalNusach && communityNusach) {
                displayPrayer();
                navigateTo('prayerDisplay');
            } else {
                alert("Please select a prayer and both Nusachim.");
            }
        });

        backToMenuButtons.forEach(button => {
            button.addEventListener('click', () => {
                prayerContentArea.innerHTML = ''; // Clear previous prayer
                currentPrayerTitle.textContent = '';
                navigateTo('mainMenu');
            });
        });
    }

    // --- Navigation ---
    function navigateTo(viewName) {
        Object.values(views).forEach(view => view.classList.remove('active-view'));
        if (views[viewName]) {
            views[viewName].classList.add('active-view');
        }
    }

    // --- Data Fetching ---
    async function fetchData(url) {
        if (prayerDataCache[url]) {
            return prayerDataCache[url];
        }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            }
            const data = await response.json();
            prayerDataCache[url] = data; // Cache the fetched data
            return data;
        } catch (error) {
            console.error("Failed to fetch data:", error);
            prayerContentArea.innerHTML = `<p class="error">Error loading prayer data: ${error.message}. Please try again later.</p>`;
            return null; // Or an empty array/object as appropriate
        }
    }

    // --- Core Prayer Rendering Logic ---
    async function displayPrayer() {
        if (!currentPrayer || !personalNusach || !communityNusach) return;

        currentPrayerTitle.textContent = currentPrayer.charAt(0).toUpperCase() + currentPrayer.slice(1); // Simple title
        prayerContentArea.innerHTML = '<p>Loading prayer...</p>'; // Loading indicator

        const templatePath = prayerTemplates[currentPrayer];
        const nusachPersonalPath = `data/nusachim/${personalNusach}.json`;
        const nusachCommunityPath = `data/nusachim/${communityNusach}.json`;

        try {
            // Fetch all necessary data in parallel
            const [template, personalTexts, communityTexts] = await Promise.all([
                fetchData(templatePath),
                fetchData(nusachPersonalPath),
                fetchData(nusachCommunityPath)
            ]);

            if (!template || !personalTexts || !communityTexts) {
                 prayerContentArea.innerHTML = `<p class="error">Could not load all necessary prayer data. One or more files might be missing or malformed.</p>`;
                 return;
            }

            renderPrayerContent(template, personalTexts, communityTexts);

        } catch (error) {
            console.error("Error processing prayer:", error);
            prayerContentArea.innerHTML = `<p class="error">An error occurred while preparing the prayer: ${error.message}</p>`;
        }
    }

    function renderPrayerContent(template, personalTexts, communityTexts) {
        prayerContentArea.innerHTML = ''; // Clear loading message or previous content

        template.forEach(unit => {
            const unitDiv = document.createElement('div');
            unitDiv.classList.add('prayer-unit');
            unitDiv.setAttribute('data-unit-id', unit.unit_id); // For debugging or advanced features

            // Optional: Display section name (if you want it in the UI)
            if (unit.section_name) {
                const sectionHeader = document.createElement('h4');
                sectionHeader.classList.add('section-name-header');
                sectionHeader.textContent = unit.section_name;
                // unitDiv.appendChild(sectionHeader); // Uncomment to display
            }

            let textToDisplay = null;
            let appliedRule = unit.display_rule; // For clarity in debugging if needed

            const pText = personalTexts[unit.unit_id];
            const cText = communityTexts[unit.unit_id];

            switch (unit.display_rule) {
                case 'personal':
                    textToDisplay = pText;
                    if (textToDisplay) unitDiv.classList.add('personal-text');
                    break;
                case 'community':
                    textToDisplay = cText;
                    if (textToDisplay) unitDiv.classList.add('community-text');
                    break;
                case 'hybrid_default_personal':
                    if (pText && cText && pText === cText) {
                        textToDisplay = pText; // Texts are identical
                        unitDiv.classList.add('personal-text'); // Or a generic 'shared-text' class
                    } else if (pText && cText && pText !== cText) {
                        textToDisplay = pText; // Personal text preferred when different
                        unitDiv.classList.add('personal-text');
                        // Optionally, indicate that community text is different but not shown,
                        // or implement a toggle later.
                    } else if (pText && !cText) {
                        textToDisplay = pText;
                        unitDiv.classList.add('personal-only');
                    } else if (!pText && cText) {
                        textToDisplay = cText;
                        unitDiv.classList.add('community-only');
                    }
                    // If neither exists, textToDisplay remains null.
                    break;
                default:
                    console.warn(`Unknown display_rule: ${unit.display_rule} for unit_id: ${unit.unit_id}`);
                    textToDisplay = `Error: Unknown display rule '${unit.display_rule}'.`;
                    unitDiv.classList.add('error-text');
            }

            if (textToDisplay) {
                // Sanitize text before inserting if it can contain HTML, though for prayer texts it usually won't.
                // For simplicity, assuming plain text. If HTML is needed, use careful sanitization.
                const paragraph = document.createElement('p');
                paragraph.textContent = textToDisplay;
                unitDiv.appendChild(paragraph);
            } else {
                // Handle cases where no text is available based on the rules (e.g., a unit is truly omitted)
                // unitDiv.innerHTML = `<p class="omitted-text"><i>Section omitted or not applicable.</i></p>`;
                // Or simply don't append the unitDiv if you want to hide empty sections.
                // For now, let's skip adding empty sections to the DOM.
                return; // Skip appending this unitDiv
            }
            prayerContentArea.appendChild(unitDiv);
        });
    }

    // --- PWA Setup (Conceptual - Service Worker Registration) ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    }

    // --- Start the App ---
    init();
    registerServiceWorker(); // Call PWA registration
});