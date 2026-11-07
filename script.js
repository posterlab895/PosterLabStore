const WHATSAPP_NUMBER = "201010414187";
const DELIVERY_FEE = 35;
const POSTER_FALLBACK_IMAGE = "assets/poster-lab-logo.webp";
const CUSTOM_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff,image/*";
const SESSION_SCROLL_KEY = "pls-scroll";
const frameOptions = {
  None: { label: "Poster only", price: 0, hint: "Poster only, no frame" },
  Black: { label: "Black frame", price: 120 },
  White: { label: "White frame", price: 120 },

};

const translations = {
  en: {
    brandTitle: "Poster Lab Store",
    brandSubtitle: "Pick, frame, order",
    navShop: "Shop",
    navMenu: "Menu",
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
    catFootball: "Football",
    catClubs: "Clubs",
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
    cartInstapayOption: "Instapay",
    cartVodafoneOption: "VF-Cash",
    cartWhatsappHint: "WhatsApp will include items, sizes, frames, totals, payment method, product links, and uploaded design filenames.",
    cartCheckoutBtn: "Review order",
    productLink: "Product page link",
    backToShop: "Back to shop",

    confEyebrow: "Final confirmation",
    confTitle: "Check details, then send order",
    confHint: "Your WhatsApp message will include every poster, selected frame, selected size, total price, customer details, product links, and uploaded design filenames.",
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
    ourWorkButton: "Watch our real quality work",
    ourWorkGalleryLabel: "Captured photos",
    ourWorkReelLabel: "Quality reel",
    clearCart: "Clear cart",
    navAccount: "Account",
    navWishlist: "Wishlist",
    navFaq: "FAQ",
    faqEyebrow: "Got questions?",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about ordering framed posters from Poster Lab Store.",
    faqQ1: "How do I place an order?",
    faqA1: "Browse the shop, choose your favorite poster, select the size and frame option, then add it to your cart. When you're ready, go to the cart, enter your name, phone, address, and payment method, then click \"Place order\" to send the order via WhatsApp.",
    faqQ2: "What sizes are available?",
    faqA2: "We offer four sizes: 20x30 cm, 30x40 cm, 40x50 cm, and 50x70 cm. Prices vary by size — larger sizes cost more. All sizes can be framed or unframed.",
    faqQ3: "What frame options do you offer?",
    faqA3: "We offer three options: no frame (poster only), black frame, and white frame. Frames add EGP 120 to the price. All frames are high-quality and ready to hang.",
    faqQ4: "Can I upload my own design?",
    faqA4: "Yes! Use the \"Upload Your Custom Design\" product to upload any photo or design. We'll print it as a high-quality framed poster. You can upload JPG, PNG, or any common image format.",
    faqQ5: "What payment methods do you accept?",
    faqA5: "We accept VF-Cash and Instapay. Payment is made before we start printing your order. You'll receive the payment details after placing your order.",
    faqQ6: "How long does delivery take?",
    faqA6: "Delivery typically takes 3–7 business days depending on your location. We deliver anywhere in Egypt. A delivery fee of EGP 35 is added to each order.",
    faqQ7: "Can I cancel or change my order?",
    faqA7: "You can cancel or modify your order within 2 hours of placing it. After that, production may have already started. Contact us on WhatsApp to make changes.",
    faqQ8: "Do you offer refunds or exchanges?",
    faqA8: "Yes. If your poster arrives damaged or defective, we will replace it free of charge. Contact us within 48 hours of delivery with a photo of the issue.",
    faqQ9: "How do I contact you?",
    faqA9: "You can reach us directly on WhatsApp by clicking the WhatsApp icon button at the bottom of any page. We typically respond within a few hours during business days.",
    faqContactTitle: "Still have questions?",
    faqContactText: "Chat with us on WhatsApp — we're happy to help!",
    faqWhatsappBtn: "Chat on WhatsApp",
    couponLabel: "Coupon code",
    couponPlaceholder: "Enter coupon code",
    couponApply: "Apply",
    couponRemove: "Remove",
    orderNoteLabel: "Order notes (optional)",
    orderNotePlaceholder: "Any special instructions...",
    orderConfirmed: "Order placed successfully!",
    trackOrder: "Track order",
    whatsappChat: "Chat with us on WhatsApp",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    myAccount: "My Account",
    myOrders: "My Orders",
    cancelOrder: "Cancel Order",
    cancelOrderConfirm: "Are you sure you want to cancel this order?",
    orderCancelled: "Order cancelled",
    cannotCancelOrder: "Cannot cancel this order",
    loading: "Loading...",
    loggingIn: "Logging in...",
    creatingAccount: "Creating account...",
    firebaseErrorEmailInUse: "Email already registered",
    firebaseErrorWeakPassword: "Password must be at least 6 characters",
    firebaseErrorInvalidCred: "Invalid email or password",
  },
  ar: {
    brandTitle: "بوستر لاب ستور",
    brandSubtitle: "اختار، برواز، اطلب",
    navShop: "المتجر",
    navMenu: "القائمة",
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
    catFootball: "كرة قدم",
    catClubs: "أندية",
    catAbstract: "تجريدي",
    sizeLabel: "المقاس",
    sizeAll: "كل المقاسات",
    frameLabel: "الإطار",
    frameAll: "كل الإطارات",
    frameNone: "بدون إطار",
    frameBlack: "أسود",
    frameWhite: "أبيض",
    sortLabel: "ترتيب",
    sortFeatured: "مميز",
    sortPriceLow: "السعر: من الأقل للأعلى",
    sortPriceHigh: "السعر: من الأعلى للأقل",
    sortName: "الاسم",
    freshDropsEyebrow: "تسوق البوسترات",
    freshDropsTitle: "اختر ما يعجبك",
    resultCountProduct: "منتج",
    resultCountProducts: "منتجات",
    noProductsFound: "لم نجد بوسترات مطابقة.",
    tryDifferentSearch: "جرب بحثا بكلمات أخرى أو تغيير الفلاتر.",
    from: "تبدأ من",
    sizesAvailable: "٤ مقاسات متاحة",
    customize: "عرض التفاصيل",
    orderNow: "أضف للسلة",
    uploadDesignBtn: "رفع تصميمك",
    addPosterBtn: "إضافة البوستر",
    detailEyebrow: "جاهز للطلب",
    detailPosterSize: "١. اختر المقاس",
    detailFrameColor: "٢. اختر الإطار",
    detailUploadLabel: "ارفع صورتك أو تصميمك",
    detailUploadHint: "ارفع ملف JPG أو PNG أو أي تصميم قبل الإضافة للسلة.",
    detailSelectedFile: "الملف المختار: ",
    detailAddBtn: "إضافة البوستر للسلة",
    detailAddPosterBtn: "أضف هذا البوستر",
    pleaseUploadAlert: "يرجى رفع صورتك أو تصميمك أولاً.",
    cartEyebrow: "طلبك",
    cartTitle: "السلة",
    cartEmpty: "سلتك فارغة.",
    cartStartOrderHint: "أضف بوسترا للبدء.",
    cartEach: "للقطعة",
    cartTotalLabel: "الإجمالي:",
    cartNameLabel: "الاسم",
    cartNamePlaceholder: "اسمك الكريم",
    cartPhoneLabel: "رقم الهاتف",
    cartPhonePlaceholder: "رقم هاتفك للتواصل",
    cartAddressLabel: "العنوان",
    cartAddressPlaceholder: "عنوان التوصيل بالتفصيل",
    cartPaymentLabel: "طريقة الدفع",
    cartInstapayOption: "إنستاباي",
    cartVodafoneOption: "فودافون كاش",
    cartWhatsappHint: "ستشمل رسالة الواتساب المنتجات، المقاسات، الإطارات، الإجمالي، طريقة الدفع، بيانات العميل، وروابط المنتجات.",
    cartCheckoutBtn: "مراجعة الطلب",
    productLink: "رابط المنتج",
    backToShop: "العودة للتسوق",
    confEyebrow: "التأكيد",
    confTitle: "راجع الطلب ثم أرسله",
    confHint: "ستحتوي رسالتك على الواتساب على كل بوستر، والإطار، والمقاس، والإجمالي، وبيانات العميل، وروابط المنتجات.",
    confTotal: "إجمالي الطلب: ",
    confItemsCount: "بوستر مضاف",
    confItemsCountPlural: "بوسترات مضافة",
    confEditBtn: "تعديل البيانات",
    confSendBtn: "إرسال عبر واتساب",
    confAddFirstAlert: "يرجى إضافة بوستر واحد على الأقل إلى السلة.",
    addedToCart: "تمت الإضافة إلى السلة",
    confUploadSummaryTitle: "التصميمات المرفوعة:",
    uploadProgressLabel: "جاري رفع البوستر...",
    deliveryFeeLabel: "التوصيل",
    subtotalLabel: "المجموع الفرعي",
    sizeGuideTitle: "دليل المقاسات",
    sizeGuideHint: "اختر المقاس المناسب لحائطك.",
    addToCartSimple: "أضف للسلة",
    navAccount: "حسابي",
    navWishlist: "المفضلة",
    navFaq: "الأسئلة",
    couponLabel: "كود الخصم",
    couponPlaceholder: "أدخل كود الخصم",
    couponApply: "تطبيق",
    couponRemove: "إزالة",
    orderNoteLabel: "ملاحظات الطلب",
    orderNotePlaceholder: "أي ملاحظات؟",
    paymentCod: "الدفع عند الاستلام",
    orderConfirmed: "تم تأكيد الطلب!",
    trackOrder: "تتبع الطلب",
    ourWorkTitle: "شغلنا",
    ourWorkEyebrow: "صور جودة حقيقية",
    ourWorkSubtitle: "شوف جودة الطباعة وعمق البرواز وتنسيق الغرف.",
    ourWorkButton: "شاهد جودتنا",
    ourWorkGalleryLabel: "المعرض",
    ourWorkReelLabel: "فيديو الجودة",
    clearCart: "تفريغ السلة",
    whatsappChat: "تحدث معنا",
    faqEyebrow: "عندك أسئلة؟",
    faqTitle: "الأسئلة الشائعة",
    faqSubtitle: "كل ما تحتاج معرفته عن طلب البوسترات من Poster Lab Store.",
    faqQ1: "كيف أطلب؟",
    faqA1: "تصفح المتجر، اختر البوستر المناسب، حدد المقاس والإطار، ثم أضف للسلة. لما تخلص، اذهب للسلة وأدخل اسمك ورقم هاتفك وعنوانك وطريقة الدفع، ثم اضغط \"إرسال الطلب\" لترسله عبر واتساب.",
    faqQ2: "ما المقاسات المتاحة؟",
    faqA2: "نوفر أربع مقاسات: 20x30 سم، 30x40 سم، 40x50 سم، و50x70 سم. الأسعار تختلف حسب المقاس — المقاسات الأكبر أغلى. كل المقاسات تنفع مع أو بدون إطار.",
    faqQ3: "ما خيارات الإطارات؟",
    faqA3: "نوفر ثلاثة خيارات: بدون إطار (بوستر فقط)، إطار أسود، وإطار أبيض. الإطارات تضيف 120 جنيهاً للسعر. كل الإطارات عالية الجودة وجاهزة للتعليق.",
    faqQ4: "هل أقدر أرفع تصميمي الخاص؟",
    faqA4: "نعم! استخدم منتج \"ارفع تصميمك الخاص\" لرفع أي صورة أو تصميم. سنطبعه كبوستر مؤطر عالي الجودة. تقدر ترفع JPG أو PNG أو أي صيغة صور شائعة.",
    faqQ5: "ما طرق الدفع المتاحة؟",
    faqA5: "نقبل فودافون كاش وإنستاباي. يتم الدفع قبل بدء طباعة طلبك. هتستلم تفاصيل الدفع بعد تأكيد الطلب.",
    faqQ6: "كم تستغرق التوصيلة؟",
    faqA6: "التوصيل عادة يستغرق 3–7 أيام عمل حسب موقعك. نوصل في كل مصر. رسوم التوصيل 35 جنيهاً تضاف لكل طلب.",
    faqQ7: "هل أقدر ألغي أو أغير طلبي؟",
    faqA7: "تقدر تلغي أو تعدل طلبك خلال ساعتين من تقديمه. بعد كده ممكن يكون الإنتاج بدأ. تواصل معنا على واتساب للتعديل.",
    faqQ8: "هل توفرون استرجاع أو استبدال؟",
    faqA8: "نعم. لو وصل البوستر تالف أو فيه عيب، سنستبدله مجاناً. تواصل معنا خلال 48 ساعة من الاستلام مع صورة المشكلة.",
    faqQ9: "كيف أتواصل معكم؟",
    faqA9: "تقدر تتواصل معنا مباشرة على واتساب بالضغط على زر الواتساب في أي صفحة. نرد عادة خلال ساعات في أيام العمل.",
    faqContactTitle: "لسه عندك أسئلة؟",
    faqContactText: "تحدث معنا على واتساب — يسعدنا مساعدتك!",
    faqWhatsappBtn: "تحدث على واتساب",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    myAccount: "حسابي",
    myOrders: "طلباتي",
    cancelOrder: "إلغاء الطلب",
    cancelOrderConfirm: "هل أنت متأكد من إلغاء هذا الطلب؟",
    orderCancelled: "تم إلغاء الطلب",
    cannotCancelOrder: "لا يمكن إلغاء هذا الطلب",
    loading: "جاري التحميل...",
    loggingIn: "جاري تسجيل الدخول...",
    creatingAccount: "جاري إنشاء الحساب...",
    firebaseErrorEmailInUse: "البريد الإلكتروني مسجل بالفعل",
    firebaseErrorWeakPassword: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    firebaseErrorInvalidCred: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  },
};

const currency = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0
});

const products = [
  {
    id: "custom-design",
    name: "Upload Your Custom Design",
    nameAr: "ارفع تصميمك الخاص",
    category: "custom",
    tag: "Custom upload",
    tagAr: "رفع خاص",
    isCustom: true,
    image: "assets/Custom/Upload-Your-Custom-Design.webp",
    gallery: ["assets/Custom/Upload-Your-Custom-Design.webp"],
    basePrice: 60,
    sizes: { '20x30': 60, '30x40': 80, '40x50': 100, '50x70': 120 },
    frames: ['None', 'Black', 'White'],
    description: "Upload any photo or design and we'll print it as a high-quality framed poster.",
    descriptionAr: "ارفع أي صورة أو تصميم وسنقوم بطباعته كبوستر مؤطر عالي الجودة."
  }
];

if (typeof footballProducts !== 'undefined') {
  products.push(...footballProducts);
}
if (typeof carProducts !== 'undefined') {
  products.push(...carProducts);
}
if (typeof clubProducts !== 'undefined') {
  products.push(...clubProducts);
}
if (typeof movieArtistProducts !== 'undefined') {
  products.push(...movieArtistProducts);
}
if (typeof albumArtistProducts !== 'undefined') {
  products.push(...albumArtistProducts);
}
if (typeof gymProducts !== 'undefined') {
  products.push(...gymProducts);
}
if (typeof artProducts !== 'undefined') {
  products.push(...artProducts);
}
if (typeof animeProducts !== 'undefined') {
  products.push(...animeProducts);
}
if (typeof girlsProducts !== 'undefined') {
  products.push(...girlsProducts);
}
if (typeof gamesProducts !== 'undefined') {
  products.push(...gamesProducts);
}
if (typeof islamicProducts !== 'undefined') {
  products.push(...islamicProducts);
}
if (typeof citiesProducts !== 'undefined') {
  products.push(...citiesProducts);
}
if (typeof quotesProducts !== 'undefined') {
  products.push(...quotesProducts);
}
if (typeof nbaProducts !== 'undefined') {
  products.push(...nbaProducts);
}
if (typeof meemesProducts !== 'undefined') {
  products.push(...meemesProducts);
}
if (typeof pharaonicProducts !== 'undefined') {
  products.push(...pharaonicProducts);
}
if (typeof rapSceneProducts !== 'undefined') {
  products.push(...rapSceneProducts);
}
if (typeof jordanProducts !== 'undefined') {
  products.push(...jordanProducts);
}

const OUR_WORK_MEDIA = [
  {
    src: "assets/our-work/our-work-01.webp",
    title: "Framed room capture 01"
  },
  {
    src: "assets/our-work/our-work-02.webp",
    title: "Framed room capture 02"
  },
  {
    src: "assets/our-work/our-work-03.webp",
    title: "Framed room capture 03"
  },
  {
    src: "assets/our-work/our-work-04.webp",
    title: "Framed room capture 04"
  },
  {
    src: "assets/our-work/our-work-05.webp",
    title: "Framed room capture 05"
  },
  {
    src: "assets/our-work/our-work-06.webp",
    title: "Framed room capture 06"
  },
  {
    src: "assets/our-work/our-work-07.webp",
    title: "Framed room capture 07"
  },
  {
    src: "assets/our-work/our-work-08.webp",
    title: "Framed room capture 08"
  },
  {
    src: "assets/our-work/our-work-09.webp",
    title: "Framed room capture 09"
  },
  {
    src: "assets/our-work/our-work-10.webp",
    title: "Framed room capture 10"
  }
];

const LOCAL_STORAGE_LANG_KEY = "poster-lab-lang";
const LOCAL_STORAGE_THEME_KEY = "poster-lab-theme";
const LOCAL_STORAGE_UPLOAD_KEY = "poster-lab-custom-upload";
const LOCAL_STORAGE_CART_KEY = "poster-lab-cart";

const LOCAL_STORAGE_USERS_KEY = "pls-users";
const LOCAL_STORAGE_SESSION_KEY = "pls-session";
const LOCAL_STORAGE_ORDERS_KEY = "pls-orders";
const LOCAL_STORAGE_COUPONS_KEY = "pls-coupons";
const LOCAL_STORAGE_WISHLIST_KEY = "pls-wishlist";
const LOCAL_STORAGE_REVIEWS_KEY = "pls-reviews";
const LOCAL_STORAGE_PRODUCTS_KEY = "pls-products";

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function lsSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function getUsers() { return lsGet(LOCAL_STORAGE_USERS_KEY, []); }
function saveUsers(u) { lsSet(LOCAL_STORAGE_USERS_KEY, u); }
function getSession() { return lsGet(LOCAL_STORAGE_SESSION_KEY, null); }
function saveSession(s) { lsSet(LOCAL_STORAGE_SESSION_KEY, s); }
function getOrders() { return lsGet(LOCAL_STORAGE_ORDERS_KEY, []); }
function saveOrders(o) { lsSet(LOCAL_STORAGE_ORDERS_KEY, o); }
function getPendingOrdersCount() {
  return getOrders().filter(o => o.status === 'pending').length;
}
function updatePendingOrdersBadge() {
  const el = document.querySelector("[data-pending-count]");
  if (!el) return;
  const count = getPendingOrdersCount();
  el.textContent = count;
  el.hidden = count === 0;
}
function getCouponsData() {
  const coupons = lsGet(LOCAL_STORAGE_COUPONS_KEY, []);
  if (!coupons || !coupons.length) {
    const defaults = [
      { code: "POSTER10", type: "percent", value: 10, minOrder: 100, maxUses: 100, uses: 0, usedBy: [] }
    ];
    lsSet(LOCAL_STORAGE_COUPONS_KEY, defaults);
    return defaults;
  }
  return coupons;
}
function saveCouponsData(c) { lsSet(LOCAL_STORAGE_COUPONS_KEY, c); }
function getWishlistData() { return lsGet(LOCAL_STORAGE_WISHLIST_KEY, []); }
function saveWishlistData(w) { lsSet(LOCAL_STORAGE_WISHLIST_KEY, w); }
function getReviewsData() { return lsGet(LOCAL_STORAGE_REVIEWS_KEY, []); }
function saveReviewsData(r) { lsSet(LOCAL_STORAGE_REVIEWS_KEY, r); }

function getMergedProducts() {
  const custom = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
  const merged = products.map(p => ({ ...p }));
  custom.forEach(cp => {
    if (cp._deleted) {
      const idx = merged.findIndex(m => m.id === cp.id);
      if (idx >= 0) merged.splice(idx, 1);
      return;
    }
    const idx = merged.findIndex(m => m.id === cp.id);
    if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
    else merged.push(cp);
  });
  return merged;
}

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PLS-${ts}-${rand}`;
}

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
  try { deleteImageFromDB("pending-upload"); } catch {}
  return null;
}

function saveCustomUpload(upload) {
  // Do not persist upload metadata to prevent reloading broken object URLs
  deleteImageFromDB("pending-upload").catch(() => {});
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
          url: ""
        }
      };
    }
    return item;
  });
  localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cleanCart));
  saveCartToUser();
  saveCartToFirestore();
}

function userCartKey() { return state.user ? `pls-cart-${state.user.id}` : null; }

function saveCartToUser() {
  if (!state.user) return;
  localStorage.setItem(userCartKey(), localStorage.getItem(LOCAL_STORAGE_CART_KEY) || JSON.stringify([]));
}

function loadCartFromUser() {
  if (!state.user) return null;
  try {
    const key = userCartKey();
    const d = localStorage.getItem(key);
    if (!d) return null;
    const parsed = JSON.parse(d);
    return Array.isArray(parsed) ? parsed.map(item => ({ ...item, upload: item.upload ? { ...item.upload, url: "" } : null })) : null;
  } catch { return null; }
}

function saveCartToFirestore() {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady() || !state.user) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('users').doc(state.user.email).collection('cart').doc('current').set({
        items: state.cart.map(item => {
          const clean = { ...item };
          if (clean.upload) clean.upload = { name: item.upload.name, size: item.upload.size, type: item.upload.type, url: "" };
          return clean;
        }),
        updatedAt: new Date().toISOString()
      });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] save cart error:', e);
      resolve(false);
    }
  });
}

function loadCartFromFirestore() {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady() || !state.user) { resolve(null); return; }
    try {
      const db = getFirebaseDb();
      const doc = await db.collection('users').doc(state.user.email).collection('cart').doc('current').get();
      if (!doc.exists) { resolve(null); return; }
      const data = doc.data();
      if (!data.items || !Array.isArray(data.items)) { resolve(null); return; }
      resolve(data.items.map(item => ({
        ...item,
        upload: item.upload ? { ...item.upload, url: "" } : null
      })));
    } catch (e) {
      console.error('[Firestore] load cart error:', e);
      resolve(null);
    }
  });
}

/* ── Firestore Product Sync ── */
function syncProductsFromFirestore(force = false) {
  return new Promise(async (resolve) => {
    try {
      const lastSync = parseInt(localStorage.getItem('pls_last_fs_sync') || '0', 10);
      if (!force && Date.now() - lastSync < 300000 && lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []).length > 0) {
        resolve(0);
        return;
      }
    } catch {}
    if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
    else initFirebase();
    if (!isFirebaseReady()) { resolve(0); return; }
    try {
      const db = getFirebaseDb();
      const snap = await db.collection('products').get();
      const custom = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data._deleted) {
          const idx = custom.findIndex(c => c.id === data.id);
          if (idx >= 0) custom.splice(idx, 1);
          return;
        }
        const existing = custom.findIndex(c => c.id === data.id);
        if (existing >= 0) custom[existing] = { ...custom[existing], ...data };
        else custom.push(data);
      });
      if (custom.length) {
        const existing = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
        const merged = [...existing];
        custom.forEach(cp => {
          const idx = merged.findIndex(m => m.id === cp.id);
          if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
          else merged.push(cp);
        });
        lsSet(LOCAL_STORAGE_PRODUCTS_KEY, merged);
      try { localStorage.setItem("pls_last_fs_sync", String(Date.now())); } catch {}
      }
      resolve(custom.length);
    } catch (e) {
      console.error('[Firestore] sync products error:', e);
      resolve(0);
    }
  });
}

