const TRACKER_CONFIG = {
    classTrackable: 'tfm-trackable',
    classOwned: 'tfm-owned',
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
    applyTracking: (element, itemId) => {
        element.classList.add(TRACKER_CONFIG.classTrackable);

        if (StorageService.isOwned(itemId)) {
            element.classList.add(TRACKER_CONFIG.classOwned);
        }

        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            this.classList.toggle(TRACKER_CONFIG.classOwned);
            const isNowOwned = this.classList.contains(TRACKER_CONFIG.classOwned);

            StorageService.toggle(itemId, isNowOwned);
        });
    }
};

const ItemCategorizer = {
    getType: (cell) => {
        if (!cell) return 'general';

        switch (cell.cellIndex) {
            case 3: return 'badge';
            case 4: return 'orb';
            case 5: return 'shop';
            default: return 'item';
        }
    }
};

const initTracker = () => {
    const tableImages = document.querySelectorAll('table.article-table img, table.wikitable img');

    tableImages.forEach(img => {
        const cell = img.closest('td');
        const category = ItemCategorizer.getType(cell);

        const rawName = img.getAttribute('data-image-name') || img.src;
        const itemId = `${category}_${rawName}`;

        img.classList.add(`tfm-${category}`);
        UIManager.applyTracking(img, itemId);
    });
};

initTracker();