const wikiImages = document.querySelectorAll('table.article-table img, table.wikitable img');

wikiImages.forEach(img => {
    if (img.width < 15 || img.height < 15)
        return;

    img.classList.add('tfm-trackable');

    const itemId = img.getAttribute('data-image-name');
    if (localStorage.getItem(itemId) === 'owned') {
        img.classList.add('tfm-owned');
    }

    img.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.classList.toggle('tfm-owned');

        if (this.classList.contains('tfm-owned')) {
            localStorage.setItem(itemId, 'owned');
        } else {
            localStorage.removeItem(itemId);
        }
    })
})