function saveProductToFirestore(product) {
  return new Promise(async (resolve) => {
    if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
    else initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('products').doc(product.id).set({
        ...product,
        _updatedAt: new Date().toISOString()
      });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] save product error:', e);
      resolve(false);
    }
  });
}

function deleteProductFromFirestore(productId) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('products').doc(productId).set({
        id: productId,
        _deleted: true,
        _updatedAt: new Date().toISOString()
      });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] delete product error:', e);
      resolve(false);
    }
  });
}

/* ── Firestore Coupon Sync ── */
function syncCouponsFromFirestore(force = false) {
  return new Promise(async (resolve) => {
    if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
    else initFirebase();
    if (!isFirebaseReady()) { resolve(0); return; }
    try {
      const db = getFirebaseDb();
      const snap = await db.collection('coupons').get();
      const coupons = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (!data._deleted) coupons.push(data);
      });
      if (coupons.length) {
        const existing = lsGet(LOCAL_STORAGE_COUPONS_KEY, []);
        const merged = [...existing];
                coupons.forEach(c => {
          const idx = merged.findIndex(m => m.code === c.code);
          if (idx >= 0) {
            const maxUses = Math.max(merged[idx].uses || 0, c.uses || 0);
            const combinedUsedBy = [...(merged[idx].usedBy || []), ...(c.usedBy || [])];
            const uniqueUsedBy = [];
            const seen = new Set();
            combinedUsedBy.forEach(u => {
              const key = u.orderId || (u.date + '_' + u.customerPhone);
              if (!seen.has(key)) { seen.add(key); uniqueUsedBy.push(u); }
            });
            merged[idx] = { ...merged[idx], ...c, uses: maxUses, usedBy: uniqueUsedBy };
            if (merged[idx].uses > (c.uses || 0)) {
              saveCouponToFirestore(merged[idx]);
            }
          } else {
            merged.push(c);
          }
        });
        lsSet(LOCAL_STORAGE_COUPONS_KEY, merged);
      }
      resolve(coupons.length);
    } catch (e) {
      console.error('[Firestore] sync coupons error:', e);
      resolve(0);
    }
  });
}

function saveCouponToFirestore(coupon) {
  return new Promise(async (resolve) => {
    if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
    else initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('coupons').doc(coupon.code).set({
        ...coupon,
        _updatedAt: new Date().toISOString()
      });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] save coupon error:', e);
      resolve(false);
    }
  });
}

function deleteCouponFromFirestore(code) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('coupons').doc(code).set({
        code,
        _deleted: true,
        _updatedAt: new Date().toISOString()
      });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] delete coupon error:', e);
      resolve(false);
    }
  });
}

const PER_PAGE = 21;

const state = {
  lang: localStorage.getItem(LOCAL_STORAGE_LANG_KEY) || "en",
  theme: localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || "light",
  search: "",
  cart: loadCart(),
  selectedProduct: null,
  detailSize: "20x30",
  detailFrame: "Black",
  customUpload: loadCustomUpload(),
  confirmedForm: null,
  user: getSession(),
  wishlist: getWishlistData(),
  appliedCoupon: null,
  orderNote: ""
};

const productGrid = document.querySelector("#categorySections");
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

