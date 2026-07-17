(() => {
  'use strict';

  const DATA = window.MENU_DATA;
  if (!DATA || !Array.isArray(DATA.items) || !Array.isArray(DATA.categories)) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">The menu data could not be loaded.</p>';
    return;
  }

  const categoryMap = new Map(DATA.categories.map(category => [category.id, category]));
  const itemMap = new Map(DATA.items.map(item => [item.id, item]));
  const signatureSelections = [
    { id: 'nonveg-biryanis-hyderabadi-chicken-dum-biryani', name: 'Chicken Dum Biryani' },
    { id: 'chicken-main-course-spicy-darbar-tandoor-butter-chicken-bn', name: 'Butter Chicken' },
    { id: 'shawarma-wraps-loaded-chicken-shawarma', name: 'Loaded Chicken Shawarma' },
    { id: 'paneer-main-course-creamy-paneer-butter-masala', name: 'Paneer Butter Masala' },
    { id: 'tandoori-kebabs-tandoori-chicken', name: 'Tandoori Chicken' },
    { id: 'noodles-chicken-schezwan-noodles', name: 'Chicken Schezwan Noodles' }
  ];
  const itemsByCategory = new Map(DATA.categories.map(category => [
    category.id,
    DATA.items.filter(item => item.category === category.id)
  ]));
  const representativeImage = new Map(DATA.categories.map(category => [
    category.id,
    itemsByCategory.get(category.id)?.[0]?.image || 'assets/menu/fallback.webp'
  ]));

  const DIET_LABELS = {
    veg: 'Vegetarian',
    egg: 'Contains egg',
    nonveg: 'Non-vegetarian'
  };

  const state = {
    query: '',
    diet: 'all',
    budget: null,
    openCategory: null,
    lastFocused: null
  };

  const el = {
    itemCount: document.getElementById('itemCount'),
    categoryCount: document.getElementById('categoryCount'),
    hoursText: document.getElementById('hoursText'),
    locationText: document.getElementById('locationText'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    categoriesButton: document.getElementById('categoriesButton'),
    filters: document.getElementById('filters'),
    mainTitle: document.getElementById('mainTitle'),
    menuStatus: document.getElementById('menuStatus'),
    categoryView: document.getElementById('categoryView'),
    categoryGrid: document.getElementById('categoryGrid'),
    categorySections: document.getElementById('categorySections'),
    signatureGrid: document.getElementById('signatureGrid'),
    searchView: document.getElementById('searchView'),
    searchTitle: document.getElementById('searchTitle'),
    searchResults: document.getElementById('searchResults'),
    resetSearch: document.getElementById('resetSearch'),
    emptyState: document.getElementById('emptyState'),
    emptyReset: document.getElementById('emptyReset'),
    backTop: document.getElementById('backTop'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    categoryDrawer: document.getElementById('categoryDrawer'),
    closeDrawer: document.getElementById('closeDrawer'),
    drawerList: document.getElementById('drawerList'),
    dishDialog: document.getElementById('dishDialog'),
    closeDishDialog: document.getElementById('closeDishDialog'),
    dishDialogImage: document.getElementById('dishDialogImage'),
    dishDialogDiet: document.getElementById('dishDialogDiet'),
    dishDialogCategory: document.getElementById('dishDialogCategory'),
    dishDialogTitle: document.getElementById('dishDialogTitle'),
    dishDialogPrices: document.getElementById('dishDialogPrices')
  };

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[character]);
  }

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function formatPrice(price) {
    if (!Number.isFinite(price) || price <= 0) return 'Ask staff';
    return `₹${Math.round(price).toLocaleString('en-IN')}`;
  }

  function minimumPrice(item) {
    const prices = item.variants
      .map(variant => variant.price)
      .filter(price => Number.isFinite(price) && price > 0);
    return prices.length ? Math.min(...prices) : null;
  }

  function priceSummary(item) {
    const min = minimumPrice(item);
    if (min === null) return 'Ask staff';
    return item.variants.length > 1 ? `From ${formatPrice(min)}` : formatPrice(min);
  }

  function dishDescription(item) {
    if (item.note) return item.note;
    const category = categoryMap.get(item.category);
    const cuisine = DATA.cuisines.find(entry => entry.id === item.cuisine);
    const tone = {
      veg: 'A vegetarian favourite',
      egg: 'A comforting egg favourite',
      nonveg: 'A hearty non-veg favourite'
    }[item.diet] || 'A house favourite';
    return `${tone} from ${category?.name || cuisine?.name || 'the Amigos kitchen'}, prepared fresh for your table.`;
  }

  function spicyLevel(item) {
    const text = normalize(`${item.name} ${item.search || ''}`);
    if (/\b(spicy|schezwan|chilli|chili|dragon|pepper|kolhapuri|andhra|gongura|avakai|hot)\b/.test(text)) {
      return 'Hot';
    }
    if (/\b(tandoori|tikka|masala|curry|biryani|pulao|mandi|kebab|gravy)\b/.test(text)) {
      return 'Medium';
    }
    return 'Mild';
  }

  function dishBadges(item) {
    const spice = spicyLevel(item);
    return `<div class="dish-card__badges" aria-label="Dish highlights">
      <span class="dish-badge dish-badge--chef">Chef Recommended</span>
      <span class="dish-badge dish-badge--ordered">Most Ordered</span>
      <span class="dish-badge dish-badge--spice dish-badge--${escapeHTML(spice.toLowerCase())}">${escapeHTML(spice)} Spice</span>
    </div>`;
  }

  function matchesQuery(item) {
    if (!state.query) return true;
    const category = categoryMap.get(item.category);
    const haystack = normalize([
      item.search,
      item.name,
      category?.name,
      category?.description,
      DIET_LABELS[item.diet],
      ...item.variants.map(variant => `${variant.label} ${variant.portion || ''}`)
    ].join(' '));
    const terms = normalize(state.query).split(' ').filter(Boolean);
    return terms.every(term => haystack.includes(term));
  }

  function matchesFilters(item, includeQuery = true) {
    if (state.diet !== 'all' && item.diet !== state.diet) return false;
    if (state.budget !== null) {
      const min = minimumPrice(item);
      if (min === null || min > state.budget) return false;
    }
    if (includeQuery && !matchesQuery(item)) return false;
    return true;
  }

  function filteredItems(includeQuery = true) {
    return DATA.items.filter(item => matchesFilters(item, includeQuery));
  }

  function filteredCategoryItems(categoryId, includeQuery = false) {
    return (itemsByCategory.get(categoryId) || []).filter(item => matchesFilters(item, includeQuery));
  }

  function dietMarkup(diet) {
    return `<i class="diet ${escapeHTML(diet)}" role="img" aria-label="${escapeHTML(DIET_LABELS[diet] || 'Diet information')}"></i>`;
  }

  function responsiveImageAttrs(item, sizes) {
    const image = escapeHTML(item.image);
    const thumb = item.imageThumb ? escapeHTML(item.imageThumb) : '';
    const srcset = thumb ? ` srcset="${thumb} 420w, ${image} 960w" sizes="${escapeHTML(sizes)}"` : '';
    return `src="${image}"${srcset}`;
  }

  function variantsMarkup(item) {
    if (item.variants.length === 1) {
      const variant = item.variants[0];
      const price = formatPrice(variant.price);
      const label = variant.label && !/^regular$/i.test(variant.label)
        ? `<small>${escapeHTML(variant.label)}</small>`
        : '';
      return `<div class="single-price ${price === 'Ask staff' ? 'ask' : ''}">${label}${escapeHTML(price)}</div>`;
    }

    return `<div class="variants" aria-label="Available portions">
      ${item.variants.map(variant => {
        const price = formatPrice(variant.price);
        return `<span class="variant" title="${escapeHTML(variant.portion || variant.label)}">
          <span>${escapeHTML(variant.label)}</span>
          <strong class="${price === 'Ask staff' ? 'ask' : ''}">${escapeHTML(price)}</strong>
        </span>`;
      }).join('')}
    </div>`;
  }

  function dishCard(item) {
    const category = categoryMap.get(item.category);
    const price = priceSummary(item);
    return `<article class="dish-card">
      <button class="dish-card__image" type="button" data-open-dish="${escapeHTML(item.id)}" aria-label="View ${escapeHTML(item.name)}">
        <img ${responsiveImageAttrs(item, '(min-width: 1080px) 31vw, (min-width: 820px) 46vw, calc(100vw - 56px)')} alt="Illustrative visual of ${escapeHTML(item.name)}" loading="lazy" decoding="async" width="960" height="720" onerror="this.src='assets/menu/fallback.webp'">
      </button>
      <div class="dish-card__body">
        <div class="dish-card__content">
          <div class="dish-card__top">
            <div class="dish-card__name">${dietMarkup(item.diet)}<h3>${escapeHTML(item.name)}</h3></div>
            <strong class="dish-card__price ${price === 'Ask staff' ? 'ask' : ''}">${escapeHTML(price)}</strong>
          </div>
          <p class="dish-card__category">${escapeHTML(category?.name || '')}</p>
          <p class="dish-card__description">${escapeHTML(dishDescription(item))}</p>
          ${dishBadges(item)}
        </div>
        ${variantsMarkup(item)}
      </div>
    </article>`;
  }

  function signatureItem(selection) {
    if (itemMap.has(selection.id)) return itemMap.get(selection.id);
    const normalized = normalize(selection.name);
    return DATA.items.find(item => normalize(item.name).includes(normalized) && item.imageThumb)
      || DATA.items.find(item => normalize(item.name).includes(normalized))
      || null;
  }

  function signatureCard(item) {
    const category = categoryMap.get(item.category);
    return `<article class="signature-card">
      <button class="signature-card__image" type="button" data-open-dish="${escapeHTML(item.id)}" aria-label="View ${escapeHTML(item.name)}">
        <img ${responsiveImageAttrs(item, '(min-width: 820px) 36vw, calc(100vw - 56px)')} alt="Illustrative visual of ${escapeHTML(item.name)}" loading="lazy" decoding="async" width="960" height="720" onerror="this.src='assets/menu/fallback.webp'">
      </button>
      <div class="signature-card__body">
        <div>
          <p>${escapeHTML(category?.name || 'Amigos favourite')}</p>
          <h3>${escapeHTML(item.name)}</h3>
        </div>
        <div class="signature-card__badges" aria-label="Dish highlights">
          <span class="dish-badge dish-badge--chef">Chef Recommended</span>
          <span class="dish-badge dish-badge--ordered">Most Ordered</span>
        </div>
      </div>
    </article>`;
  }

  function renderSignatureDishes() {
    if (!el.signatureGrid) return;
    const selected = signatureSelections
      .map(signatureItem)
      .filter(Boolean)
      .filter((item, index, items) => items.findIndex(entry => entry.id === item.id) === index);

    el.signatureGrid.innerHTML = selected.map(signatureCard).join('');
  }

  function categoryCard(category, count) {
    return `<button class="category-card" type="button" data-open-category="${escapeHTML(category.id)}" aria-label="Open ${escapeHTML(category.name)}, ${count} dishes">
      <span class="category-card__image"><img src="${escapeHTML(representativeImage.get(category.id))}" alt="" loading="lazy" decoding="async" width="640" height="480" onerror="this.src='assets/menu/fallback.webp'"></span>
      <span class="category-card__copy">
        <span><strong>${escapeHTML(category.name)}</strong><small>${count} ${count === 1 ? 'dish' : 'dishes'}</small></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </span>
    </button>`;
  }

  function categorySection(category, items) {
    const open = state.openCategory === category.id;
    return `<section class="category-section ${open ? 'open' : ''}" id="category-${escapeHTML(category.id)}">
      <button class="section-toggle" type="button" data-toggle-category="${escapeHTML(category.id)}" aria-expanded="${open}" aria-controls="panel-${escapeHTML(category.id)}">
        <span class="section-toggle__image"><img src="${escapeHTML(representativeImage.get(category.id))}" alt="" loading="lazy" decoding="async" width="640" height="480"></span>
        <span class="section-toggle__copy">
          <small>${items.length} ${items.length === 1 ? 'DISH' : 'DISHES'}</small>
          <h2>${escapeHTML(category.name)}</h2>
          <p>${escapeHTML(category.description || '')}</p>
        </span>
        <span class="chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      <div class="section-panel" id="panel-${escapeHTML(category.id)}" ${open ? '' : 'hidden'}>
        <div class="dish-grid">${open ? items.map(dishCard).join('') : ''}</div>
      </div>
    </section>`;
  }

  function renderMeta() {
    if (el.itemCount) el.itemCount.textContent = DATA.meta.itemCount.toLocaleString('en-IN');
    if (el.categoryCount) el.categoryCount.textContent = DATA.meta.categoryCount.toLocaleString('en-IN');
    if (el.hoursText) el.hoursText.textContent = DATA.meta.hours;
    if (el.locationText) el.locationText.textContent = DATA.meta.location;
  }

  function renderFilters() {
    el.filters.querySelectorAll('[data-diet]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.diet === state.diet));
    });
    const budgetButton = el.filters.querySelector('[data-budget]');
    budgetButton?.setAttribute('aria-pressed', String(state.budget !== null));
  }

  function availableCategoryEntries() {
    return DATA.categories
      .map(category => ({
        category,
        items: filteredCategoryItems(category.id, false)
      }))
      .filter(entry => entry.items.length > 0);
  }

  function renderBrowseView() {
    const entries = availableCategoryEntries();
    const visibleItemCount = entries.reduce((sum, entry) => sum + entry.items.length, 0);

    if (state.openCategory && !entries.some(entry => entry.category.id === state.openCategory)) {
      state.openCategory = null;
    }

    el.drawerList.innerHTML = entries.map(({ category, items }) => `
      <button class="drawer-item" type="button" data-open-category="${escapeHTML(category.id)}">
        <img src="${escapeHTML(representativeImage.get(category.id))}" alt="" loading="lazy" decoding="async" width="96" height="96">
        <span><strong>${escapeHTML(category.name)}</strong><small>${items.length} ${items.length === 1 ? 'dish' : 'dishes'}</small></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </button>`).join('');

    const selectedEntry = state.openCategory
      ? entries.find(entry => entry.category.id === state.openCategory)
      : null;

    if (selectedEntry) {
      el.categoryGrid.hidden = true;
      el.categorySections.hidden = false;
      el.categorySections.innerHTML = categorySection(selectedEntry.category, selectedEntry.items);
      el.mainTitle.textContent = 'Browse dishes';
      el.menuStatus.textContent = `${selectedEntry.items.length} ${selectedEntry.items.length === 1 ? 'dish' : 'dishes'} in ${selectedEntry.category.name}`;
    } else {
      el.categoryGrid.hidden = false;
      el.categorySections.hidden = true;
      el.categoryGrid.innerHTML = entries.map(({ category, items }) => categoryCard(category, items.length)).join('');
      el.categorySections.innerHTML = '';
      el.mainTitle.textContent = 'Explore the menu';

      const filterDescription = [];
      if (state.diet !== 'all') filterDescription.push(DIET_LABELS[state.diet]);
      if (state.budget !== null) filterDescription.push(`under ₹${state.budget}`);
      el.menuStatus.textContent = filterDescription.length
        ? `${visibleItemCount} dishes · ${filterDescription.join(' · ')}`
        : `${visibleItemCount} dishes across ${entries.length} categories`;
    }

    const empty = entries.length === 0;
    el.categoryView.hidden = empty;
    el.emptyState.hidden = !empty;
  }

  function renderSearchView() {
    const results = filteredItems(true);
    const groups = DATA.categories
      .map(category => ({ category, items: results.filter(item => item.category === category.id) }))
      .filter(group => group.items.length > 0);

    el.searchTitle.textContent = `${results.length} ${results.length === 1 ? 'dish' : 'dishes'} found`;
    el.menuStatus.textContent = `${results.length} ${results.length === 1 ? 'match' : 'matches'} for “${state.query}”`;
    el.searchResults.innerHTML = groups.map(({ category, items }) => `
      <section class="result-group">
        <header class="result-group__header"><h3>${escapeHTML(category.name)}</h3><span>${items.length} ${items.length === 1 ? 'match' : 'matches'}</span></header>
        <div class="dish-grid">${items.map(dishCard).join('')}</div>
      </section>`).join('');

    el.searchView.hidden = results.length === 0;
    el.emptyState.hidden = results.length !== 0;
  }

  function render() {
    renderFilters();
    el.clearSearch.hidden = !state.query;
    const searching = state.query.trim().length > 0;
    if (searching) el.mainTitle.textContent = 'Search the full menu';

    if (searching) {
      el.categoryView.hidden = true;
      renderSearchView();
    } else {
      el.searchView.hidden = true;
      renderBrowseView();
    }
  }

  function openCategory(categoryId, scroll = true) {
    if (!categoryMap.has(categoryId)) return;
    state.query = '';
    el.searchInput.value = '';
    state.openCategory = categoryId;
    closeDrawerPanel();
    render();
    if (scroll) {
      requestAnimationFrame(() => {
        document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function toggleCategory(categoryId) {
    state.openCategory = state.openCategory === categoryId ? null : categoryId;
    renderBrowseView();
    if (state.openCategory) {
      requestAnimationFrame(() => {
        document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function resetAll() {
    state.query = '';
    state.diet = 'all';
    state.budget = null;
    state.openCategory = null;
    el.searchInput.value = '';
    render();
    document.getElementById('menuMain')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openDrawerPanel() {
    state.lastFocused = document.activeElement;
    el.drawerBackdrop.hidden = false;
    el.categoryDrawer.hidden = false;
    document.body.classList.add('drawer-open');
    requestAnimationFrame(() => el.closeDrawer.focus());
  }

  function closeDrawerPanel() {
    if (el.categoryDrawer.hidden) return;
    el.categoryDrawer.hidden = true;
    el.drawerBackdrop.hidden = true;
    document.body.classList.remove('drawer-open');
    state.lastFocused?.focus?.();
  }

  function openDish(itemId) {
    const item = itemMap.get(itemId);
    if (!item) return;
    const category = categoryMap.get(item.category);
    el.dishDialogImage.src = item.image;
    el.dishDialogImage.alt = `Illustrative visual of ${item.name}`;
    el.dishDialogTitle.textContent = item.name;
    el.dishDialogCategory.textContent = category?.name || '';
    el.dishDialogDiet.className = `diet ${item.diet}`;
    el.dishDialogDiet.setAttribute('aria-label', DIET_LABELS[item.diet] || 'Diet information');
    el.dishDialogPrices.innerHTML = item.variants.map(variant => {
      const price = formatPrice(variant.price);
      return `<div class="dialog-price"><span>${escapeHTML(variant.label)}</span><strong class="${price === 'Ask staff' ? 'ask' : ''}">${escapeHTML(price)}</strong></div>`;
    }).join('');

    if (typeof el.dishDialog.showModal === 'function') {
      el.dishDialog.showModal();
    } else {
      el.dishDialog.setAttribute('open', '');
    }
  }

  function closeDish() {
    if (typeof el.dishDialog.close === 'function') {
      el.dishDialog.close();
    } else {
      el.dishDialog.removeAttribute('open');
    }
  }

  let searchFrame = null;
  el.searchInput.addEventListener('input', event => {
    state.query = event.currentTarget.value.trim();
    cancelAnimationFrame(searchFrame);
    searchFrame = requestAnimationFrame(render);
  });

  el.searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.query) {
      state.query = '';
      el.searchInput.value = '';
      render();
    }
  });

  el.clearSearch.addEventListener('click', () => {
    state.query = '';
    el.searchInput.value = '';
    el.searchInput.focus();
    render();
  });

  el.filters.addEventListener('click', event => {
    const dietButton = event.target.closest('[data-diet]');
    const budgetButton = event.target.closest('[data-budget]');

    if (dietButton) {
      state.diet = dietButton.dataset.diet || 'all';
      state.openCategory = null;
      render();
      return;
    }

    if (budgetButton) {
      const budget = Number(budgetButton.dataset.budget);
      state.budget = state.budget === budget ? null : budget;
      state.openCategory = null;
      render();
    }
  });

  document.addEventListener('click', event => {
    const categoryButton = event.target.closest('[data-open-category]');
    if (categoryButton) {
      openCategory(categoryButton.dataset.openCategory);
      return;
    }

    const toggleButton = event.target.closest('[data-toggle-category]');
    if (toggleButton) {
      toggleCategory(toggleButton.dataset.toggleCategory);
      return;
    }

    const dishButton = event.target.closest('[data-open-dish]');
    if (dishButton) openDish(dishButton.dataset.openDish);
  });

  el.categoriesButton.addEventListener('click', openDrawerPanel);
  el.closeDrawer.addEventListener('click', closeDrawerPanel);
  el.drawerBackdrop.addEventListener('click', closeDrawerPanel);
  el.resetSearch.addEventListener('click', resetAll);
  el.emptyReset.addEventListener('click', resetAll);
  el.backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  el.closeDishDialog.addEventListener('click', closeDish);

  el.dishDialog.addEventListener('click', event => {
    const bounds = el.dishDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeDish();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !el.categoryDrawer.hidden) {
      closeDrawerPanel();
      return;
    }
    if (event.key === '/' && document.activeElement !== el.searchInput && !el.dishDialog.open) {
      event.preventDefault();
      el.searchInput.focus();
    }
  });

  window.addEventListener('scroll', () => {
    el.backTop.hidden = window.scrollY < 700;
  }, { passive: true });

  renderMeta();
  renderSignatureDishes();
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
