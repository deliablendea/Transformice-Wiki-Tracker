const TRACKER_CONFIG = {
    classTrackable: 'tfm-trackable',
    classOwned: 'tfm-owned',
    storageValue: 'owned'
};

const StorageSystem = {
    isOwned: function(id) {
        return localStorage.getItem(id) === TRACKER_CONFIG.storageValue;
    },
    toggleSave: function(id, isCurrentlyOwned) {
        if (isCurrentlyOwned) {
            localStorage.setItem(id, TRACKER_CONFIG.storageValue);
        } else {
            localStorage.removeItem(id);
        }
    }
};

function applyTrackingLogic(element, itemId) {
    element.classList.add(TRACKER_CONFIG.classTrackable);
    if (StorageSystem.isOwned(itemId)) {
        element.classList.add(TRACKER_CONFIG.classOwned);
    }

    element.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.classList.toggle(TRACKER_CONFIG.classOwned);
        const isNowOwned = this.classList.contains(TRACKER_CONFIG.classOwned);

        StorageSystem.toggleSave(itemId, isNowOwned);
    });

    function initTracker() {
        const tableImages = document.querySelectorAll('table.article-table img, table.wikitable img');

        tableImages.forEach(img => {
            const itemId = img.getAttribute('data-image-name') || img.src;
            applyTrackingLogic(img, itemId);
        });
    }

    initTracker();
}