function showToast(message, duration = 15000) {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-text">${message}</span>
    <button class="toast-close" type="button" aria-label="Close">✕</button>
    <span class="toast-progress" style="animation-duration: ${duration}ms"></span>
  `;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    toast.classList.remove("show");
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 250);
  };

  toast.querySelector(".toast-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss();
  });
  toast.addEventListener("click", dismiss);

  timer = window.setTimeout(dismiss, duration);
}

function money(amount) {
  const formatted = currency.format(amount);
  return formatted.includes("EGP\u00a0") ? formatted.replace("EGP\u00a0", "EGP ") : formatted;
}

function getProduct(id) {
  return getMergedProducts().find((product) => product.id === id);
}

let _supportsWebp = null;
function supportsWebp() {
  if (_supportsWebp === null) {
    _supportsWebp = document.createElement('canvas').toDataURL('image/webp').indexOf('image/webp') === 5;
  }
  return _supportsWebp;
}

function productImageUrl(path) {
  if (!path || path.startsWith('data:') || path.startsWith('blob:')) return path;
  if (supportsWebp()) {
    path = path.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  const clean = path.replace(/#/g, '%23').replace(/ /g, '%20');
  const base = window.location.pathname.includes('/admin/')
    ? window.location.href.replace(/\/admin\/.*$/, '/')
    : window.location.href;
  return new URL(clean, base).href;
}

function hideLoader() {
  const el = document.getElementById('appLoader');
  if (!el || el.classList.contains('hidden')) return;
  el.classList.add('hidden');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
}

function displayImageForItem(product, item = null) {
  const src = item?.upload?.url || product.image;
  return src && src.startsWith('data:') ? src : productImageUrl(src);
}

function itemUnitPrice(product, size, frame) {
  return product.sizes[size] + frameOptions[frame].price;
}

function orderDeliveryFee() {
  return state.cart.length ? DELIVERY_FEE : 0;
}

function sizeGuideMarkup() {
  return `
    <button class="size-guide-button" type="button" data-size-guide-toggle>
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
        <img src="${productImageUrl('assets/size-guide.webp')}" alt="${t("sizeGuideTitle")}">
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

function registerUser(name, email, phone, password) {
  return new Promise(async (resolve) => {
    try {
      initFirebase();
      const auth = getFirebaseAuth();
      if (auth) {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        state.user = { id: cred.user.uid, name, email, phone: phone || '', deliveryAddress: '', addresses: [] };
        saveSession(state.user);
        saveCart();
        renderCart();
        updateUserUI();
        saveUserToFirestore(state.user, password);
        resolve({ success: true, user: state.user });
        return;
      }
    } catch (e) {
      if (isFirebaseReady()) {
        const isAr = state.lang === 'ar';
        const msg = e.code === 'auth/email-already-in-use' ? t('firebaseErrorEmailInUse')
          : e.code === 'auth/weak-password' ? t('firebaseErrorWeakPassword')
          : isAr ? 'فشل التسجيل' : 'Registration failed';
        resolve({ success: false, msg });
        return;
      }
    }
    // Fallback to localStorage
    const users = getUsers();
    if (users.find(u => u.email === email)) { resolve({ success: false, msg: "Email already registered" }); return; }
    const user = { id: 'u-' + Date.now(), name, email, phone, password: btoa(password), deliveryAddress: '', addresses: [], createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    state.user = { id: user.id, name: user.name, email: user.email, phone: user.phone, deliveryAddress: user.deliveryAddress, addresses: user.addresses };
    saveSession(state.user);
    saveCart();
    renderCart();
    updateUserUI();
    resolve({ success: true, user: state.user });
  });
}

function loginUser(email, password) {
  return new Promise(async (resolve) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();
    if (cleanEmail === "posterlab895@gmail.com" && (cleanPwd === "Poster895Lab$" || cleanPwd === "Poster895Lab")) {
      state.user = { id: "admin-posterlab", name: "Poster Lab Admin", email: "posterlab895@gmail.com", phone: "01010414187", deliveryAddress: "", addresses: [] };
      saveSession(state.user);
      localStorage.setItem("pls-admin-session", "true");
      localStorage.setItem("pls-admin-email", "posterlab895@gmail.com");
      saveCart();
      renderCart();
      updateUserUI();
      resolve({ success: true, user: state.user });
      return;
    }
    try {
      initFirebase();
      const auth = getFirebaseAuth();
      if (auth) {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const dbUser = await getUserFromFirestore(email);
        state.user = { id: cred.user.uid, name: cred.user.displayName || email, email, phone: cred.user.phoneNumber || '', deliveryAddress: dbUser?.deliveryAddress || '', addresses: [] };
        saveSession(state.user);
        // Load cart from Firestore first (cross-device), fall back to localStorage
        let firestoreCart = await loadCartFromFirestore();
        if (firestoreCart && firestoreCart.length) {
          state.cart = firestoreCart;
        } else {
          const userCart = loadCartFromUser();
          if (userCart && userCart.length) {
            const userKeys = new Set(userCart.map(i => i.key));
            state.cart = [...userCart, ...state.cart.filter(i => !userKeys.has(i.key))];
          }
        }
        saveCart();
        renderCart();
        updateUserUI();
        resolve({ success: true, user: state.user });
        return;
      }
    } catch (e) {
      if (isFirebaseReady()) {
        const isAr = state.lang === 'ar';
        const msg = e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' ? t('firebaseErrorInvalidCred')
          : e.code === 'auth/invalid-email' ? (isAr ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format')
          : isAr ? 'فشل تسجيل الدخول' : 'Login failed';
        resolve({ success: false, msg });
        return;
      }
    }
    // Fallback to localStorage
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) { resolve({ success: false, msg: "Invalid email or password" }); return; }
    state.user = { id: user.id, name: user.name, email: user.email, phone: user.phone, deliveryAddress: user.deliveryAddress || '', addresses: user.addresses || [] };
    saveSession(state.user);
    // Merge guest cart with user cart
    const userCart = loadCartFromUser();
    if (userCart && userCart.length) {
      const userKeys = new Set(userCart.map(i => i.key));
      state.cart = [...userCart, ...state.cart.filter(i => !userKeys.has(i.key))];
    }
    saveCart();
    renderCart();
    updateUserUI();
    resolve({ success: true, user: state.user });
  });
}

function logoutUser() {
  return new Promise(async (resolve) => {
    try {
      initFirebase();
      const auth = getFirebaseAuth();
      if (auth) { await auth.signOut(); }
    } catch (e) { /* ignore */ }
    saveCartToUser();
    await saveCartToFirestore();
    state.user = null;
    saveSession(null);
    localStorage.removeItem("pls-admin-session");
    localStorage.removeItem("pls-admin-email");
    state.cart = [];
    localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
    saveCart();
    renderCart();
    updateUserUI();
    resolve();
  });
}

function isPosterLabAdmin() {
  const ADMIN_EMAIL = "posterlab895@gmail.com";
  const userEmail = (state.user && state.user.email ? state.user.email : "").toLowerCase().trim();
  const hasAdminSession = localStorage.getItem("pls-admin-session") === "true";
  const adminEmail = (localStorage.getItem("pls-admin-email") || "").toLowerCase().trim();

  if (userEmail === ADMIN_EMAIL) return true;
  if (hasAdminSession && adminEmail === ADMIN_EMAIL) return true;
  return false;
}

function updateHeaderAdminButton() {
  const isAdmin = isPosterLabAdmin();
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  let adminBtn = headerActions.querySelector('.header-admin-link');
  if (isAdmin) {
    if (!adminBtn) {
      adminBtn = document.createElement('a');
      adminBtn.className = 'header-admin-link';
      adminBtn.href = 'admin/panel.html';
      adminBtn.title = (state && state.lang === 'ar') ? 'لوحة التحكم' : 'Admin Panel';
      adminBtn.setAttribute('aria-label', 'Admin Panel');
      adminBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
      const accountBtn = headerActions.querySelector('[data-account-btn]');
      if (accountBtn) headerActions.insertBefore(adminBtn, accountBtn);
      else headerActions.appendChild(adminBtn);
    }
  } else if (adminBtn) {
    adminBtn.remove();
  }
}

function updateUserUI() {
  updateHeaderAdminButton();
  document.querySelectorAll("[data-account-link]").forEach(el => {
    if (state.user) {
      el.innerHTML = `<span data-account-name>${state.user.name}</span>`;
      el.href = "#";
      el.dataset.showAccount = "true";
    } else {
      el.innerHTML = `<span data-t="navAccount">Account</span>`;
      el.href = "#";
      el.dataset.showAccount = "true";
    }
  });
  const accountName = document.querySelector("[data-account-name]");
  if (accountName) accountName.textContent = state.user ? state.user.name : t("navAccount");
  const accountBtn = document.querySelector("[data-account-btn]");
  if (accountBtn) {
    if (state.user) {
      accountBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      accountBtn.classList.add("is-logged-in");
    } else {
      accountBtn.textContent = state.lang === "ar" ? "تسجيل الدخول" : "Sign in";
      accountBtn.classList.remove("is-logged-in");
    }
  }
}

function showAccountPanel() {
  const existing = document.querySelector("[data-account-panel]");
  if (existing) existing.remove();
  const panel = document.createElement("aside");
  panel.className = "cart-drawer is-open";
  panel.dataset.accountPanel = "";
  panel.setAttribute("aria-hidden", "false");
  const isAr = state.lang === "ar";
  panel.innerHTML = `<div class="drawer-panel" role="dialog" aria-modal="true">
    <div class="drawer-header">
      <h2>${state.user ? (isAr ? "حسابي" : "My Account") : (isAr ? "تسجيل الدخول" : "Account")}</h2>
      <button class="icon-button close-account-panel" type="button">x</button>
    </div>
    ${state.user ? `
      <div style="display:grid;gap:12px;padding:0 0 16px;border-bottom:1px solid var(--line);margin-bottom:16px">
        <p style="font-weight:900;color:var(--text-strong)">${isAr ? "مرحباً" : "Welcome"}, ${state.user.name}</p>
        <p style="color:var(--muted);font-size:0.85rem">${state.user.email}</p>
      </div>
      <div style="display:grid;gap:8px">
        ${isPosterLabAdmin() ? `
        <a href="admin/panel.html" class="secondary-link" style="justify-content:flex-start;padding:12px 16px;min-height:48px;text-decoration:none;display:flex;align-items:center;gap:10px;font-weight:700;border-color:var(--accent);color:var(--accent)">
          <span>⚙️</span> <span>${isAr ? "لوحة التحكم (الإدارة)" : "Admin Panel"}</span>
        </a>
      ` : ''}
        <button class="secondary-link" type="button" data-view-orders style="justify-content:flex-start;padding:12px 16px;min-height:48px">${isAr ? "طلباتي" : "My Orders"}</button>
        <button class="secondary-link" type="button" data-view-wishlist style="justify-content:flex-start;padding:12px 16px;min-height:48px">${isAr ? "المفضلة" : "Wishlist"} (${state.wishlist.length})</button>
        <button class="secondary-link" type="button" data-view-settings style="justify-content:flex-start;padding:12px 16px;min-height:48px">${isAr ? "الإعدادات" : "Settings"}</button>
        <button class="secondary-link" type="button" data-logout-btn style="justify-content:flex-start;padding:12px 16px;min-height:48px;border-color:var(--danger);color:var(--danger)">${isAr ? "تسجيل الخروج" : "Logout"}</button>
      </div>
    ` : `
      <form id="accountForm" style="display:grid;gap:12px">
        <div id="accountLoginFields" style="display:grid;gap:10px">
          <input id="accountEmail" type="email" placeholder="${isAr ? "البريد الإلكتروني" : "Email"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <input id="accountPassword" type="password" placeholder="${isAr ? "كلمة المرور" : "Password"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <div style="display:flex;justify-content:flex-end;margin-top:-4px">
            <a href="#" id="forgotPasswordLink" style="font-size:0.78rem;color:var(--warm);font-weight:800;text-decoration:none">${isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}</a>
          </div>
          <button id="accountLoginBtn" class="checkout-button" type="button">${isAr ? "تسجيل الدخول" : "Login"}</button>
          <p style="text-align:center;color:var(--muted);font-size:0.82rem;margin:4px 0">
            <a href="#" id="showRegisterToggle" style="color:var(--accent);font-weight:800">${isAr ? "إنشاء حساب جديد" : "Create new account"}</a>
          </p>
        </div>
        <div id="accountRegisterFields" style="display:grid;gap:10px;display:none">
          <input id="regName" type="text" placeholder="${isAr ? "الاسم" : "Name"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <input id="regEmail" type="email" placeholder="${isAr ? "البريد الإلكتروني" : "Email"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <input id="regPhone" type="tel" placeholder="${isAr ? "رقم الهاتف" : "Phone"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <input id="regPassword" type="password" placeholder="${isAr ? "كلمة المرور" : "Password"}" style="min-height:50px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700">
          <button id="accountRegisterBtn" class="checkout-button" type="button">${isAr ? "إنشاء حساب" : "Register"}</button>
          <p style="text-align:center;color:var(--muted);font-size:0.82rem;margin:4px 0">
            <a href="#" id="showLoginToggle" style="color:var(--accent);font-weight:800">${isAr ? "لديك حساب؟ تسجيل الدخول" : "Have an account? Login"}</a>
          </p>
        </div>
        
        <p id="accountMsg" style="text-align:center;font-weight:800;font-size:0.85rem;color:var(--danger);margin:0"></p>
      </form>
    `}</div>`;
  document.body.appendChild(panel);

  panel.addEventListener("click", (e) => {
    if (e.target === panel || e.target.closest(".close-account-panel")) panel.remove();
  });

  if (state.user) {
    panel.querySelector("[data-logout-btn]")?.addEventListener("click", async () => {
      await logoutUser();
      panel.remove();
      showToast(isAr ? "تم تسجيل الخروج" : "Logged out");
    });
    panel.querySelector("[data-view-orders]")?.addEventListener("click", () => {
      panel.remove();
      showUserOrders();
    });
    panel.querySelector("[data-view-wishlist]")?.addEventListener("click", () => {
      panel.remove();
      showWishlistPanel();
    });
    panel.querySelector("[data-view-settings]")?.addEventListener("click", () => {
      panel.remove();
      showUserSettings();
    });
  } else {
    setupAccountForm(panel, isAr);
  }
}

function setupAccountForm(panel, isAr) {
  const loginFields = panel.querySelector("#accountLoginFields");
  const regFields = panel.querySelector("#accountRegisterFields");
  const msg = panel.querySelector("#accountMsg");

  panel.querySelector("#showRegisterToggle")?.addEventListener("click", (e) => {
    e.preventDefault();
    loginFields.style.display = "none";
    regFields.style.display = "grid";
  });
  panel.querySelector("#showLoginToggle")?.addEventListener("click", (e) => {
    e.preventDefault();
    regFields.style.display = "none";
    loginFields.style.display = "grid";
  });

  panel.querySelector("#accountLoginBtn")?.addEventListener("click", async () => {
    const email = panel.querySelector("#accountEmail").value.trim();
    const password = panel.querySelector("#accountPassword").value.trim();
    if (!email || !password) { msg.textContent = isAr ? "يرجى إدخال البريد الإلكتروني وكلمة المرور" : "Please enter email and password"; return; }
    msg.textContent = isAr ? "جاري تسجيل الدخول..." : "Logging in...";
    const result = await loginUser(email, password);
    if (result.success) { panel.remove(); location.reload(); }
    else msg.textContent = result.msg;
  });

  panel.querySelector("#forgotPasswordLink")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = panel.querySelector("#accountEmail").value.trim();
    if (!email) { msg.textContent = isAr ? "يرجى إدخال البريد الإلكتروني أولاً" : "Please enter your email first"; return; }
    msg.textContent = isAr ? "جاري إرسال رابط reset..." : "Sending reset link...";
    try {
      initFirebase();
      const auth = getFirebaseAuth();
      if (auth) {
        await auth.sendPasswordResetEmail(email);
        msg.style.color = "var(--accent-strong)";
        msg.textContent = isAr ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" : "Password reset link sent to your email";
      } else {
        msg.textContent = isAr ? "خاصية استعادة كلمة المرور غير متاحة حالياً" : "Password reset not available currently";
      }
    } catch (e) {
      msg.style.color = "var(--danger)";
      if (e.code === 'auth/user-not-found') {
        msg.textContent = isAr ? "البريد الإلكتروني غير مسجل" : "Email not registered";
      } else {
        msg.textContent = isAr ? "فشل إرسال رابط إعادة التعيين" : "Failed to send reset link";
      }
    }
  });

  panel.querySelector("#accountRegisterBtn")?.addEventListener("click", async () => {
    const name = panel.querySelector("#regName").value.trim();
    const email = panel.querySelector("#regEmail").value.trim();
    const phone = panel.querySelector("#regPhone").value.trim();
    const password = panel.querySelector("#regPassword").value.trim();
    if (!name || !email || !password) { msg.textContent = isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields"; return; }
    msg.textContent = isAr ? "جاري إنشاء الحساب..." : "Creating account...";
    const result = await registerUser(name, email, phone, password);
    if (result.success) { panel.remove(); location.reload(); }
    else msg.textContent = result.msg;
  });
}

function showUserOrders() {
  const isAr = state.lang === "ar";
  const panel = document.createElement("aside");
  panel.className = "cart-drawer is-open";
  panel.setAttribute("aria-hidden", "false");
  panel.innerHTML = `<div class="drawer-panel" role="dialog" aria-modal="true">
    <div class="drawer-header">
      <h2>${isAr ? "طلباتي" : "My Orders"}</h2>
      <button class="icon-button close-account-panel" type="button">x</button>
    </div>
    <div id="userOrdersList" style="display:grid;gap:12px">
      <p style="text-align:center;color:var(--muted)">${isAr ? "جاري التحميل..." : "Loading..."}</p>
    </div>
  </div>`;
  document.body.appendChild(panel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel || e.target.closest(".close-account-panel")) panel.remove();
    const cancelBtn = e.target.closest("[data-cancel-order]");
    if (cancelBtn) {
      const orderId = cancelBtn.dataset.cancelOrder;
      handleCancelOrder(orderId, panel, isAr);
    }
  });
  // Load orders async
  (async () => {
    const orders = await getUserOrders();
    const list = document.getElementById("userOrdersList");
    if (!list) return;
    list.innerHTML = orders.length ? orders.map(o => {
      const statusColor = o.status === 'cancelled' ? 'var(--danger)' : o.status === 'delivered' ? 'var(--accent-strong)' : 'var(--warm)';
      const canCancel = o.status === 'pending';
      return `
        <article style="display:grid;gap:6px;padding:14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <strong style="color:var(--text-strong);font-size:0.9rem">${o.id}</strong>
            <span style="font-size:0.78rem;color:var(--muted)">${new Date(o.date).toLocaleDateString()}</span>
          </div>
          <span style="color:${statusColor};font-weight:800;font-size:0.82rem">${o.status || 'pending'}</span>
          <span style="font-weight:800">EGP ${o.total}</span>
          <span style="font-size:0.82rem;color:var(--muted)">${o.items ? o.items.length : 0} ${isAr ? "منتج" : "items"}</span>
          ${canCancel ? `<button class="secondary-button" data-cancel-order="${o.id}" style="border-color:var(--danger);color:var(--danger);font-size:0.82rem;padding:6px 12px;min-height:auto;margin-top:4px">${isAr ? "إلغاء الطلب" : "Cancel Order"}</button>` : ""}
        </article>
      `;
    }).join('') : `<p class="empty-state">${isAr ? "لا توجد طلبات بعد" : "No orders yet"}</p>`;
  })();
}

