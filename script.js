const WHATSAPP_NUMBER = "201010414187";
const DELIVERY_FEE = 35;
const POSTER_FALLBACK_IMAGE = "assets/poster-lab-logo.png";
const CUSTOM_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff,image/*";
const frameOptions = {
  None: { label: "Poster only", price: 0, hint: "Poster only, no frame" },
  Black: { label: "Black frame", price: 120 },
  White: { label: "White frame", price: 120 },
  Wood: { label: "Wood frame", price: 140 }
};

const translations = {
  en: {
    brandTitle: "Poster Lab Store",
    brandSubtitle: "Pick, frame, order",
    navShop: "Shop",
    navCart: "Cart",
    langToggle: "AR",
    themeToggle: "Light",
    themeToggleDark: "Dark",

    heroEyebrow: "Simple local poster ordering",
    heroTitle: "Poster Lab Store",
    heroText: "Choose a poster, select the size and frame, then send your order directly on WhatsApp.",
    heroActionShop: "Start order",
    heroActionCart: "Open cart",
    stepChoose: "Choose a poster",
    stepCustomize: "Pick size and frame",
    stepWhatsapp: "Send order on WhatsApp",
    badgeFramed: "Framed",
    badgePrints: "Local Prints",

    searchLabel: "Search",
    searchPlaceholder: "Search by poster name or style...",
    categoryLabel: "Category",
    catAll: "All posters",
    catCustom: "Custom upload",
    catCars: "Cars",
    catPaint: "Paint art",
    catAbstract: "Abstract",
    sizeLabel: "Size",
    sizeAll: "All sizes",
    frameLabel: "Frame",
    frameAll: "All frames",
    frameNone: "None",
    frameBlack: "Black",
    frameWhite: "White",
    frameWood: "Wood",
    sortLabel: "Sort",
    sortFeatured: "Featured",
    sortPriceLow: "Price low to high",
    sortPriceHigh: "Price high to low",
    sortName: "Name",

    freshDropsEyebrow: "Shop posters",
    freshDropsTitle: "Choose your favorite",
    resultCountProduct: "product",
    resultCountProducts: "products",
    noProductsFound: "No framed posters found.",
    tryDifferentSearch: "Try a different search or filter.",
    from: "From",
    sizesAvailable: "4 sizes available",
    customize: "View details",
    orderNow: "Add to cart",
    uploadDesignBtn: "Upload design",
    addPosterBtn: "Add poster",

    detailEyebrow: "ready to order",
    detailPosterSize: "1. Choose size",
    detailFrameColor: "2. Choose frame",
    detailUploadLabel: "Upload photo or design",
    detailUploadHint: "Upload JPG, PNG, or any image design before adding to cart.",
    detailSelectedFile: "Selected: ",
    detailAddBtn: "Add customized framed poster",
    detailAddPosterBtn: "Add this poster",
    pleaseUploadAlert: "Please upload your photo or design first.",

    cartEyebrow: "Your order",
    cartTitle: "Cart",
    cartEmpty: "Your cart is empty.",
    cartStartOrderHint: "Add a framed poster to start an order.",
    cartEach: "each",
    cartTotalLabel: "Total:",
    cartNameLabel: "Name",
    cartNamePlaceholder: "Your name",
    cartPhoneLabel: "Phone",
    cartPhonePlaceholder: "Your phone number",
    cartAddressLabel: "Address",
    cartAddressPlaceholder: "Delivery address",
    cartPaymentLabel: "Payment method",
    cartInstapayOption: "Instapay QR - qnbziad49015@instapay",
    cartVodafoneOption: "Vodafone Cash - 01090927525",
    cartWhatsappHint: "WhatsApp will include items, sizes, frames, totals, payment method, product links, and uploaded design filenames.",
    cartCheckoutBtn: "Review order",
    productLink: "Product page link",
    backToShop: "Back to shop",
    backToShop: "Back to shop",

    confEyebrow: "Final confirmation",
    confTitle: "Check details, then send order",
    confHint: "Your WhatsApp message will include every poster, selected frame, selected size, price total, customer details, product links, and uploaded design filenames.",
    confTotal: "Order total: ",
    confItemsCount: "customized framed poster item",
    confItemsCountPlural: "customized framed poster items",
    confEditBtn: "Edit details",
    confSendBtn: "Send final order to WhatsApp",
    confAddFirstAlert: "Please add at least one framed poster to your cart.",
    addedToCart: "Added to cart",
    confUploadSummaryTitle: "Uploaded designs:",
    uploadProgressLabel: "Uploading poster to server",
    deliveryFeeLabel: "Delivery",
    subtotalLabel: "Subtotal",
    sizeGuideTitle: "Size guide",
    sizeGuideHint: "Choose the size that fits your wall.",
    addToCartSimple: "Add to cart",
    ourWorkTitle: "Our Work",
    ourWorkEyebrow: "Real quality captures",
    ourWorkSubtitle: "See the print finish, frame depth, and room styling from real photos.",
    ourWorkButton: "Watch real quality video",
    ourWorkGalleryLabel: "Captured photos",
    ourWorkReelLabel: "Quality reel",
  },
  ar: {
    brandTitle: "بوستر لاب ستور",
    brandSubtitle: "اختار، برواز، اطلب",
    navShop: "المتجر",
    navCart: "السلة",
    langToggle: "EN",
    themeToggle: "فاتح",
    themeToggleDark: "داكن",

    heroEyebrow: "طلب بوسترات بسهولة",
    heroTitle: "بوستر لاب ستور",
    heroText: "اختر البوستر، حدد المقاس والإطار، ثم أرسل طلبك مباشرة على واتساب.",
    heroActionShop: "ابدأ الطلب",
    heroActionCart: "فتح السلة",
    stepChoose: "اختر البوستر",
    stepCustomize: "حدد المقاس والإطار",
    stepWhatsapp: "أرسل الطلب على واتساب",
    badgeFramed: "مؤطر",
    badgePrints: "طباعة محلية",

    searchLabel: "بحث",
    searchPlaceholder: "ابحث باسم البوستر أو النوع...",
    categoryLabel: "الفئة",
    catAll: "كل البوسترات",
    catCustom: "تصميم خاص",
    catCars: "سيارات",
    catPaint: "لوحات فنية",
    catAbstract: "تجريدي",
    sizeLabel: "المقاس",
    sizeAll: "كل المقاسات",
    frameLabel: "الإطار",
    frameAll: "كل الإطارات",
    frameNone: "بدون إطار",
    frameBlack: "أسود",
    frameWhite: "أبيض",
    frameWood: "خشبي",
    sortLabel: "ترتيب",
    sortFeatured: "مميز",
    sortPriceLow: "السعر: من الأقل للأعلى",
    sortPriceHigh: "السعر: من الأعلى للأقل",
    sortName: "الاسم",

    freshDropsEyebrow: "تسوق البوسترات",
    freshDropsTitle: "اختار المفضل عندك",
    resultCountProduct: "منتج",
    resultCountProducts: "منتجات",
    noProductsFound: "لم يتم العثور على بوسترات.",
    tryDifferentSearch: "جرّب البحث بكلمات أخرى أو تغيير الفلاتر.",
    from: "تبدأ من",
    sizesAvailable: "٤ مقاسات متاحة",
    customize: "عرض التفاصيل",
    orderNow: "أضف للسلة",
    uploadDesignBtn: "رفع التصميم",
    addPosterBtn: "إضافة البوستر",

    detailEyebrow: "جاهز للطلب",
    detailPosterSize: "١. اختار المقاس",
    detailFrameColor: "٢. اختار الإطار",
    detailUploadLabel: "ارفع صورتك أو تصميمك",
    detailUploadHint: "ارفع ملف JPG أو PNG أو أي تصميم قبل الإضافة للسلة.",
    detailSelectedFile: "الملف المختار: ",
    detailAddBtn: "إضافة البوستر المخصص للسلة",
    detailAddPosterBtn: "أضف هذا البوستر",
    pleaseUploadAlert: "يرجى رفع صورتك أو تصميمك أولاً.",

    cartEyebrow: "طلبك",
    cartTitle: "السلة",
    cartEmpty: "سلتك فارغة.",
    cartStartOrderHint: "أضف بوستراً مؤطراً لبدء الطلب.",
    cartEach: "للقطعة",
    cartTotalLabel: "الإجمالي:",
    cartNameLabel: "الاسم",
    cartNamePlaceholder: "اسمك الكريم",
    cartPhoneLabel: "رقم الهاتف",
    cartPhonePlaceholder: "رقم هاتفك للتواصل",
    cartAddressLabel: "العنوان",
    cartAddressPlaceholder: "عنوان التوصيل بالتفصيل",
    cartPaymentLabel: "طريقة الدفع",
    cartInstapayOption: "إنستا باي QR - qnbziad49015@instapay",
    cartVodafoneOption: "فودافون كاش - 01090927525",
    cartWhatsappHint: "سوف تتضمن رسالة الواتساب المنتجات، المقاسات، الإطارات، الإجماليات، طريقة الدفع، تفاصيل العميل، روابط المنتجات، وأسماء ملفات التصاميم المرفوعة.",
    cartCheckoutBtn: "مراجعة الطلب",
    productLink: "رابط صفحة المنتج",
    backToShop: "العودة للتسوق",
    backToShop: "العودة للتسوق",

    confEyebrow: "التأكيد النهائي",
    confTitle: "راجع التفاصيل، ثم أرسل الطلب",
    confHint: "سوف تحتوي رسالتك على الواتساب على كل بوستر، الإطار المختار، المقاس المختار، إجمالي السعر، تفاصيل العميل، روابط المنتجات، وأسماء ملفات التصاميم المرفوعة.",
    confTotal: "إجمالي الطلب: ",
    confItemsCount: "بوستر مخصص مضاف",
    confItemsCountPlural: "بوسترات مخصصة مضافة",
    confEditBtn: "تعديل البيانات",
    confSendBtn: "إرسال الطلب النهائي عبر واتساب",
    confAddFirstAlert: "يرجى إضافة بوستر واحد على الأقل إلى السلة.",
    addedToCart: "تمت الإضافة إلى السلة",
    confUploadSummaryTitle: "التصاميم المرفوعة:",
    uploadProgressLabel: "جاري رفع البوستر إلى السيرفر",
    deliveryFeeLabel: "التوصيل",
    subtotalLabel: "المجموع الفرعي",
    sizeGuideTitle: "دليل المقاسات",
    sizeGuideHint: "اختار المقاس المناسب للحائط عندك.",
    addToCartSimple: "أضف للسلة",
    ourWorkTitle: "شغلنا",
    ourWorkEyebrow: "صور جودة حقيقية",
    ourWorkSubtitle: "شوف خامة الطباعة وعمق البرواز وتنسيق الغرفة من صور حقيقية.",
    ourWorkButton: "شاهد فيديو الجودة الحقيقية",
    ourWorkGalleryLabel: "الصور المصورة",
    ourWorkReelLabel: "استعراض الجودة",
  }
};

const currency = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0
});

const products = [
  {
    id: "custom-upload",
    name: "Upload Your Design",
    nameAr: "رفع تصميمك الخاص",
    category: "custom",
    tag: "Custom upload",
    tagAr: "تصميم خاص",
    image: "assets/custom-upload.jpg",
    gallery: ["assets/custom-upload.jpg"],
    basePrice: 60,
    sizes: { "20x30": 60, "30x40": 80, "40x50": 90, "50x70": 120 },
    frames: ["None", "Black", "White", "Wood"],
    isCustom: true,
    description: "Upload your own photo, artwork, logo, or poster design. Choose poster size and optional frame before sending the final order.",
    descriptionAr: "ارفع صورتك الخاصة، عملك الفني، شعارك أو تصميم البوستر الخاص بك. اختر مقاس البوستر والإطار الاختياري قبل إرسال الطلب النهائي."
  },
  {
    id: "porsche-gt3-rs",
    name: "Porsche GT3 RS",
    nameAr: "Porsche GT3 RS",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/Porsche GT3 RS.png",
    gallery: ["assets/Porsche GT3 RS.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A premium Porsche poster with bold racing style and crisp detail for modern interiors.",
    descriptionAr: "بوستر بورشه فاخر بتصميم سباق جريء وتفاصيل واضحة للمساحات العصرية."
  },
  {
    id: "red-ferrari",
    name: "Red Ferrari",
    nameAr: "Red Ferrari",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/Red Ferrari.png",
    gallery: ["assets/Red Ferrari.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A dynamic Ferrari poster with striking contrast and a performance-inspired look.",
    descriptionAr: "بوستر فيراري ديناميكي بتباين قوي ومظهر مستوحى من الأداء."
  },
  {
    id: "red-bull-racing",
    name: "RedBull Racing",
    nameAr: "RedBull Racing",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/Dark Blue RedBull.png",
    gallery: ["assets/Dark Blue RedBull.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A striking Red Bull racing poster with vivid colors and sharp energy.",
    descriptionAr: "بوستر ريد بول السباقي بألوان زاهية وطاقة حادة."
  },
  {
    id: "space-astronauts",
    name: "Space Astronauts",
    nameAr: "Space Astronauts",
    category: "abstract",
    tag: "Space art",
    tagAr: "فن الفضاء",
    image: "assets/Space Astronauts.png",
    gallery: ["assets/Space Astronauts.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A futuristic astronaut poster with vibrant planets and cosmic energy.",
    descriptionAr: "بوستر رواد فضاء مستقبلي بألوان كوكبية زاهية وطاقة كونية."
  },
  {
    id: "minecraft-avengers",
    name: "Minecraft Avengers",
    nameAr: "Minecraft Avengers",
    category: "abstract",
    tag: "Gaming art",
    tagAr: "فن ألعاب",
    image: "assets/Minecraft Avengers.png",
    gallery: ["assets/Minecraft Avengers.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A bold Minecraft Avengers poster that mixes gaming and pop culture for colorful spaces.",
    descriptionAr: "بوستر Minecraft Avengers جريء يمزج بين الألعاب والثقافة الشعبية لمساحات ملونة."
  },
  {
    id: "monaliza",
    name: "Monaliza",
    nameAr: "Monaliza",
    category: "abstract",
    tag: "Art poster",
    tagAr: "بوستر فني",
    image: "assets/Monaliza.png",
    gallery: ["assets/Monaliza.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A stylish Monaliza poster with classic art inspiration and modern edge.",
    descriptionAr: "بوستر Monaliza أنيق مستوحى من الفن الكلاسيكي مع لمسة عصرية."
  },
  {
    id: "spiderman",
    name: "Spiderman",
    nameAr: "Spiderman",
    category: "abstract",
    tag: "Superhero art",
    tagAr: "فن خارق",
    image: "assets/Spiderman.png",
    gallery: ["assets/Spiderman.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A dynamic Spiderman poster with crisp comic-style visuals for fan spaces.",
    descriptionAr: "بوستر سبايدرمان ديناميكي بصور أسلوب الكوميك الواضحة لمساحات المعجبين."
  },
  {
    id: "blue-porsche-3",
    name: "Blue Porsche Series",
    nameAr: "سلسلة بورشه الزرقاء",
    category: "cars",
    tag: "Car poster set",
    tagAr: "مجموعة بوسترات سيارات",
    image: "assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_01.png",
    gallery: [
      "assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_01.png",
      "assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_02.png",
      "assets/Blue Porsche 3/upscalemedia-transformed blue porsche 3_03.png"
    ],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A three-image Blue Porsche poster set that shows the car in three bold compositions.",
    descriptionAr: "مجموعة بثلاث صور لبورشه زرقاء تعرض السيارة في ثلاث تركيبات جريئة."
  },
  {
    id: "red-ferrari-3",
    name: "Red Ferrari Series",
    nameAr: "سلسلة فيراري الحمراء",
    category: "cars",
    tag: "Car poster set",
    tagAr: "مجموعة بوسترات سيارات",
    image: "assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (1).png",
    gallery: [
      "assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (1).png",
      "assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (2).png",
      "assets/Red Ferrari 3/upscalemedia-transformed ferrari 3 (3).png"
    ],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A three-image Ferrari poster set with dramatic red speed styling.",
    descriptionAr: "مجموعة بثلاث صور لبوستر فيراري بتصميم أحمر درامي وسرعة مميزة."
  },
  {
    id: "yellow-porsche-3",
    name: "Yellow Porsche Series",
    nameAr: "سلسلة بورشه الصفراء",
    category: "cars",
    tag: "Car poster set",
    tagAr: "مجموعة بوسترات سيارات",
    image: "assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_01.png",
    gallery: [
      "assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_01.png",
      "assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_02.png",
      "assets/Yellow Porsche 3/upscalemedia-transformed yellow 3_03.png"
    ],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A three-image Yellow Porsche poster set with bright racing energy.",
    descriptionAr: "مجموعة بثلاث صور لبوستر بورشه صفراء بطاقة سباقية مشرقة."
  },
  {
    id: "atelier-splash",
    name: "Atelier Splash",
    nameAr: "أتولييه سبلاش",
    category: "paint",
    tag: "Studio art",
    tagAr: "فن ستوديو",
    image: "assets/atelier-splash.png",
    gallery: ["assets/atelier-splash.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "Bright painterly motion with a clean frame-friendly layout.",
    descriptionAr: "حركة لونية مبهجة بتكوين مناسب جدًا للتأطير."
  },
  {
    id: "classic-redline",
    name: "Classic Redline",
    nameAr: "كلاسيك ريدلاين",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/classic-redline.png",
    gallery: ["assets/classic-redline.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A sharp monochrome racing poster that works well in black frames.",
    descriptionAr: "بوستر سباق أحادي اللون يبدو أنيقًا داخل الإطار الأسود."
  },
  {
    id: "color-riot",
    name: "Color Riot",
    nameAr: "كولور رايوت",
    category: "abstract",
    tag: "Abstract art",
    tagAr: "فن تجريدي",
    image: "assets/color-riot.png",
    gallery: ["assets/color-riot.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A loud color splash print for playful rooms and studios.",
    descriptionAr: "طباعة تجريدية مليئة بالألوان للمساحات الحيوية."
  },
  {
    id: "gallery-wave",
    name: "Gallery Wave",
    nameAr: "غاليري ويف",
    category: "paint",
    tag: "Art print",
    tagAr: "طباعة فنية",
    image: "assets/gallery-wave.png",
    gallery: ["assets/gallery-wave.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A calm framed wave print with a soft gallery look.",
    descriptionAr: "طباعة أمواج هادئة بطابع مناسب للمعارض والإطارات."
  },
  {
    id: "midnight-turbo",
    name: "Midnight Turbo",
    nameAr: "ميدنايت تيربو",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/midnight-turbo.png",
    gallery: ["assets/midnight-turbo.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A darker performance poster that feels premium in a frame.",
    descriptionAr: "بوستر أداء داكن يمنح الإطار مظهرًا فاخرًا."
  },
  {
    id: "neon-drift",
    name: "Neon Drift",
    nameAr: "نيون دريفت",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/neon-drift.png",
    gallery: ["assets/neon-drift.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A neon-toned racing poster with a bold street style.",
    descriptionAr: "بوستر سباقي بنكهة نيون ولمسة شارع جريئة."
  },
  {
    id: "orange-f1",
    name: "Orange F1",
    nameAr: "أورنج إف 1",
    category: "cars",
    tag: "F1 poster",
    tagAr: "بوستر فورمولا 1",
    image: "assets/Orange F1.png",
    gallery: ["assets/Orange F1.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "Fast orange racing art for a clean modern wall.",
    descriptionAr: "فن سباقي برتقالي سريع يناسب الجدران العصرية."
  },
  {
    id: "yellow-cadillac-landscape",
    name: "Yellow Cadillac Landscape",
    nameAr: "منظر كاديلاك أصفر",
    category: "cars",
    tag: "Landscape poster",
    tagAr: "بوستر منظر",
    image: "assets/Yellow Cadillac Landscape.png",
    gallery: ["assets/Yellow Cadillac Landscape.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A cinematic landscape-style car print with room for framing.",
    descriptionAr: "طباعة سيارة بأسلوب سينمائي مناسب جدًا للتأطير."
  },
  {
    id: "redbull-night-shift",
    name: "Red Bull Night Shift",
    nameAr: "ريد بول نايت شفت",
    category: "cars",
    tag: "Racing poster",
    tagAr: "بوستر سباق",
    image: "assets/Dark Blue RedBull.png",
    gallery: ["assets/Dark Blue RedBull.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A dark racing poster that looks clean in minimal interiors.",
    descriptionAr: "بوستر سباق داكن يبدو نظيفًا في المساحات البسيطة."
  },
  {
    id: "modern-monaliza",
    name: "Win The Day",
    nameAr: "اكسب اليوم",
    category: "abstract",
    tag: "Quote poster",
    tagAr: "بوستر اقتباس",
    image: "assets/Monaliza.png",
    gallery: ["assets/Monaliza.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A clean quote-style poster for focus and momentum.",
    descriptionAr: "بوستر اقتباس نظيف يمنح المساحة طاقة وتركيزًا."
  },
  {
    id: "spider-verse-wall",
    name: "Mamba Mentality",
    nameAr: "عقلية مامبا",
    category: "abstract",
    tag: "Quote poster",
    tagAr: "بوستر اقتباس",
    image: "assets/Spiderman.png",
    gallery: ["assets/Spiderman.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A basketball quote poster with a strong frame-ready look.",
    descriptionAr: "بوستر اقتباس بسمة كرة السلة ومظهر مناسب للتأطير."
  },
  {
    id: "cosmic-orbit",
    name: "Just Do It",
    nameAr: "فقط افعلها",
    category: "abstract",
    tag: "Quote poster",
    tagAr: "بوستر اقتباس",
    image: "assets/Space Astronauts.png",
    gallery: ["assets/Space Astronauts.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A football-inspired quote poster with simple wall energy.",
    descriptionAr: "بوستر اقتباس مستوحى من كرة القدم بطاقة بسيطة وواضحة."
  },
  {
    id: "ferrari-heat",
    name: "Ferrari Heat",
    nameAr: "فيراري هيت",
    category: "cars",
    tag: "Car poster",
    tagAr: "بوستر سيارة",
    image: "assets/Red Ferrari.png",
    gallery: ["assets/Red Ferrari.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A sharp Ferrari print with a strong display-frame look.",
    descriptionAr: "طباعة فيراري واضحة ومناسبة جدًا للإطار."
  },
  {
    id: "voxel-heroes",
    name: "Game Time",
    nameAr: "وقت اللعب",
    category: "abstract",
    tag: "Quote poster",
    tagAr: "بوستر اقتباس",
    image: "assets/Minecraft Avengers.png",
    gallery: ["assets/Minecraft Avengers.png"],
    basePrice: 50,
    sizes: { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },
    frames: ["None", "Black", "White", "Wood"],
    description: "A sports quote poster with a focused, modern wall feel.",
    descriptionAr: "بوستر اقتباس رياضي بمظهر حديث ومركز."
  }
];

const OUR_WORK_MEDIA = [
  {
    src: "assets/our-work/our-work-01.jpg",
    title: "Framed room capture 01"
  },
  {
    src: "assets/our-work/our-work-02.png",
    title: "Framed room capture 02"
  },
  {
    src: "assets/our-work/our-work-03.png",
    title: "Framed room capture 03"
  },
  {
    src: "assets/our-work/our-work-04.png",
    title: "Framed room capture 04"
  },
  {
    src: "assets/our-work/our-work-05.png",
    title: "Framed room capture 05"
  },
  {
    src: "assets/our-work/our-work-06.png",
    title: "Framed room capture 06"
  },
  {
    src: "assets/our-work/our-work-07.png",
    title: "Framed room capture 07"
  },
  {
    src: "assets/our-work/our-work-08.png",
    title: "Framed room capture 08"
  },
  {
    src: "assets/our-work/our-work-09.png",
    title: "Framed room capture 09"
  },
  {
    src: "assets/our-work/our-work-10.png",
    title: "Framed room capture 10"
  }
];

const LOCAL_STORAGE_LANG_KEY = "poster-lab-lang";
const LOCAL_STORAGE_THEME_KEY = "poster-lab-theme";
const LOCAL_STORAGE_UPLOAD_KEY = "poster-lab-custom-upload";
const LOCAL_STORAGE_CART_KEY = "poster-lab-cart";

const DB_NAME = "PosterLabStoreDB";
const DB_VERSION = 1;
const STORE_NAME = "custom_uploads";

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function storeImageInDB(key, blob) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }).catch((err) => {
    console.error("IndexedDB store error:", err);
    return false;
  });
}

function getImageFromDB(key) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }).catch((err) => {
    console.error("IndexedDB get error:", err);
    return null;
  });
}

function deleteImageFromDB(key) {
  return getDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }).catch((err) => {
    console.error("IndexedDB delete error:", err);
    return false;
  });
}

async function initializeCartImages() {
  for (const item of state.cart) {
    if (item.upload && !item.upload.url) {
      const blob = await getImageFromDB(item.key);
      if (blob) {
        item.upload.url = URL.createObjectURL(blob);
      }
    }
  }
  renderCart();
  if (state.confirmedForm) {
    renderConfirmation();
  }
}

function loadCustomUpload() {
  return null;
}

function saveCustomUpload(upload) {
  // Do not persist upload metadata to prevent reloading broken object URLs
}

function loadCart() {
  const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      upload: item.upload ? { ...item.upload, url: "" } : null
    }));
  } catch {
    return [];
  }
}

function saveCart() {
  const cleanCart = state.cart.map((item) => {
    if (item.upload) {
      return {
        ...item,
        upload: {
          name: item.upload.name,
          size: item.upload.size,
          type: item.upload.type,
          url: "" // Keep the localStorage clean of huge base64/blob strings
        }
      };
    }
    return item;
  });
  localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cleanCart));
}

const state = {
  lang: localStorage.getItem(LOCAL_STORAGE_LANG_KEY) || "en",
  theme: localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || "dark",
  search: "",
  category: "all",
  size: "all",
  frame: "all",
  sort: "featured",
  cart: loadCart(),
  selectedProduct: null,
  detailSize: "30x40",
  detailFrame: "Black",
  customUpload: loadCustomUpload(),
  confirmedForm: null
};

const productGrid = document.querySelector("#productGrid");
const resultCount = document.querySelector("#resultCount");
const productDetail = document.querySelector("#productDetail");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartCount = document.querySelector("[data-cart-count]");
const cartButton = document.querySelector(".cart-button");
const checkoutForm = document.querySelector("#checkoutForm");
const paymentConfirmation = document.querySelector("#paymentConfirmation");
const confirmationSummary = document.querySelector("#confirmationSummary");
const toastContainer = document.querySelector(".toast-notification");
const ourWorkGrid = document.querySelector("[data-our-work-grid]");
const ourWorkReelImage = document.querySelector("[data-our-work-reel-image]");
const ourWorkReelCaption = document.querySelector("[data-our-work-reel-caption]");
const ourWorkReelControls = document.querySelector("[data-our-work-reel-controls]");
let ourWorkReelIndex = 0;
let ourWorkReelTimer = null;

function getProductName(product) {
  const currentLang = state.lang || "en";
  return currentLang === "ar" && product.nameAr ? product.nameAr : product.name;
}

function flashCartBubble() {
  if (!cartCount) return;
  cartCount.classList.add("bump");
  window.setTimeout(() => cartCount.classList.remove("bump"), 320);
}

function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 2400);
}

function money(amount) {
  return currency.format(amount).replace("EGP", "EGP ");
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function productImageUrl(path) {
  return new URL(path, window.location.href).href;
}

function displayImageForItem(product, item = null) {
  return item?.upload?.url || product.image;
}

function itemUnitPrice(product, size, frame) {
  return product.sizes[size] + frameOptions[frame].price;
}

function cartSubtotal() {
  return state.cart.reduce((sum, item) => sum + cartLineTotal(item), 0);
}

function orderDeliveryFee() {
  return state.cart.length ? DELIVERY_FEE : 0;
}

function sizeGuideMarkup() {
  return `
    <button class="size-guide-button" type="button" data-size-guide-toggle>
      <span aria-hidden="true">▦</span>
      ${t("sizeGuideTitle")}
    </button>
  `;
}

function openSizeGuide() {
  let modal = document.querySelector("[data-size-guide-modal]");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "size-guide-modal";
    modal.dataset.sizeGuideModal = "true";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", t("sizeGuideTitle"));
    modal.innerHTML = `
      <div class="size-guide-preview">
        <button class="icon-button size-guide-close" type="button" data-size-guide-close aria-label="Close size guide">x</button>
        <img src="assets/size-guide.png" alt="${t("sizeGuideTitle")}">
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeSizeGuide() {
  const modal = document.querySelector("[data-size-guide-modal]");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function getPageProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function t(key) {
  const currentLang = state.lang || "en";
  return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
}

function galleryBadge(product) {
  if (!product.gallery || product.gallery.length <= 1) return "";
  const currentLang = state.lang || "en";
  const count = product.gallery.length;
  if (currentLang === "ar") {
    return `${count} ${count === 1 ? "صورة" : "صور"}`;
  }
  return `${count} images`;
}

function sceneImageForIndex(index = 0) {
  if (!OUR_WORK_MEDIA.length) return "";
  const media = OUR_WORK_MEDIA[Math.abs(index) % OUR_WORK_MEDIA.length];
  return media?.src || "";
}

function getFrameOptionLabel(frameKey) {
  const currentLang = state.lang || "en";
  if (currentLang === "ar") {
    if (frameKey === "None") return "بوستر فقط";
    if (frameKey === "Black") return "إطار أسود";
    if (frameKey === "White") return "إطار أبيض";
    if (frameKey === "Wood") return "إطار خشبي";
  }
  return frameOptions[frameKey]?.label || frameKey;
}

function getFrameOptionHint(frameKey) {
  const currentLang = state.lang || "en";
  if (currentLang === "ar") {
    if (frameKey === "None") return "بوستر فقط بدون إطار";
  }
  return frameOptions[frameKey]?.hint || "";
}

function updateLanguageUI() {
  const currentLang = state.lang || "en";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";

  // Update static elements with data-t
  document.querySelectorAll("[data-t]").forEach((elem) => {
    const key = elem.dataset.t;
    elem.textContent = t(key);
  });

  // Update static elements with data-t-placeholder
  document.querySelectorAll("[data-t-placeholder]").forEach((elem) => {
    const key = elem.dataset.tPlaceholder;
    elem.placeholder = t(key);
  });

  // Specifically handle search input placeholder
  const searchInput = document.querySelector("#searchInput");
  if (searchInput) {
    searchInput.placeholder = t("searchPlaceholder");
  }
}

function updateThemeUI() {
  const theme = state.theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const label = theme === "dark" ? t("themeToggle") : t("themeToggleDark");
    const icon = button.querySelector("[data-theme-icon]");
    const text = button.querySelector("[data-t]");
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
    if (text) text.textContent = label;
  });
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(LOCAL_STORAGE_THEME_KEY, state.theme);
  updateThemeUI();
}

function toggleLanguage() {
  state.lang = state.lang === "en" ? "ar" : "en";
  localStorage.setItem(LOCAL_STORAGE_LANG_KEY, state.lang);
  updateLanguageUI();
  updateThemeUI();
  if (productGrid) renderProducts();
  renderCart();
  if (state.selectedProduct) {
    renderDetail(state.selectedProduct);
  }
  if (ourWorkGrid) {
    renderOurWork();
  }
}

function preloadProductImages(list = products) {
  const preload = () => {
    list.flatMap((product) => product.gallery?.length ? product.gallery : [product.image])
      .filter(Boolean)
      .slice(0, 18)
      .forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
      });
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(preload);
  } else {
    window.setTimeout(preload, 300);
  }
}

function filteredProducts() {
  const search = state.search.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const haystack = [
      product.name, product.nameAr,
      product.category,
      product.tag, product.tagAr,
      product.description, product.descriptionAr
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesCategory = state.category === "all" || product.category === state.category;
    const matchesSize = state.size === "all" || Object.keys(product.sizes).includes(state.size);
    const matchesFrame = state.frame === "all" || product.frames.includes(state.frame);
    return matchesSearch && matchesCategory && matchesSize && matchesFrame;
  });

  return filtered.sort((a, b) => {
    if (state.sort === "price-low") return a.basePrice - b.basePrice;
    if (state.sort === "price-high") return b.basePrice - a.basePrice;
    if (state.sort === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
}

function renderProducts() {
  if (!productGrid) return;
  const list = filteredProducts();
  const currentLang = state.lang || "en";
  const productCountText = currentLang === "ar"
    ? `${list.length} ${list.length === 1 ? t("resultCountProduct") : t("resultCountProducts")}`
    : `${list.length} ${list.length === 1 ? "product" : "products"}`;
  if (resultCount) resultCount.textContent = productCountText;

  if (!list.length) {
    productGrid.innerHTML = `<div class="empty-state"><strong>${t("noProductsFound")}</strong><p>${t("tryDifferentSearch")}</p></div>`;
    return;
  }

  productGrid.innerHTML = list.map((product, index) => {
    const name = getProductName(product);
    const tag = currentLang === "ar" && product.tagAr ? product.tagAr : product.tag;
    const desc = currentLang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
    const sceneImage = sceneImageForIndex(index);

    return `
      <article class="product-card" style="--delay: ${index * 65}ms">
        <a class="product-media" href="product.html?id=${product.id}" aria-label="View ${name}" style="${sceneImage ? `--scene-image: url('${sceneImage}')` : ""}">
          <span class="frame-preview frame-preview-black"></span>
          <img src="${product.image}" loading="lazy" decoding="async" alt="${name} ${currentLang === "ar" ? "بوستر مؤطر" : "framed poster"}" onerror="this.onerror=null;this.src='${POSTER_FALLBACK_IMAGE}'">
          <span class="product-tag">${tag}</span>
          ${galleryBadge(product) ? `<span class="product-gallery-badge">${galleryBadge(product)}</span>` : ""}
        </a>
        <div class="product-info">
          <h2>${name}</h2>
          <p class="product-summary">${desc}</p>
          <div class="product-meta">
            <span>${t("from")} ${money(product.basePrice)}</span>
            <span>${t("sizesAvailable")}</span>
          </div>
          <div class="swatch-row" aria-label="Available frames">
            ${product.frames.map((frame) => `<span class="frame-swatch ${frame.toLowerCase()}">${getFrameOptionLabel(frame)}</span>`).join("")}
          </div>
          <div class="card-actions">
            ${product.isCustom ? "" : `<button class="quick-order-btn" type="button" data-quick-add="${product.id}">${t("orderNow")}</button>`}
            <a class="view-customize-btn" href="product.html?id=${product.id}">${product.isCustom ? t("uploadDesignBtn") : t("customize")}</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function showOurWorkImage(index) {
  if (!OUR_WORK_MEDIA.length) return;
  ourWorkReelIndex = (index + OUR_WORK_MEDIA.length) % OUR_WORK_MEDIA.length;
  const media = OUR_WORK_MEDIA[ourWorkReelIndex];
  if (ourWorkReelImage) {
    ourWorkReelImage.src = media.src;
    ourWorkReelImage.alt = media.title;
  }
  if (ourWorkReelCaption) {
    ourWorkReelCaption.textContent = media.title;
  }
}

function updateOurWorkReelToggleLabel() {
  if (!ourWorkReelControls) return;
  const toggle = ourWorkReelControls.querySelector("[data-work-reel-toggle]");
  if (!toggle) return;
  const currentLang = state.lang || "en";
  if (ourWorkReelTimer) {
    toggle.textContent = currentLang === "ar" ? "إيقاف" : "Pause";
    toggle.setAttribute("aria-label", currentLang === "ar" ? "إيقاف الاستعراض" : "Pause reel");
  } else {
    toggle.textContent = currentLang === "ar" ? "تشغيل" : "Play";
    toggle.setAttribute("aria-label", currentLang === "ar" ? "تشغيل الاستعراض" : "Play reel");
  }
}

function stopOurWorkReel() {
  if (ourWorkReelTimer) {
    window.clearInterval(ourWorkReelTimer);
    ourWorkReelTimer = null;
  }
  if (ourWorkReelControls) {
    ourWorkReelControls.setAttribute("data-playing", "false");
  }
  updateOurWorkReelToggleLabel();
}

function startOurWorkReel() {
  if (!ourWorkReelImage || !OUR_WORK_MEDIA.length) return;
  stopOurWorkReel();
  ourWorkReelTimer = window.setInterval(() => {
    showOurWorkImage(ourWorkReelIndex + 1);
  }, 2800);
  if (ourWorkReelControls) {
    ourWorkReelControls.setAttribute("data-playing", "true");
  }
  updateOurWorkReelToggleLabel();
}

function renderOurWork() {
  if (!ourWorkGrid) return;

  ourWorkGrid.innerHTML = OUR_WORK_MEDIA.map((media, index) => `
    <button type="button" class="our-work-tile" data-work-slide="${index}" aria-label="${media.title}">
      <img src="${media.src}" loading="lazy" decoding="async" alt="${media.title}" onerror="this.onerror=null;this.src='${POSTER_FALLBACK_IMAGE}'">
    </button>
  `).join("");

  showOurWorkImage(0);
  startOurWorkReel();
  updateOurWorkReelToggleLabel();
}

function renderDetail(productId) {
  const product = getProduct(productId);
  if (!product) {
    productDetail.hidden = true;
    return;
  }

  const currentLang = state.lang || "en";
  const name = getProductName(product);
  const tag = currentLang === "ar" && product.tagAr ? product.tagAr : product.tag;
  const desc = currentLang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;

  state.selectedProduct = product.id;
  if (!product.sizes[state.detailSize]) state.detailSize = Object.keys(product.sizes)[0];
  if (!product.frames.includes(state.detailFrame)) state.detailFrame = product.frames[0];

  if (productDetail) {
    document.title = `${name} — ${t("brandTitle")}`;
    productDetail.hidden = false;
    const previewImage = product.isCustom && state.customUpload ? state.customUpload.url : product.image;
    const sceneImage = sceneImageForIndex(products.findIndex((item) => item.id === product.id));
    productDetail.innerHTML = `
      <article class="detail product-detail-layout">
      <div class="detail-gallery">
        <div class="detail-main-image frame-${state.detailFrame.toLowerCase()}" style="${sceneImage ? `--scene-image: url('${sceneImage}')` : ""}">
          <img id="detailMainImage" src="${previewImage}" loading="eager" decoding="async" fetchpriority="high" alt="${name} ${currentLang === "ar" ? "معرض البوستر" : "framed poster gallery image"}" onerror="this.onerror=null;this.src='${POSTER_FALLBACK_IMAGE}'">
        </div>
        ${product.gallery && product.gallery.length > 1 ? `
          <div class="thumb-row">
            ${product.gallery.map((image) => `
              <button type="button" class="${image === previewImage ? "is-active" : ""}" data-gallery-image="${image}" aria-label="Show gallery image">
                <img src="${image}" loading="lazy" decoding="async" alt="${name} thumbnail" onerror="this.onerror=null;this.src='${POSTER_FALLBACK_IMAGE}'">
              </button>
            `).join("")}
          </div>
        ` : ""}
        <a class="watch-quality-link detail-work-link" href="our-work.html" data-t="ourWorkButton">${t("ourWorkButton")}</a>
      </div>
      <div class="detail-copy product-order-panel">
        <a class="back-link" href="index.html">${t("backToShop")}</a>
        <p class="eyebrow">${tag}</p>
        <h1 class="${product.isCustom ? "custom-product-title" : ""}">${name}</h1>
        <div class="price-line">
          <span>${money(itemUnitPrice(product, state.detailSize, state.detailFrame))}</span>
          <small>${state.detailSize} ${currentLang === "ar" ? "سم مع" : "cm with"} ${getFrameOptionLabel(state.detailFrame)}</small>
        </div>
        <p class="detail-short-desc">${desc}</p>
        ${sizeGuideMarkup()}
        <div class="variant-row">
          <span class="eyebrow">${t("detailPosterSize")}</span>
          <div class="variant-options size-options">
            ${Object.entries(product.sizes).map(([size, price]) => `
              <button type="button" class="${size === state.detailSize ? "is-selected" : ""}" data-size="${size}">
                ${size}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="variant-row">
          <span class="eyebrow">${t("detailFrameColor")}</span>
          <div class="variant-options frame-options">
            ${product.frames.map((frame) => `
              <button type="button" class="${frame === state.detailFrame ? "is-selected" : ""}" data-frame="${frame}">
                <span class="dot ${frame.toLowerCase()}"></span>
                <span>${getFrameOptionLabel(frame)}</span>
              </button>
            `).join("")}
          </div>
        </div>
        ${product.isCustom ? `
          <div class="upload-section">
            <label class="upload-box ${state.customUpload ? "has-file" : ""}">
              ${state.customUpload && state.customUpload.url && !state.customUpload.previewError ? `
                <img class="upload-preview-thumb" src="${state.customUpload.url}" alt="Preview">
              ` : ""}
              <div class="upload-box-content">
                <span>${state.customUpload ? t("detailSelectedFile") : t("detailUploadLabel")}</span>
                <small>${state.customUpload ? state.customUpload.name : t("detailUploadHint")}</small>
              </div>
              <input type="file" accept="${CUSTOM_UPLOAD_ACCEPT}" data-upload-design>
            </label>
            ${state.customUpload ? `
              <button class="detail-add" type="button" data-detail-add>${t("detailAddBtn")}</button>
              <button class="remove-upload-btn" type="button" data-remove-upload>${state.lang === "ar" ? "إزالة التصميم" : "Remove design"}</button>
            ` : ""}
          </div>
          <p class="custom-upload-note">${currentLang === "ar" ? "ارفع التصميم، ثم أضف البوستر إلى السلة." : "Upload your design, then add the poster to the cart."}</p>
        ` : `
          <button class="detail-add" type="button" data-detail-add>${t("addToCartSimple")}</button>
        `}
      </div>
    </article>
  `;

    if (productGrid) {
      productDetail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

async function addToCart(productId, size = "30x40", frame = "Black") {
  const product = getProduct(productId);
  if (!product) return;
  if (product.isCustom && !state.customUpload) {
    renderDetail(product.id);
    showToast(t("pleaseUploadAlert"));
    return;
  }
  const resolvedSize = product.sizes[size] ? size : Object.keys(product.sizes)[0];
  const resolvedFrame = product.frames.includes(frame) ? frame : product.frames[0];
  const upload = product.isCustom && state.customUpload ? {
    name: state.customUpload.name,
    size: state.customUpload.size,
    type: state.customUpload.type,
    url: state.customUpload.url,
    dataUrl: state.customUpload.dataUrl,
    file: state.customUploadFile || null
  } : null;
  const key = product.isCustom
    ? `${product.id}-${resolvedSize}-${resolvedFrame}-${Date.now()}`
    : `${product.id}-${resolvedSize}-${resolvedFrame}`;

  if (product.isCustom && state.customUploadFile) {
    await storeImageInDB(key, state.customUploadFile);
  }

  const existing = state.cart.find((item) => item.key === key);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      key,
      productId: product.id,
      size: resolvedSize,
      frame: resolvedFrame,
      upload,
      quantity: 1
    });
  }

  hideConfirmation();
  saveCart();
  renderCart();
  openCart();
  flashCartBubble();
  showToast(`${t("addedToCart")} — ${getProductName(product)}`);
}

function cartLineTotal(item) {
  const product = getProduct(item.productId);
  if (!product) return 0;
  return itemUnitPrice(product, item.size, item.frame) * item.quantity;
}

function cartGrandTotal() {
  return cartSubtotal() + orderDeliveryFee();
}

function renderCart() {
  const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalQuantity;
  if (cartTotal) cartTotal.textContent = money(cartGrandTotal());
  if (!cartItems) return;
  const currentLang = state.lang || "en";

  if (!state.cart.length) {
    cartItems.innerHTML = `<div class="empty-state"><strong>${t("cartEmpty")}</strong><p>${t("cartStartOrderHint")}</p></div>`;
    return;
  }

  cartItems.innerHTML = state.cart.map((item) => {
    const product = getProduct(item.productId);
    if (!product) return "";
    const name = getProductName(product);
    return `
      <article class="cart-item">
        <img src="${displayImageForItem(product, item)}" alt="${name}" onerror="this.onerror=null;this.src='${POSTER_FALLBACK_IMAGE}'">
        <div>
          <h3>${name}</h3>
          <p>${item.size} ${currentLang === "ar" ? "سم" : "cm"} / ${getFrameOptionLabel(item.frame)}</p>
          ${item.upload ? `<p>${currentLang === "ar" ? "الملف المرفوع:" : "Uploaded:"} ${item.upload.name}</p>` : ""}
          <p>${money(itemUnitPrice(product, item.size, item.frame))} ${t("cartEach")}</p>
        </div>
        <div class="quantity-controls" aria-label="Quantity controls">
          <button type="button" data-qty-minus="${item.key}">-</button>
          <strong>${item.quantity}</strong>
          <button type="button" data-qty-plus="${item.key}">+</button>
        </div>
      </article>
    `;
  }).join("") + `
    <div class="cart-fee-summary">
      <span>${t("subtotalLabel")}</span><strong>${money(cartSubtotal())}</strong>
      <span>${t("deliveryFeeLabel")}</span><strong>${money(orderDeliveryFee())}</strong>
    </div>
  `;
}

function openCart() {
  if (!cartDrawer) return;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

async function updateQuantity(key, delta) {
  const item = state.cart.find((cartItem) => cartItem.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.key !== key);
    await deleteImageFromDB(key);
  }
  hideConfirmation();
  saveCart();
  renderCart();
}

function readCheckoutForm() {
  const fields = checkoutForm.elements;
  return {
    customerName: fields.customerName.value.trim(),
    customerPhone: fields.customerPhone.value.trim(),
    customerAddress: fields.customerAddress.value.trim(),
    paymentMethod: fields.paymentMethod.value
  };
}

function renderConfirmation() {
  const details = readCheckoutForm();
  state.confirmedForm = details;
  const uploadedItems = state.cart.filter((item) => item.upload);
  const currentLang = state.lang || "en";
  const orderTotalLabel = t("confTotal");
  const itemsCountText = currentLang === "ar"
    ? `${state.cart.length} ${state.cart.length === 1 ? t("confItemsCount") : t("confItemsCountPlural")}`
    : `${state.cart.length} customized framed poster ${state.cart.length === 1 ? "item" : "items"}`;

  const uploadHintMsg = currentLang === "ar"
    ? "💡 اضغط مطولاً على الصورة لحفظها ومشاركتها في واتساب!"
    : "💡 Long-press the image to save or share it directly to WhatsApp!";

  confirmationSummary.innerHTML = `
    <strong>${orderTotalLabel} ${money(cartGrandTotal())}</strong>
    <span>${t("subtotalLabel")}: ${money(cartSubtotal())}</span>
    <span>${t("deliveryFeeLabel")}: ${money(orderDeliveryFee())}</span>
    <span>${details.customerName} / ${details.customerPhone}</span>
    <span>${details.paymentMethod}</span>
    <span>${itemsCountText}</span>
    ${uploadedItems.length ? `
      <div class="uploaded-summary">
        <p class="uploaded-summary-title" style="font-weight: 800; font-size: 0.85rem; margin: 4px 0;">${t("confUploadSummaryTitle")}</p>
        <p class="long-press-tip" style="color: var(--lime); font-size: 0.85rem; font-weight: 800; margin-bottom: 8px;">${uploadHintMsg}</p>
        ${uploadedItems.map((item) => {
    const product = getProduct(item.productId);
    const name = product.name;
    return `
            <article style="display: flex; flex-direction: column; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 12px; border: 1px solid var(--lime); margin-bottom: 8px;">
              <img src="${item.upload.url}" alt="${name} ${currentLang === "ar" ? "معاينة التصميم" : "uploaded design preview"}" style="max-width: 100%; height: auto; max-height: 200px; border-radius: 8px; object-fit: contain; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 0.85rem; color: #fff;">${item.upload.name}</span>
            </article>
          `;
  }).join("")}
      </div>
    ` : ""}
  `;

  // Toggle visibility of payment methods dynamically
  const cashCard = paymentConfirmation.querySelector("[data-payment-cash]");
  const qrCard = paymentConfirmation.querySelector("[data-payment-qr]");
  if (cashCard && qrCard) {
    if (details.paymentMethod.includes("Vodafone Cash")) {
      cashCard.removeAttribute("hidden");
      qrCard.setAttribute("hidden", "true");
    } else if (details.paymentMethod.includes("Instapay")) {
      qrCard.removeAttribute("hidden");
      cashCard.setAttribute("hidden", "true");
    } else {
      cashCard.setAttribute("hidden", "true");
      qrCard.setAttribute("hidden", "true");
    }
  }

  checkoutForm.hidden = true;
  paymentConfirmation.hidden = false;
}

function hideConfirmation() {
  state.confirmedForm = null;
  checkoutForm.hidden = false;
  paymentConfirmation.hidden = true;

  const cashCard = paymentConfirmation.querySelector("[data-payment-cash]");
  const qrCard = paymentConfirmation.querySelector("[data-payment-qr]");
  if (cashCard) cashCard.setAttribute("hidden", "true");
  if (qrCard) qrCard.setAttribute("hidden", "true");
}

function setUploadProgress(percent = 0, active = false) {
  document.querySelectorAll("[data-upload-progress]").forEach((progress) => {
    const bar = progress.querySelector("[data-upload-progress-bar]");
    const value = Math.max(0, Math.min(100, percent));
    progress.hidden = !active;
    progress.setAttribute("aria-valuenow", String(Math.round(value)));
    if (bar) bar.style.width = `${value}%`;
  });
}

function resetCartAfterOrder() {
  state.cart.forEach((item) => {
    if (item.upload?.url && item.upload.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.upload.url);
    }
    if (item.upload) deleteImageFromDB(item.key);
  });
  state.cart = [];
  state.confirmedForm = null;
  localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
  hideConfirmation();
  renderCart();
  closeCart();
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

async function uploadImageToTemporaryServer(blob, fileName) {
  try {
    const formData = new FormData();
    formData.append("file", blob, fileName || "design.png");

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed");
    const json = await response.json();
    if (json.data && json.data.url) {
      return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
  } catch (err) {
    console.error("Temporary upload failed:", err);
  }
  return null;
}

async function fetchAndUploadImage(imgUrl, fileName) {
  try {
    const response = await fetch(imgUrl);
    const blob = await response.blob();
    return await uploadImageToTemporaryServer(blob, fileName);
  } catch (err) {
    console.error("Failed to fetch/upload image:", imgUrl, err);
    return imgUrl;
  }
}

async function getUploadBlobForItem(item) {
  if (item.upload?.file) return item.upload.file;
  const storedBlob = await getImageFromDB(item.key);
  if (storedBlob) return storedBlob;
  if (item.upload?.url) {
    const response = await fetch(item.upload.url);
    return await response.blob();
  }
  return null;
}

function buildWhatsAppMessage() {
  const details = state.confirmedForm || readCheckoutForm();
  const currentLang = state.lang || "en";
  const isAr = currentLang === "ar";

  const tMsg = {
    title: isAr ? "طلب جديد من متجر بوستر لاب" : "New Order - Poster Lab Store",
    customer: isAr ? "اسم العميل" : "Customer Name",
    phone: isAr ? "رقم الهاتف" : "Phone",
    address: isAr ? "العنوان" : "Address",
    payment: isAr ? "طريقة الدفع" : "Payment Method",
    subtotal: isAr ? "المجموع الفرعي" : "Subtotal",
    delivery: isAr ? "التوصيل" : "Delivery",
    product: isAr ? "المنتج" : "Product",
    customization: isAr ? "التخصيص" : "Customization",
    link: isAr ? "رابط المنتج" : "Product Link",
    totalPrice: isAr ? "السعر الإجمالي" : "Total Price"
  };

  const lines = [
    `*${tMsg.title}*`,
    `----------------------------------`,
    `*${tMsg.customer}:* ${details.customerName}`,
    `*${tMsg.phone}:* ${details.customerPhone}`,
    `*${tMsg.address}:* ${details.customerAddress}`,
    `*${tMsg.payment}:* ${details.paymentMethod}`,
    `----------------------------------`
  ];

  state.cart.forEach((item, index) => {
    const product = getProduct(item.productId);
    if (!product) return;
    const name = getProductName(product);
    const resolvedSize = `${item.size} cm`;
    const resolvedFrame = getFrameOptionLabel(item.frame);

    lines.push(
      `*${tMsg.product} ${index + 1}:* ${name}`,
      `*${tMsg.customization}:* ${resolvedSize} | ${resolvedFrame}`,
      `*${tMsg.link}:* ${productImageUrl(`product.html?id=${product.id}`)}`
    );
  });

  lines.push(
    `----------------------------------`,
    `*${tMsg.subtotal}:* ${money(cartSubtotal())}`,
    `*${tMsg.delivery}:* ${money(orderDeliveryFee())}`,
    `*${tMsg.totalPrice}:* ${money(cartGrandTotal())}`
  );

  return lines.filter(line => line !== "").join("\n");
}

function handleCheckout(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast(t("confAddFirstAlert"));
    return;
  }
  renderConfirmation();
}

async function sendWhatsAppOrder() {
  if (!state.cart.length) {
    showToast(t("confAddFirstAlert"));
    return;
  }

  const isAr = state.lang === "ar";
  showToast(isAr ? "جاري رفع صور المنتجات إلى الخادم الآمن..." : "Uploading product images to secure server...");
  setUploadProgress(8, true);

  let message = buildWhatsAppMessage();
  const uploadPromises = [];
  const uploadTotal = state.cart.reduce((total, item) => {
    const product = getProduct(item.productId);
    if (!product) return total;
    if (item.upload) return total + 1;
    return total + ((product.gallery && product.gallery.length) ? product.gallery.length : 1);
  }, 0);
  let uploadDone = 0;

  const uploadWithProgress = async (imgUrl, fileName) => {
    const url = await fetchAndUploadImage(imgUrl, fileName);
    uploadDone += 1;
    setUploadProgress(8 + (uploadDone / Math.max(uploadTotal, 1)) * 82, true);
    return url;
  };

  // Gather all items and their images (including full galleries for series)
  state.cart.forEach((item, index) => {
    const product = getProduct(item.productId);
    if (!product) return;
    if (item.upload) {
      // Custom upload
      uploadPromises.push((async () => {
        const blob = await getUploadBlobForItem(item);
        const url = blob ? await uploadImageToTemporaryServer(blob, item.upload.name) : null;
        uploadDone += 1;
        setUploadProgress(8 + (uploadDone / Math.max(uploadTotal, 1)) * 82, true);
        return { index, label: isAr ? "التصميم المرفوع" : "Uploaded Design", urls: url ? [url] : [] };
      })());
    } else {
      // Standard product or Series
      const imagesToUpload = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
      uploadPromises.push((async () => {
        const urls = [];
        for (let i = 0; i < imagesToUpload.length; i++) {
          const imgUrl = productImageUrl(imagesToUpload[i]);
          const fileName = `${product.name.replace(/\s+/g, "_")}_${i + 1}.png`;
          const url = await uploadWithProgress(imgUrl, fileName);
          if (url) urls.push(url);
        }
        return { index, label: getProductName(product), urls };
      })());
    }
  });

  try {
    const results = await Promise.all(uploadPromises);
    let linkSection = isAr ? "\n\n*روابط تنزيل صور المنتجات:*" : "\n\n*Product Image Download Links:*";
    results.forEach((res) => {
      linkSection += `\n- *${res.label}:*`;
      res.urls.forEach((url, i) => {
        linkSection += `\n  [${i + 1}] ${url}`;
      });
    });
    message += linkSection;
    setUploadProgress(100, true);
    showToast(isAr ? "تم الرفع بنجاح!" : "Upload successful!");
  } catch (err) {
    console.error("Failed to upload some product images:", err);
    showToast(isAr ? "حدث خطأ أثناء رفع بعض الصور" : "Error uploading some images");
  }

  setTimeout(() => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setUploadProgress(0, false);
    resetCartAfterOrder();
  }, 1500);
}

const searchInput = document.querySelector("#searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });
}

const categoryFilter = document.querySelector("#categoryFilter");
if (categoryFilter) {
  categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderProducts();
  });
}

const sizeFilter = document.querySelector("#sizeFilter");
if (sizeFilter) {
  sizeFilter.addEventListener("change", (event) => {
    state.size = event.target.value;
    renderProducts();
  });
}

const frameFilter = document.querySelector("#frameFilter");
if (frameFilter) {
  frameFilter.addEventListener("change", (event) => {
    state.frame = event.target.value;
    renderProducts();
  });
}

const sortFilter = document.querySelector("#sortFilter");
if (sortFilter) {
  sortFilter.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });
}

document.addEventListener("click", (event) => {
  const themeToggle = event.target.closest("[data-theme-toggle]");
  if (themeToggle) {
    toggleTheme();
    return;
  }

  const langToggle = event.target.closest("[data-lang-toggle]");
  if (langToggle) {
    toggleLanguage();
    return;
  }

  const sizeGuideToggle = event.target.closest("[data-size-guide-toggle]");
  if (sizeGuideToggle) {
    openSizeGuide();
    return;
  }

  const sizeGuideClose = event.target.closest("[data-size-guide-close]");
  if (sizeGuideClose || event.target.matches("[data-size-guide-modal]")) {
    closeSizeGuide();
    return;
  }

  const removeUpload = event.target.closest("[data-remove-upload]");
  if (removeUpload) {
    if (state.customUpload?.url && state.customUpload.isObjectUrl) {
      URL.revokeObjectURL(state.customUpload.url);
    }
    state.customUpload = null;
    saveCustomUpload(null);
    renderDetail(state.selectedProduct);
    return;
  }

  const quickAdd = event.target.closest("[data-quick-add]");
  if (quickAdd) {
    const product = getProduct(quickAdd.dataset.quickAdd);
    if (product?.isCustom) {
      window.location.href = `product.html?id=${product.id}`;
    } else {
      addToCart(quickAdd.dataset.quickAdd);
    }
  }

  const openButton = event.target.closest("[data-open-cart]");
  if (openButton) openCart();

  const closeButton = event.target.closest("[data-close-cart]");
  if (closeButton) closeCart();

  if (event.target === cartDrawer) closeCart();

  const galleryButton = event.target.closest("[data-gallery-image]");
  if (galleryButton) {
    const selectedImage = galleryButton.dataset.galleryImage;
    const detailImage = document.querySelector("#detailMainImage");
    if (detailImage) detailImage.src = selectedImage;

    document.querySelectorAll("[data-gallery-image]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.galleryImage === selectedImage);
    });
  }

  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    state.detailSize = sizeButton.dataset.size;
    renderDetail(state.selectedProduct);
  }

  const frameButton = event.target.closest("[data-frame]");
  if (frameButton) {
    state.detailFrame = frameButton.dataset.frame;
    renderDetail(state.selectedProduct);
  }

  const detailAdd = event.target.closest("[data-detail-add]");
  if (detailAdd) addToCart(state.selectedProduct, state.detailSize, state.detailFrame);

  const workSlide = event.target.closest("[data-work-slide]");
  if (workSlide) {
    showOurWorkImage(Number(workSlide.dataset.workSlide || 0));
    startOurWorkReel();
  }

  const workReelToggle = event.target.closest("[data-work-reel-toggle]");
  if (workReelToggle) {
    if (ourWorkReelTimer) {
      stopOurWorkReel();
    } else {
      startOurWorkReel();
    }
  }

  const workReelPrev = event.target.closest("[data-work-reel-prev]");
  if (workReelPrev) {
    showOurWorkImage(ourWorkReelIndex - 1);
    startOurWorkReel();
  }

  const workReelNext = event.target.closest("[data-work-reel-next]");
  if (workReelNext) {
    showOurWorkImage(ourWorkReelIndex + 1);
    startOurWorkReel();
  }

  const minusButton = event.target.closest("[data-qty-minus]");
  if (minusButton) updateQuantity(minusButton.dataset.qtyMinus, -1);

  const plusButton = event.target.closest("[data-qty-plus]");
  if (plusButton) updateQuantity(plusButton.dataset.qtyPlus, 1);

  const editCheckout = event.target.closest("[data-edit-checkout]");
  if (editCheckout) hideConfirmation();

  const sendWhatsApp = event.target.closest("[data-send-whatsapp]");
  if (sendWhatsApp) sendWhatsAppOrder();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSizeGuide();
});

document.addEventListener("change", (event) => {
  const uploadInput = event.target.closest("[data-upload-design]");
  if (!uploadInput) return;
  const file = uploadInput.files?.[0];
  if (!file) return;

  if (state.customUpload?.url && state.customUpload.isObjectUrl) {
    URL.revokeObjectURL(state.customUpload.url);
  }

  const objectUrl = URL.createObjectURL(file);
  state.customUpload = {
    name: file.name,
    size: file.size,
    type: file.type || "image",
    url: objectUrl,
    isObjectUrl: true,
    previewError: false
  };
  state.customUploadFile = file; // Store raw file object
  saveCustomUpload(state.customUpload);
  renderDetail(state.selectedProduct);

  const previewProbe = new Image();
  previewProbe.onerror = () => {
    if (state.customUpload?.url === objectUrl) {
      state.customUpload.previewError = true;
      renderDetail(state.selectedProduct);
    }
  };
  previewProbe.src = objectUrl;
});

if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckout);

// Run initial configurations
updateLanguageUI();
updateThemeUI();
if (productGrid) renderProducts();
if (ourWorkGrid) renderOurWork();
renderCart();
initializeCartImages();
preloadProductImages();

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('Service Worker registered:', reg))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

const pageProductId = getPageProductId();
if (pageProductId) {
  renderDetail(pageProductId);
} else if (!productGrid && productDetail) {
  productDetail.hidden = false;
  productDetail.innerHTML = `<div class="empty-state"><strong>${t("noProductsFound")}</strong><p><a href="index.html">${t("heroActionShop")}</a></p></div>`;
}
