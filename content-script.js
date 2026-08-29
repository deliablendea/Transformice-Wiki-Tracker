const TRACKER_CONFIG = {
    classTrackable: 'tfm-trackable',
    classOwned: 'tfm-owned',
    classHovered: 'tfm-hovered',
    storageValue: 'owned'
};

const StorageService = {
    isOwned: (id) => localStorage.getItem(id) === TRACKER_CONFIG.storageValue,

    toggle: (id, isOwned) => {
        if (isOwned) {
            localStorage.setItem(id, TRACKER_CONFIG.storageValue);
        } else {
            localStorage.removeItem(id);
        }
    }
};

const UIManager = {
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

        UIManager.updateOwnedState(
            itemId,
            StorageService.isOwned(itemId)
        );

        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isNowOwned = !StorageService.isOwned(itemId);

            StorageService.toggle(itemId, isNowOwned);
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