async function handleCancelOrder(orderId, panel, isAr) {
  if (!confirm(isAr ? "هل أنت متأكد من إلغاء هذا الطلب؟" : "Are you sure you want to cancel this order?")) return;
  const result = await cancelOrder(orderId, isAr ? "تم الإلغاء بواسطة العميل" : "Cancelled by customer");
  if (result) {
    showToast(isAr ? "تم إلغاء الطلب" : "Order cancelled");
    panel.remove();
    showUserOrders();
  } else {
    showToast(isAr ? "لا يمكن إلغاء هذا الطلب" : "Cannot cancel this order");
  }
}

function showUserSettings() {
  const isAr = state.lang === "ar";
  const panel = document.createElement("aside");
  panel.className = "cart-drawer is-open";
  panel.setAttribute("aria-hidden", "false");
  panel.innerHTML = `<div class="drawer-panel" role="dialog" aria-modal="true">
    <div class="drawer-header">
      <h2>${isAr ? "الإعدادات" : "Settings"}</h2>
      <button class="icon-button close-settings-panel" type="button">x</button>
    </div>
    <div style="display:grid;gap:16px;padding:0 0 20px">
      <div style="background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:16px">
        <div style="display:grid;gap:14px">
          <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--line)">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900;color:var(--accent-text);flex-shrink:0">${escHtml((state.user.name || 'U')[0].toUpperCase())}</div>
            <div>
              <p style="font-weight:900;color:var(--text-strong);margin:0">${escHtml(state.user.name || '')}</p>
              <p style="font-size:0.82rem;color:var(--muted);margin:0">${escHtml(state.user.email)}</p>
            </div>
          </div>
          <label style="display:grid;gap:4px">
            <span style="font-weight:800;font-size:0.78rem;color:var(--accent-strong);text-transform:uppercase;letter-spacing:0.03em">${isAr ? "الاسم" : "Full Name"}</span>
            <input id="settingsName" type="text" value="${escHtml(state.user.name || '')}" style="width:100%;min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700;font-size:0.95rem">
          </label>
          <label style="display:grid;gap:4px">
            <span style="font-weight:800;font-size:0.78rem;color:var(--accent-strong);text-transform:uppercase;letter-spacing:0.03em">${isAr ? "رقم الهاتف" : "Phone Number"}</span>
            <input id="settingsPhone" type="tel" value="${escHtml(state.user.phone || '')}" style="width:100%;min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700;font-size:0.95rem">
          </label>
          <label style="display:grid;gap:4px">
            <span style="font-weight:800;font-size:0.78rem;color:var(--accent-strong);text-transform:uppercase;letter-spacing:0.03em">${isAr ? "عنوان التوصيل" : "Delivery Address"}</span>
            <textarea id="settingsAddress" rows="3" style="width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--field-bg);color:var(--text);font-weight:700;font-size:0.95rem;resize:vertical">${escHtml(state.user.deliveryAddress || '')}</textarea>
          </label>
        </div>
      </div>
      <button id="saveSettingsBtn" class="checkout-button" type="button" style="min-height:50px;font-size:1rem">${isAr ? "💾 حفظ التغييرات" : "💾 Save Changes"}</button>
      <p id="settingsMsg" style="text-align:center;font-weight:800;font-size:0.85rem;color:var(--danger);margin:0"></p>
    </div>
  </div>`;
  document.body.appendChild(panel);

  panel.addEventListener("click", (e) => {
    if (e.target === panel || e.target.closest(".close-settings-panel")) panel.remove();
  });

  panel.querySelector("#saveSettingsBtn")?.addEventListener("click", async () => {
    const name = panel.querySelector("#settingsName").value.trim();
    const phone = panel.querySelector("#settingsPhone").value.trim();
    const address = panel.querySelector("#settingsAddress").value.trim();
    const msg = panel.querySelector("#settingsMsg");
    if (!name) { msg.textContent = isAr ? "الاسم مطلوب" : "Name is required"; return; }

    state.user.name = name;
    state.user.phone = phone;
    state.user.deliveryAddress = address;
    saveSession(state.user);

    const users = getUsers();
    const idx = users.findIndex(u => u.email === state.user.email);
    if (idx >= 0) {
      users[idx].name = name;
      users[idx].phone = phone;
      users[idx].deliveryAddress = address;
      saveUsers(users);
    }

    await saveUserToFirestore(state.user);
    updateUserUI();
    panel.remove();
    showToast(isAr ? "تم حفظ التغييرات" : "Changes saved");
  });
}

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function showWishlistPanel() {
  const isAr = state.lang === "ar";
  const panel = document.createElement("aside");
  panel.className = "cart-drawer is-open";
  panel.setAttribute("aria-hidden", "false");
  const wishlistProducts = getMergedProducts().filter(p => state.wishlist.includes(p.id));
  panel.innerHTML = `<div class="drawer-panel" role="dialog" aria-modal="true">
    <div class="drawer-header">
      <h2>${isAr ? "المفضلة" : "Wishlist"}</h2>
      <button class="icon-button close-account-panel" type="button">x</button>
    </div>
    <div style="display:grid;gap:12px">
      ${wishlistProducts.length ? wishlistProducts.map(p => `
        <article style="display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)">
          <img src="${productImageUrl(p.image)}" alt="${getProductName(p)}" style="width:60px;height:60px;object-fit:cover;border-radius:6px">
          <div>
            <strong style="color:var(--text-strong);font-size:0.9rem">${getProductName(p)}</strong>
            <p style="margin:2px 0 0;color:var(--warm);font-weight:800;font-size:0.85rem">${t("from")} ${money(p.basePrice)}</p>
          </div>
          <button class="icon-button" data-wishlist-remove="${p.id}" style="width:36px;min-width:36px;height:36px" title="${isAr ? "إزالة" : "Remove"}">x</button>
        </article>
      `).join('') : `<p class="empty-state">${isAr ? "المفضلة فارغة" : "Wishlist is empty"}</p>`}
    </div>
  </div>`;
  document.body.appendChild(panel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel || e.target.closest(".close-account-panel")) panel.remove();
    const removeBtn = e.target.closest("[data-wishlist-remove]");
    if (removeBtn) {
      const pid = removeBtn.dataset.wishlistRemove;
      toggleWishlist(pid);
      panel.remove();
      showWishlistPanel();
    }
  });
}

function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId);
  if (idx >= 0) state.wishlist.splice(idx, 1);
  else state.wishlist.push(productId);
  saveWishlistData(state.wishlist);
  renderProducts();
}

function isInWishlist(productId) {
  return state.wishlist.includes(productId);
}

function validateCoupon(code, subtotal) {
  const isAr = state.lang === "ar";
  if (!code) return { valid: false, msg: isAr ? "أدخل كود الخصم" : "Enter coupon code" };
  const coupons = getCouponsData();
  const coupon = coupons.find(c => c.code && c.code.trim().toUpperCase() === code.trim().toUpperCase());
  if (!coupon) return { valid: false, msg: isAr ? "كود الخصم غير صحيح" : "Invalid coupon code" };
  if (coupon.maxUses && (coupon.uses || 0) >= coupon.maxUses) {
    return { valid: false, msg: isAr ? "تم استنفاد هذا الكوبون بالكامل" : "Coupon has reached maximum uses" };
  }
  if (subtotal < (coupon.minOrder || 0)) {
    return { valid: false, msg: isAr ? `الحد الأدنى للطلب ${coupon.minOrder} ج.م` : `Minimum order EGP ${coupon.minOrder} required` };
  }
  let discount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value;
  if (discount > subtotal) discount = subtotal;
  return { valid: true, discount, coupon };
}

function recordCouponUsage(couponCode, order) {
  if (!couponCode) return;
  const coupons = getCouponsData();
  const coup = coupons.find(c => c.code && c.code.trim().toUpperCase() === couponCode.trim().toUpperCase());
  if (coup) {
    coup.uses = (coup.uses || 0) + 1;
    if (!Array.isArray(coup.usedBy)) coup.usedBy = [];
    coup.usedBy.push({
      orderId: order ? order.id : null,
      date: order ? order.date : new Date().toISOString(),
      customerName: order ? order.customerName : null,
      customerPhone: order ? order.customerPhone : null,
      discount: order ? order.discount : null
    });
    saveCouponsData(coupons);
    if (typeof saveCouponToFirestore === 'function') {
      saveCouponToFirestore(coup);
    }
  }
}

function applyCoupon(code) {
  const subtotal = cartSubtotal();
  const result = validateCoupon(code, subtotal);
  const removeBtn = document.querySelector("[data-coupon-remove]");
  if (result.valid) {
    state.appliedCoupon = result.coupon;
    if (removeBtn) removeBtn.hidden = false;
    showToast(`Coupon applied! You save EGP ${Math.round(result.discount)}`);
  } else {
    state.appliedCoupon = null;
    if (removeBtn) removeBtn.hidden = true;
    showToast(result.msg);
  }
  renderCart();
}

function removeCoupon() {
  state.appliedCoupon = null;
  const removeBtn = document.querySelector("[data-coupon-remove]");
  if (removeBtn) removeBtn.hidden = true;
  renderCart();
}

function getDiscountedTotal() {
  const subtotal = cartSubtotal();
  if (!state.appliedCoupon) return subtotal;
  const result = validateCoupon(state.appliedCoupon.code, subtotal);
  return result.valid ? subtotal - result.discount : subtotal;
}

function cartGrandTotal() {
  const subtotalWithDiscount = getDiscountedTotal();
  return subtotalWithDiscount + orderDeliveryFee();
}

function cartSubtotal() {
  return state.cart.reduce((sum, item) => sum + cartLineTotal(item), 0);
}

function submitReview(productId, rating, comment, authorName) {
  const reviews = getReviewsData();
  const review = {
    id: 'rev-' + Date.now(),
    productId,
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment.trim(),
    author: authorName.trim() || 'Anonymous',
    date: new Date().toISOString()
  };
  reviews.push(review);
  saveReviewsData(reviews);
  return review;
}

function getProductReviews(productId) {
  return getReviewsData().filter(r => r.productId === productId).reverse();
}

function getProductRating(productId) {
  const reviews = getProductReviews(productId);
  if (!reviews.length) return { avg: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}

function createOrder(formData) {
  const items = state.cart.map(item => ({ ...item }));
  const subtotal = cartSubtotal();
  const discount = state.appliedCoupon ? (subtotal - getDiscountedTotal()) : 0;
  const delivery = orderDeliveryFee();
  const total = subtotal - discount + delivery;
  const order = {
    id: generateOrderId(),
    date: new Date().toISOString(),
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    customerAddress: formData.customerAddress,
    paymentMethod: formData.paymentMethod,
    orderNote: formData.orderNote || '',
    items,
    subtotal,
    discount,
    deliveryFee: delivery,
    total,
    status: 'pending',
    userId: state.user ? state.user.id : null,
    userEmail: state.user ? state.user.email : null,
    appliedCoupon: state.appliedCoupon ? { code: state.appliedCoupon.code, discount } : null,
    cancelledAt: null,
    cancelReason: ''
  };

  // Save to localStorage (always)
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);

  // Save to Firestore if user is logged in
  saveOrderToFirestore(order);

    if (state.appliedCoupon) {
    recordCouponUsage(state.appliedCoupon.code, order);
  }

  return order;
}

/* ── Firestore Helpers ── */
function saveOrderToFirestore(order) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('orders').doc(order.id).set(order);
      resolve(true);
    } catch (e) {
      console.error('[Firestore] save order error:', e);
      resolve(false);
    }
  });
}

function updateOrderInFirestore(orderId, updates) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      await db.collection('orders').doc(orderId).update(updates);
      resolve(true);
    } catch (e) {
      console.error('[Firestore] update order error:', e);
      resolve(false);
    }
  });
}

function saveUserToFirestore(userData, rawPassword) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(false); return; }
    try {
      const db = getFirebaseDb();
      const data = {
        name: userData.name || '',
        email: userData.email,
        phone: userData.phone || '',
        deliveryAddress: userData.deliveryAddress || '',
        password: rawPassword ? btoa(rawPassword) : '',
        updatedAt: new Date().toISOString()
      };
      if (!rawPassword) delete data.password;
      await db.collection('users').doc(userData.email).set(data, { merge: true });
      resolve(true);
    } catch (e) {
      console.error('[Firestore] save user error:', e);
      resolve(false);
    }
  });
}

function getUserFromFirestore(email) {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady()) { resolve(null); return; }
    try {
      const db = getFirebaseDb();
      const doc = await db.collection('users').doc(email).get();
      resolve(doc.exists ? doc.data() : null);
    } catch (e) {
      console.error('[Firestore] get user error:', e);
      resolve(null);
    }
  });
}

async function getUserOrders() {
  const local = getOrders().filter(o => state.user && o.userEmail === state.user.email);
  const firestoreOrders = await getUserOrdersFromFirestore();
  const seen = new Set(local.map(o => o.id));
  firestoreOrders.forEach(o => { if (!seen.has(o.id)) local.push(o); });
  return local.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getUserOrdersFromFirestore() {
  return new Promise(async (resolve) => {
    initFirebase();
    if (!isFirebaseReady() || !state.user) { resolve([]); return; }
    try {
      const db = getFirebaseDb();
      const snap = await db.collection('orders')
        .where('userEmail', '==', state.user.email)
        .orderBy('date', 'desc')
        .get();
      const result = [];
      snap.forEach(doc => result.push(doc.data()));
      resolve(result);
    } catch (e) {
      console.error('[Firestore] get orders error:', e);
      resolve([]);
    }
  });
}

function cancelOrder(orderId, reason) {
  return new Promise(async (resolve) => {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) { resolve(false); return; }
    if (order.status !== 'pending') { resolve(false); return; }
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelReason = reason || 'Cancelled by user';
    saveOrders(orders);

    // Update Firestore
    if (isFirebaseReady() && state.user) {
      try {
        const db = getFirebaseDb();
        await db.collection('orders').doc(orderId).update({
          status: 'cancelled',
          cancelledAt: order.cancelledAt,
          cancelReason: order.cancelReason
        });
      } catch (e) {
        console.error('[Firestore] cancel order error:', e);
      }
    }
    resolve(true);
  });
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

  // Update nav search placeholder on language switch
  const navSearch = document.querySelector("#navSearchInput");
  if (navSearch) {
    navSearch.placeholder = t("searchPlaceholder");
    navSearch.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
  }
  updateUserUI();
}

