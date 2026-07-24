(() => {
  'use strict';

  const DATA = window.MENU_DATA;
  if (!DATA || !Array.isArray(DATA.items) || !Array.isArray(DATA.categories)) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">The menu data could not be loaded.</p>';
    return;
  }
  const PRODUCT_DETAILS = window.MENU_PRODUCT_DETAILS || { meta: {}, items: {} };
  const OFFER_STORAGE_KEY = 'amigos-anniversary-offer-dismissed-2026';
  const OFFER_DISMISSAL_DAYS = 45;
  const MENU_VIEW_STORAGE_KEY = 'amigos-menu-view';
  const MENU_VIEWS = new Set(['grid', 'list']);
  const MENU_OFFER = Object.freeze({
    enabled: true,
    discountPercent: 10,
    minimumBill: 300,
    minimumRule: 'above',
    storageKey: 'amigos-menu-offer-seen'
  });

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
  const studentFavouriteGroups = [
    {
      title: 'Best Biryanis',
      query: 'biryani',
      ids: [
        'nonveg-biryanis-hyderabadi-chicken-dum-biryani',
        'nonveg-biryanis-amigos-fry-piece-chicken-biryani',
        'veg-biryanis-paneer-tikka-biryani'
      ]
    },
    {
      title: 'Best Chinese',
      query: 'chinese',
      ids: [
        'chicken-starters-chicken-65',
        'noodles-chicken-schezwan-noodles',
        'chinese-rice-chicken-fried-rice'
      ]
    },
    {
      title: 'Best Shawarmas',
      query: 'shawarma',
      ids: [
        'shawarma-wraps-loaded-chicken-shawarma',
        'shawarma-wraps-classic-chicken-shawarma',
        'shawarma-wraps-paneer-shawarma'
      ]
    },
    {
      title: 'Best Desserts',
      query: 'dessert',
      ids: [
        'desserts-double-ka-meetha',
        'desserts-gulab-jamun',
        'desserts-brownie-with-ice-cream'
      ]
    },
    {
      title: 'Late Night Favourites',
      query: 'chicken',
      ids: [
        'chicken-main-course-spicy-darbar-tandoor-butter-chicken-bn',
        'rotis-naans-garlic-butter-naan',
        'mocktails-virgin-mojito'
      ]
    },
    {
      title: 'Budget Picks',
      query: 'under 199',
      ids: [
        'south-indian-masala-dosa',
        'meals-thalis-veg-mini-meals',
        'cold-beverages-coca-cola-soft-beverage-300-ml-served-in-glass'
      ]
    }
  ];
  const popularSearchTerms = ['Chicken Biryani', 'Paneer', 'Butter Chicken', 'Shawarma', 'Mojito', 'Dosa', 'Pizza', 'Noodles'];
  const smartFilters = {
    chicken: ['chicken', 'murgh', 'kodi'],
    mutton: ['mutton', 'raan', 'keema', 'gosht'],
    seafood: ['seafood', 'fish', 'prawn', 'prawns', 'basa'],
    paneer: ['paneer', 'chaman'],
    rice: ['rice', 'biryani', 'pulao', 'mandi'],
    noodles: ['noodles', 'hakka'],
    tandoor: ['tandoor', 'tandoori', 'tikka', 'kebab', 'seekh', 'naan', 'roti'],
    desserts: ['dessert', 'meetha', 'jamun', 'brownie', 'rasgulla', 'tukda', 'apricot', 'qubani'],
    mocktails: ['mocktail', 'mojito', 'cooler', 'iced tea', 'punch']
  };
  const complementSets = {
    biryani: [
      { role: 'Starter', patterns: ['chicken 65', 'paneer 65', 'salt pepper prawns', 'crispy fish', 'veg manchurian dry'] },
      { role: 'Main Pairing', patterns: ['onion raita', 'boondi raita', 'cucumber raita'] },
      { role: 'Dessert', patterns: ['double ka meetha', 'shahi tukda', 'gulab jamun'] },
      { role: 'Beverage', patterns: ['coca cola', 'masala cool drink', 'virgin mojito'] }
    ],
    indian: [
      { role: 'Starter', patterns: ['tandoori chicken', 'paneer tikka', 'chicken seekh kebab', 'veg manchurian dry'] },
      { role: 'Main Pairing', patterns: ['butter naan', 'garlic naan', 'classic jeera rice', 'steamed basmati rice'] },
      { role: 'Dessert', patterns: ['gulab jamun', 'shahi tukda', 'double ka meetha'] },
      { role: 'Beverage', patterns: ['virgin mojito', 'masala cool drink', 'coca cola'] }
    ],
    wok: [
      { role: 'Starter', patterns: ['chicken lollipop', 'chilli paneer', 'crispy chilli baby corn', 'salt pepper prawns'] },
      { role: 'Main Course', patterns: ['chicken hakka noodles', 'veg hakka noodles', 'chicken fried rice', 'veg fried rice'] },
      { role: 'Dessert', patterns: ['brownie with ice cream', 'gulab jamun'] },
      { role: 'Beverage', patterns: ['virgin mojito', 'lemon iced tea', 'blue lagoon'] }
    ],
    grill: [
      { role: 'Starter', patterns: ['tandoori chicken', 'paneer tikka', 'chicken wings'] },
      { role: 'Main Course', patterns: ['loaded mac cheese', 'classic chicken burger', 'garden fresh salad'] },
      { role: 'Dessert', patterns: ['brownie with ice cream', 'gulab jamun'] },
      { role: 'Beverage', patterns: ['virgin mojito', 'fruit punch', 'cold coffee thick shake'] }
    ],
    south: [
      { role: 'Starter', patterns: ['sambar vada', 'medu vada', 'idli vada combo'] },
      { role: 'Main Course', patterns: ['south indian meals', 'plain dosa', 'idli sambar'] },
      { role: 'Dessert', patterns: ['rasgulla', 'gulab jamun'] },
      { role: 'Beverage', patterns: ['cold coffee thick shake', 'masala cool drink'] }
    ],
    drinks: [
      { role: 'Main Course', patterns: ['hyderabadi chicken dum biryani', 'paneer butter masala', 'loaded chicken shawarma', 'masala dosa'] },
      { role: 'Starter', patterns: ['chicken 65', 'paneer 65', 'veg manchurian dry'] },
      { role: 'Dessert', patterns: ['brownie with ice cream', 'gulab jamun'] },
      { role: 'Beverage', patterns: ['virgin mojito', 'masala cool drink'] }
    ]
  };
  const itemsByCategory = new Map(DATA.categories.map(category => [
    category.id,
    DATA.items.filter(item => item.category === category.id)
  ]));
  const CATEGORY_IMAGE_OVERRIDES = {
    'veg-starters': 'assets/menu/premium/paneer-chinese.webp',
    'chicken-starters': 'assets/menu/premium/manchurian.webp',
    'seafood-starters': 'assets/menu/premium/prawn-chinese.webp',
    'shawarma-wraps': 'assets/menu/premium/chicken-wrap.webp',
    'veg-biryanis': 'assets/menu/premium/veg-biryani.webp',
    'veg-pot-biryanis': 'assets/menu/premium/veg-biryani.webp',
    'nonveg-biryanis': 'assets/menu/premium/chicken-biryani.webp',
    'nonveg-pot-biryanis': 'assets/menu/premium/chicken-biryani.webp',
    'family-packs': 'assets/menu/family-packs-hyderabadi-chicken-dum-family-pack.webp',
    mandi: 'assets/menu/mandi-classic-chicken-mandi.webp',
    'meals-thalis': 'assets/menu/meals-thalis-south-indian-meals.webp',
    dals: 'assets/menu/premium/dal-makhani.webp',
    'veg-main-course': 'assets/menu/premium/palak-paneer.webp',
    'paneer-main-course': 'assets/menu/premium/paneer-curry.webp',
    'egg-main-course': 'assets/menu/premium/egg-curry.webp',
    'chicken-main-course': 'assets/menu/premium/butter-chicken.webp',
    'mutton-main-course': 'assets/menu/premium/mutton-curry.webp',
    'seafood-main-course': 'assets/menu/premium/fish-curry.webp',
    'tandoori-kebabs': 'assets/menu/premium/tandoori-chicken.webp',
    'chinese-main-course': 'assets/menu/premium/manchurian.webp',
    'chinese-rice': 'assets/menu/premium/fried-rice.webp',
    noodles: 'assets/menu/premium/noodles.webp',
    'rotis-naans': 'assets/menu/rotis-naans-garlic-butter-naan.webp',
    'indian-rice': 'assets/menu/premium/steamed-rice.webp',
    'south-indian': 'assets/menu/south-indian-masala-dosa.webp',
    'nonveg-dosa': 'assets/menu/nonveg-dosa-chicken-dosa.webp',
    burgers: 'assets/menu/burgers-classic-chicken-burger.webp',
    continental: 'assets/menu/continental-loaded-chicken-mac.webp',
    salads: 'assets/menu/salads-grilled-chicken-salad.webp',
    soups: 'assets/menu/premium/soup.webp',
    desserts: 'assets/menu/desserts-shahi-tukda.webp',
    'thick-shakes': 'assets/menu/thick-shakes-chocolate-thick-shake.webp',
    mocktails: 'assets/menu/mocktails-fruit-punch.webp',
    'cold-beverages': 'assets/menu/cold-beverages-masala-cool-drink.webp',
    'biryani-addons': 'assets/menu/biryani-addons-onion-raita.webp'
  };
  const representativeImage = new Map(DATA.categories.map(category => [
    category.id,
    CATEGORY_IMAGE_OVERRIDES[category.id] || itemsByCategory.get(category.id)?.[0]?.image || 'assets/menu/fallback.webp'
  ]));

  const DIET_LABELS = {
    veg: 'Vegetarian',
    egg: 'Contains egg',
    nonveg: 'Non-vegetarian'
  };

  function readMenuView() {
    try {
      const saved = localStorage.getItem(MENU_VIEW_STORAGE_KEY);
      return MENU_VIEWS.has(saved) ? saved : 'grid';
    } catch {
      return 'grid';
    }
  }

  function storeMenuView(value) {
    try {
      localStorage.setItem(MENU_VIEW_STORAGE_KEY, value);
    } catch {}
  }

  const state = {
    query: '',
    diet: 'all',
    smartFilter: null,
    budget: null,
    openCategory: null,
    menuView: readMenuView(),
    lastFocused: null
  };

  const el = {
    itemCount: document.getElementById('itemCount'),
    categoryCount: document.getElementById('categoryCount'),
    hoursText: document.getElementById('hoursText'),
    locationText: document.getElementById('locationText'),
    menuOfferBanner: document.getElementById('menuOfferBanner'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    categoriesButton: document.getElementById('categoriesButton'),
    filters: document.getElementById('filters'),
    mainTitle: document.getElementById('mainTitle'),
    menuStatus: document.getElementById('menuStatus'),
    menuMain: document.getElementById('menuMain'),
    categoryView: document.getElementById('categoryView'),
    categoryGrid: document.getElementById('categoryGrid'),
    categorySections: document.getElementById('categorySections'),
    signatureGrid: document.getElementById('signatureGrid'),
    studentFavouritesGrid: document.getElementById('studentFavouritesGrid'),
    popularSearches: document.getElementById('popularSearches'),
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
    dishDialogDescription: document.getElementById('dishDialogDescription'),
    dishDialogMeta: document.getElementById('dishDialogMeta'),
    dishDialogPrices: document.getElementById('dishDialogPrices'),
    dishDialogSmart: document.getElementById('dishDialogSmart'),
    dishDialogAllergens: document.getElementById('dishDialogAllergens'),
    dishDialogDisclaimer: document.getElementById('dishDialogDisclaimer'),
    viewSwitcher: document.querySelector('.view-switcher'),
    anniversaryOfferDialog: document.getElementById('anniversaryOfferDialog'),
    closeOfferDialog: document.getElementById('closeOfferDialog'),
    dismissOfferDialog: document.getElementById('dismissOfferDialog'),
    exploreOfferMenu: document.getElementById('exploreOfferMenu'),
    viewOfferDetails: document.getElementById('viewOfferDetails')
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

  function getPromotionalPrice(price) {
    if (!Number.isFinite(price) || price <= 0) return null;
    return Math.round(Number(price) * (1 - (MENU_OFFER.discountPercent / 100)));
  }

  function offerConditionText() {
    const bill = formatPrice(MENU_OFFER.minimumBill);
    if (MENU_OFFER.minimumRule === 'above') {
      return `Applicable when the eligible bill exceeds ${bill}.`;
    }
    return `Applicable on eligible bills of ${bill} and above.`;
  }

  function offerBannerText() {
    const bill = formatPrice(MENU_OFFER.minimumBill);
    if (MENU_OFFER.minimumRule === 'above') {
      return `Enjoy ${MENU_OFFER.discountPercent}% off your eligible food bill above ${bill}.`;
    }
    return `Enjoy ${MENU_OFFER.discountPercent}% off your eligible food bill of ${bill} and above.`;
  }

  function offerPriceMarkup(price, { from = false, context = 'card' } = {}) {
    const regular = formatPrice(price);
    if (!MENU_OFFER.enabled || regular === 'Ask staff') {
      return `<span class="offer-price offer-price--disabled ${regular === 'Ask staff' ? 'ask' : ''}">${escapeHTML(regular)}</span>`;
    }
    const promotional = formatPrice(getPromotionalPrice(price));
    const visualPrefix = from ? '<span class="offer-price__from">From</span>' : '';
    const caption = context === 'modal'
      ? `after ${MENU_OFFER.discountPercent}% discount`
      : `with ${MENU_OFFER.discountPercent}% offer`;
    const ariaCondition = MENU_OFFER.minimumRule === 'above'
      ? `Offer applies on eligible bills above ${formatPrice(MENU_OFFER.minimumBill)}.`
      : `Offer applies on eligible bills of ${formatPrice(MENU_OFFER.minimumBill)} and above.`;
    const aria = `${from ? 'Regular price from' : 'Regular price'} ${regular}. ${from ? `Price after ${MENU_OFFER.discountPercent} percent offer from` : `Price after ${MENU_OFFER.discountPercent} percent offer`} ${promotional}. ${ariaCondition}`;
    return `<span class="offer-price offer-price--${escapeHTML(context)}" aria-label="${escapeHTML(aria)}">
      ${visualPrefix}
      <span class="offer-price__regular" aria-hidden="true">${escapeHTML(regular)}</span>
      <span class="offer-price__promo" aria-hidden="true">${escapeHTML(promotional)}<sup>*</sup></span>
      <span class="offer-price__caption" aria-hidden="true">${escapeHTML(caption)}</span>
    </span>`;
  }

  function priceSummary(item) {
    const min = minimumPrice(item);
    if (min === null) return 'Ask staff';
    return item.variants.length > 1 ? `From ${formatPrice(min)}` : formatPrice(min);
  }

  function priceSummaryMarkup(item, options = {}) {
    const min = minimumPrice(item);
    if (min === null) return offerPriceMarkup(null, options);
    return offerPriceMarkup(min, { ...options, from: item.variants.length > 1 });
  }

  function productDetail(item) {
    return PRODUCT_DETAILS.items?.[item.id] || null;
  }

  function dishFocus(item) {
    const text = normalize(item.name);
    const focusMatches = [
      [/prawn|shrimp/, 'prawns'],
      [/fish|basa/, 'fish'],
      [/mutton|raan|kosha|rogan|keema/, 'mutton'],
      [/chicken|lollipop|wings|tangdi/, 'chicken'],
      [/egg|omelette|bhurji/, 'egg'],
      [/paneer|chaman/, 'paneer'],
      [/mushroom/, 'mushroom'],
      [/baby corn/, 'baby corn'],
      [/corn/, 'corn'],
      [/soya|chaap/, 'soya chaap'],
      [/kaju|cashew/, 'cashew'],
      [/rajma/, 'rajma'],
      [/bhindi/, 'bhindi'],
      [/aloo|potato/, 'potato'],
      [/dal|pappu|lentil/, 'lentils']
    ];
    const match = focusMatches.find(([pattern]) => pattern.test(text));
    if (match) return match[1];
    if (item.diet === 'veg') return 'vegetables';
    if (item.diet === 'egg') return 'egg';
    return 'fresh ingredients';
  }

  function flavorStyle(item) {
    const text = normalize(`${item.name} ${item.search || ''}`);
    if (/\b(honey|sweet)\b/.test(text)) return 'sweet-spicy';
    if (/\b(schezwan|chilli|chili|dragon|hot|kolhapuri|andhra|gongura|avakai|karam|peri peri)\b/.test(text)) return 'fiery';
    if (/\b(garlic|lasooni|burnt garlic)\b/.test(text)) return 'garlic-forward';
    if (/\b(pepper|chettinad)\b/.test(text)) return 'peppery';
    if (/\b(butter|creamy|malai|afghani|reshmi|white|shahi|korma|lababdar)\b/.test(text)) return 'creamy';
    if (/\b(tandoori|tikka|kebab|seekh|smoky|grilled)\b/.test(text)) return 'smoky';
    if (/\b(lemon|coriander|mint|curd|raita|iced tea|mojito|cooler)\b/.test(text)) return 'refreshing';
    return 'balanced';
  }

  function dishDescription(item) {
    const detail = productDetail(item);
    if (detail?.description) return detail.description;
    if (item.note) return item.note;
    const text = normalize(`${item.name} ${item.search || ''}`);
    const focus = dishFocus(item);
    const style = flavorStyle(item);

    if (item.category === 'family-packs') {
      return `A generous biryani pack made for sharing, layered with ${focus}, aromatic rice and house spices.`;
    }
    if (item.category === 'biryani-addons') {
      return `A useful biryani companion with ${focus}, made to round out the meal at the table.`;
    }
    if (item.category === 'mandi') {
      return `A slow-spiced mandi plate with ${focus}, fragrant rice and a mellow, comforting finish.`;
    }
    if (/pot biryani/.test(text) || item.category.includes('pot-biryanis')) {
      return `A hearty pot-style biryani with ${focus}, sealed-in aroma and a richer spice finish.`;
    }
    if (/biryani|pulao/.test(text) || item.category.includes('biryanis')) {
      return `Fragrant rice layered with ${focus}, warm spices and classic Amigos biryani comfort.`;
    }
    if (/shawarma|wrap/.test(text)) {
      return `A warm handheld wrap with ${focus}, crisp fillings and a creamy, satisfying finish.`;
    }
    if (/dosa|idli|vada|uttapam|upma|pongal|poori|tiffin/.test(text) || item.cuisine === 'south') {
      return `A South Indian favourite with ${focus}, clean flavours and comforting campus-style ease.`;
    }
    if (/burger/.test(text)) {
      return `A soft-bun burger with ${focus}, fresh crunch and a saucy cafe-style finish.`;
    }
    if (/mac|cheese/.test(text)) {
      return `Creamy mac and cheese with ${focus}, baked-in richness and a smooth comfort-food finish.`;
    }
    if (/salad/.test(text)) {
      return `A fresh salad bowl with ${focus}, crisp vegetables and a clean, balanced bite.`;
    }
    if (/soup/.test(text)) {
      return `A warm ${style} soup with ${focus}, served light, savoury and soothing.`;
    }
    if (/shake|thick shake/.test(text)) {
      return `A chilled thick shake with ${focus}, creamy texture and an indulgent cafe finish.`;
    }
    if (/mocktail|mojito|cooler|iced tea|punch/.test(text)) {
      return `A chilled ${style} drink with bright flavour, ice-cold refreshment and a clean finish.`;
    }
    if (/water|beverage|coca|pepsi|campa|drink/.test(text) || item.category === 'cold-beverages') {
      return `A chilled table refreshment served simply to keep the meal easy and balanced.`;
    }
    if (/dessert|meetha|jamun|tukda|brownie|rasgulla|apricot|qubani/.test(text) || item.category === 'desserts') {
      return `A sweet finish with rich comfort, soft texture and a celebratory Amigos touch.`;
    }
    if (/naan|roti|paratha|kulcha/.test(text)) {
      return `Fresh tandoor bread with a soft bite, made to pair beautifully with curries and kebabs.`;
    }
    if (/rice/.test(text) || item.category === 'indian-rice') {
      return `A comforting rice plate with ${focus}, gentle aromatics and a clean homestyle finish.`;
    }
    if (/dal|pappu/.test(text) || item.category === 'dals') {
      return `Slow-simmered ${focus} with a ${style} tempering, made for rice, roti and comfort.`;
    }
    if (/tandoori|tikka|kebab|seekh|platter|grill/.test(text) || item.category === 'tandoori-kebabs') {
      return `Char-grilled ${focus} with smoky edges, warm masala and a refined tandoor finish.`;
    }
    if (/fried rice/.test(text) || item.category === 'chinese-rice') {
      return `Wok-tossed rice with ${focus}, crisp vegetables and a savoury Indo-Chinese finish.`;
    }
    if (/noodles/.test(text) || item.category === 'noodles') {
      return `Wok-tossed noodles with ${focus}, springy strands and a lively ${style} finish.`;
    }
    if (/manchurian|gravy|black pepper|hot garlic|chilli garlic/.test(text) || item.category === 'chinese-main-course') {
      return `An Indo-Chinese gravy with ${focus}, glossy sauce and a bold ${style} finish.`;
    }
    if (/starter|crispy|chilli|dragon|pepper|65|lollipop|wings|salt/.test(text) || /starters/.test(item.category)) {
      return `A ${style} starter with ${focus}, crisp edges and a lively table-sharing bite.`;
    }
    if (/meal|thali/.test(text) || item.category === 'meals-thalis') {
      return `A complete plate with ${focus}, rice, sides and homestyle comfort in every serving.`;
    }
    if (/curry|masala|handi|kadai|do pyaza|lababdar|korma|bhurji|fry/.test(text) || /main-course/.test(item.category)) {
      return `A ${style} curry with ${focus}, slow-built gravy and warm Indian spices.`;
    }

    return `A balanced Amigos favourite with ${focus}, prepared fresh for easy table-side browsing.`;
  }

  function spicyLevel(item) {
    const detail = productDetail(item);
    if (detail?.spice) return detail.spice;
    const text = normalize(`${item.name} ${item.search || ''}`);
    if (/\b(spicy|schezwan|chilli|chili|dragon|pepper|kolhapuri|andhra|gongura|avakai|hot)\b/.test(text)) {
      return 'Hot';
    }
    if (/\b(tandoori|tikka|masala|curry|biryani|pulao|mandi|kebab|gravy)\b/.test(text)) {
      return 'Medium';
    }
    return 'Mild';
  }

  function itemText(item) {
    const category = categoryMap.get(item.category);
    const detail = productDetail(item);
    return normalize([
      item.name,
      item.category,
      item.cuisine,
      item.search,
      category?.name,
      category?.description,
      detail?.brand,
      detail?.menuSection,
      detail?.description,
      detail?.searchText,
      detail?.dietary?.label,
      detail?.spice
    ].join(' '));
  }

  function normalizeBadgeLabel(label) {
    const text = normalize(label);
    if (!text) return '';
    if (/most ordered/.test(text)) return 'Most Ordered';
    if (/chef|signature/.test(text)) return "Chef's Recommendation";
    if (/limited|seasonal|selected/.test(text)) return 'Limited Time';
    if (/popular|favourite|favorite|best value|spicy pick|veg favourite/.test(text)) return 'Student Favourite';
    return 'Student Favourite';
  }

  function highlightBadges(item) {
    const detail = productDetail(item);
    const labels = [];
    if (/selected days|available on selected/i.test(item.note || '')) labels.push('Limited Time');
    (detail?.badges || []).forEach(badge => {
      const label = normalizeBadgeLabel(badge);
      if (label) labels.push(label);
    });
    return [...new Set(labels)].slice(0, 2);
  }

  function dishBadges(item) {
    const spice = spicyLevel(item);
    const badges = highlightBadges(item);
    const spiceIcons = spice === 'Hot' ? '🌶🌶 ' : spice === 'Medium' ? '🌶 ' : '';
    const approvedMarkup = badges.map(label => {
      const modifier = label === "Chef's Recommendation" ? 'chef'
        : label === 'Most Ordered' ? 'ordered'
          : label === 'Limited Time' ? 'limited'
            : 'student';
      return `<span class="dish-badge dish-badge--${modifier}">${escapeHTML(label)}</span>`;
    }).join('');
    return `<div class="dish-card__badges" aria-label="Dish highlights">
      ${approvedMarkup}
      <span class="dish-badge dish-badge--spice dish-badge--${escapeHTML(spice.toLowerCase())}">${spiceIcons}${escapeHTML(spice)} Spice</span>
    </div>`;
  }

  function portionCountMarkup(item) {
    if (item.variants.length <= 1) return '';
    return `<span class="dish-card__sizes">${item.variants.length} sizes</span>`;
  }

  function matchesQuery(item) {
    if (!state.query) return true;
    const category = categoryMap.get(item.category);
    const haystack = normalize([
      item.search,
      item.name,
      productDetail(item)?.description,
      productDetail(item)?.searchText,
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
    if (state.smartFilter) {
      const terms = smartFilters[state.smartFilter] || [];
      const haystack = itemText(item);
      if (!terms.some(term => haystack.includes(normalize(term)))) return false;
    }
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

  function dietMarkup(diet, detail = null) {
    const dietary = detail?.dietary;
    const key = dietary?.key || diet;
    const label = dietary?.label || DIET_LABELS[diet] || 'Diet information';
    return `<i class="diet ${escapeHTML(key)}" role="img" aria-label="${escapeHTML(label)}"></i>`;
  }

  function responsiveImageAttrs(item, sizes) {
    const image = escapeHTML(item.image);
    const thumb = item.imageThumb ? escapeHTML(item.imageThumb) : '';
    const srcset = thumb ? ` srcset="${thumb} 420w, ${image} 960w" sizes="${escapeHTML(sizes)}"` : '';
    return `src="${image}"${srcset}`;
  }

  function cardImageAttrs(item) {
    if (state.menuView === 'grid' && item.imageThumb) {
      return `src="${escapeHTML(item.imageThumb)}"`;
    }
    return responsiveImageAttrs(item, '(min-width: 1280px) 24vw, (min-width: 820px) 31vw, calc(100vw - 56px)');
  }

  function variantsMarkup(item) {
    if (item.variants.length === 1) {
      const variant = item.variants[0];
      const price = formatPrice(variant.price);
      const label = variant.label && !/^regular$/i.test(variant.label)
        ? `<small>${escapeHTML(variant.label)}</small>`
        : '';
      return `<div class="single-price ${price === 'Ask staff' ? 'ask' : ''}">${label}${offerPriceMarkup(variant.price, { context: 'variant' })}</div>`;
    }

    return `<div class="variants" aria-label="Available portions">
      ${item.variants.map(variant => {
        const price = formatPrice(variant.price);
        return `<span class="variant" title="${escapeHTML(variant.portion || variant.label)}">
          <span>${escapeHTML(variant.label)}</span>
          <strong class="${price === 'Ask staff' ? 'ask' : ''}">${offerPriceMarkup(variant.price, { context: 'variant' })}</strong>
        </span>`;
      }).join('')}
    </div>`;
  }

  function itemFocus(item) {
    const text = itemText(item);
    if (/prawn|shrimp|fish|basa|seafood/.test(text)) return 'seafood';
    if (/mutton|raan|keema|gosht/.test(text)) return 'mutton';
    if (/chicken|murgh|kodi|lollipop|wings|tangdi/.test(text)) return 'chicken';
    if (/egg|omelette|bhurji/.test(text)) return 'egg';
    if (/paneer|chaman/.test(text)) return 'paneer';
    return item.diet === 'veg' ? 'veg' : 'nonveg';
  }

  function compatibleRecommendation(target, candidate) {
    if (!candidate || target.id === candidate.id) return false;
    if (target.diet === 'veg' && candidate.diet !== 'veg') return false;
    if (target.diet === 'egg' && candidate.diet === 'nonveg') return false;
    return true;
  }

  function recommendationProfile(item) {
    if (/biryani|mandi|family-packs|biryani-addons/.test(item.category) || item.cuisine === 'biryani') return 'biryani';
    if (item.cuisine === 'south' || /dosa|idli|vada|uttapam|pongal|upma|poori/.test(itemText(item))) return 'south';
    if (item.cuisine === 'grill' || /shawarma|burger|mac|salad/.test(itemText(item))) return 'grill';
    if (item.cuisine === 'wok' || /noodles|fried rice|manchurian|chilli|schezwan/.test(itemText(item))) return 'wok';
    if (item.cuisine === 'drinks' || /dessert|shake|mocktail|beverage|mojito|cooler/.test(itemText(item))) return 'drinks';
    return 'indian';
  }

  function candidateScore(target, candidate, patternIndex) {
    const targetFocus = itemFocus(target);
    const candidateFocus = itemFocus(candidate);
    let score = 100 - patternIndex;
    if (targetFocus === candidateFocus) score += 18;
    if (target.diet === candidate.diet) score += 10;
    if (candidate.imageThumb) score += 3;
    if (highlightBadges(candidate).length) score += 2;
    return score;
  }

  function roleCategories(role) {
    const categoryPreferences = {
      Starter: ['veg-starters', 'chicken-starters', 'seafood-starters', 'tandoori-kebabs', 'south-indian'],
      'Main Course': ['nonveg-biryanis', 'veg-biryanis', 'meals-thalis', 'chicken-main-course', 'paneer-main-course', 'veg-main-course', 'mutton-main-course', 'seafood-main-course', 'chinese-main-course', 'chinese-rice', 'noodles', 'south-indian', 'shawarma-wraps', 'burgers', 'continental'],
      'Main Pairing': ['rotis-naans', 'indian-rice', 'biryani-addons'],
      Dessert: ['desserts'],
      Beverage: ['mocktails', 'cold-beverages', 'thick-shakes']
    };
    return categoryPreferences[role] || categoryPreferences['Main Course'];
  }

  function findRecommendation(patterns, role, target, used) {
    const allowedCategories = roleCategories(role);
    for (let index = 0; index < patterns.length; index += 1) {
      const pattern = normalize(patterns[index]);
      const matches = DATA.items
        .filter(candidate => !used.has(candidate.id))
        .filter(candidate => compatibleRecommendation(target, candidate))
        .filter(candidate => allowedCategories.includes(candidate.category))
        .filter(candidate => itemText(candidate).includes(pattern))
        .sort((a, b) => candidateScore(target, b, index) - candidateScore(target, a, index));
      if (matches.length) return matches[0];
    }
    return null;
  }

  function fallbackRecommendation(role, target, used) {
    const categories = roleCategories(role);
    return DATA.items
      .filter(candidate => !used.has(candidate.id))
      .filter(candidate => compatibleRecommendation(target, candidate))
      .filter(candidate => categories.includes(candidate.category))
      .sort((a, b) => candidateScore(target, b, 0) - candidateScore(target, a, 0))[0] || null;
  }

  function completeMealRecommendations(item) {
    const profile = recommendationProfile(item);
    const used = new Set([item.id]);
    const rules = complementSets[profile] || complementSets.indian;
    return rules.map(rule => {
      const candidate = findRecommendation(rule.patterns, rule.role, item, used) || fallbackRecommendation(rule.role, item, used);
      if (!candidate) return null;
      used.add(candidate.id);
      return { role: rule.role, item: candidate };
    }).filter(Boolean).slice(0, 4);
  }

  function servingMax(item) {
    const detail = productDetail(item);
    if (/family|pack/.test(item.category)) return 4;
    const values = (detail?.variants || []).flatMap(variant => String(variant.serves || '').match(/\d+/g) || []).map(Number);
    return values.length ? Math.max(...values) : 1;
  }

  function perfectFor(item) {
    const max = servingMax(item);
    if (max >= 4) return { icon: '🎉', label: /family|pack/.test(item.category) ? 'Family Sharing' : 'Group of Four' };
    if (max >= 2) return { icon: '👥', label: 'Two People' };
    return { icon: '👤', label: 'Solo Meal' };
  }

  function smartDialogMarkup(item) {
    const recommendations = completeMealRecommendations(item);
    const fit = perfectFor(item);
    const recMarkup = recommendations.length
      ? `<section class="meal-builder" aria-labelledby="mealBuilderTitle">
          <div class="meal-builder__heading">
            <h3 id="mealBuilderTitle">Complete Your Meal</h3>
            <p>Recommended with ${escapeHTML(item.name)}</p>
          </div>
          <div class="meal-builder__grid">
            ${recommendations.map(({ role, item: recommendation }) => `<button type="button" class="meal-card" data-open-dish="${escapeHTML(recommendation.id)}" aria-label="View ${escapeHTML(recommendation.name)}">
              <img ${responsiveImageAttrs(recommendation, '104px')} alt="" loading="lazy" decoding="async" width="160" height="120" onerror="this.src='assets/menu/fallback.webp'">
              <span>
                <small>${escapeHTML(role)}</small>
                <strong>${escapeHTML(recommendation.name)}</strong>
                <em>${priceSummaryMarkup(recommendation, { context: 'meal' })}</em>
              </span>
            </button>`).join('')}
          </div>
        </section>`
      : '';

    return `<section class="perfect-for" aria-label="Perfect for">
        <span>Perfect For</span>
        <strong>${fit.icon} ${escapeHTML(fit.label)}</strong>
      </section>${recMarkup}`;
  }

  function dishCard(item) {
    const category = categoryMap.get(item.category);
    const detail = productDetail(item);
    const price = priceSummary(item);
    return `<article class="dish-card" role="button" tabindex="0" data-open-dish="${escapeHTML(item.id)}" aria-label="View ${escapeHTML(item.name)}">
      <span class="dish-card__image">
        <img ${cardImageAttrs(item)} alt="Illustrative visual of ${escapeHTML(item.name)}" loading="lazy" decoding="async" width="960" height="720" onerror="this.src='assets/menu/fallback.webp'">
      </span>
      <div class="dish-card__body">
        <div class="dish-card__content">
          <div class="dish-card__top">
            <div class="dish-card__name">${dietMarkup(item.diet, detail)}<h3>${escapeHTML(item.name)}</h3></div>
            <div class="dish-card__price ${price === 'Ask staff' ? 'ask' : ''}">${priceSummaryMarkup(item)}</div>
          </div>
          <p class="dish-card__category">${escapeHTML(category?.name || '')}</p>
          <p class="dish-card__description">${escapeHTML(dishDescription(item))}</p>
          ${dishBadges(item)}
          ${portionCountMarkup(item)}
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

  function favouriteGroupItems(group) {
    return group.ids
      .map(id => itemMap.get(id))
      .filter(Boolean)
      .slice(0, 3);
  }

  function renderStudentFavourites() {
    if (!el.studentFavouritesGrid) return;
    el.studentFavouritesGrid.innerHTML = studentFavouriteGroups.map(group => {
      const items = favouriteGroupItems(group);
      const image = items[0]?.image || 'assets/menu/fallback.webp';
      return `<article class="student-favourite-card">
        <button class="student-favourite-card__image" type="button" data-smart-search="${escapeHTML(group.query)}" aria-label="Search ${escapeHTML(group.title)}">
          <img src="${escapeHTML(image)}" alt="" loading="lazy" decoding="async" width="640" height="480" onerror="this.src='assets/menu/fallback.webp'">
        </button>
        <div class="student-favourite-card__body">
          <h3>${escapeHTML(group.title)}</h3>
          <div class="student-favourite-card__items">
            ${items.map(item => `<button type="button" data-open-dish="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button>`).join('')}
          </div>
          <button class="student-favourite-card__search" type="button" data-smart-search="${escapeHTML(group.query)}">Explore ${escapeHTML(group.title)}</button>
        </div>
      </article>`;
    }).join('');
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
    el.filters.querySelectorAll('[data-smart-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.smartFilter === state.smartFilter));
    });
    const budgetButton = el.filters.querySelector('[data-budget]');
    budgetButton?.setAttribute('aria-pressed', String(state.budget !== null));
  }

  function renderPopularSearches() {
    if (!el.popularSearches) return;
    el.popularSearches.hidden = Boolean(state.query);
    el.popularSearches.innerHTML = popularSearchTerms
      .map(term => `<button type="button" data-smart-search="${escapeHTML(term)}">${escapeHTML(term)}</button>`)
      .join('');
  }

  function renderOfferBanner() {
    if (!el.menuOfferBanner) return;
    if (!MENU_OFFER.enabled) {
      el.menuOfferBanner.hidden = true;
      el.menuOfferBanner.innerHTML = '';
      return;
    }
    el.menuOfferBanner.hidden = false;
    el.menuOfferBanner.innerHTML = `<div>
        <strong>Flat ${MENU_OFFER.discountPercent}% Off</strong>
        <span>${escapeHTML(offerBannerText())}</span>
        <small>*${escapeHTML(offerConditionText())}</small>
      </div>
      <button type="button" data-open-offer-details>Offer details</button>`;
  }

  function renderMenuViewControls() {
    el.menuMain?.setAttribute('data-menu-view', state.menuView);
    el.viewSwitcher?.querySelectorAll('[data-menu-view]').forEach(button => {
      const active = button.dataset.menuView === state.menuView;
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function currentMenuAnchor() {
    if (state.query) return el.searchView;
    if (state.openCategory) return document.getElementById(`category-${state.openCategory}`);
    return el.categoryView;
  }

  function preserveMenuAnchor(callback) {
    const anchor = currentMenuAnchor();
    const beforeTop = anchor?.getBoundingClientRect().top;
    callback();
    if (!Number.isFinite(beforeTop)) return;
    requestAnimationFrame(() => {
      const nextAnchor = currentMenuAnchor();
      const afterTop = nextAnchor?.getBoundingClientRect().top;
      if (Number.isFinite(afterTop)) {
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' });
      }
    });
  }

  function setMenuView(value) {
    if (!MENU_VIEWS.has(value) || value === state.menuView) return;
    preserveMenuAnchor(() => {
      state.menuView = value;
      storeMenuView(value);
      render();
    });
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
      if (state.smartFilter) filterDescription.push(state.smartFilter.replace('-', ' '));
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
    if (results.length === 0) {
      el.emptyState.innerHTML = `<span aria-hidden="true">0</span>
        <h2>No dishes found.</h2>
        <p>Try one of these searches:</p>
        <div class="empty-suggestions">
          ${['Chicken', 'Paneer', 'Biryani', 'Noodles', 'Desserts'].map(term => `<button type="button" data-smart-search="${term}">${term}</button>`).join('')}
        </div>
        <button id="emptyReset" type="button">Show full menu</button>`;
      el.emptyReset = document.getElementById('emptyReset');
    }
  }

  function render() {
    renderFilters();
    renderPopularSearches();
    renderMenuViewControls();
    renderOfferBanner();
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

  function runSearch(term) {
    state.query = String(term || '').trim();
    state.diet = 'all';
    state.smartFilter = null;
    state.budget = null;
    state.openCategory = null;
    el.searchInput.value = state.query;
    render();
    document.getElementById('menuMain')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    state.smartFilter = null;
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
    const alreadyOpen = el.dishDialog.open || el.dishDialog.hasAttribute('open');
    const category = categoryMap.get(item.category);
    const detail = productDetail(item);
    el.dishDialogImage.src = item.image;
    el.dishDialogImage.alt = `Illustrative visual of ${item.name}`;
    el.dishDialogTitle.textContent = item.name;
    el.dishDialogCategory.textContent = detail?.brand ? `${detail.brand} · ${category?.name || ''}` : category?.name || '';
    el.dishDialogDiet.className = `diet ${detail?.dietary?.key || item.diet}`;
    el.dishDialogDiet.setAttribute('aria-label', detail?.dietary?.label || DIET_LABELS[item.diet] || 'Diet information');
    el.dishDialogDescription.textContent = dishDescription(item);

    const meta = [];
    if (detail?.dietary?.label) meta.push(detail.dietary.label);
    if (detail?.spice) meta.push(`${detail.spice} Spicy`);
    meta.push(...highlightBadges(item));
    el.dishDialogMeta.innerHTML = meta.map(value => `<span>${escapeHTML(value)}</span>`).join('');

    el.dishDialogPrices.innerHTML = item.variants.map((variant, index) => {
      const price = formatPrice(variant.price);
      const variantDetail = detail?.variants?.[index];
      const quantity = [
        variantDetail?.approxTotalServing,
        variantDetail?.mainIngredientQuantity,
        variantDetail?.serves ? `Serves ${variantDetail.serves}` : '',
        variantDetail?.calorieRange ? `Approximately ${variantDetail.calorieRange}` : variantDetail?.estimatedCalories ? `Approximately ${variantDetail.estimatedCalories} kcal` : ''
      ].filter(Boolean);
      return `<div class="dialog-price">
        <div>
          <span>${escapeHTML(variantDetail?.approvedPortion || variant.label)}</span>
          ${quantity.length ? `<ul>${quantity.map(entry => `<li>${escapeHTML(entry)}</li>`).join('')}</ul>` : ''}
        </div>
        <strong class="${price === 'Ask staff' ? 'ask' : ''}">${offerPriceMarkup(variant.price, { context: 'modal' })}</strong>
      </div>`;
    }).join('') + (MENU_OFFER.enabled ? `<p class="dialog-offer-note">*${escapeHTML(offerConditionText())}</p>` : '');
    el.dishDialogSmart.innerHTML = smartDialogMarkup(item);
    const allergens = [...new Set((detail?.variants || []).map(variant => variant.allergens).filter(Boolean))];
    el.dishDialogAllergens.innerHTML = allergens.length
      ? `<strong>Allergens</strong><p>${allergens.map(escapeHTML).join('<br>')}</p>`
      : '';
    el.dishDialogDisclaimer.textContent = PRODUCT_DETAILS.meta?.disclaimer || 'Visual is illustrative. Actual presentation may vary.';

    if (alreadyOpen) {
      el.dishDialog.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof el.dishDialog.showModal === 'function') {
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

  function readOfferDismissal() {
    try {
      return JSON.parse(localStorage.getItem(OFFER_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function offerDismissedRecently() {
    const saved = readOfferDismissal();
    if (!saved?.dismissedAt) return false;
    return Date.now() - Number(saved.dismissedAt) < OFFER_DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
  }

  function storeOfferDismissal() {
    try {
      localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {}
  }

  let offerLastFocused = null;
  let offerAutoTimer = null;

  function openOfferDialog(trigger = null) {
    if (!el.anniversaryOfferDialog) return;
    offerLastFocused = trigger || document.activeElement;
    document.body.classList.add('offer-open');
    if (typeof el.anniversaryOfferDialog.showModal === 'function') {
      el.anniversaryOfferDialog.showModal();
    } else {
      el.anniversaryOfferDialog.setAttribute('open', '');
    }
    requestAnimationFrame(() => el.exploreOfferMenu?.focus());
  }

  function closeOfferDialog({ remember = true, restoreFocus = true } = {}) {
    if (!el.anniversaryOfferDialog?.open && !el.anniversaryOfferDialog?.hasAttribute('open')) return;
    if (remember) storeOfferDismissal();
    if (typeof el.anniversaryOfferDialog.close === 'function') {
      el.anniversaryOfferDialog.close();
    } else {
      el.anniversaryOfferDialog.removeAttribute('open');
    }
    document.body.classList.remove('offer-open');
    if (restoreFocus) offerLastFocused?.focus?.();
  }

  function scheduleOfferDialog() {
    if (!el.anniversaryOfferDialog || offerDismissedRecently()) return;
    offerAutoTimer = window.setTimeout(() => {
      if (document.hidden || el.dishDialog.open || !el.categoryDrawer.hidden) return;
      openOfferDialog();
    }, 1900);
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
    const smartFilterButton = event.target.closest('[data-smart-filter]');
    const budgetButton = event.target.closest('[data-budget]');

    if (dietButton) {
      state.diet = dietButton.dataset.diet || 'all';
      state.smartFilter = null;
      state.openCategory = null;
      render();
      return;
    }

    if (smartFilterButton) {
      const value = smartFilterButton.dataset.smartFilter || null;
      state.smartFilter = state.smartFilter === value ? null : value;
      state.diet = 'all';
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

  el.viewSwitcher?.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-menu-view]');
    if (!viewButton) return;
    setMenuView(viewButton.dataset.menuView);
  });

  document.addEventListener('click', event => {
    const searchButton = event.target.closest('[data-smart-search]');
    if (searchButton) {
      runSearch(searchButton.dataset.smartSearch);
      return;
    }

    const offerButton = event.target.closest('[data-open-offer-details]');
    if (offerButton) {
      event.preventDefault();
      window.clearTimeout(offerAutoTimer);
      openOfferDialog(offerButton);
      return;
    }

    if (event.target.closest('#emptyReset')) {
      resetAll();
      return;
    }

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

  document.addEventListener('keydown', event => {
    const dishCard = event.target.closest?.('.dish-card[data-open-dish]');
    if (!dishCard || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    openDish(dishCard.dataset.openDish);
  });

  el.categoriesButton.addEventListener('click', openDrawerPanel);
  el.closeDrawer.addEventListener('click', closeDrawerPanel);
  el.drawerBackdrop.addEventListener('click', closeDrawerPanel);
  el.resetSearch.addEventListener('click', resetAll);
  el.backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  el.closeDishDialog.addEventListener('click', closeDish);
  el.viewOfferDetails?.addEventListener('click', event => {
    event.preventDefault();
    window.clearTimeout(offerAutoTimer);
    openOfferDialog(event.currentTarget);
  });
  el.closeOfferDialog?.addEventListener('click', () => closeOfferDialog());
  el.dismissOfferDialog?.addEventListener('click', () => closeOfferDialog());
  el.exploreOfferMenu?.addEventListener('click', () => closeOfferDialog({ restoreFocus: false }));

  el.dishDialog.addEventListener('click', event => {
    const bounds = el.dishDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeDish();
  });

  el.anniversaryOfferDialog?.addEventListener('cancel', event => {
    event.preventDefault();
    closeOfferDialog();
  });

  el.anniversaryOfferDialog?.addEventListener('click', event => {
    const bounds = el.anniversaryOfferDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeOfferDialog();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && el.anniversaryOfferDialog?.open) {
      closeOfferDialog();
      return;
    }
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
  renderStudentFavourites();
  render();
  scheduleOfferDialog();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
