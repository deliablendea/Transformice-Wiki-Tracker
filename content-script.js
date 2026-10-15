const TRACKER_CONFIG = {
    classTrackable: 'tfm-trackable',
    classOwned: 'tfm-owned',
    classHovered: 'tfm-hovered',
    storageValue: 'owned',
    hideSettingsKey: 'tfm_hide_mode'
};

const StorageService = {
    isOwned: async (id) => {
        try {
            const result = await chrome.storage.local.get(id);
            return result[id] === TRACKER_CONFIG.storageValue;
        } catch (error) {
            console.error('Failed to read item state:', error);
            return false;
        }
    },

    toggle: async (id, isOwned) => {
        try {
            if (isOwned) {
                await chrome.storage.local.set({
                    [id]: TRACKER_CONFIG.storageValue
                });
            } else {
                await chrome.storage.local.remove(id);
            }
        } catch (error) {
            console.error('Failed to update item state:', error);
        }
    }
};

const UIManager = {
    initControls: () => {
        const container = document.createElement('div');
        container.id = 'tfm-controls';

        const hideLabel = document.createElement('label');
        const hideCheckbox = document.createElement('input');
        hideCheckbox.type = 'checkbox';
        hideLabel.append(hideCheckbox, ' Hide collected');

        chrome.storage.local.get(TRACKER_CONFIG.hideSettingsKey).then((result) => {
            if (result[TRACKER_CONFIG.hideSettingsKey]) {
                hideCheckbox.checked = true;
                document.body.classList.add('tfm-hide-owned');
            }
        });

        hideCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            chrome.storage.local.set({ [TRACKER_CONFIG.hideSettingsKey]: isChecked });
            document.body.classList.toggle('tfm-hide-owned', isChecked);
        });

        const btnContainer = document.createElement('div');
        btnContainer.id = 'tfm-btn-container';

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export';
        exportBtn.onclick = async () => {
            const data = await chrome.storage.local.get(null);
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transformice_tracker_backup.json';
            a.click();
            URL.revokeObjectURL(url);
        };

        const importBtn = document.createElement('button');
        importBtn.textContent = 'Import';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        importBtn.onclick = () => fileInput.click();

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const importedData = JSON.parse(ev.target.result);
                    await chrome.storage.local.clear();
                    await chrome.storage.local.set(importedData);
                    alert('Progress imported successfully! Reloading page...');
                    location.reload();
                } catch (err) {
                    alert('Error: Invalid backup file.');
                }
            };
            reader.readAsText(file);
        };

        btnContainer.append(exportBtn, importBtn, fileInput);
        container.append(hideLabel, btnContainer);
        document.body.appendChild(container);
    },

    getLinkedElements: (itemId) =>
        document.querySelectorAll(
            `[data-track-id="${CSS.escape(itemId)}"]`
        ),

    updateOwnedState: (itemId, isOwned) => {
        UIManager.getLinkedElements(itemId).forEach((element) => {
            element.classList.toggle(
                TRACKER_CONFIG.classOwned,
                isOwned
            );
        });
    },

    updateHoverState: (itemId, isHovered) => {
        UIManager.getLinkedElements(itemId).forEach((element) => {
            element.classList.toggle(
                TRACKER_CONFIG.classHovered,
                isHovered
            );
        });
    },

    applyTracking: (element, itemId) => {
        element.classList.add(TRACKER_CONFIG.classTrackable);
        element.setAttribute('data-track-id', itemId);

        StorageService.isOwned(itemId).then((isOwned) => {
            UIManager.updateOwnedState(itemId, isOwned);
        });

        element.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isNowOwned = !(await StorageService.isOwned(itemId));

            await StorageService.toggle(itemId, isNowOwned);
            UIManager.updateOwnedState(itemId, isNowOwned);
        });

        element.addEventListener('mouseenter', () => {
            UIManager.updateHoverState(itemId, true);
        });

        element.addEventListener('mouseleave', () => {
            UIManager.updateHoverState(itemId, false);
        });
    }
};

const ItemCategorizer = {
    getType: (cell) => {
        if (!cell) {
            return 'general';
        }

        switch (cell.cellIndex) {
            case 0:
            case 1:
                return 'chest';
            case 2:
                return 'title';
            case 3:
                return 'badge';
            case 4:
                return 'orb';
            case 5:
                return 'shop';
            default:
                return 'item';
        }
    }
};

const ItemIdentifier = {
    normalize: (value) =>
        value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_'),

    create: (category, rawName) =>
        `${category}_${ItemIdentifier.normalize(rawName)}`
};

const ItemNameExtractor = {
    getName: (element, category) => {
        if (category === 'chest') {
            const row = element.closest('tr');
            const nameCell = row?.cells[1];

            return nameCell?.textContent.trim() || 'unknown';
        }

        if (element instanceof HTMLImageElement) {
            return (
                element.getAttribute('data-image-name') ||
                element.src
            );
        }

        return element.textContent.trim();
    }
};

const initTracker = () => {
    UIManager.initControls();
    const trackableElements = document.querySelectorAll(
        ':is(table.article-table, table.wikitable) :is(img, td:nth-child(2) a, td:nth-child(3) a)'
    );

    trackableElements.forEach((element) => {
        const cell = element.closest('td');
        const category = ItemCategorizer.getType(cell);
        const rawName = ItemNameExtractor.getName(element, category);
        const itemId = ItemIdentifier.create(category, rawName);

        element.classList.add(`tfm-${category}`);

        UIManager.applyTracking(element, itemId);
    });
};

initTracker();