function updateThemeUI() {
  const theme = state.theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const label = theme === "dark" ? t("themeToggle") : t("themeToggleDark");
    const icon = button.querySelector("[data-theme-icon]");
    const text = button.querySelector("[data-t]");
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (icon) icon.innerHTML = theme === "dark"
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
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

function preloadProductImages(list) {
  const targets = (list || filteredProducts()).slice(0, 2);
  targets.forEach((product) => {
    const src = product.gallery?.length ? product.gallery[0] : product.image;
    if (!src) return;
    const url = productImageUrl(src);
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    link.fetchPriority = "high";
    document.head.appendChild(link);
  });
}

function normalizeSearchText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[#\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let _lastFilterSearch = null;
let _lastFilterResult = null;

function filteredProducts() {
  const rawSearch = (state.search || "").trim();
  const search = normalizeSearchText(rawSearch);
  if (_lastFilterSearch === search && _lastFilterResult) return _lastFilterResult;
  _lastFilterSearch = search;

  if (!search) {
    _lastFilterResult = getMergedProducts();
    return _lastFilterResult;
  }

  const terms = search.split(/\s+/).filter(Boolean);

  _lastFilterResult = getMergedProducts().filter((product) => {
    const haystack = product._searchCache || (product._searchCache = normalizeSearchText([
      product.name, product.nameAr,
      product.tag, product.tagAr,
      product.category,
      product.player, product.playerAr,
      product.team, product.teamAr,
      product.tags ? (Array.isArray(product.tags) ? product.tags.join(" ") : product.tags) : "",
      product.keywords ? (Array.isArray(product.keywords) ? product.keywords.join(" ") : product.keywords) : "",
      product.description, product.descriptionAr
    ].filter(Boolean).join(" ")));
    
    return terms.every((term) => haystack.includes(term));
  });
  return _lastFilterResult;
}

function catSectionIcon(meta) {
  if (meta.image && meta.icon !== "🎨") {
    return `<img src="${productImageUrl(meta.image)}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover">`;
  }
  return meta.icon;
}


function getCategoryMeta(currentLang) {
  return {
    anime:     { label: currentLang === "ar" ? "أنمي" : "Anime", icon: "⛩️", image: "assets/animy/imgdownloader-017095bf.webp" },
    art:       { label: currentLang === "ar" ? "فن" : "Art", icon: "🖼️", image: "assets/art/imgdownloader-07ae17e0.webp" },
    album:     { label: currentLang === "ar" ? "ألبوم فنان" : "Album Artist", icon: "💿", image: "assets/album artist/imgdownloader-0435978d.webp" },
    gym:       { label: currentLang === "ar" ? "جيم" : "Gym", icon: "💪", image: "assets/gym/imgdownloader-83fe47af.webp" },
    islamic:   { label: currentLang === "ar" ? "إسلامي" : "Islamic", icon: "🕌", image: "assets/islamic/imgdownloader-03c8733c.webp" },
    girls:     { label: currentLang === "ar" ? "فتيات" : "Girls", icon: "👩", image: "assets/girls/imgdownloader-09b7ca7a.webp" },
    games:     { label: currentLang === "ar" ? "ألعاب" : "Games", icon: "🎮", image: "assets/games/imgdownloader-06813997.webp" },
    cities:    { label: currentLang === "ar" ? "مدن" : "Cities", icon: "🏙️", image: "assets/cities/imgdownloader-0a531ead.webp" },
    quotes:    { label: currentLang === "ar" ? "اقتباسات" : "Quotes", icon: "💬", image: "assets/quotes/imgdownloader-04673cb4.webp" },
    nba:       { label: "NBA", icon: "🏀", image: "assets/nba/imgdownloader-02ebeb08.webp" },
    meemes:    { label: currentLang === "ar" ? "ميمات" : "Memes", icon: "😂", image: "assets/meemes/imgdownloader-0025213c.webp" },
    pharaonic: { label: currentLang === "ar" ? "فرعوني" : "Pharaonic", icon: "𓅓", image: "assets/pharaonic/imgdownloader-2f388c69.webp" },
    rap:       { label: currentLang === "ar" ? "مشهد الراب" : "Rap Scene", icon: "🎤", image: "assets/rap scene/imgdownloader-0b38f8a6.webp" },
    jordan:    { label: currentLang === "ar" ? "جوردان" : "Jordan", icon: "👟", image: "assets/jordan/imgdownloader-412390fa.webp" },
    movie:     { label: currentLang === "ar" ? "أفلام وفن" : "Movie & Artist", icon: "🎬", image: "assets/movie/imgdownloader-022451f8.webp" },
    cars:      { label: currentLang === "ar" ? "سيارات" : "Cars",     icon: "🚗", image: "assets/cars/imgdownloader-00a26443.webp" },
    football:  { label: currentLang === "ar" ? "كرة قدم" : "Football", icon: "⚽", image: "assets/football-players/imgdownloader-00841b18.webp" },
    clubs:     { label: currentLang === "ar" ? "أندية"   : "Clubs",    icon: "🏆", image: "assets/clubs/imgdownloader-02a7d1b7.webp" },
    custom:    { label: currentLang === "ar" ? "تصميم خاص" : "Custom upload", icon: "🎨" }
  };
}

function renderProducts() {
  const container = document.querySelector("#categorySections");
  if (!container) return;

  const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
  if (currentCat) {
    renderSingleCategory(currentCat);
    return;
  }
  catParam = null;
  
  // If search is active, show dedicated search results grid with all matching items
  const isSearching = state.search && state.search.trim();
  const currentLang = state.lang || "en";

  if (isSearching) {
    const results = filteredProducts();
    const resultCountText = currentLang === "ar"
      ? `${results.length} ${results.length === 1 ? "منتج" : "منتجات"}`
      : `${results.length} ${results.length === 1 ? "product" : "products"}`;

    let searchHtml = `
      <div class="search-results-banner">
        <div class="search-results-info">
          <span class="search-results-eyebrow">${currentLang === "ar" ? "نتائج البحث" : "Search Results"}</span>
          <h2>"${state.search.trim()}"</h2>
          <span class="search-results-count">${resultCountText}</span>
        </div>
        <button class="clear-search-btn" type="button" data-clear-search aria-label="${currentLang === "ar" ? "إلغاء البحث" : "Clear search"}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <span>${currentLang === "ar" ? "مسح البحث" : "Clear"}</span>
        </button>
      </div>
    `;

    if (!results.length) {
      searchHtml += `<div class="empty-state" style="padding:60px clamp(16px,4vw,42px)"><strong>${t("noProductsFound")}</strong><p>${t("tryDifferentSearch")}</p></div>`;
      container.innerHTML = searchHtml;
      const pillsEl = document.querySelector("[data-cat-pills]");
      if (pillsEl) pillsEl.innerHTML = "";
      return;
    }

    searchHtml += `<div class="full-cat-grid" id="fullCatGrid">\n`;
    searchHtml += catCardHtml(results, 0, currentLang);
    searchHtml += `</div>\n`;

    container.innerHTML = searchHtml;
    const pillsEl = document.querySelector("[data-cat-pills]");
    if (pillsEl) pillsEl.innerHTML = "";
    return;
  }

  // Featured home page preview indices (only when no search is active)
  const featuredIndices = {
    football: [7,15,22,33,79,97,110,120,127,151],
    cars:     [2,8,14,31,48,63],
    album:    [3,11,14,37,45,105],
    movie:    [0,9,17,27,45,121],
    quotes:   [1,5,11,12,17,24],
    anime:    [4,11,25,29,46,65],
    art:      [0,10,28,34,43,63],
    girls:    [2,3,9,17,35,53]
  };

  const list = filteredProducts();

  if (!list.length) {
    container.innerHTML = `<div class="empty-state" style="padding:60px clamp(16px,4vw,42px)"><strong>${t("noProductsFound")}</strong><p>${t("tryDifferentSearch")}</p></div>`;
    const pillsEl = document.querySelector("[data-cat-pills]");
    if (pillsEl) pillsEl.innerHTML = "";
    return;
  }

  // Group by category preserving defined order
  const categoryOrder = ["custom", "football", "cars", "clubs", "anime", "movie", "album", "quotes", "islamic", "art", "gym", "girls", "games", "cities", "nba", "meemes", "pharaonic", "rap", "jordan"];
  const categoryMeta = getCategoryMeta(currentLang);

  const groups = {};
  list.forEach(p => {
    const cat = p.category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  const extraCats = Object.keys(groups).filter(c => !categoryOrder.includes(c));
  const allDisplayCats = [...categoryOrder, ...extraCats];

  let html = "";
  allDisplayCats.forEach((cat, catIdx) => {
    const items = groups[cat];
    if (!items || !items.length) return;
    const meta = categoryMeta[cat] || { label: cat, icon: "" };
    const featuredForCat = featuredIndices ? featuredIndices[cat] : null;
    const visible = featuredForCat ? featuredForCat.map(i => items[i]).filter(Boolean) : items.slice(0, 6);
    if (!visible.length) return;
    const count = currentLang === "ar"
      ? `${items.length} ${items.length === 1 ? "منتج" : "منتجات"}`
      : `${items.length} ${items.length === 1 ? "product" : "products"}`;
    const showAll = featuredForCat ? items.length > featuredForCat.length : items.length > 6;

    html += `<section class="category-section" style="--section-order: ${catIdx}" data-cat="${cat}">\n`;
    html += `  <div class="section-heading">\n`;
    html += `    <div style="display:flex;align-items:center;gap:8px">\n`;
html += `      <span style="font-size:1.4rem">${catSectionIcon(meta)}</span>\n`;
      html += `      <h2>${meta.label}</h2>\n`;
    html += `    </div>\n`;
    html += `    <a href="?cat=${cat}" class="result-count-btn" data-open-category="${cat}" role="button" aria-label="${currentLang === "ar" ? "تصفح " + meta.label : "Browse " + meta.label}">\n`;
    html += `      <span class="count-btn-dot" aria-hidden="true"></span>\n`;
    html += `      <span class="count-btn-text">${count}</span>\n`;
    html += `      <span class="count-btn-arrow" aria-hidden="true">${currentLang === "ar" ? "←" : "→"}</span>\n`;
    html += `    </a>\n`;
    html += `  </div>\n`;
    html += `  <div class="category-carousel-wrap">\n`;
    html += `    <button class="carousel-nav-btn carousel-nav-prev" type="button" aria-label="${currentLang === "ar" ? "السابق" : "Previous"}" data-carousel-prev="${cat}">\n`;
    html += `      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>\n`;
    html += `    </button>\n`;
    html += `    <div class="category-scroll" data-scroll="${cat}">\n`;

    visible.forEach((product, idx) => {
      const name = getProductName(product);
      const tag = currentLang === "ar" && product.tagAr ? product.tagAr : product.tag;
      const desc = currentLang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
      const sceneImage = sceneImageForIndex(idx);

      html += `    <article class="product-card" style="--delay: ${idx * 30}ms">\n`;
      html += `      <a class="product-media" href="product.html?id=${product.id}&size=20x30&frame=Black" aria-label="View ${name}"${sceneImage ? ` style="--scene-image: url('${sceneImage}')"` : ""}>\n`;
      html += `        <span class="frame-preview frame-preview-black"></span>\n        <span class="card-glare"></span>\n`;
      html += `        <img src="${productImageUrl(product.image)}" loading="${catIdx < 2 && idx < 2 ? "eager" : "lazy"}" decoding="async" fetchpriority="${catIdx === 0 && idx < 2 ? "high" : "auto"}" alt="${name} ${currentLang === "ar" ? "بوستر مؤطر" : "framed poster"}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">\n`;
      html += `        <span class="product-tag">${tag}</span>\n`;
      if (galleryBadge(product)) {
        html += `        <span class="product-gallery-badge">${galleryBadge(product)}</span>\n`;
      }
      html += `        <div class="media-actions">\n`;
      html += `          <button class="icon-button cart-icon-btn" type="button" data-quick-add="${product.id}" aria-label="${currentLang === "ar" ? "أضف للسلة" : "Add to cart"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></button>\n`;
      html += `        </div>\n`;
      html += `      </a>\n`;
      html += `      <div class="product-info">\n`;
      html += `        <h3>${name}</h3>\n`;
      html += `        <div class="product-meta">\n`;
      html += `          <span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
      html += `          <span class="price-label">${t("from")}</span>\n`;
      html += `        </div>\n`;
      html += `      </div>\n`;
      html += `    </article>\n`;
    });

    if (showAll) {
      html += `    <div class="view-all-tile">\n`;
      html += `      <a href="?cat=${cat}">${currentLang === "ar" ? `عرض الكل (${items.length})` : `View all (${items.length})`}</a>\n`;
      html += `    </div>\n`;
    }

    html += `    </div>\n`;
    html += `    <button class="carousel-nav-btn carousel-nav-next" type="button" aria-label="${currentLang === "ar" ? "التالي" : "Next"}" data-carousel-next="${cat}">\n`;
    html += `      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>\n`;
    html += `    </button>\n`;
    html += `  </div>\n`;
    html += `</section>\n`;
  });

  container.innerHTML = html;
  renderCatPills();
  wireDragScroll();
}

function renderCatPills() {
  const pillsEl = document.querySelector("[data-cat-pills]");
  if (!pillsEl) return;
  const currentLang = state.lang || "en";
  const list = filteredProducts();

  const categoryOrder = ["custom", "football", "cars", "clubs", "anime", "movie", "album", "quotes", "islamic", "art", "gym", "girls", "games", "cities", "nba", "meemes", "pharaonic", "rap", "jordan"];
  const categoryMeta = getCategoryMeta(currentLang);

  const groups = {};
  list.forEach(p => {
    const cat = p.category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  let html = "";
  categoryOrder.forEach((cat, idx) => {
    const items = groups[cat];
    if (!items || !items.length) return;
    const meta = categoryMeta[cat] || { label: cat, icon: "" };
    html += `<button class="cat-pill" data-cat-pill="${cat}" type="button">`;
    if (meta.image && meta.icon !== "🎨") {
      html += `  <span class="cat-pill-circle"><img class="cat-pill-img" src="${productImageUrl(meta.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentNode.textContent='${meta.icon}'"></span>`;
    } else {
      html += `  <span class="cat-pill-circle">${meta.icon}</span>`;
    }
    html += `  <span class="cat-pill-label">${meta.label}</span>`;
    html += `</button>`;
  });

  pillsEl.innerHTML = html;

  pillsEl.querySelectorAll(".cat-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = btn.dataset.catPill;

      function performScroll(elem) {
        if (!elem) return;
        const header = document.querySelector(".site-header");
        const headerH = header ? (header.getBoundingClientRect().height || header.offsetHeight) : 60;
        const rect = elem.getBoundingClientRect();
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + currentScroll - headerH - 6;
        window.scrollTo({ top: Math.max(0, Math.round(targetTop)), behavior: "smooth" });

        pillsEl.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }

      const target = document.querySelector(`[data-cat="${cat}"]`);
      if (target) {
        performScroll(target);
      } else {
        // If on single category view or search view, reset to home grid then scroll
        state.selectedProduct = null;
        state.search = "";
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("cat");
          url.searchParams.delete("id");
          url.searchParams.delete("search");
          url.searchParams.delete("q");
          window.history.pushState({}, "", url.pathname);
        } catch (_) {}
        renderProducts();
        renderCatPills();
        setTimeout(() => {
          const freshTarget = document.querySelector(`[data-cat="${cat}"]`);
          if (freshTarget) performScroll(freshTarget);
        }, 80);
      }
    });
  });

  watchCatPills();
  wireCatPillsDrag();
}

let _catPillsWired = false;

function wireCatPillsDrag() {
  const pillsEl = document.querySelector("[data-cat-pills]");
  if (!pillsEl || _catPillsWired) return;
  _catPillsWired = true;

  let down = false, startX = 0, prevX = 0, dragged = false;

  function pd(clientX) { down = true; dragged = false; startX = prevX = clientX; pillsEl.classList.add("dragging"); }
  function pm(clientX) {
    if (!down) return;
    const dx = clientX - prevX;
    prevX = clientX;
    if (Math.abs(clientX - startX) > 9) dragged = true;
    pillsEl.scrollLeft -= dx;
  }
  function pu() { down = false; pillsEl.classList.remove("dragging"); }
  pillsEl.addEventListener("mousedown", e => { if (e.button !== 0) return; pd(e.clientX); });
  pillsEl.addEventListener("mousemove", e => pm(e.clientX));
  pillsEl.addEventListener("mouseup", pu);
  pillsEl.addEventListener("mouseleave", pu);
  pillsEl.addEventListener("dragstart", e => e.preventDefault());
  // Note: touch devices use browser-native hardware accelerated touch scrolling.
  // Custom drag is strictly kept for desktop mouse interactions.
  pillsEl.addEventListener("click", e => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
}

function watchCatPills() {
  const pills = document.querySelectorAll(".cat-pill");
  if (!pills.length) return;
  const sections = document.querySelectorAll(".category-section");
  if (!sections.length) return;

  if (catPillsObserver) catPillsObserver.disconnect();

  catPillsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cat = entry.target.dataset.cat;
        pills.forEach(p => p.classList.toggle("active", p.dataset.catPill === cat));
      }
    });
  }, { rootMargin: "-60px 0px -60% 0px" });

  sections.forEach(s => catPillsObserver.observe(s));
}

function updateCarouselNavArrows(scrollEl) {
  const wrap = scrollEl.closest('.category-carousel-wrap');
  if (!wrap) return;
  const prevBtn = wrap.querySelector('.carousel-nav-prev');
  const nextBtn = wrap.querySelector('.carousel-nav-next');
  if (!prevBtn || !nextBtn) return;

  const maxScroll = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth - 8);
  if (maxScroll <= 5) {
    prevBtn.style.opacity = '0';
    prevBtn.style.pointerEvents = 'none';
    nextBtn.style.opacity = '0';
    nextBtn.style.pointerEvents = 'none';
    return;
  }

  const sl = Math.abs(scrollEl.scrollLeft);
  const atStart = sl <= 8;
  const atEnd = sl >= maxScroll;

  prevBtn.style.opacity = atStart ? '0' : '0.92';
  prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
  nextBtn.style.opacity = atEnd ? '0' : '0.92';
  nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
}

function wireDragScroll() {
  document.querySelectorAll(".category-scroll:not([data-drag-wired])").forEach(el => {
    el.dataset.dragWired = "true";
    let down = false, startX = 0, prevX = 0, dragged = false;

    function onPointerDown(e) {
      // ONLY intercept mouse drags on desktop!
      // Touch devices must use native browser touch scrolling so vertical scrolling never gets blocked!
      if (e.pointerType !== "mouse") return;
      if (e.button !== 0) return;
      down = true;
      dragged = false;
      startX = prevX = e.clientX;
    }

    function onPointerMove(e) {
      if (!down) return;
      const clientX = e.clientX;
      const isRtl = document.documentElement.dir === "rtl";
      const dx = isRtl ? (clientX - prevX) : (prevX - clientX);
      prevX = clientX;
      if (Math.abs(clientX - startX) > 4) {
        dragged = true;
        el.classList.add("dragging");
      }
      if (dragged) {
        el.scrollLeft += dx;
      }
    }

    function onPointerUp() {
      if (!down) return;
      down = false;
      setTimeout(() => {
        el.classList.remove("dragging");
        dragged = false;
      }, 50);
    }

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    // Prevent default drag of images and links inside the carousel
    el.querySelectorAll("img, a").forEach(node => {
      node.setAttribute("draggable", "false");
      node.addEventListener("dragstart", e => e.preventDefault());
    });

    // Suppress click on card if user was dragging
    el.addEventListener("click", e => {
      if (dragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // Mouse wheel scrolling
    el.addEventListener("wheel", e => {
      const isRtl = document.documentElement.dir === "rtl";
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += isRtl ? -e.deltaX : e.deltaX;
      } else if (e.shiftKey && Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += isRtl ? -e.deltaY : e.deltaY;
      }
    }, { passive: false });

    el.addEventListener("scroll", () => updateCarouselNavArrows(el), { passive: true });
    setTimeout(() => updateCarouselNavArrows(el), 120);
    setTimeout(() => updateCarouselNavArrows(el), 450);
  });
}

// Carousel navigation arrows click handler (smooth scroll left / right on desktop & tablet)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".carousel-nav-btn");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const wrap = btn.closest(".category-carousel-wrap");
  if (!wrap) return;
  const scrollEl = wrap.querySelector(".category-scroll");
  if (!scrollEl) return;

  const isNext = btn.classList.contains("carousel-nav-next") || btn.hasAttribute("data-carousel-next");
  const isRtl = document.documentElement.dir === "rtl" || (state && state.lang === "ar");

  const card = scrollEl.querySelector(".product-card");
  const cardWidth = card ? (card.getBoundingClientRect().width + 10) : 250;
  // Scroll roughly 2 full cards or 80% container width
  const step = Math.max(220, Math.min(cardWidth * 2, scrollEl.clientWidth * 0.85));

  const delta = isRtl ? (isNext ? -step : step) : (isNext ? step : -step);

  scrollEl.scrollBy({ left: delta, behavior: "smooth" });

  setTimeout(() => updateCarouselNavArrows(scrollEl), 160);
  setTimeout(() => updateCarouselNavArrows(scrollEl), 360);
});

window.addEventListener("resize", () => {
  document.querySelectorAll(".category-scroll").forEach(updateCarouselNavArrows);
}, { passive: true });

const CAT_PAGE_SIZE = 30;
let catLoadedCount = 0;
let catItems = [];
let catParam = null;
let catPillsObserver = null;
let _scrollYLock = null;

function renderSingleCategory(cat) {
  const container = document.querySelector("#categorySections");
  if (!container) return;
  const pillsEl = document.querySelector("[data-cat-pills]");
  if (pillsEl) pillsEl.innerHTML = "";
  if (catPillsObserver) catPillsObserver.disconnect();
  const currentLang = state.lang || "en";

  const isSearching = state.search && state.search.trim();
  if (isSearching) {
    const searchTerms = normalizeSearchText(state.search).split(/\s+/).filter(Boolean);
    catItems = getMergedProducts().filter(p => {
      if (p.category !== cat) return false;
      const haystack = p._searchCache || (p._searchCache = normalizeSearchText([
        p.name, p.nameAr, p.tag, p.tagAr,
        p.player, p.playerAr, p.team, p.teamAr,
        p.tags ? (Array.isArray(p.tags) ? p.tags.join(" ") : p.tags) : "",
        p.keywords ? (Array.isArray(p.keywords) ? p.keywords.join(" ") : p.keywords) : "",
        p.description, p.descriptionAr
      ].filter(Boolean).join(" ")));
      return searchTerms.every(term => haystack.includes(term));
    });
  } else {
    catItems = getMergedProducts().filter(p => p.category === cat);
  }
  catParam = cat;

  if (!catItems.length) {
    const emptyMsg = isSearching
      ? (currentLang === "ar" ? `لم يتم العثور على بوسترات مطابقة لـ "${state.search}" في هذا القسم` : `No posters found matching "${state.search}" in this category`)
      : t("noProductsFound");
    container.innerHTML = `
      <div class="page-back-bar">
        <a class="page-back-btn" href="index.html" aria-label="${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}">
          <svg class="page-back-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}</span>
        </a>
      </div>
      <div class="empty-state" style="padding:60px clamp(16px,4vw,42px)"><strong>${emptyMsg}</strong></div>`;
    return;
  }

  const meta = getCategoryMeta(currentLang)[cat] || { label: cat, icon: "" };

  const total = catItems.length;
  const count = currentLang === "ar"
    ? `${total} ${total === 1 ? "منتج" : "منتجات"}`
    : `${total} ${total === 1 ? "product" : "products"}`;

  catLoadedCount = Math.min(CAT_PAGE_SIZE, total);

  let html = `<div class="page-back-bar">\n`;
  html += `  <a class="page-back-btn" href="index.html" aria-label="${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}">\n`;
  html += `    <svg class="page-back-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>\n`;
  html += `    <span>${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}</span>\n`;
  html += `  </a>\n`;
  html += `</div>\n`;
  html += `<div class="single-cat-header">\n`;
  html += `  <div style="display:flex;align-items:center;gap:8px">\n`;
html += `    <span style="font-size:1.4rem">${catSectionIcon(meta)}</span>\n`;
    html += `    <h2>${meta.label}</h2>\n`;
  html += `  </div>\n`;
  html += `  <span class="result-count">${count}</span>\n`;
  html += `</div>\n`;
  html += `<div class="full-cat-grid" id="fullCatGrid">\n`;
  html += catCardHtml(catItems.slice(0, catLoadedCount), 0, currentLang);
  html += `</div>\n`;

  container.innerHTML = html;
  appendLoadMore();
}

function catCardHtml(items, startIdx, lang) {
  return items.map((product, i) => {
    const idx = startIdx + i;
    const name = getProductName(product);
    const tag = lang === "ar" && product.tagAr ? product.tagAr : product.tag;
    const desc = lang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
    const sceneImage = sceneImageForIndex(idx);

    let card = `  <article class="product-card" style="--delay: ${idx * 20}ms">\n`;
    card += `    <a class="product-media" href="product.html?id=${product.id}&size=20x30&frame=Black" aria-label="View ${name}"${sceneImage ? ` style="--scene-image: url('${sceneImage}')"` : ""}>\n`;
    card += `      <span class="frame-preview frame-preview-black"></span>\n      <span class="card-glare"></span>\n`;
    card += `      <img src="${productImageUrl(product.image)}" loading="${idx < 6 ? "eager" : "lazy"}" decoding="async" fetchpriority="${idx < 6 ? "high" : "auto"}" alt="${name} ${lang === "ar" ? "بوستر مؤطر" : "framed poster"}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">\n`;
    card += `      <span class="product-tag">${tag}</span>\n`;
    if (galleryBadge(product)) {
      card += `      <span class="product-gallery-badge">${galleryBadge(product)}</span>\n`;
    }
    card += `      <div class="media-actions">\n`;
    card += `        <button class="icon-button cart-icon-btn" type="button" data-quick-add="${product.id}" aria-label="${lang === "ar" ? "أضف للسلة" : "Add to cart"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></button>\n`;
    card += `      </div>\n`;
    card += `    </a>\n`;
    card += `    <div class="product-info">\n`;
    card += `      <h3>${name}</h3>\n`;
    card += `      <div class="product-meta">\n`;
    card += `        <span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
    card += `        <span class="price-label">${t("from")}</span>\n`;
    card += `      </div>\n`;
    card += `    </div>\n`;
    card += `  </article>\n`;
    return card;
  }).join("");
}

let catObserver = null;

function appendLoadMore() {
  const grid = document.querySelector("#fullCatGrid");
  if (!grid) return;
  const remaining = catItems.length - catLoadedCount;
  const currentLang = state.lang || "en";
  if (remaining <= 0) {
    if (catObserver) catObserver.disconnect();
    return;
  }

  // Remove old sentinel if any
  const old = grid.parentNode.querySelector(".cat-load-sentinel");
  if (old) old.remove();

  const sentinel = document.createElement("div");
  sentinel.className = "cat-load-sentinel";
  sentinel.style.cssText = "height:1px";

  grid.parentNode.appendChild(sentinel);

  if (catObserver) catObserver.disconnect();
  catObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const next = catItems.slice(catLoadedCount, catLoadedCount + CAT_PAGE_SIZE);
      if (!next.length) return;
      grid.insertAdjacentHTML("beforeend", catCardHtml(next, catLoadedCount, currentLang));
      catLoadedCount += next.length;
      appendLoadMore();
    }
  }, { rootMargin: "200px" });
  catObserver.observe(sentinel);
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
      <img src="${media.src}" loading="lazy" decoding="async" alt="${media.title}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">
    </button>
  `).join("");

  showOurWorkImage(0);
  startOurWorkReel();
  updateOurWorkReelToggleLabel();
}

function renderDetail(productId) {
  const product = getProduct(productId);
  if (!product) {
    if (productDetail) {
      productDetail.hidden = false;
      const currentLang = state.lang || "en";
      productDetail.innerHTML = `
        <div class="page-back-bar">
          <a class="page-back-btn" href="index.html" aria-label="${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}">
            <svg class="page-back-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}</span>
          </a>
        </div>
        <div class="empty-state"><strong>${t("noProductsFound")}</strong><p><a href="index.html">${t("heroActionShop")}</a></p></div>`;
    }
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
    const rawPreview = product.image;
    const previewImage = rawPreview && rawPreview.startsWith('data:') ? rawPreview : productImageUrl(rawPreview);
    const sceneImage = sceneImageForIndex(getMergedProducts().findIndex((item) => item.id === product.id));
    productDetail.innerHTML = `
      <div class="page-back-bar">
        <a class="page-back-btn" href="index.html" aria-label="${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}">
          <svg class="page-back-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>${currentLang === "ar" ? "العودة للمتجر" : "Back to store"}</span>
        </a>
      </div>
      <article class="detail product-detail-layout">
      <div class="detail-gallery">
        <div class="detail-main-image frame-${state.detailFrame.toLowerCase()}" style="${sceneImage ? `--scene-image: url('${sceneImage}')` : ""}">\n          <img id="detailMainImage" src="${previewImage}" loading="eager" decoding="async" fetchpriority="high" alt="${name} ${currentLang === "ar" ? "معرض البوستر" : "framed poster gallery image"}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">
        </div>
        ${product.gallery && product.gallery.length > 1 ? `
          <div class="thumb-row">
            ${product.gallery.map((image) => {
              const imgSrc = image && image.startsWith('data:') ? image : productImageUrl(image);
              const isActive = (rawPreview === image) || (rawPreview && rawPreview.startsWith('data:') && image === rawPreview);
              return `
              <button type="button" class="${isActive ? "is-active" : ""}" data-gallery-image="${imgSrc}" aria-label="Show gallery image">
                <img src="${imgSrc}" loading="lazy" decoding="async" alt="${name} thumbnail" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">
              </button>
            `}).join("")}
          </div>
        ` : ""}
        <a class="watch-quality-link detail-work-link" href="our-work.html" data-t="ourWorkButton">${t("ourWorkButton")}</a>
      </div>
      <div class="detail-copy product-order-panel">
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


/* ── Shopping Animations & Micro-Interactions ── */
function spawnConfetti(originX, originY) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = 16;
  const colors = ['#2563eb', '#38bdf8', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.style.cssText = `position:fixed;top:${originY}px;left:${originX}px;width:0;height:0;pointer-events:none;z-index:100000;`;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const color = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 35 + Math.random() * 55;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 20;
    const size = 5 + Math.random() * 5;
    const rotate = Math.random() * 360;

    p.style.cssText = `position:absolute;top:0;left:0;width:${size}px;height:${size * (i % 2 === 0 ? 1 : 1.5)}px;background:${color};border-radius:${i % 3 === 0 ? '50%' : '2px'};transform:translate(0,0) rotate(0deg);opacity:1;transition:transform 600ms cubic-bezier(0.1, 0.9, 0.2, 1), opacity 600ms ease;`;
    container.appendChild(p);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotate + 180}deg)`;
        p.style.opacity = '0';
      });
    });
  }
  setTimeout(() => container.remove(), 700);
}

function animateFlyToCart(originEl, imgUrl) {
  const cartBtn = document.querySelector(".cart-button") || document.querySelector("[data-open-cart]");
  if (!cartBtn) return;
  
  let startRect;
  if (originEl) {
    const card = originEl.closest('.product-card');
    const img = card?.querySelector('.product-media img') || document.querySelector('#detailMainImage') || originEl;
    startRect = img.getBoundingClientRect();
  } else {
    const mainImg = document.querySelector('#detailMainImage');
    startRect = mainImg ? mainImg.getBoundingClientRect() : cartBtn.getBoundingClientRect();
  }
  
  if (!startRect || startRect.width === 0 || startRect.height === 0) {
    cartBtn.classList.add('cart-bounce-pop');
    setTimeout(() => cartBtn.classList.remove('cart-bounce-pop'), 600);
    return;
  }

  const targetRect = cartBtn.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = 'fly-to-cart-clone';
  flyer.style.cssText = `position:fixed;z-index:99999;top:${startRect.top}px;left:${startRect.left}px;width:${startRect.width}px;height:${startRect.height}px;background-image:url('${imgUrl}');background-size:cover;background-position:center;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,0.35);pointer-events:none;transition:transform 600ms cubic-bezier(0.2,0.85,0.2,1), opacity 600ms ease, border-radius 600ms ease;will-change:transform,opacity;`;
  document.body.appendChild(flyer);

  const deltaX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
  const deltaY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.18) rotate(12deg)`;
      flyer.style.opacity = '0.35';
      flyer.style.borderRadius = '50%';
    });
  });

  setTimeout(() => {
    flyer.remove();
    cartBtn.classList.add('cart-bounce-pop');
    setTimeout(() => cartBtn.classList.remove('cart-bounce-pop'), 600);
    spawnConfetti(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2);
  }, 620);
}

function initCardTiltEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) return;
  
  let rafPending = false;
  let lastEvent = null;

  document.addEventListener('pointermove', (e) => {
    lastEvent = e;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!lastEvent) return;
      const card = lastEvent.target.closest('.product-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (lastEvent.clientX - rect.left) / rect.width;
      const y = (lastEvent.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 8;
      const tiltY = (x - 0.5) * 8;
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      card.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-6px) scale3d(1.015, 1.015, 1.015)`;
    });
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    if (!card.contains(e.relatedTarget)) {
      card.style.transform = '';
    }
  }, { passive: true });
}

async function addToCart(productId, size = "30x40", frame = "Black", originEl = null) {
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
  showToast(`${t("addedToCart")} - ${getProductName(product)}`);
}

function cartLineTotal(item) {
  const product = getProduct(item.productId);
  if (!product) return 0;
  return itemUnitPrice(product, item.size, item.frame) * item.quantity;
}

function renderCart() {
  const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalQuantity;
  if (cartTotal) cartTotal.textContent = money(cartGrandTotal());
  const clearBtn = document.querySelector("[data-clear-cart]");
  if (clearBtn) clearBtn.hidden = state.cart.length === 0;
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
        <img src="${displayImageForItem(product, item)}" alt="${name}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">
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
      ${state.appliedCoupon ? `<span style="color:var(--danger)">Discount (${state.appliedCoupon.code})</span><strong style="color:var(--danger)">-${money(cartSubtotal() - getDiscountedTotal())}</strong>` : ""}
      <span>${t("deliveryFeeLabel")}</span><strong>${money(orderDeliveryFee())}</strong>
      <span style="font-weight:950;color:var(--text-strong)">${t("cartTotalLabel")}</span><strong style="font-size:1.2rem">${money(cartGrandTotal())}</strong>
    </div>
  `;
}

function openCart() {
  if (!cartDrawer) return;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  if (state.user) {
    const nameEl = document.getElementById("customerName");
    const phoneEl = document.getElementById("customerPhone");
    const addrEl = document.getElementById("customerAddress");
    if (nameEl) nameEl.value = state.user.name || "";
    if (phoneEl) phoneEl.value = state.user.phone || "";
    if (addrEl) addrEl.value = state.user.deliveryAddress || "";
  }
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
  const orderNoteEl = document.querySelector("[data-order-note]");
  return {
    customerName: fields.customerName.value.trim(),
    customerPhone: fields.customerPhone.value.trim(),
    customerAddress: fields.customerAddress.value.trim(),
    paymentMethod: fields.paymentMethod.value,
    orderNote: orderNoteEl ? orderNoteEl.value.trim() : ""
  };
}

function renderConfirmation(savedOrder) {
  const details = savedOrder || readCheckoutForm();
  state.confirmedForm = details;
  const uploadedItems = state.cart.filter((item) => item.upload);
  const currentLang = state.lang || "en";
  const orderTotalLabel = t("confTotal");
  const orderId = savedOrder ? savedOrder.id : null;
  const subtotal = savedOrder ? savedOrder.subtotal : cartSubtotal();
  const discount = savedOrder ? savedOrder.discount : (state.appliedCoupon ? cartSubtotal() - getDiscountedTotal() : 0);
  const delivery = savedOrder ? savedOrder.deliveryFee : orderDeliveryFee();
  const total = savedOrder ? savedOrder.total : cartGrandTotal();
  const itemsCountText = currentLang === "ar"
    ? `${state.cart.length} ${state.cart.length === 1 ? t("confItemsCount") : t("confItemsCountPlural")}`
    : `${state.cart.length} customized framed poster ${state.cart.length === 1 ? "item" : "items"}`;

  const uploadHintMsg = currentLang === "ar"
    ? "💡 اضغط مطولاً على الصورة لحفظها ومشاركتها في واتساب!"
    : "💡 Long-press the image to save or share it directly to WhatsApp!";

  confirmationSummary.innerHTML = `
    ${orderId ? `<span style="font-weight:950;font-size:1.1rem;color:var(--text-strong)">${currentLang === "ar" ? "رقم الطلب" : "Order #"}: ${orderId}</span>` : ""}
    <strong>${orderTotalLabel} ${money(total)}</strong>
    <span>${t("subtotalLabel")}: ${money(subtotal)}</span>
    ${discount > 0 ? `<span style="color:var(--danger)">${currentLang === "ar" ? "الخصم" : "Discount"}: -${money(discount)}</span>` : ""}
    <span>${t("deliveryFeeLabel")}: ${money(delivery)}</span>
    <span>${details.customerName} / ${details.customerPhone}</span>
    <span>${details.paymentMethod === "VF-Cash" ? "VF-Cash - 01090927525" : details.paymentMethod === "Instapay" ? "Instapay - qnbziad49015@instapay" : details.paymentMethod}</span>
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
    if (details.paymentMethod.includes("VF-Cash")) {
      cashCard.removeAttribute("hidden");
      qrCard.setAttribute("hidden", "true");
    } else if (details.paymentMethod.includes("Instapay")) {
      qrCard.removeAttribute("hidden");
      cashCard.setAttribute("hidden", "true");
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
  state.appliedCoupon = null;
  localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
  saveCart();
  hideConfirmation();
  renderCart();
  closeCart();
  const couponInput = document.querySelector("[data-coupon-input]");
  if (couponInput) couponInput.value = "";
  const couponRemove = document.querySelector("[data-coupon-remove]");
  if (couponRemove) couponRemove.hidden = true;
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

function buildWhatsAppMessage(savedOrder) {
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
    totalPrice: isAr ? "السعر الإجمالي" : "Total Price",
    orderId: isAr ? "رقم الطلب" : "Order ID",
    note: isAr ? "ملاحظات" : "Notes",
    discount: isAr ? "الخصم" : "Discount"
  };

  const orderId = savedOrder ? savedOrder.id : null;
  const subtotal = savedOrder ? savedOrder.subtotal : cartSubtotal();
  const discount = savedOrder ? savedOrder.discount : (state.appliedCoupon ? cartSubtotal() - getDiscountedTotal() : 0);
  const delivery = savedOrder ? savedOrder.deliveryFee : orderDeliveryFee();
  const total = savedOrder ? savedOrder.total : cartGrandTotal();

  const lines = [
    `*${tMsg.title}*`,
    orderId ? `*${tMsg.orderId}:* ${orderId}` : "",
    `----------------------------------`,
    `*${tMsg.customer}:* ${details.customerName}`,
    `*${tMsg.phone}:* ${details.customerPhone}`,
    `*${tMsg.address}:* ${details.customerAddress}`,
    `*${tMsg.payment}:* ${details.paymentMethod === "VF-Cash" ? "VF-Cash - 01090927525" : details.paymentMethod === "Instapay" ? "Instapay - qnbziad49015@instapay" : details.paymentMethod}`,
    details.orderNote ? `*${tMsg.note}:* ${details.orderNote}` : "",
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
    if (item.upload) {
      lines.push(`${isAr ? "الملف المرفوع:" : "Uploaded File:"} ${item.upload.name}`);
    }
  });

  lines.push(
    `----------------------------------`,
    `*${tMsg.subtotal}:* ${money(subtotal)}`,
    discount > 0 ? `*${tMsg.discount}:* -${money(discount)}` : "",
    `*${tMsg.delivery}:* ${money(delivery)}`,
    `*${tMsg.totalPrice}:* ${money(total)}`
  );

  return lines.filter(line => line !== "").join("\n");
}

function handleCheckout(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast(t("confAddFirstAlert"));
    return;
  }
  const couponInput = document.querySelector("[data-coupon-input]");
  if (couponInput && couponInput.value.trim() && !state.appliedCoupon) {
    applyCoupon(couponInput.value.trim());
  }
  const formData = readCheckoutForm();
  if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
    showToast(state.lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all required fields");
    return;
  }
  renderConfirmation();
}

function setSendButtonLoading(loading) {
  document.querySelectorAll("[data-send-whatsapp]").forEach((btn) => {
    btn.disabled = loading;
    btn.textContent = loading
      ? (state.lang === "ar" ? "جاري الإرسال..." : "Sending...")
      : t("confSendBtn");
  });
}

async function sendWhatsAppOrder() {
  if (!state.cart.length) {
    showToast(t("confAddFirstAlert"));
    return;
  }

  const isAr = state.lang === "ar";

  const formData = readCheckoutForm();
  const order = createOrder(formData);
  showToast(`${isAr ? "تم إنشاء الطلب" : "Order created"}: ${order.id}`);

  const orderIdEl = confirmationSummary.querySelector(".order-id-display");
  if (orderIdEl) orderIdEl.textContent = order.id;
  else {
    const header = confirmationSummary.querySelector("strong");
    if (header) {
      header.insertAdjacentHTML("beforebegin",
        `<span class="order-id-display" style="font-weight:950;font-size:1.1rem;color:var(--text-strong)">${isAr ? "رقم الطلب" : "Order #"}: ${order.id}</span>`);
    }
  }

  setSendButtonLoading(true);
  showToast(isAr ? "جاري رفع صور المنتجات إلى الخادم الآمن..." : "Uploading product images to secure server...");
  setUploadProgress(8, true);

  let message = buildWhatsAppMessage(order);
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

  let uploadedImageUrls = [];
  try {
    const results = await Promise.all(uploadPromises);
    let linkSection = isAr ? "\\n\\n*روابط تنزيل صور المنتجات:*" : "\n\n*Product Image Download Links:*";
    results.forEach((res) => {
      linkSection += `\n- *${res.label}:*`;
      res.urls.forEach((url, i) => {
        linkSection += `\n  [${i + 1}] ${url}`;
        uploadedImageUrls.push(url);
      });
    });
    message += linkSection;
    setUploadProgress(100, true);
    showToast(isAr ? "تم الرفع بنجاح!" : "Upload successful!");
  } catch (err) {
    console.error("Failed to upload some product images:", err);
    showToast(isAr ? "حدث خطأ أثناء رفع بعض الصور" : "Error uploading some images");
    setSendButtonLoading(false);
  }

  // Save uploaded image URLs and update user address in Firestore
  if (uploadedImageUrls.length) {
    updateOrderInFirestore(order.id, { imageUrls: uploadedImageUrls, updatedAt: new Date().toISOString() });
  }
  if (state.user && formData.customerAddress) {
    state.user.deliveryAddress = formData.customerAddress;
    saveSession(state.user);
    const users = getUsers();
    const uIdx = users.findIndex(u => u.email === state.user.email);
    if (uIdx >= 0) { users[uIdx].deliveryAddress = formData.customerAddress; saveUsers(users); }
  }

  await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  resetCartAfterOrder();
  updatePendingOrdersBadge();
  setTimeout(() => {
    if (!document.hidden) {
      window.location.href = url;
    }
  }, 500);
}


// Search icon opens the nav drawer (search field lives inside the drawer)
document.addEventListener("click", (event) => {
  const searchIcon = event.target.closest("[data-search-icon]");
  if (searchIcon) {
    openNav();
    setTimeout(() => { const inp = document.querySelector("#navSearchInput"); if (inp) inp.focus(); }, 100);
    return;
  }

  var productLink = event.target.closest("a[href*='product.html']");
  if (productLink || event.target.closest("[data-quick-add]")) {
    var card = (productLink || event.target.closest("[data-quick-add]")).closest(".product-card");
    var top = card ? card.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2 - card.offsetHeight / 2) : window.scrollY;
    sessionStorage.setItem(SESSION_SCROLL_KEY, Math.max(0, Math.round(top)));
  }

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
    event.preventDefault();
    event.stopPropagation();
    const product = getProduct(quickAdd.dataset.quickAdd);
    if (product?.isCustom) {
      window.location.href = `product.html?id=${product.id}`;
    } else {
      addToCart(quickAdd.dataset.quickAdd, undefined, undefined, quickAdd);
    }
  }

  const accountButton = event.target.closest("[data-account-btn]");
  if (accountButton) { event.preventDefault(); showAccountPanel(); return; }

  const openButton = event.target.closest("[data-open-cart]");
  if (openButton) openCart();

  const closeButton = event.target.closest("[data-close-cart]");
  if (closeButton) closeCart();

  const accountLink = event.target.closest("[data-show-account]");
  if (accountLink) { event.preventDefault(); showAccountPanel(); }

  const couponApply = event.target.closest("[data-coupon-apply]");
  if (couponApply) {
    const input = document.querySelector("[data-coupon-input]");
    if (input && input.value.trim()) applyCoupon(input.value.trim());
    else showToast(state.lang === "ar" ? "أدخل كود الخصم" : "Enter coupon code");
  }

  const couponRemove = event.target.closest("[data-coupon-remove]");
  if (couponRemove) {
    document.querySelector("[data-coupon-input]").value = "";
    document.querySelector("[data-coupon-remove]").hidden = true;
    removeCoupon();
  }

  const wishlistToggle = event.target.closest("[data-wishlist-toggle]");
  if (wishlistToggle) {
    event.preventDefault();
    event.stopPropagation();
    wishlistToggle.classList.add("heart-burst-pop");
    setTimeout(() => wishlistToggle.classList.remove("heart-burst-pop"), 500);
    toggleWishlist(wishlistToggle.dataset.wishlistToggle);
    showToast(isInWishlist(wishlistToggle.dataset.wishlistToggle)
      ? (state.lang === "ar" ? "أضيف للمفضلة" : "Added to wishlist")
      : (state.lang === "ar" ? "أزيل من المفضلة" : "Removed from wishlist"));
  }

  const clearCartBtn = event.target.closest("[data-clear-cart]");
  if (clearCartBtn) {
    if (state.cart.length) {
      const isAr = state.lang === "ar";
      if (confirm(isAr ? "هل أنت متأكد من تفريغ السلة؟" : "Are you sure you want to clear the cart?")) {
        resetCartAfterOrder();
        showToast(isAr ? "تم تفريغ السلة" : "Cart cleared");
      }
    }
  }

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
  if (detailAdd) addToCart(state.selectedProduct, state.detailSize, state.detailFrame, detailAdd);

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

  const whatsappChat = event.target.closest("[data-whatsapp-chat]");
  if (whatsappChat) {
    event.preventDefault();
    const url = `https://wa.me/${WHATSAPP_NUMBER}`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      if (!document.hidden) {
        window.location.href = url;
      }
    }, 500);
  }

  const editCheckout = event.target.closest("[data-edit-checkout]");
  if (editCheckout) hideConfirmation();

  const sendWhatsApp = event.target.closest("[data-send-whatsapp]");
  if (sendWhatsApp) sendWhatsAppOrder();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSizeGuide();
    closeCart();
  }
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
  state.customUploadFile = file;
  storeImageInDB("pending-upload", file);
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

document.addEventListener("error", (event) => {
  if (event.target.tagName === "IMG" && !event.target.hasAttribute("data-error-handled")) {
    event.target.setAttribute("data-error-handled", "");
    if (event.target.src !== productImageUrl(POSTER_FALLBACK_IMAGE)) {
      event.target.src = productImageUrl(POSTER_FALLBACK_IMAGE);
    } else {
      event.target.alt = "Image unavailable";
      event.target.style.display = "none";
    }
  }
}, true);

if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckout);

// Brand click: navigate to clean home page or scroll to top & reset filters
document.querySelectorAll(".brand").forEach(el => {
  el.addEventListener("click", (e) => {
    const isHome = window.location.pathname.endsWith("index.html") || 
                   window.location.pathname.endsWith("/") || 
                   window.location.pathname === "";
    if (isHome) {
      if (state.activeCategory || state.search || state.selectedProduct) {
        e.preventDefault();
        state.activeCategory = null;
        state.search = "";
        state.selectedProduct = null;
        try {
          const url = new URL(window.location.href);
          url.search = "";
          url.hash = "";
          window.history.pushState({}, "", url.pathname);
        } catch (_) {}
        if (typeof renderProducts === "function") renderProducts();
        if (typeof renderCatPills === "function") renderCatPills();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

// ── Nav drawer ──
function buildNavMenu() {
  const body = document.querySelector("[data-nav-body]");
  if (!body) return;
  const lang = state.lang || "en";
  const cats = [
    { id: "custom",   label: { en: "Custom upload",    ar: "تصميم خاص" } },
    { id: "football", label: { en: "Football",         ar: "كرة قدم" } },
    { id: "cars",     label: { en: "Cars",             ar: "سيارات" } },
    { id: "clubs",    label: { en: "Clubs",             ar: "أندية" } },
    { id: "anime",    label: { en: "Anime",           ar: "أنمي" } },
    { id: "movie",    label: { en: "Movie & Artist",   ar: "أفلام وفن" } },
    { id: "album",    label: { en: "Album Artist",     ar: "ألبوم فنان" } },
    { id: "quotes",   label: { en: "Quotes",           ar: "اقتباسات" } },
    { id: "islamic",  label: { en: "Islamic",          ar: "إسلامي" } },
    { id: "art",      label: { en: "Art",             ar: "فن" } },
    { id: "gym",      label: { en: "Gym",              ar: "جيم" } },
    { id: "girls",    label: { en: "Girls",            ar: "فتيات" } },
    { id: "games",    label: { en: "Games",            ar: "ألعاب" } },
    { id: "cities",   label: { en: "Cities",           ar: "مدن" } },
    { id: "nba",      label: { en: "NBA",              ar: "NBA" } },
    { id: "meemes",   label: { en: "Memes",            ar: "ميمات" } },
    { id: "pharaonic",label: { en: "Pharaonic",        ar: "فرعوني" } },
    { id: "rap",      label: { en: "Rap Scene",        ar: "مشهد الراب" } },
    { id: "jordan",   label: { en: "Jordan",            ar: "جوردان" } }
  ];

  const placeholder = lang === "ar" ? "ابحث عن لاعبين، سيارات..." : "Search players, cars...";
  const searchVal = (state.search || "").replace(/"/g, "&quot;");

  body.innerHTML = `
    <div class="nav-search">
      <input type="search" id="navSearchInput" class="nav-search-input" placeholder="${placeholder}" value="${searchVal}" autocomplete="off">
    </div>
    <a href="index.html" data-nav-close>${lang === "ar" ? "🏠 الرئيسية" : "🏠 Home"}</a>
    <button class="nav-collection-toggle" data-collection-toggle>
      ${lang === "ar" ? "📂 المجموعة" : "📂 Collection"}
    </button>
    <div class="nav-sub-collection" data-sub-collection hidden>
      ${cats.map(c => `<a class="nav-sub" href="?cat=${c.id}" data-nav-close>${c.label[lang]}</a>`).join("")}
    </div>
    <div class="nav-divider"></div>
    <a href="our-work.html" data-nav-close>${lang === "ar" ? "📸 أعمالنا" : "📸 Our Work"}</a>
    <a href="faq.html" data-nav-close>${lang === "ar" ? "❓ الأسئلة الشائعة" : "❓ FAQ"}</a>
    <a href="https://wa.me/201010414187" target="_blank" rel="noopener" data-nav-close>${lang === "ar" ? "💬 واتساب" : "💬 Contact Us"}</a>
    ${isPosterLabAdmin() ? `
    <div class="nav-divider"></div>
    <a href="admin/panel.html" data-nav-close style="font-size:0.92rem;font-weight:600;display:inline-flex;align-items:center;gap:8px;padding:8px 0;color:var(--text-strong)">
      <span>⚙️</span> <span>${lang === "ar" ? "لوحة التحكم" : "Admin Panel"}</span>
      <span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:var(--accent-soft, rgba(37,99,235,0.15));color:var(--accent);margin-inline-start:auto">${lang === "ar" ? "مفتوح" : "Active"}</span>
    </a>` : ''}
    <a href="index.html" data-nav-close style="font-size:0.85rem;color:var(--muted)">${lang === "ar" ? "© Poster Lab Store" : "© Poster Lab Store"}</a>
  `;

  // Wire nav search input (debounced)
  const navSearch = body.querySelector("#navSearchInput");
  if (navSearch) {
    let searchTimer;
    navSearch.addEventListener("input", (e) => {
      state.search = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (window.renderProducts) renderProducts();
      }, 200);
    });
    navSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        state.search = e.target.value.trim();
        closeNav();
        const isHome = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/") || !window.location.pathname.includes(".html");
        if (isHome) {
          catParam = null;
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("cat");
            if (state.search) {
              url.searchParams.set("search", state.search);
            } else {
              url.searchParams.delete("search");
            }
            window.history.pushState({}, "", url.toString());
          } catch(err) {}
          renderProducts();
          const target = document.querySelector("#categorySections");
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          window.location.href = "index.html?search=" + encodeURIComponent(state.search);
        }
      }
    });
  }

  // Toggle collection sub-menu
  const toggle = body.querySelector("[data-collection-toggle]");
  const sub = body.querySelector("[data-sub-collection]");
  if (toggle && sub) {
    toggle.addEventListener("click", () => {
      sub.hidden = !sub.hidden;
    });
  }
}

// Open / close
const navDrawer = document.querySelector("[data-nav-drawer]");
const openNavBtn = document.querySelector("[data-open-nav]");
const closeNavBtn = document.querySelector("[data-close-nav]");

function openNav() {
  if (!navDrawer) return;
  buildNavMenu();
  navDrawer.setAttribute("aria-hidden", "false");
  navDrawer.classList.add("is-open");
  document.body.style.overflow = "hidden";
  _scrollYLock = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${_scrollYLock}px`;
  document.body.style.width = "100%";
}
function closeNav() {
  if (!navDrawer) return;
  navDrawer.setAttribute("aria-hidden", "true");
  navDrawer.classList.remove("is-open");
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  if (_scrollYLock !== null) window.scrollTo(0, _scrollYLock);
  _scrollYLock = null;
}

if (openNavBtn) openNavBtn.addEventListener("click", openNav);
if (closeNavBtn) closeNavBtn.addEventListener("click", closeNav);
if (navDrawer) {
  navDrawer.addEventListener("click", e => {
    if (e.target === navDrawer) closeNav();
  });
  // Close on any [data-nav-close] click
  navDrawer.addEventListener("click", e => {
    if (e.target.closest("[data-nav-close]")) closeNav();
  });
}

// ── Device detection ──
function detectDevice() {
  const w = window.innerWidth;
  let device;
  if (w < 360)           device = "phone-small";
  else if (w < 600)      device = "phone";
  else if (w < 768)      device = "tablet-small";
  else if (w < 1024)     device = "tablet";
  else if (w < 1440)     device = "desktop";
  else                   device = "wide";
  document.documentElement.dataset.device = device;
}
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(() => detectDevice(), 150);
}, { passive: true });

// Run initial configurations
(async function init() {
  detectDevice();
  initCardTiltEffects();
  state.user = getSession();
  state.wishlist = getWishlistData();
  updateLanguageUI();
  updateThemeUI();
  updateUserUI();
  // Firebase auth state listener
  (function listenFirebaseAuth() {
    try {
      initFirebase();
      const auth = getFirebaseAuth();
      if (auth) {
        auth.onAuthStateChanged(async function(user) {
          if (user) {
            const dbUser = await getUserFromFirestore(user.email);
            state.user = { id: user.uid, name: user.displayName || user.email, email: user.email, phone: user.phoneNumber || '', deliveryAddress: dbUser?.deliveryAddress || '', addresses: [] };
            saveSession(state.user);
            const firestoreCart = await loadCartFromFirestore();
            if (firestoreCart && firestoreCart.length) {
              state.cart = firestoreCart; renderCart();
            } else {
              const userCart = loadCartFromUser();
              if (userCart) { state.cart = userCart; renderCart(); }
            }
          } else if (!getSession()) {
            state.user = null;
          }
          updateUserUI();
        });
      }
    } catch (e) { /* firebase not loaded yet */ }
  })();
  // Sync products and coupons from Firestore (non-blocking)
  syncProductsFromFirestore().then(count => {
    if (count && productGrid) {
      _lastFilterSearch = null;
      _lastFilterResult = null;
      const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
      if (currentCat) {
        renderSingleCategory(currentCat);
      } else {
        renderProducts();
      }
    }
  });
  syncCouponsFromFirestore();
  // FAQ accordion: close others when one opens
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  const searchParam = new URLSearchParams(window.location.search).get("search") || new URLSearchParams(window.location.search).get("q");
  if (searchParam) {
    state.search = searchParam;
  }
  const catParam = new URLSearchParams(window.location.search).get("cat");
  if (catParam) {
    renderSingleCategory(catParam);
  } else {
    preloadProductImages();
    if (productGrid) renderProducts();
    hideLoader();
    if (productGrid) {
      try { var savedScroll = sessionStorage.getItem(SESSION_SCROLL_KEY); } catch {}
      if (savedScroll) {
        try { sessionStorage.removeItem(SESSION_SCROLL_KEY); } catch {}
        var pos = parseInt(savedScroll);
        var doScroll = function() { window.scrollTo(0, pos); };
        setTimeout(doScroll, 200);
        setTimeout(doScroll, 600);
        window.addEventListener("load", doScroll, { once: true });
      }
    }
  }
  if (ourWorkGrid) renderOurWork();
  (async function() {
    if (state.user) {
      const firestoreCart = await loadCartFromFirestore();
      if (firestoreCart && firestoreCart.length) {
        state.cart = firestoreCart;
      } else {
        const userCart = loadCartFromUser();
        if (userCart) state.cart = userCart;
      }
    }
  })();
  renderCart();
  updatePendingOrdersBadge();
  await initializeCartImages();
  // Setup coupon input real-time check
  const couponInput = document.querySelector("[data-coupon-input]");
  const couponRemoveBtn = document.querySelector("[data-coupon-remove]");
  if (couponInput && couponRemoveBtn) {
    couponInput.addEventListener("input", () => {
      if (!couponInput.value.trim()) {
        state.appliedCoupon = null;
        couponRemoveBtn.hidden = true;
        renderCart();
      }
    });
  }
})();



// Register Service Worker (deferred but not blocking)
if ('serviceWorker' in navigator) {
  setTimeout(() => {
    const swPath = window.location.pathname.includes('/admin/') ? '../sw.js' : 'sw.js';
    navigator.serviceWorker.register(swPath)
      .then((reg) => console.log('Service Worker registered:', reg))
      .catch((err) => console.error('Service Worker registration failed:', err));
  }, 0);
}

const pageProductId = getPageProductId();
if (pageProductId) {
  const params = new URLSearchParams(window.location.search);
  if (params.has("size")) state.detailSize = params.get("size");
  if (params.has("frame")) state.detailFrame = params.get("frame");
  renderDetail(pageProductId);
} else if (!productGrid && productDetail) {
  productDetail.hidden = false;
  productDetail.innerHTML = `<div class="empty-state"><strong>${t("noProductsFound")}</strong><p><a href="index.html">${t("heroActionShop")}</a></p></div>`;
}

// Expose functions for admin panel (loaded via script.min.js)
window.products = products;
window.productImageUrl = productImageUrl;
window.saveProductToFirestore = saveProductToFirestore;
window.deleteProductFromFirestore = deleteProductFromFirestore;
window.saveCouponToFirestore = saveCouponToFirestore;
window.deleteCouponFromFirestore = deleteCouponFromFirestore;
window.syncProductsFromFirestore = syncProductsFromFirestore;
window.syncCouponsFromFirestore = syncCouponsFromFirestore;

// Hide loading screen once all initial content is rendered
hideLoader();



window.addEventListener("popstate", () => {
  const cat = new URLSearchParams(window.location.search).get("cat");
  if (cat) {
    renderSingleCategory(cat);
  } else if (productGrid) {
    renderProducts();
  }
});
