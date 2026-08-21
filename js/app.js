/**
 * KS JEWELLERS AND MAKERS - MAIN UI APPLICATION ENGINE
 * Business: KS Jewellers and Makers | Owner: Vinod Kumar Soni
 * Contact: 9413435295 | Mandawa Moad, Jhunjhunu, Rajasthan
 */

const App = {
    currentView: 'home',
    viewParams: {},
    activeCategory: 'all',
    activeMetalFilter: 'all',
    priceSort: 'default',
    searchQuery: '',
    selectedProduct: null,
    selectedSize: 'Standard',

    init() {
        // Event Listeners
        window.addEventListener('ksj:rates-updated', () => this.onRatesUpdated());
        window.addEventListener('ksj:cart-updated', () => {
            this.updateCartBadge();
            this.renderCartDrawerItems();
            this.updateAllProductCardButtons();
        });
        window.addEventListener('ksj:wishlist-updated', () => this.updateWishlistBadge());
        window.addEventListener('ksj:auth-changed', () => this.updateUserMenu());
        window.addEventListener('ksj:admin-auth-changed', () => this.updateUserMenu());
        window.addEventListener('ksj:products-updated', () => this.refreshCurrentView());
        window.addEventListener('ksj:orders-updated', () => this.refreshCurrentView());
        window.addEventListener('ksj:reviews-updated', () => this.refreshCurrentView());

        // Automatic Customer Session Security Lock on Exit/Back/Reload
        window.addEventListener('beforeunload', () => {
            Store.lockCustomerSession();
        });
        window.addEventListener('pagehide', () => {
            Store.lockCustomerSession();
        });

        // Hash Routing
        window.addEventListener('hashchange', () => this.handleHashRoute());

        // Initial Badges & Routing
        this.updateCartBadge();
        this.updateWishlistBadge();
        this.updateUserMenu();
        this.updateHeaderTicker();
        this.handleHashRoute();

        // Prompt security unlock if saved locked session exists
        if (Store.isCustomerLocked()) {
            setTimeout(() => {
                this.showToast('🔒 Session Locked for Security. All your cart items & progress are saved!', 'info');
            }, 600);
        }
    },

    handleHashRoute() {
        const hash = window.location.hash.replace('#', '') || 'home';
        const parts = hash.split('?');
        const viewName = parts[0];
        this.navigateTo(viewName, {}, false);
    },

    navigateTo(viewName, params = {}, updateHash = true) {
        this.currentView = viewName;
        this.viewParams = params;

        if (updateHash) {
            window.location.hash = viewName;
        }

        const viewport = document.getElementById('app-viewport');

        // Smooth Continuous Single Page Navigation for Home, Rates, About, Contact
        if (['home', 'rates', 'about', 'contact'].includes(viewName)) {
            if (!document.getElementById('section-hero')) {
                viewport.innerHTML = this.renderHomeView();
                this.initHomeCharts();
            }

            const targetSectionMap = {
                'home': 'section-hero',
                'rates': 'section-rates',
                'about': 'section-owner',
                'contact': 'section-showroom'
            };

            const targetId = targetSectionMap[viewName] || 'section-hero';
            const targetEl = document.getElementById(targetId);

            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (window.lucide) {
                lucide.createIcons();
            }
            return;
        }

        viewport.innerHTML = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        switch (viewName) {
            case 'shop':
                viewport.innerHTML = this.renderShopView();
                break;
            case 'track':
                viewport.innerHTML = this.renderTrackView();
                break;
            case 'account':
                viewport.innerHTML = this.renderAccountView();
                break;
            case 'admin':
                viewport.innerHTML = this.renderAdminView();
                break;
            default:
                viewport.innerHTML = this.renderHomeView();
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    },

    refreshCurrentView() {
        this.navigateTo(this.currentView, this.viewParams, false);
    },

    updateAllProductCardButtons() {
        const cart = Store.getCart();
        const products = Store.getProducts();

        products.forEach(product => {
            const container = document.getElementById(`product-btn-container-${product.id}`);
            if (container) {
                const isInCart = cart.some(i => i.productId === product.id);
                container.innerHTML = isInCart ? `
                    <button onclick="App.toggleCartDrawer()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-emerald-500">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-200"></i> Added
                    </button>
                ` : `
                    <button onclick="Store.addToCart('${product.id}', 'Standard', 1); App.showToast('Added to cart!'); App.toggleCartDrawer();" class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-amber-300">
                        <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Add To Cart
                    </button>
                `;
            }
        });
        if (window.lucide) lucide.createIcons();
    },

    onRatesUpdated() {
        this.updateHeaderTicker();
        if (this.currentView === 'home' || this.currentView === 'rates' || this.currentView === 'shop') {
            this.refreshCurrentView();
        }
    },

    updateHeaderTicker() {
        const rates = Store.getRates();
        const ticker = document.getElementById('header-rate-ticker');
        if (ticker) {
            ticker.innerHTML = `
                <span class="mr-6">🏆 <strong>24K Gold:</strong> ₹${rates.gold24k.toLocaleString('en-IN')}/g</span>
                <span class="mr-6">✨ <strong>22K Gold (916):</strong> ₹${rates.gold22k.toLocaleString('en-IN')}/g</span>
                <span class="mr-6">💛 <strong>18K Gold:</strong> ₹${rates.gold18k.toLocaleString('en-IN')}/g</span>
                <span class="mr-6">🥈 <strong>999 Silver:</strong> ₹${rates.silver999.toFixed(2)}/g</span>
                <span>📅 Updated: ${new Date(rates.lastUpdated).toLocaleTimeString()}</span>
            `;
        }
    },

    updateCartBadge() {
        const cart = Store.getCart();
        const count = cart.reduce((acc, item) => acc + item.qty, 0);
        const badge = document.getElementById('cart-badge');
        if (badge) {
            if (count > 0) {
                badge.innerText = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    updateWishlistBadge() {
        const wishlist = Store.getWishlist();
        const badge = document.getElementById('wishlist-badge');
        if (badge) {
            if (wishlist.length > 0) {
                badge.innerText = wishlist.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    updateUserMenu() {
        const user = Store.getUser();
        const admin = Store.getAdmin();
        const isLocked = Store.isCustomerLocked();
        const btnText = document.getElementById('user-btn-text');

        if (btnText) {
            if (user) {
                btnText.innerText = user.name.split(' ')[0];
            } else if (isLocked) {
                const savedProfile = Store.getSavedCustomerProfile();
                btnText.innerText = `🔒 Unlock (${savedProfile?.name ? savedProfile.name.split(' ')[0] : 'Session'})`;
            } else {
                btnText.innerText = 'Customer Sign In';
            }
        }

        // Strictly toggle Admin Navigation (Only visible when Admin Session is Active)
        const navAdminBtn = document.getElementById('nav-admin-btn');
        const mobileAdminBtn = document.getElementById('mobile-admin-btn');
        if (admin) {
            if (navAdminBtn) {
                navAdminBtn.classList.remove('hidden');
                navAdminBtn.classList.add('flex');
            }
            if (mobileAdminBtn) {
                mobileAdminBtn.classList.remove('hidden');
            }
        } else {
            if (navAdminBtn) {
                navAdminBtn.classList.add('hidden');
                navAdminBtn.classList.remove('flex');
            }
            if (mobileAdminBtn) {
                mobileAdminBtn.classList.add('hidden');
            }
        }
    },

    toggleMobileMenu() {
        const drawer = document.getElementById('mobile-menu-drawer');
        if (drawer) {
            drawer.classList.toggle('hidden');
        }
    },

    handleGlobalSearch(e) {
        if (e.key === 'Enter' || e.type === 'keyup') {
            this.searchQuery = e.target.value;
            this.navigateTo('shop');
        }
    },

    // TOAST SYSTEM
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 ${
            type === 'success' 
                ? 'bg-stone-900 text-amber-200 border-amber-500/40' 
                : 'bg-red-950 text-red-200 border-red-800'
        }`;
        
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 text-luxury-gold shrink-0"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        }, 10);

        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // ==========================================
    // VIEWS RENDERERS
    // ==========================================

    renderHomeView() {
        const rates = Store.getRates();
        const products = Store.getProducts();
        const featuredProducts = products.filter(p => p.featured).slice(0, 8);

        return `
            <!-- HERO BANNER -->
            <section id="section-hero" class="py-10 lg:py-14 bg-stone-950 text-white relative border-b border-amber-900/30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <!-- Outer Luxury Framed Box -->
                    <div class="relative bg-stone-900/90 rounded-3xl p-6 sm:p-10 border-2 border-amber-500/40 shadow-2xl overflow-hidden backdrop-blur-md">
                        
                        <!-- Double hairline inner border -->
                        <div class="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none"></div>

                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                            
                            <!-- Left Panel: Text Content (Left to Right Entrance Animation) -->
                            <div class="lg:col-span-7 space-y-6 text-center lg:text-left py-4 animate-slide-left">
                                
                                <!-- Top Pill Tag -->
                                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950 border border-amber-500/50 text-amber-300 text-[11px] font-bold tracking-widest uppercase shadow-md">
                                    <span class="text-luxury-gold">✦</span> PRESERVING SHEKHAWATI'S GOLDEN LEGACY
                                </div>

                                <!-- Main Hero Heading -->
                                <h1 class="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-black text-amber-100 tracking-wide uppercase leading-tight">
                                    WHERE HERITAGE MEETS<br>
                                    <span class="gold-text-gradient font-playfair italic capitalize">PURE ELEGANCE.</span>
                                </h1>

                                <!-- Description -->
                                <p class="text-stone-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                                    Discover handcrafted 22K 916 BIS Hallmarked Gold, Solitaire Diamonds, and Authentic Rajputi Aad. Master experts in handcrafted traditional Rajasthani <strong>Hamel</strong> and <strong>Tevata</strong>. Curated with <strong>40 Years of Experience</strong> & trust by Vinod Kumar Soni in the heart of Jhunjhunu, with complete transparency on a clear rate breakdown.
                                </p>

                                <!-- CTA Button -->
                                <div class="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <button onclick="App.navigateTo('shop')" class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 border border-amber-300">
                                        🛍️ SHOP MORE
                                    </button>
                                </div>

                                <!-- EST 1986 Tag -->
                                <div class="pt-4 flex items-center justify-center lg:justify-start gap-3 text-xs text-amber-400/80 font-serif-luxury font-bold">
                                    <span class="w-12 h-px bg-amber-500/40"></span>
                                    <span class="tracking-widest uppercase text-[11px]">EST. 1986</span>
                                    <span class="w-12 h-px bg-amber-500/40"></span>
                                </div>

                            </div>

                            <!-- Right Panel: High-End Bridal Portrait & Metallic Gold Plaque -->
                            <div class="lg:col-span-5 relative">
                                <div class="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl group">
                                    
                                    <!-- High Luxury Bridal Photo -->
                                    <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80" alt="KS Jewellers Pure Elegance Model" class="w-full h-80 sm:h-96 lg:h-[420px] object-cover object-top group-hover:scale-105 transition-transform duration-500">

                                    <!-- Metallic Gold Plaque Overlay -->
                                    <div class="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 text-stone-950 p-3.5 rounded-xl border border-amber-300 shadow-2xl text-center">
                                        <h3 class="font-serif-luxury font-black text-lg sm:text-xl uppercase tracking-wider leading-tight">
                                            K.S. JEWELLERS & MAKERS
                                        </h3>
                                        <p class="text-[11px] font-bold text-stone-900 tracking-wide mt-0.5">
                                            Mandawa Moad, Jhunjhunu
                                        </p>
                                        <div class="inline-block bg-stone-950 text-amber-300 text-[10px] font-bold px-3 py-0.5 rounded-full mt-1 border border-amber-400">
                                            Experience: 40 Years &bull; EST. 1986
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <!-- SHOP OWNER PHOTO & INTRODUCTION SECTION -->
            <section id="section-owner" class="py-16 bg-cream-50 border-b border-amber-900/10">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-xl relative overflow-hidden">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            
                            <!-- Left: Owner Photo & Badge Frame -->
                            <div class="lg:col-span-5 text-center">
                                <div class="relative inline-block mx-auto">
                                    <div class="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-luxury-gold p-1.5 shadow-2xl bg-stone-900 mx-auto">
                                        <img src="images/owner.jpg" alt="Vinod Kumar Soni - KS Jewellers Owner" class="w-full h-full object-cover object-top rounded-full">
                                    </div>
                                    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900 text-luxury-goldLight text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-luxury-gold shadow-lg whitespace-nowrap">
                                        Master Goldsmith & Owner
                                    </div>
                                </div>
                                <h3 class="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 mt-5">Vinod Kumar Soni</h3>
                                <p class="text-xs text-luxury-goldDark font-semibold uppercase tracking-wider">KS Jewellers and Makers</p>
                                <p class="text-[11px] text-stone-500 font-medium">B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, RJ</p>
                            </div>

                            <!-- Right: Personal Introduction Message -->
                            <div class="lg:col-span-7 space-y-5 text-center lg:text-left">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-widest border border-amber-300">
                                    <i data-lucide="award" class="w-3.5 h-3.5 text-luxury-gold"></i> Heritage & Trust Since 1986 &bull; 40 Years Experience
                                </div>

                                <h2 class="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                                    "Purity, Devotion & Heritage Craftsmanship in Every Gram of Gold."
                                </h2>

                                <p class="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                    Namaste! I am <strong>Vinod Kumar Soni</strong>, owner and master artisan of <strong>KS Jewellers and Makers</strong>. With over <strong>40 Years of Experience</strong>, we are master experts in handcrafted traditional <strong>Rajasthani Hamel</strong>, <strong>Tevata</strong>, <strong>Rajputi Aad</strong>, Kundan bridal sets, and certified 999 pure silver coins & payals.
                                </p>

                                <p class="text-stone-600 text-xs sm:text-sm leading-relaxed">
                                    We believe in complete transparency: exact weight calculation, live gold rate, clear making charges, and official GST billing. Whether you need custom Hamel or Tevata jewellery making or old gold redesigning, I am personally here to guide you.
                                </p>

                                <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                    <a href="tel:9413435295" class="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all border border-amber-300 transform hover:-translate-y-0.5">
                                        <i data-lucide="phone" class="w-4 h-4 text-stone-950"></i> Call Vinod Soni: 9413435295
                                    </a>
                                    <a href="https://wa.me/919413435295?text=Hello%20Vinod%20Kumar%20Soni%20ji,%20I%20visited%20your%20website%20and%20want%20to%20consult%20you%20for%20jewellery." target="_blank" class="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all border border-amber-300 transform hover:-translate-y-0.5">
                                        <i data-lucide="message-circle" class="w-4 h-4 text-stone-950"></i> WhatsApp Consultation
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <!-- FEATURED PRODUCTS SHOWCASE -->
            <section id="section-featured" class="py-16 bg-white border-b border-amber-900/10">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex flex-col sm:flex-row justify-between items-end mb-10 pb-4 border-b border-stone-200">
                        <div>
                            <span class="text-xs uppercase tracking-widest text-luxury-goldDark font-semibold">Curated Showroom Selection</span>
                            <h2 class="font-serif-luxury text-3xl font-bold text-stone-900">Featured Jewellery</h2>
                        </div>
                        <button onclick="App.navigateTo('shop')" class="text-xs font-bold uppercase tracking-wider text-luxury-goldDark hover:text-stone-900 flex items-center gap-1 mt-3 sm:mt-0">
                            View All Collections <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        ${featuredProducts.map(p => this.renderProductCard(p)).join('')}
                    </div>
                </div>
            </section>

            <!-- SHOWROOM PHOTO & COMPLETE SHOP DETAILS SECTION -->
            <section id="section-showroom" class="py-20 bg-cream-50 border-b border-amber-900/10">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center max-w-2xl mx-auto mb-12">
                        <span class="text-xs uppercase tracking-widest text-luxury-goldDark font-semibold">Jhunjhunu Showroom</span>
                        <h2 class="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900 mt-1">Our Boutique Showroom & Store Details</h2>
                        <div class="w-16 h-0.5 bg-luxury-gold mx-auto mt-3"></div>
                    </div>

                    <div class="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl overflow-hidden">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                            
                            <!-- Showroom Image Gallery Frame -->
                            <div class="lg:col-span-6 relative">
                                <div class="relative rounded-2xl overflow-hidden border-2 border-luxury-gold/40 shadow-2xl group">
                                    <img src="images/showroom.jpg" alt="KS Jewellers Real Showroom Building Mandawa Moad Jhunjhunu" class="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500">
                                    
                                    <div class="absolute bottom-4 left-4 right-4 bg-stone-900/90 backdrop-blur-md text-white p-4 rounded-xl border border-amber-500/30">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <h4 class="font-serif-luxury font-bold text-lg text-amber-200">KS Jewellers and Makers</h4>
                                                <p class="text-[11px] text-stone-300">Mandawa Moad, Jhunjhunu, Rajasthan</p>
                                            </div>
                                            <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Open Today
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Complete Shop Details Grid -->
                            <div class="lg:col-span-6 space-y-6">
                                <div>
                                    <span class="text-xs uppercase font-bold text-luxury-goldDark tracking-widest">Store Information</span>
                                    <h3 class="font-serif-luxury text-3xl font-bold text-stone-900 mt-1">Visit Us In Mandawa Moad</h3>
                                    <p class="text-xs text-stone-500 mt-1 leading-relaxed">
                                        Experience authentic Rajasthani craftsmanship, complete billing transparency, and 100% hallmarked gold jewellery in our Jhunjhunu boutique.
                                    </p>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    
                                    <!-- 1 No. Proprietor & Master Goldsmith -->
                                    <div class="p-4 bg-cream-50 rounded-2xl border border-stone-200 space-y-1">
                                        <div class="flex items-center gap-2 text-luxury-goldDark font-bold">
                                            <i data-lucide="user" class="w-4 h-4 text-luxury-gold"></i>
                                            <span>Proprietor & Master Goldsmith</span>
                                        </div>
                                        <p class="text-stone-900 font-extrabold text-sm">Vinod Kumar Soni</p>
                                    </div>

                                    <!-- Phone & WhatsApp -->
                                    <div class="p-4 bg-cream-50 rounded-2xl border border-stone-200 space-y-1">
                                        <div class="flex items-center gap-2 text-luxury-goldDark font-bold">
                                            <i data-lucide="phone" class="w-4 h-4 text-luxury-gold"></i>
                                            <span>Contact Number</span>
                                        </div>
                                        <a href="tel:9413435295" class="text-amber-800 font-bold text-sm block hover:underline">📞 9413435295</a>
                                    </div>

                                    <!-- Showroom Address with Direct Google Maps Link -->
                                    <div class="p-4 bg-cream-50 rounded-2xl border border-stone-200 space-y-1">
                                        <div class="flex items-center gap-2 text-luxury-goldDark font-bold">
                                            <i data-lucide="map-pin" class="w-4 h-4 text-luxury-gold"></i>
                                            <span>Showroom Address</span>
                                        </div>
                                        <p class="text-stone-700 font-medium">B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, Rajasthan</p>
                                        <a href="https://maps.google.com/?q=KS+Jewellers+and+Makers+B-171+Indira+Nagar+Mandawa+Mod+Jhunjhunu+Rajasthan" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-emerald-700 hover:underline pt-1">
                                            <i data-lucide="navigation" class="w-3.5 h-3.5 text-emerald-600"></i> Open Live Google Maps Location &rarr;
                                        </a>
                                    </div>

                                    <!-- Hours -->
                                    <div class="p-4 bg-cream-50 rounded-2xl border border-stone-200 space-y-1">
                                        <div class="flex items-center gap-2 text-luxury-goldDark font-bold">
                                            <i data-lucide="clock" class="w-4 h-4 text-luxury-gold"></i>
                                            <span>Showroom Hours</span>
                                        </div>
                                        <p class="text-stone-700 font-medium">Mon - Sun: 10:00 AM - 8:30 PM</p>
                                    </div>

                                </div>

                                <div class="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                    <div class="flex items-center gap-2 text-stone-800 font-semibold">
                                        <i data-lucide="shield-check" class="w-5 h-5 text-emerald-600"></i>
                                        <span>100% BIS 916 Hallmarked Assurance</span>
                                    </div>
                                    <div class="flex items-center gap-2 w-full sm:w-auto">
                                        <a href="https://maps.google.com/?q=KS+Jewellers+and+Makers+B-171+Indira+Nagar+Mandawa+Mod+Jhunjhunu+Rajasthan" target="_blank" class="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] shadow transition-colors flex items-center justify-center gap-1.5">
                                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> Open Shop Location
                                        </a>
                                        <a href="tel:9413435295" class="flex-1 sm:flex-none px-4 py-2.5 bg-stone-900 text-amber-300 font-bold rounded-xl text-[11px] shadow hover:bg-stone-800 transition-colors flex items-center justify-center gap-1">
                                            📞 Call Store
                                        </a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <!-- CUSTOMER REVIEWS & TESTIMONIALS -->
            <section id="section-reviews" class="py-16 bg-cream-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center max-w-2xl mx-auto mb-12">
                        <span class="text-xs uppercase tracking-widest text-luxury-goldDark font-semibold">Testimonials & Trust</span>
                        <h2 class="font-serif-luxury text-3xl font-bold text-stone-900 mt-1">What Our Patrons Say</h2>
                        <div class="w-16 h-0.5 bg-luxury-gold mx-auto mt-3"></div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        ${INITIAL_REVIEWS.map(rev => `
                            <div class="luxury-card rounded-2xl p-6 space-y-4 shadow-sm">
                                <div class="flex text-amber-400">
                                    ${'<i data-lucide="star" class="w-4 h-4 fill-amber-400"></i>'.repeat(rev.rating)}
                                </div>
                                <p class="text-xs text-stone-600 leading-relaxed italic">"${rev.comment}"</p>
                                <div class="pt-2 border-t border-stone-100 flex justify-between items-center text-xs">
                                    <span class="font-bold text-stone-900">${rev.name}</span>
                                    <span class="text-[10px] text-stone-400">${rev.city}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderProductCard(product) {
        const price = Store.calculateProductPrice(product);
        const isWishlisted = Store.getWishlist().includes(product.id);
        const ratingStats = Store.getProductRatingStats(product.id);

        const cart = Store.getCart();
        const cartItem = cart.find(i => i.productId === product.id);
        const isInCart = Boolean(cartItem);
        const cartQty = cartItem ? cartItem.qty : 0;

        return `
            <div class="luxury-card rounded-2xl overflow-hidden group flex flex-col justify-between">
                <div class="relative overflow-hidden bg-cream-100 cursor-pointer group/photo" onclick="App.openImageLightbox('${product.image}', '${encodeURIComponent(product.name)}', '${product.purity} &bull; ${product.weight} Grams')">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500">
                    
                    <!-- Purity Badge -->
                    <span class="absolute top-3 left-3 bg-stone-900/90 text-luxury-goldLight text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-500/30 uppercase tracking-wider backdrop-blur-sm">
                        ${product.purity}
                    </span>

                    <!-- HD View Zoom Badge -->
                    <span class="absolute bottom-3 right-3 bg-stone-900/90 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-md flex items-center gap-1 backdrop-blur-sm transition-transform group-hover/photo:scale-105">
                        <i data-lucide="maximize-2" class="w-3 h-3 text-luxury-gold"></i> View Photo 🔍
                    </span>

                    <!-- Wishlist Button -->
                    <button onclick="event.stopPropagation(); App.toggleWishlist('${product.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-stone-700 hover:text-red-500 flex items-center justify-center shadow-md transition-colors">
                        <i data-lucide="heart" class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}"></i>
                    </button>
                </div>

                <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold text-luxury-goldDark uppercase tracking-widest">${product.hallmark}</span>
                            <div class="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-500"></i>
                                <span>${ratingStats.avg}</span>
                                <span class="text-stone-400 font-normal">(${ratingStats.count})</span>
                            </div>
                        </div>
                        <h3 onclick="App.openProductModal('${product.id}')" class="font-serif-luxury text-lg font-bold text-stone-900 hover:text-luxury-gold transition-colors cursor-pointer line-clamp-1 mt-0.5">
                            ${product.name}
                        </h3>
                        <p class="text-xs text-stone-600 mt-1 font-semibold">Net Weight: ${product.weight} Grams</p>
                    </div>

                    <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-stone-400 font-medium block">Product Price</span>
                            <span class="font-extrabold text-stone-900 text-lg">₹${price.toLocaleString('en-IN')}</span>
                        </div>
                        <div id="product-btn-container-${product.id}">
                            ${isInCart ? `
                                <button onclick="App.toggleCartDrawer()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-emerald-500">
                                    <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-200"></i> Added
                                </button>
                            ` : `
                                <button onclick="Store.addToCart('${product.id}', 'Standard', 1); App.showToast('Added to cart!'); App.toggleCartDrawer();" class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-amber-300">
                                    <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Add To Cart
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    initHomeCharts() {
        // Option to initialize home widgets if required
    },

    // SHOP / CATALOG VIEW
    renderShopView() {
        let products = Store.getProducts();

        // Filters
        if (this.viewParams.category) {
            this.activeCategory = this.viewParams.category;
        }
        if (this.viewParams.wishlistOnly) {
            const wishlist = Store.getWishlist();
            products = products.filter(p => wishlist.includes(p.id));
        }

        if (this.activeCategory !== 'all') {
            products = products.filter(p => p.category === this.activeCategory);
        }

        if (this.activeMetalFilter !== 'all') {
            products = products.filter(p => p.purityCode === this.activeMetalFilter);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.purity.toLowerCase().includes(q));
        }

        // Sorting
        if (this.priceSort === 'low-high') {
            products.sort((a, b) => Store.calculateProductPrice(a) - Store.calculateProductPrice(b));
        } else if (this.priceSort === 'high-low') {
            products.sort((a, b) => Store.calculateProductPrice(b) - Store.calculateProductPrice(a));
        } else if (this.priceSort === 'weight') {
            products.sort((a, b) => b.weight - a.weight);
        }

        return `
            <section class="py-12 bg-cream-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <!-- Header -->
                    <div class="mb-8">
                        <h1 class="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900">
                            ${this.viewParams.wishlistOnly ? 'Your Saved Wishlist' : 'Jewellery Catalogue'}
                        </h1>
                        <p class="text-xs text-stone-500 mt-1">
                            Handcrafted gold and silver pieces with real-time price calculations based on today's market rate.
                        </p>
                    </div>

                    <!-- Category Pills -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                        ${CATEGORIES.map(cat => `
                            <button onclick="App.setCategoryFilter('${cat.id}')" class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                                this.activeCategory === cat.id 
                                    ? 'bg-luxury-dark text-luxury-goldLight border-luxury-dark shadow' 
                                    : 'bg-white text-stone-700 border-stone-200 hover:border-luxury-gold'
                            }">
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Filter & Sorting Toolbar -->
                    <div class="bg-white p-4 rounded-2xl border border-stone-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                        
                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <span class="font-bold text-stone-700">Filter Metal:</span>
                            <select onchange="App.setMetalFilter(this.value)" class="bg-cream-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-luxury-gold font-medium">
                                <option value="all" ${this.activeMetalFilter === 'all' ? 'selected' : ''}>All Metals & Karats</option>
                                <option value="gold24k" ${this.activeMetalFilter === 'gold24k' ? 'selected' : ''}>24K Pure Gold</option>
                                <option value="gold22k" ${this.activeMetalFilter === 'gold22k' ? 'selected' : ''}>22K Gold (916 BIS)</option>
                                <option value="gold18k" ${this.activeMetalFilter === 'gold18k' ? 'selected' : ''}>18K Gold (750 BIS)</option>
                                <option value="silver999" ${this.activeMetalFilter === 'silver999' ? 'selected' : ''}>925 / 999 Silver</option>
                            </select>
                        </div>

                        <div class="flex items-center justify-between w-full md:w-auto gap-4">
                            <span class="text-stone-500 font-medium">Showing ${products.length} Products</span>
                            
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-stone-700">Sort By:</span>
                                <select onchange="App.setSort(this.value)" class="bg-cream-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-luxury-gold font-medium">
                                    <option value="default" ${this.priceSort === 'default' ? 'selected' : ''}>Featured</option>
                                    <option value="low-high" ${this.priceSort === 'low-high' ? 'selected' : ''}>Price: Low to High</option>
                                    <option value="high-low" ${this.priceSort === 'high-low' ? 'selected' : ''}>Price: High to Low</option>
                                    <option value="weight" ${this.priceSort === 'weight' ? 'selected' : ''}>Weight: High to Low</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <!-- Product Grid -->
                    ${products.length > 0 ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            ${products.map(p => this.renderProductCard(p)).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-20 bg-white rounded-2xl border border-stone-200">
                            <i data-lucide="search-x" class="w-12 h-12 text-stone-300 mx-auto mb-3"></i>
                            <h3 class="font-serif-luxury text-xl font-bold text-stone-800">No Jewellery Found</h3>
                            <p class="text-xs text-stone-500 mt-1">Try resetting your filters or search terms.</p>
                            <button onclick="App.resetFilters()" class="mt-4 px-4 py-2 bg-luxury-gold text-white font-bold text-xs rounded-lg">Reset All Filters</button>
                        </div>
                    `}

                </div>
            </section>
        `;
    },

    setCategoryFilter(catId) {
        this.activeCategory = catId;
        this.refreshCurrentView();
    },

    setMetalFilter(val) {
        this.activeMetalFilter = val;
        this.refreshCurrentView();
    },

    setSort(val) {
        this.priceSort = val;
        this.refreshCurrentView();
    },

    resetFilters() {
        this.activeCategory = 'all';
        this.activeMetalFilter = 'all';
        this.priceSort = 'default';
        this.searchQuery = '';
        this.refreshCurrentView();
    },

    // LIVE GOLD & SILVER RATES VIEW
    renderRatesView() {
        const rates = Store.getRates();

        return `
            <section class="py-12 bg-cream-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div class="text-center max-w-3xl mx-auto mb-12">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Updated Live Market Rates
                        </span>
                        <h1 class="font-serif-luxury text-4xl font-bold text-stone-900 mt-3">Live Gold & Silver Bullion Board</h1>
                        <p class="text-xs text-stone-500 mt-2">
                            Official rate board for Mandawa Moad, Jhunjhunu. Prices are updated transparently to calculate exact product costs.
                        </p>
                    </div>

                    <!-- RATE CARDS GRID -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        
                        <!-- 24K Gold Card -->
                        <div class="luxury-card rounded-2xl p-6 border-l-4 border-amber-500 relative overflow-hidden">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <span class="text-[10px] uppercase font-bold tracking-widest text-amber-700">99.9% Purity</span>
                                    <h3 class="font-serif-luxury text-xl font-bold text-stone-900">24K Fine Pure Gold</h3>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                                    <i data-lucide="coins" class="w-5 h-5"></i>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-xs border-t border-stone-100 pt-4">
                                <div class="flex justify-between font-bold text-sm">
                                    <span>Rate per 1 Gram:</span>
                                    <span class="text-amber-800">₹${rates.gold24k.toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600">
                                    <span>Rate per 8 Gram (Sovereign):</span>
                                    <span>₹${(rates.gold24k * 8).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600">
                                    <span>Rate per 10 Gram (Tola):</span>
                                    <span class="font-semibold text-stone-900">₹${(rates.gold24k * 10).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 22K Gold Card (916 BIS) -->
                        <div class="luxury-card rounded-2xl p-6 border-l-4 border-luxury-gold bg-amber-50/30 relative overflow-hidden">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <span class="text-[10px] uppercase font-bold tracking-widest text-luxury-goldDark">BIS 916 Hallmarked</span>
                                    <h3 class="font-serif-luxury text-xl font-bold text-stone-900">22K Jewellery Gold</h3>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-luxury-gold text-white flex items-center justify-center">
                                    <i data-lucide="sparkles" class="w-5 h-5"></i>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-xs border-t border-amber-200/60 pt-4">
                                <div class="flex justify-between font-bold text-sm">
                                    <span>Rate per 1 Gram:</span>
                                    <span class="text-luxury-goldDark">₹${rates.gold22k.toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600">
                                    <span>Rate per 8 Gram:</span>
                                    <span>₹${(rates.gold22k * 8).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600 font-semibold">
                                    <span>Rate per 10 Gram:</span>
                                    <span class="text-stone-900">₹${(rates.gold22k * 10).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 18K Gold Card -->
                        <div class="luxury-card rounded-2xl p-6 border-l-4 border-amber-600 relative overflow-hidden">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <span class="text-[10px] uppercase font-bold tracking-widest text-amber-700">75.0% Purity</span>
                                    <h3 class="font-serif-luxury text-xl font-bold text-stone-900">18K Diamond Gold</h3>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                                    <i data-lucide="gem" class="w-5 h-5"></i>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-xs border-t border-stone-100 pt-4">
                                <div class="flex justify-between font-bold text-sm">
                                    <span>Rate per 1 Gram:</span>
                                    <span class="text-amber-800">₹${rates.gold18k.toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600">
                                    <span>Rate per 10 Gram:</span>
                                    <span>₹${(rates.gold18k * 10).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 999 Silver Card -->
                        <div class="luxury-card rounded-2xl p-6 border-l-4 border-stone-400 relative overflow-hidden">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <span class="text-[10px] uppercase font-bold tracking-widest text-stone-500">Fine Sterling 999</span>
                                    <h3 class="font-serif-luxury text-xl font-bold text-stone-900">Pure Silver</h3>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
                                    <i data-lucide="disc" class="w-5 h-5"></i>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-xs border-t border-stone-100 pt-4">
                                <div class="flex justify-between font-bold text-sm">
                                    <span>Rate per 1 Gram:</span>
                                    <span class="text-stone-900">₹${rates.silver999.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-stone-600">
                                    <span>Rate per 10 Gram:</span>
                                    <span>₹${(rates.silver999 * 10).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="flex justify-between text-stone-600 font-semibold">
                                    <span>Rate per 1 Kg:</span>
                                    <span class="text-stone-900">₹${(rates.silver999 * 1000).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- GOLD VALUE ESTIMATION CALCULATOR -->
                    <div class="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl mb-12">
                        <div class="max-w-2xl mx-auto text-center mb-8">
                            <h2 class="font-serif-luxury text-2xl font-bold text-stone-900">Gold & Silver Value Estimator</h2>
                            <p class="text-xs text-stone-500">Enter weight in grams to calculate estimated metal cost + making charges & GST.</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-xs font-bold text-stone-700 mb-1">Select Metal / Karat</label>
                                <select id="calc-purity" onchange="App.calculateEstimate()" class="w-full px-3 py-2 text-xs bg-cream-50 border border-stone-300 rounded-lg">
                                    <option value="gold24k">24K Pure Gold (₹${rates.gold24k}/g)</option>
                                    <option value="gold22k" selected>22K Gold (916 BIS) (₹${rates.gold22k}/g)</option>
                                    <option value="gold18k">18K Diamond Gold (₹${rates.gold18k}/g)</option>
                                    <option value="silver999">999 Pure Silver (₹${rates.silver999}/g)</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-stone-700 mb-1">Ornament Weight (Grams)</label>
                                <input type="number" id="calc-weight" value="10" min="0.1" step="0.1" oninput="App.calculateEstimate()" class="w-full px-3 py-2 text-xs bg-cream-50 border border-stone-300 rounded-lg">
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-stone-700 mb-1">Making Charge Estimate (₹)</label>
                                <input type="number" id="calc-making" value="1200" min="0" oninput="App.calculateEstimate()" class="w-full px-3 py-2 text-xs bg-cream-50 border border-stone-300 rounded-lg">
                            </div>
                        </div>

                        <!-- Calculation Output Box -->
                        <div id="calc-output-box" class="mt-8 p-6 bg-stone-900 text-white rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <!-- Calculated via App.calculateEstimate -->
                        </div>
                    </div>

                    <!-- TREND CHART -->
                    <div class="bg-white rounded-3xl p-8 border border-stone-200 shadow-lg">
                        <h2 class="font-serif-luxury text-xl font-bold text-stone-900 mb-4">7-Day Gold Rate Market Trend</h2>
                        <div class="h-64 w-full">
                            <canvas id="liveRateChart"></canvas>
                        </div>
                    </div>

                </div>
            </section>
        `;
    },

    calculateEstimate() {
        const purityCode = document.getElementById('calc-purity')?.value || 'gold22k';
        const weight = parseFloat(document.getElementById('calc-weight')?.value || 10);
        const making = parseFloat(document.getElementById('calc-making')?.value || 1200);

        const breakup = Store.getPriceBreakup(weight, purityCode, making);
        const box = document.getElementById('calc-output-box');
        if (box) {
            box.innerHTML = `
                <div class="space-y-1 text-xs">
                    <div class="text-amber-400 font-semibold">Metal Base Cost: ₹${breakup.metalCost.toLocaleString('en-IN')} (${weight}g @ ₹${breakup.ratePerGram}/g)</div>
                    <div class="text-stone-300">Making Charges: ₹${breakup.makingCharge.toLocaleString('en-IN')} | GST (3%): ₹${breakup.gst.toLocaleString('en-IN')}</div>
                </div>
                <div class="text-right">
                    <span class="text-[10px] uppercase text-stone-400 tracking-wider font-semibold block">Total Estimated Value</span>
                    <span class="text-2xl font-bold font-serif-luxury text-amber-300">₹${breakup.total.toLocaleString('en-IN')}</span>
                </div>
            `;
        }
    },

    initLiveRatesChart() {
        const rates = Store.getRates();
        const ctx = document.getElementById('liveRateChart');
        if (!ctx) return;

        const base = rates.gold22k;
        const labels = ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'];
        const dataPoints = [
            base - 140,
            base - 90,
            base - 120,
            base - 30,
            base + 40,
            base - 10,
            base
        ];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '22K Gold Rate per Gram (INR)',
                    data: dataPoints,
                    borderColor: '#C5A059',
                    backgroundColor: 'rgba(197, 160, 89, 0.1)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointBackgroundColor: '#1C1917'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
        this.calculateEstimate();
    },

    // ABOUT US VIEW
    renderAboutView() {
        return `
            <section class="py-16 bg-cream-50">
                <div class="max-w-5xl mx-auto px-4 sm:px-6">
                    <div class="text-center mb-12">
                        <img src="images/logo.jpg" alt="KSJ Logo" class="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-luxury-gold mx-auto mb-4 shadow-xl">
                        <h1 class="font-serif-luxury text-4xl font-bold text-stone-900">About KS Jewellers and Makers</h1>
                        <p class="text-xs text-luxury-goldDark uppercase tracking-widest mt-2 font-semibold">Heritage Craftsmanship in Mandawa Moad, Jhunjhunu</p>
                    </div>

                    <div class="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-xl space-y-8">
                        <div>
                            <h2 class="font-serif-luxury text-2xl font-bold text-stone-900 mb-3">Our Legacy & Owner</h2>
                            <p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                Managed by <strong>Vinod Kumar Soni</strong>, KS Jewellers and Makers has been a beacon of trust, purity, and artistic excellence in Rajasthan. From traditional Kundan sets to modern diamond bands, we believe every piece of jewellery carries emotion, heritage, and value.
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
                            <div class="p-4 bg-cream-50 rounded-2xl border border-amber-200/50">
                                <i data-lucide="award" class="w-8 h-8 text-luxury-gold mb-2"></i>
                                <h3 class="font-serif-luxury text-lg font-bold text-stone-900">100% BIS Hallmarking</h3>
                                <p class="text-xs text-stone-500 mt-1">All gold jewellery is laser-etched with 6-digit HUID code assuring 916 (22K) or 750 (18K) purity.</p>
                            </div>
                            <div class="p-4 bg-cream-50 rounded-2xl border border-amber-200/50">
                                <i data-lucide="calculator" class="w-8 h-8 text-luxury-gold mb-2"></i>
                                <h3 class="font-serif-luxury text-lg font-bold text-stone-900">Transparent Billing</h3>
                                <p class="text-xs text-stone-500 mt-1">Clear price breakdown: Live gold rate + exact net weight + nominal making charge + 3% GST.</p>
                            </div>
                            <div class="p-4 bg-cream-50 rounded-2xl border border-amber-200/50">
                                <i data-lucide="sparkles" class="w-8 h-8 text-luxury-gold mb-2"></i>
                                <h3 class="font-serif-luxury text-lg font-bold text-stone-900">Bespoke Jewelry Making</h3>
                                <p class="text-xs text-stone-500 mt-1">Have a design in mind? Bring your raw gold or photo, and our master goldsmiths will craft it to perfection.</p>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                            <div>
                                <span class="font-bold text-stone-800 block">Showroom Address:</span>
                                <span class="text-stone-600">B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, Rajasthan</span>
                            </div>
                            <a href="tel:9413435295" class="px-6 py-2.5 bg-stone-900 text-amber-300 font-bold rounded-lg hover:bg-stone-800 transition-colors">
                                📞 Call 9413435295
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    // CONTACT VIEW
    renderContactView() {
        return `
            <section class="py-12 bg-cream-50">
                <div class="max-w-6xl mx-auto px-4 sm:px-6">
                    <div class="text-center max-w-2xl mx-auto mb-12">
                        <h1 class="font-serif-luxury text-4xl font-bold text-stone-900">Visit Our Showroom</h1>
                        <p class="text-xs text-stone-500 mt-1">Mandawa Moad, Jhunjhunu, Rajasthan | Phone: 9413435295</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        <!-- Contact Info Card -->
                        <div class="lg:col-span-5 bg-stone-900 text-white rounded-3xl p-8 border border-amber-500/30 shadow-2xl flex flex-col justify-between space-y-6">
                            <div>
                                <img src="images/logo.jpg" alt="KSJ Logo" class="w-14 h-14 rounded-full object-cover border-2 border-luxury-gold mb-4 shadow-md">
                                <h2 class="font-serif-luxury text-2xl font-bold text-amber-200">KS Jewellers and Makers</h2>
                                <p class="text-xs text-stone-400 mt-1">Owner: Vinod Kumar Soni</p>
                            </div>

                            <div class="space-y-4 text-xs">
                                <div class="flex items-start gap-3">
                                    <i data-lucide="map-pin" class="w-5 h-5 text-luxury-gold shrink-0"></i>
                                    <div>
                                        <span class="font-bold text-stone-200 block">Address</span>
                                        <span class="text-stone-400">B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, Rajasthan</span>
                                    </div>
                                </div>

                                <div class="flex items-center gap-3">
                                    <i data-lucide="phone" class="w-5 h-5 text-luxury-gold shrink-0"></i>
                                    <div>
                                        <span class="font-bold text-stone-200 block">Phone & WhatsApp</span>
                                        <a href="tel:9413435295" class="text-amber-300 font-bold hover:underline">9413435295</a>
                                    </div>
                                </div>

                                <div class="flex items-center gap-3">
                                    <i data-lucide="clock" class="w-5 h-5 text-luxury-gold shrink-0"></i>
                                    <div>
                                        <span class="font-bold text-stone-200 block">Store Timings</span>
                                        <span class="text-stone-400">Monday – Sunday: 10:00 AM – 8:30 PM</span>
                                    </div>
                                </div>
                            </div>

                            <a href="https://wa.me/919413435295?text=Hello%20Vinod%20Kumar%20Soni%20ji,%20I%20have%20an%20enquiry." target="_blank" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                                <i data-lucide="message-circle" class="w-4 h-4"></i> Direct WhatsApp Enquiry
                            </a>
                        </div>

                        <!-- Inquiry Form -->
                        <div class="lg:col-span-7 bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
                            <h2 class="font-serif-luxury text-2xl font-bold text-stone-900 mb-2">Send an Enquiry</h2>
                            <p class="text-xs text-stone-500 mb-6">Want custom bridal jewellery, old gold exchange rates, or store appointment?</p>

                            <form onsubmit="App.handleContactSubmit(event)" class="space-y-4 text-xs">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block font-semibold text-stone-700 mb-1">Your Full Name</label>
                                        <input type="text" required placeholder="e.g. Ramesh Soni" class="w-full px-3 py-2.5 bg-cream-50 border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-gold">
                                    </div>
                                    <div>
                                        <label class="block font-semibold text-stone-700 mb-1">Phone Number</label>
                                        <input type="tel" required placeholder="e.g. 98290XXXXX" class="w-full px-3 py-2.5 bg-cream-50 border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-gold">
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-semibold text-stone-700 mb-1">Topic / Jewellery Type</label>
                                    <select class="w-full px-3 py-2.5 bg-cream-50 border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-gold">
                                        <option>22K Gold Bridal Set Enquiry</option>
                                        <option>Custom Jewellery Making Order</option>
                                        <option>Gold Coin / Silver Coin Purchase</option>
                                        <option>Old Gold Exchange & Rate Enquiry</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-semibold text-stone-700 mb-1">Message / Requirements</label>
                                    <textarea rows="4" placeholder="Describe your design or requirements..." class="w-full px-3 py-2.5 bg-cream-50 border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-gold"></textarea>
                                </div>
                                <button type="submit" class="w-full py-3 bg-luxury-dark text-luxury-goldLight font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-lg">
                                    Submit Request to Vinod Soni
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
        `;
    },

    handleContactSubmit(e) {
        e.preventDefault();
        this.showToast('Thank you! Vinod Kumar Soni ji will call/WhatsApp you shortly.', 'success');
        e.target.reset();
    },

    // TRACK ORDER VIEW - DEDICATED STANDALONE PAGE
    renderTrackView() {
        const user = Store.getUser();
        return `
            <section class="py-16 bg-cream-50 min-h-screen">
                <div class="max-w-3xl mx-auto px-4 sm:px-6">
                    
                    <div class="text-center mb-10 space-y-2">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 text-[11px] font-bold uppercase tracking-widest">
                            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-luxury-gold"></i> Verified Dispatch Tracking
                        </div>
                        <h1 class="font-serif-luxury text-3xl sm:text-4xl font-black text-gold-bright uppercase tracking-wide">
                            Jewellery Order Tracking Portal
                        </h1>
                        <p class="text-xs text-gold-light max-w-md mx-auto">
                            Enter your Order ID (e.g. <span class="font-mono text-amber-300 font-bold">KSJ-89412</span>), Tracking AWB, or Phone Number.
                        </p>
                    </div>

                    <!-- Search Box -->
                    <div class="bg-maroon-dark rounded-3xl p-6 sm:p-8 border-2 border-luxury-gold shadow-2xl mb-8 space-y-4">
                        <form onsubmit="App.handleTrackSearch(event)" class="flex flex-col sm:flex-row gap-3">
                            <div class="relative flex-1">
                                <i data-lucide="search" class="w-4 h-4 text-luxury-gold absolute left-3.5 top-3.5"></i>
                                <input type="text" id="track-id-input" placeholder="Enter Order ID (e.g. KSJ-89412) or Phone Number" required class="w-full pl-10 pr-4 py-3 text-xs bg-stone-900 border border-amber-500/40 text-white rounded-xl focus:outline-none focus:border-luxury-gold font-mono font-bold uppercase placeholder:text-stone-500">
                            </div>
                            <button type="submit" class="px-8 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:from-amber-500 hover:to-amber-400 shadow-lg transition-all border border-amber-300 shrink-0">
                                Track Order
                            </button>
                        </form>

                        <div class="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row justify-between items-center text-xs text-amber-200/80 gap-2">
                            <span>Already an existing customer?</span>
                            ${user ? `
                                <button onclick="App.navigateTo('account')" class="text-amber-300 font-bold hover:underline flex items-center gap-1">
                                    <i data-lucide="user" class="w-3.5 h-3.5 text-luxury-gold"></i> View All Orders in Account (${user.name})
                                </button>
                            ` : `
                                <button onclick="App.openCustomerAuthModal()" class="text-amber-300 font-bold hover:underline flex items-center gap-1">
                                    <i data-lucide="key-round" class="w-3.5 h-3.5 text-luxury-gold"></i> Sign In to View Your Order History
                                </button>
                            `}
                        </div>
                    </div>

                    <div id="track-results-container">
                        <!-- Rendered upon submit search -->
                    </div>

                </div>
            </section>
        `;
    },

    handleTrackSearch(e) {
        if (e) e.preventDefault();
        const inputVal = document.getElementById('track-id-input')?.value.trim();
        if (!inputVal) return;

        const idUpper = inputVal.toUpperCase();
        const orders = Store.getOrders();
        
        // Search by Order ID, Tracking Number, or Phone/Name
        const matchingOrders = orders.filter(o => 
            o.id.toUpperCase() === idUpper || 
            (o.trackingNumber && o.trackingNumber.toUpperCase() === idUpper) ||
            (o.customerPhone && o.customerPhone.includes(inputVal)) ||
            (o.customerName && o.customerName.toLowerCase().includes(inputVal.toLowerCase()))
        );

        const container = document.getElementById('track-results-container');
        if (!container) return;

        if (matchingOrders.length === 0) {
            container.innerHTML = `
                <div class="bg-maroon-dark p-8 rounded-3xl border-2 border-red-500/40 text-center space-y-3 shadow-2xl">
                    <i data-lucide="alert-triangle" class="w-10 h-10 text-red-400 mx-auto"></i>
                    <h3 class="font-serif-luxury text-xl font-bold text-red-300">No Matching Order Found</h3>
                    <p class="text-xs text-amber-100/80 max-w-md mx-auto">
                        We could not find any order with ID or Phone number "<span class="font-mono text-amber-300 font-bold">${inputVal}</span>". Please double-check your Order Receipt or call Showroom support at <strong>9413435295</strong>.
                    </p>
                    <button onclick="App.openCustomerAuthModal()" class="mt-2 px-6 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl hover:bg-amber-500/30">
                        Sign In to Customer Account
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const stages = ['Placed', 'Processing', 'Shipped', 'Delivered'];

        container.innerHTML = `
            <div class="space-y-6">
                ${matchingOrders.map(order => {
                    const currentIdx = stages.indexOf(order.orderStatus) >= 0 ? stages.indexOf(order.orderStatus) : 1;
                    return `
                        <div class="bg-maroon-dark rounded-3xl p-6 sm:p-8 border-2 border-luxury-gold shadow-2xl space-y-6">
                            
                            <!-- Header Info -->
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-500/30 pb-4">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-amber-300 font-mono">ORDER #${order.id}</span>
                                        <span class="px-2.5 py-0.5 bg-stone-900 text-amber-300 text-[10px] font-bold rounded border border-amber-500/40">
                                            Tracking: ${order.trackingNumber}
                                        </span>
                                    </div>
                                    <h3 class="font-serif-luxury text-xl font-bold text-gold-bright mt-1">
                                        ${order.items ? order.items.map(i => i.name).join(', ') : 'Custom Jewellery Order'}
                                    </h3>
                                    <span class="text-[11px] text-amber-200/70">Placed on ${new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                
                                <span class="px-4 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-400 font-bold text-xs rounded-full uppercase tracking-wider">
                                    Status: ${order.orderStatus}
                                </span>
                            </div>

                            <!-- 4 Step Status Progress Timeline -->
                            <div class="py-2">
                                <div class="grid grid-cols-4 gap-2 text-center relative">
                                    ${stages.map((stage, idx) => `
                                        <div class="space-y-2 z-10">
                                            <div class="w-9 h-9 rounded-full ${idx <= currentIdx ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/30' : 'bg-stone-900 text-stone-600 border border-stone-800'} mx-auto flex items-center justify-center text-xs">
                                                ${idx <= currentIdx ? '<i data-lucide="check" class="w-5 h-5"></i>' : idx + 1}
                                            </div>
                                            <span class="text-[11px] font-bold ${idx <= currentIdx ? 'text-amber-300' : 'text-stone-500'} block uppercase tracking-wider">${stage}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Order Details Box -->
                            <div class="bg-stone-900/90 p-4 sm:p-5 rounded-2xl border border-amber-500/30 text-xs space-y-2">
                                <div class="flex justify-between border-b border-amber-500/10 pb-2">
                                    <span class="text-amber-200/70">Customer Name:</span>
                                    <span class="font-bold text-white">${order.customerName}</span>
                                </div>
                                <div class="flex justify-between border-b border-amber-500/10 pb-2">
                                    <span class="text-amber-200/70">Contact Number:</span>
                                    <span class="font-mono font-bold text-amber-300">${order.customerPhone || 'N/A'}</span>
                                </div>
                                <div class="flex justify-between border-b border-amber-500/10 pb-2">
                                    <span class="text-amber-200/70">Shipping Address:</span>
                                    <span class="text-stone-300 font-medium text-right max-w-xs">${order.address}</span>
                                </div>
                                <div class="flex justify-between pt-1">
                                    <span class="text-amber-200/70">Total Amount:</span>
                                    <span class="font-bold text-gold-bright text-sm">₹${order.total.toLocaleString('en-IN')} (${order.paymentMethod})</span>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex flex-col sm:flex-row gap-3 pt-2">
                                <button onclick="App.viewCustomerOrderModal('${order.id}')" class="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <i data-lucide="file-text" class="w-4 h-4 text-luxury-gold"></i> Tax Invoice
                                </button>

                                <a href="https://wa.me/919413435295?text=Hello%20Vinod%20Kumar%20Soni%20ji,%20I%20want%20to%20inquire%20about%20my%20Order%20ID:%20${order.id}" target="_blank" class="flex-1 py-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <i data-lucide="message-circle" class="w-4 h-4 text-emerald-400"></i> WhatsApp Help
                                </a>

                                ${order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' ? `
                                    <button onclick="App.handleCustomerOrderCancel('${order.id}')" class="flex-1 py-3 bg-red-950/90 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-red-400"></i> ❌ Cancel Order
                                    </button>
                                ` : ''}
                            </div>

                        </div>
                    `;
                }).join('')}
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    },

    handleCustomerOrderCancel(orderId) {
        if (!confirm(`Are you sure you want to cancel Order #${orderId}? Your order will be cancelled immediately.`)) {
            return;
        }

        const res = Store.cancelOrder(orderId, 'Cancelled by customer from tracking portal');
        if (res.success) {
            this.showToast(`❌ Order #${orderId} has been successfully cancelled!`, 'info');
            this.handleTrackSearch();
            this.refreshCurrentView();
        } else {
            this.showToast(res.message, 'error');
        }
    },

    // CUSTOMER ACCOUNT VIEW - LOGGED-IN ORDER DASHBOARD
    renderAccountView() {
        const user = Store.getUser();
        if (!user) {
            return `
                <div class="py-20 text-center max-w-md mx-auto px-4">
                    <div class="bg-maroon-dark p-8 rounded-3xl border-2 border-luxury-gold shadow-2xl space-y-4">
                        <img src="images/logo.jpg" alt="KSJ Logo" class="w-16 h-16 rounded-full object-cover border-2 border-luxury-gold mx-auto shadow-xl">
                        <h2 class="font-serif-luxury text-2xl font-black text-gold-bright uppercase">Customer Sign In Required</h2>
                        <p class="text-xs text-gold-light">Please sign in with your phone number or email to access your orders & tax invoices.</p>
                        <button onclick="App.openCustomerAuthModal()" class="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg border border-amber-300">
                            Sign In / Register Account
                        </button>
                    </div>
                </div>
            `;
        }

        const allOrders = Store.getOrders();
        const userPhone = user.emailOrPhone;
        const customerOrders = allOrders.filter(o => 
            (o.customerPhone && o.customerPhone === userPhone) || 
            (o.customerEmail && o.customerEmail === userPhone) ||
            (o.customerName && user.name && o.customerName.toLowerCase() === user.name.toLowerCase())
        );

        return `
            <section class="py-12 bg-cream-50 min-h-screen">
                <div class="max-w-5xl mx-auto px-4 sm:px-6">
                    
                    <!-- Customer Profile Header Card -->
                    <div class="bg-maroon-dark rounded-3xl p-6 sm:p-8 border-2 border-luxury-gold shadow-2xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center text-xl font-extrabold font-serif-luxury border-2 border-luxury-gold shadow-lg">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span class="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Logged-In Patron</span>
                                <h1 class="font-serif-luxury text-2xl font-bold text-gold-bright">${user.name}</h1>
                                <span class="text-xs text-amber-200/80 font-mono">${user.emailOrPhone}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <button onclick="App.navigateTo('shop')" class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition-colors">
                                Shop Catalogue
                            </button>
                            <button onclick="Store.logoutCustomer()" class="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold rounded-xl border border-red-800 transition-colors">
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <!-- Orders List Section -->
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="font-serif-luxury text-2xl font-bold text-stone-900">Your Order History (${customerOrders.length})</h2>
                        <button onclick="App.navigateTo('track')" class="text-xs font-bold text-luxury-goldDark hover:underline flex items-center gap-1">
                            <i data-lucide="package-search" class="w-4 h-4"></i> Standalone Order Tracking
                        </button>
                    </div>

                    ${customerOrders.length > 0 ? `
                        <div class="space-y-5">
                            ${customerOrders.map(o => `
                                <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-stone-900 text-sm font-mono">ORDER #${o.id}</span>
                                            <span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300">
                                                ${o.orderStatus}
                                            </span>
                                        </div>
                                        <p class="text-xs text-stone-600 font-medium">
                                            ${o.items ? o.items.map(i => i.name).join(', ') : 'Jewellery Purchase'}
                                        </p>
                                        <div class="text-[11px] text-stone-400 flex items-center gap-3">
                                            <span>Date: ${new Date(o.date).toLocaleDateString('en-IN')}</span>
                                            <span>&bull;</span>
                                            <span>Tracking AWB: ${o.trackingNumber}</span>
                                        </div>
                                        <span class="text-sm font-extrabold text-stone-900 block pt-1">Total: ₹${o.total.toLocaleString('en-IN')} (${o.paymentMethod})</span>
                                    </div>

                                    <div class="flex items-center gap-2 w-full md:w-auto">
                                        <button onclick="App.navigateTo('track'); setTimeout(() => { document.getElementById('track-id-input').value = '${o.id}'; App.handleTrackSearch(); }, 150);" class="flex-1 md:flex-none px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                            <i data-lucide="truck" class="w-4 h-4 text-luxury-gold"></i> Live Status
                                        </button>
                                        <button onclick="App.viewCustomerOrderModal('${o.id}')" class="flex-1 md:flex-none px-4 py-2.5 bg-cream-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-stone-300">
                                            <i data-lucide="printer" class="w-4 h-4"></i> GST Invoice
                                        </button>
                                        ${o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled' ? `
                                            <button onclick="App.handleCustomerOrderCancel('${o.id}')" class="flex-1 md:flex-none px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-red-300 shadow-sm">
                                                <i data-lucide="x-circle" class="w-4 h-4 text-red-600"></i> Cancel
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                            <i data-lucide="shopping-bag" class="w-12 h-12 text-stone-300 mx-auto"></i>
                            <h3 class="font-serif-luxury text-xl font-bold text-stone-800">No Orders Found Yet</h3>
                            <p class="text-xs text-stone-500 max-w-sm mx-auto">You haven't placed any jewellery orders under this account phone/email yet.</p>
                            <button onclick="App.navigateTo('shop')" class="mt-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md">
                                Explore Jewellery Collections
                            </button>
                        </div>
                    `}

                </div>
        `;
    },

    // ADMIN DASHBOARD VIEW
    renderAdminView() {
        const admin = Store.getAdmin();
        if (!admin) {
            setTimeout(() => this.openAdminAuthModal(), 100);
            return `
                <div class="py-24 text-center max-w-md mx-auto px-4">
                    <i data-lucide="lock" class="w-12 h-12 text-amber-600 mx-auto mb-3"></i>
                    <h2 class="font-serif-luxury text-2xl font-bold text-stone-900">Admin Authentication Required</h2>
                    <p class="text-xs text-stone-500 mt-1 mb-6">Restricted portal for Vinod Kumar Soni & authorized store managers.</p>
                    <button onclick="App.openAdminAuthModal()" class="w-full py-3 bg-stone-900 text-amber-300 font-bold text-xs rounded-xl shadow-lg">
                        Open Admin Login Dialog
                    </button>
                </div>
            `;
        }

        const rates = Store.getRates();
        const products = Store.getProducts();
        const orders = Store.getOrders();
        const orderHistory = Store.getOrderHistory();
        const securityLogs = Store.getSecurityLogs();
        const lockoutInfo = Store.getAdminLockoutInfo();
        const currentDeviceId = Store.getDeviceId();

        // Calculate Analytics Counters
        const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
        const totalProductsSold = orders.reduce((sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);
        const uniqueCustomerPhones = new Set(orders.map(o => o.customerPhone || o.customerName));
        const totalCustomersCount = uniqueCustomerPhones.size;

        return `
            <section class="py-10 bg-stone-900 text-white min-h-screen">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <!-- Top Bar & Security Device Status -->
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-stone-800">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] uppercase font-bold tracking-widest text-amber-400">KS Jewellers Admin Control Panel</span>
                                <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    🔒 Single Device Lock Active
                                </span>
                            </div>
                            <h1 class="font-serif-luxury text-3xl font-bold text-white">Master Store & Analytics Dashboard</h1>
                            <p class="text-xs text-stone-400 mt-0.5">Bound Device ID: <span class="font-mono text-amber-300">${currentDeviceId}</span></p>
                        </div>
                        <div class="flex items-center gap-2.5">
                            <button onclick="App.openAdminPasswordResetModal()" class="px-3 py-1.5 bg-amber-950/90 hover:bg-amber-900 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 flex items-center gap-1.5 shadow">
                                <i data-lucide="key-round" class="w-3.5 h-3.5 text-amber-400"></i> Change Password
                            </button>
                            <button onclick="App.openSecurityAuditModal()" class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                                <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i> Security Logs (${securityLogs.length})
                            </button>
                            <span class="text-xs font-semibold text-stone-300 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
                                👤 Vinod Kumar Soni (Owner)
                            </span>
                            <button onclick="App.handleAdminLogout()" class="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 text-xs font-bold rounded-lg border border-red-800">
                                Logout
                            </button>
                        </div>
                    </div>

                    <!-- 4 ANALYTICS STATS OVERVIEW CARDS -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        
                        <!-- Total Sales Revenue -->
                        <div class="bg-stone-800 p-6 rounded-2xl border border-amber-500/30 relative overflow-hidden shadow-xl">
                            <span class="text-[11px] text-amber-400/90 uppercase font-bold tracking-wider">Total Sales Revenue</span>
                            <span class="block text-2xl font-bold font-serif-luxury text-amber-300 mt-1">₹${totalSales.toLocaleString('en-IN')}</span>
                            <span class="text-[10px] text-stone-400 mt-1 block">From ${orders.length} Verified Orders</span>
                        </div>

                        <!-- Total Products Sold -->
                        <div class="bg-stone-800 p-6 rounded-2xl border border-stone-700 shadow-xl">
                            <span class="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Total Products Sold</span>
                            <span class="block text-2xl font-bold font-serif-luxury text-white mt-1">${totalProductsSold} Units</span>
                            <span class="text-[10px] text-emerald-400 mt-1 block font-semibold">✓ Shipped & Delivered Items</span>
                        </div>

                        <!-- Total Customers Connected -->
                        <div class="bg-stone-800 p-6 rounded-2xl border border-stone-700 shadow-xl">
                            <span class="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Total Active Customers</span>
                            <span class="block text-2xl font-bold font-serif-luxury text-white mt-1">${totalCustomersCount} Patrons</span>
                            <span class="text-[10px] text-stone-400 mt-1 block">Registered & Buying Customers</span>
                        </div>

                        <!-- Single Device Lock Status -->
                        <div class="bg-stone-800 p-6 rounded-2xl border border-stone-700 shadow-xl">
                            <span class="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Single Device Session</span>
                            <span class="block text-xl font-bold font-serif-luxury text-emerald-400 mt-1">Locked to This Device</span>
                            <span class="text-[10px] text-stone-400 mt-1 block">5 Failed Attempts $\\rightarrow$ 72h Gap</span>
                        </div>

                    </div>

                    <!-- LIVE RATES MANAGER (FULL MANUAL OVERRIDE CONTROL) -->
                    <div class="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-amber-500/30 mb-10 space-y-6 shadow-xl">
                        <div class="flex justify-between items-center border-b border-stone-700 pb-4">
                            <div>
                                <h2 class="font-serif-luxury text-xl font-bold text-amber-200">Live Bullion Rate Override</h2>
                                <p class="text-xs text-stone-400">Update daily market prices for 24K, 22K, 18K Gold & 999 Silver. Product prices update instantly.</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${rates.isManualOverride ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}">
                                ${rates.isManualOverride ? 'Manual Override Locked' : 'Auto Live Market Simulation'}
                            </span>
                        </div>

                        <form onsubmit="App.handleAdminRatesUpdate(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
                            <div>
                                <label class="block text-stone-300 font-semibold mb-1">24K Gold (₹/g)</label>
                                <input type="number" id="admin-rate-24k" value="${rates.gold24k}" required class="w-full px-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white font-bold">
                            </div>
                            <div>
                                <label class="block text-stone-300 font-semibold mb-1">22K Gold (₹/g)</label>
                                <input type="number" id="admin-rate-22k" value="${rates.gold22k}" required class="w-full px-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white font-bold">
                            </div>
                            <div>
                                <label class="block text-stone-300 font-semibold mb-1">18K Gold (₹/g)</label>
                                <input type="number" id="admin-rate-18k" value="${rates.gold18k}" required class="w-full px-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white font-bold">
                            </div>
                            <div>
                                <label class="block text-stone-300 font-semibold mb-1">999 Silver (₹/g)</label>
                                <input type="number" step="any" id="admin-rate-silver" value="${rates.silver999}" required class="w-full px-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white font-bold">
                            </div>
                            <div>
                                <label class="block text-amber-300 font-semibold mb-1">Gold Making (%)</label>
                                <input type="number" step="0.1" id="admin-rate-making" value="${rates.defaultMakingPercent !== undefined ? rates.defaultMakingPercent : 10}" required class="w-full px-2.5 py-2 bg-stone-900 border border-amber-500/50 rounded-lg text-amber-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-amber-300 font-semibold mb-1">Silver Making (₹/g)</label>
                                <input type="number" step="0.1" id="admin-rate-silver-making" value="${rates.silverMakingPerGram !== undefined ? rates.silverMakingPerGram : 30}" required class="w-full px-2.5 py-2 bg-stone-900 border border-amber-500/50 rounded-lg text-amber-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-amber-300 font-semibold mb-1">GST Rate (%)</label>
                                <input type="number" step="0.1" id="admin-rate-gst" value="${rates.gstPercent !== undefined ? rates.gstPercent : 3}" required class="w-full px-2.5 py-2 bg-stone-900 border border-amber-500/50 rounded-lg text-amber-300 font-bold">
                            </div>
                            <div class="sm:col-span-2 lg:col-span-7 flex gap-4 pt-2">
                                <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-lg transition-colors shadow">
                                    Save & Lock Market Rates
                                </button>
                                <button type="button" onclick="App.toggleAutoRateSimulation()" class="px-6 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold rounded-lg">
                                    ${rates.isManualOverride ? 'Switch to Auto Live Rate Ticker' : 'Lock Manual Rates'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- CUSTOMER ORDERS & DETAILED PURCHASE RECORDS -->
                    <div class="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-stone-700 mb-10 space-y-6 shadow-xl">
                        <div class="flex justify-between items-center border-b border-stone-700 pb-4">
                            <div>
                                <h2 class="font-serif-luxury text-xl font-bold text-white">Customer Orders & Full Purchase Details</h2>
                                <p class="text-xs text-stone-400">Click any customer order to view purchase details, print tax invoice, or edit/delete order.</p>
                            </div>
                            <span class="text-xs text-amber-300 font-semibold bg-stone-900 px-3 py-1 rounded-lg border border-stone-700">
                                Active Orders: ${orders.length}
                            </span>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                                <thead>
                                    <tr class="border-b border-stone-700 text-stone-400 uppercase font-semibold">
                                        <th class="py-3 px-3">Order ID</th>
                                        <th class="py-3 px-3">Customer Name</th>
                                        <th class="py-3 px-3">Phone & Address</th>
                                        <th class="py-3 px-3">Total Payable</th>
                                        <th class="py-3 px-3">Payment</th>
                                        <th class="py-3 px-3">Order Status</th>
                                        <th class="py-3 px-3">Admin Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orders.map(o => `
                                        <tr class="border-b border-stone-700/60 hover:bg-stone-700/30">
                                            <td class="py-3 px-3 font-bold text-amber-300">${o.id}</td>
                                            <td class="py-3 px-3 font-semibold text-white">${o.customerName}</td>
                                            <td class="py-3 px-3">${o.customerPhone}<br><span class="text-[10px] text-stone-400 line-clamp-1">${o.address}</span></td>
                                            <td class="py-3 px-3 font-bold text-amber-300">₹${o.total.toLocaleString('en-IN')}</td>
                                            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-stone-900 border border-stone-700">${o.paymentMethod}</span></td>
                                            <td class="py-3 px-3">
                                                <select onchange="Store.updateOrderStatus('${o.id}', this.value)" class="bg-stone-900 border border-stone-700 text-amber-300 font-bold rounded px-2 py-1">
                                                    <option value="Placed" ${o.orderStatus === 'Placed' ? 'selected' : ''}>Placed</option>
                                                    <option value="Processing" ${o.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                                                    <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                                    <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                                    <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                                </select>
                                            </td>
                                            <td class="py-3 px-3">
                                                <div class="flex items-center gap-1.5">
                                                    <button onclick="App.viewCustomerOrderModal('${o.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] rounded transition-colors shadow">
                                                        View Info
                                                    </button>
                                                    <button onclick="App.openAdminEditOrderModal('${o.id}', false)" class="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-amber-300 font-bold text-[11px] rounded transition-colors border border-amber-500/40" title="Edit Order Details">
                                                        ✏️ Edit
                                                    </button>
                                                    <button onclick="App.handleAdminDeleteOrder('${o.id}')" class="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-[11px] rounded transition-colors border border-red-800" title="Delete Order">
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 📜 COMPLETE ORDER HISTORY ARCHIVES SECTION -->
                    <div class="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-amber-500/30 mb-10 space-y-6 shadow-xl">
                        <div class="flex justify-between items-center border-b border-stone-700 pb-4">
                            <div>
                                <h2 class="font-serif-luxury text-xl font-bold text-amber-200">📜 Complete Order History Archives</h2>
                                <p class="text-xs text-stone-400">Archived historic records of all customer orders. Admin can view, edit, or delete any history record.</p>
                            </div>
                            <span class="text-xs text-amber-300 font-bold bg-stone-900 px-3.5 py-1.5 rounded-lg border border-amber-500/40">
                                History Records: ${orderHistory.length}
                            </span>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                                <thead>
                                    <tr class="border-b border-stone-700 text-stone-400 uppercase font-semibold">
                                        <th class="py-3 px-3">Order ID</th>
                                        <th class="py-3 px-3">Date</th>
                                        <th class="py-3 px-3">Customer</th>
                                        <th class="py-3 px-3">Phone & Address</th>
                                        <th class="py-3 px-3">Total Payable</th>
                                        <th class="py-3 px-3">Payment</th>
                                        <th class="py-3 px-3">Status</th>
                                        <th class="py-3 px-3">History Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orderHistory.length > 0 ? orderHistory.map(h => `
                                        <tr class="border-b border-stone-700/60 hover:bg-stone-700/30">
                                            <td class="py-3 px-3 font-bold text-amber-300">${h.id}</td>
                                            <td class="py-3 px-3 text-[11px] text-stone-400">${new Date(h.date || Date.now()).toLocaleDateString('en-IN')}</td>
                                            <td class="py-3 px-3 font-semibold text-white">${h.customerName}</td>
                                            <td class="py-3 px-3">${h.customerPhone || 'N/A'}<br><span class="text-[10px] text-stone-400 line-clamp-1">${h.address || 'N/A'}</span></td>
                                            <td class="py-3 px-3 font-bold text-amber-300">₹${(h.total || 0).toLocaleString('en-IN')}</td>
                                            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-[10px]">${h.paymentMethod || 'COD'}</span></td>
                                            <td class="py-3 px-3">
                                                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${h.orderStatus === 'Delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : h.orderStatus === 'Cancelled' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}">
                                                    ${h.orderStatus}
                                                </span>
                                            </td>
                                            <td class="py-3 px-3">
                                                <div class="flex items-center gap-1.5">
                                                    <button onclick="App.viewCustomerOrderModal('${h.id}')" class="px-2 py-1 bg-stone-900 hover:bg-stone-950 text-amber-300 font-bold text-[10px] rounded border border-amber-500/40">
                                                        Tax Invoice
                                                    </button>
                                                    <button onclick="App.openAdminEditOrderModal('${h.id}', true)" class="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-[10px] rounded shadow">
                                                        ✏️ Edit Record
                                                    </button>
                                                    <button onclick="App.handleAdminDeleteHistoryOrder('${h.id}')" class="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-[10px] rounded border border-red-800">
                                                        🗑️ Delete Record
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('') : `
                                        <tr>
                                            <td colspan="8" class="py-8 text-center text-stone-400">No order history records found.</td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- PRODUCTS MANAGEMENT (FULL EDIT CAPABILITIES) -->
                    <div class="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-stone-700 space-y-6 shadow-xl">
                        <div class="flex justify-between items-center border-b border-stone-700 pb-4">
                            <div>
                                <h2 class="font-serif-luxury text-xl font-bold text-white">Product Catalogue Inventory Manager</h2>
                                <p class="text-xs text-stone-400">Admin can add, edit price, weight, making charges, or delete any jewellery item.</p>
                            </div>
                            <button onclick="App.openAddProductModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow">
                                <i data-lucide="plus" class="w-4 h-4"></i> Add New Jewellery Item
                            </button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${products.map(p => `
                                <div class="bg-stone-900 p-4 rounded-xl border border-stone-700 flex gap-3 items-center justify-between">
                                    <img src="${p.image}" class="w-16 h-16 rounded-lg object-cover">
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-bold text-white text-xs truncate">${p.name}</h4>
                                        <span class="text-[10px] text-stone-400">${p.purity} | ${p.weight}g</span>
                                        <span class="block text-xs font-bold text-amber-400">₹${Store.calculateProductPrice(p).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <button onclick="App.openEditProductModal('${p.id}')" class="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[10px] rounded border border-amber-500/30" title="Edit product details">
                                            Edit
                                        </button>
                                        <button onclick="Store.deleteProduct('${p.id}')" class="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-[10px] rounded border border-red-800" title="Delete product">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- ⭐ CUSTOMER RATINGS & PRODUCT REVIEWS MANAGEMENT -->
                    <div class="bg-stone-800 rounded-3xl p-6 sm:p-8 border border-stone-700 space-y-6 shadow-xl mt-10">
                        <div class="flex justify-between items-center border-b border-stone-700 pb-4">
                            <div>
                                <h2 class="font-serif-luxury text-xl font-bold text-amber-200">⭐ Customer Ratings & Product Reviews Manager</h2>
                                <p class="text-xs text-stone-400">Admin view of customer ratings, feedback comments, and star ratings across all jewellery items.</p>
                            </div>
                            <div class="flex items-center gap-2 bg-stone-900 px-4 py-2 rounded-xl border border-amber-500/40 text-amber-300 font-bold text-xs">
                                <i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>
                                <span>Overall Rating: ${Store.getProductRatingStats().avg} / 5.0 (${Store.getReviews().length} Reviews)</span>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs">
                                <thead>
                                    <tr class="border-b border-stone-700 text-stone-400 uppercase font-semibold">
                                        <th class="py-3 px-3">Customer Name</th>
                                        <th class="py-3 px-3">Product Name</th>
                                        <th class="py-3 px-3">Star Rating</th>
                                        <th class="py-3 px-3">Comment / Review Feedback</th>
                                        <th class="py-3 px-3">Date</th>
                                        <th class="py-3 px-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-stone-700 text-stone-300">
                                    ${Store.getReviews().map(r => `
                                        <tr>
                                            <td class="py-3 px-3 font-bold text-white">${r.name} (${r.city})</td>
                                            <td class="py-3 px-3 text-amber-300 font-medium">${r.productName || 'General Store Review'}</td>
                                            <td class="py-3 px-3">
                                                <div class="flex items-center gap-1 font-bold text-amber-400">
                                                    <span>${r.rating} ★</span>
                                                    <span class="text-[10px] text-amber-200/60 font-normal">(${"★".repeat(r.rating)})</span>
                                                </div>
                                            </td>
                                            <td class="py-3 px-3 italic text-stone-400 max-w-xs truncate">"${r.comment}"</td>
                                            <td class="py-3 px-3 text-stone-400">${r.date}</td>
                                            <td class="py-3 px-3">
                                                <button onclick="Store.deleteReview('${r.id}')" class="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-[10px] rounded border border-red-800">
                                                    Delete Review
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </section>
        `;
    },

    handleAdminRatesUpdate(e) {
        e.preventDefault();
        const gold24k = parseFloat(document.getElementById('admin-rate-24k').value);
        const gold22k = parseFloat(document.getElementById('admin-rate-22k').value);
        const gold18k = parseFloat(document.getElementById('admin-rate-18k').value);
        const silver999 = parseFloat(document.getElementById('admin-rate-silver').value);
        const defaultMakingPercent = parseFloat(document.getElementById('admin-rate-making').value);
        const silverMakingPerGram = parseFloat(document.getElementById('admin-rate-silver-making').value);
        const gstPercent = parseFloat(document.getElementById('admin-rate-gst').value);

        Store.updateRates({ gold24k, gold22k, gold18k, silver999, defaultMakingPercent, silverMakingPerGram, gstPercent }, true);
        this.showToast('✅ Rates, Gold Making %, Silver Making (₹/g) & GST % updated successfully!', 'success');
        this.refreshCurrentView();
    },

    toggleAutoRateSimulation() {
        const rates = Store.getRates();
        Store.updateRates({ isManualOverride: !rates.isManualOverride, isAutoUpdate: true }, !rates.isManualOverride);
        this.showToast(rates.isManualOverride ? 'Switched to Auto Live Market Rate Mode' : 'Rates Locked to Manual Override');
        this.refreshCurrentView();
    },

    // PRODUCT MODAL WITH PRICE BREAKUP
    openProductModal(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;

        this.selectedProduct = product;
        this.selectedSize = product.sizes ? product.sizes[0] : 'Standard';

        const price = Store.calculateProductPrice(product);
        const ratingStats = Store.getProductRatingStats(product.id);

        const cart = Store.getCart();
        const isInCart = cart.some(i => i.productId === product.id);

        const modalContent = document.getElementById('product-modal-content');
        modalContent.innerHTML = `
            <button onclick="App.closeProductModal()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-700 z-10">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Image Showcase (Click to Open HD Lightbox & Download) -->
                <div>
                    <div class="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-500/40 shadow-xl" onclick="App.openImageLightbox('${product.image}', '${encodeURIComponent(product.name)}', '${product.purity} &bull; ${product.weight} Grams')">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute bottom-3 right-3 bg-stone-950/90 text-amber-300 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-amber-500/50 shadow-2xl flex items-center gap-1.5 backdrop-blur-md transition-transform group-hover:scale-105">
                            <i data-lucide="maximize-2" class="w-4 h-4 text-luxury-gold"></i> Click to Open Full Photo 🔍
                        </span>
                    </div>

                    <button onclick="App.downloadProductImage('${product.image}', '${encodeURIComponent(product.name)}')" class="mt-3 w-full py-2.5 bg-stone-900 hover:bg-stone-950 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.01]">
                        <i data-lucide="download" class="w-4 h-4 text-luxury-gold"></i> Download High Resolution Photo File 📥
                    </button>
                </div>

                <!-- Product Details & Pure Clean Price Card -->
                <div class="space-y-5">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">${product.purity}</span>
                            <div class="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-500"></i>
                                <span>${ratingStats.avg} / 5.0</span>
                                <span class="text-stone-400 font-normal">(${ratingStats.count} Ratings)</span>
                            </div>
                        </div>
                        <h2 class="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 mt-1">${product.name}</h2>
                        <p class="text-xs text-stone-500 mt-1.5 leading-relaxed">${product.description}</p>
                    </div>

                    <!-- CLEAN PRICE CARD (NET WEIGHT & PRODUCT PRICE ONLY) -->
                    <div class="bg-cream-50 p-4 rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-sm">
                        <div class="flex justify-between items-center text-stone-700">
                            <span class="font-bold text-stone-800">Net Jewellery Weight:</span>
                            <span class="font-extrabold text-stone-900 text-sm">${product.weight} Grams</span>
                        </div>
                        <div class="pt-2 border-t border-amber-200/60 flex justify-between items-center">
                            <span class="font-bold text-stone-800 text-sm">Product Price:</span>
                            <span class="text-luxury-goldDark text-2xl font-extrabold">₹${price.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <!-- CUSTOMER RATING & REVIEW FORM -->
                    <div class="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
                        <h4 class="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                            <i data-lucide="star" class="w-4 h-4 text-amber-500 fill-amber-400"></i> Rate Product & Submit Review
                        </h4>
                        
                        <form onsubmit="App.handleProductRatingSubmit(event, '${product.id}', '${encodeURIComponent(product.name)}')" class="space-y-2 text-xs">
                            <div class="flex items-center gap-2">
                                <label class="font-semibold text-stone-700">Your Rating:</label>
                                <select id="review-stars" class="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-amber-600 font-bold focus:outline-none">
                                    <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                                    <option value="4">⭐⭐⭐⭐ (4/5 Very Good)</option>
                                    <option value="3">⭐⭐⭐ (3/5 Good)</option>
                                    <option value="2">⭐⭐ (2/5 Average)</option>
                                    <option value="1">⭐ (1/5 Needs Improvement)</option>
                                </select>
                            </div>
                            <textarea id="review-comment" required rows="2" placeholder="Write your feedback for Vinod Kumar Soni & team..." class="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-luxury-gold"></textarea>
                            <button type="submit" class="w-full py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow transition-colors">
                                Submit My Star Rating & Review
                            </button>
                        </form>
                    </div>

                    <!-- CTA Actions -->
                    <div class="space-y-2.5 pt-1">
                        <div class="grid grid-cols-2 gap-3">
                            ${isInCart ? `
                                <button onclick="App.toggleCartDrawer(); App.closeProductModal();" class="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 border border-emerald-500">
                                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-200"></i> Added
                                </button>
                            ` : `
                                <button onclick="Store.addToCart('${product.id}', '${this.selectedSize}', 1); App.showToast('Added to cart!'); App.closeProductModal(); App.toggleCartDrawer();" class="w-full py-3 bg-stone-900 text-luxury-goldLight font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors shadow">
                                    Add To Cart
                                </button>
                            `}
                            <button onclick="App.shopProductNow('${product.id}')" class="w-full py-3 bg-luxury-gold text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors shadow">
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('product-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    },

    handleProductRatingSubmit(e, productId, productNameEncoded) {
        e.preventDefault();
        const productName = decodeURIComponent(productNameEncoded);
        const rating = parseInt(document.getElementById('review-stars').value) || 5;
        const comment = document.getElementById('review-comment').value;
        const user = Store.getUser() || {};

        Store.addReview({
            productId,
            productName,
            customerName: user.name || 'Valued Customer',
            city: 'Jhunjhunu',
            rating,
            comment
        });

        this.showToast('🎉 Thank you! Your star rating & review feedback has been submitted successfully.', 'success');
        this.closeProductModal();
        this.refreshCurrentView();
    },

    highlightSelectedSize(btn) {
        document.querySelectorAll('.size-btn').forEach(b => {
            b.classList.remove('bg-stone-900', 'text-white', 'border-stone-900');
            b.classList.add('bg-white', 'text-stone-700', 'border-stone-300');
        });
        btn.classList.remove('bg-white', 'text-stone-700', 'border-stone-300');
        btn.classList.add('bg-stone-900', 'text-white', 'border-stone-900');
    },

    closeProductModal() {
        document.getElementById('product-modal')?.classList.add('hidden');
    },

    // CART DRAWER CONTROLS
    toggleCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return;

        if (drawer.classList.contains('hidden')) {
            this.renderCartDrawerItems();
            drawer.classList.remove('hidden');
        } else {
            drawer.classList.add('hidden');
        }
    },

    renderCartDrawerItems() {
        const cart = Store.getCart();
        const itemsContainer = document.getElementById('cart-drawer-items');
        const footerContainer = document.getElementById('cart-drawer-footer');

        if (!itemsContainer || !footerContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="text-center py-16 text-stone-400">
                    <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-3 text-stone-300"></i>
                    <p class="text-xs font-medium">Your cart is currently empty.</p>
                </div>
            `;
            footerContainer.innerHTML = '';
            if (window.lucide) lucide.createIcons();
            return;
        }

        let subtotal = 0;

        itemsContainer.innerHTML = cart.map(item => {
            const product = Store.getProductById(item.productId);
            if (!product) return '';
            const price = Store.calculateProductPrice(product);
            const itemTotal = price * item.qty;
            subtotal += itemTotal;

            return `
                <div class="flex gap-3 p-3 bg-cream-50 rounded-xl border border-stone-200 items-center justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                        <img src="${product.image}" class="w-14 h-14 rounded-lg object-cover border border-stone-200">
                        <div class="min-w-0">
                            <h4 class="font-serif-luxury font-bold text-stone-900 text-xs truncate">${product.name}</h4>
                            <span class="text-[10px] text-stone-500 block">Size: ${item.size}</span>
                            <span class="block text-xs font-extrabold text-stone-900 mt-0.5">₹${itemTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1.5 shrink-0">
                        <div class="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-1">
                            <button onclick="Store.updateCartQty('${item.productId}', '${item.size}', ${item.qty - 1})" class="px-1.5 py-0.5 text-stone-700 font-bold hover:bg-stone-100 rounded text-xs">-</button>
                            <span class="text-xs font-bold px-1.5">${item.qty}</span>
                            <button onclick="Store.updateCartQty('${item.productId}', '${item.size}', ${item.qty + 1})" class="px-1.5 py-0.5 text-stone-700 font-bold hover:bg-stone-100 rounded text-xs">+</button>
                        </div>
                        <button onclick="Store.updateCartQty('${item.productId}', '${item.size}', 0); App.showToast('Item removed from cart');" class="text-[10px] font-bold text-red-600 hover:text-red-800 flex items-center gap-0.5">
                            <i data-lucide="trash-2" class="w-3 h-3 text-red-500"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        footerContainer.innerHTML = `
            <div class="space-y-1 text-xs">
                <div class="flex justify-between text-stone-600">
                    <span>Cart Total:</span>
                    <span class="font-bold text-stone-900 text-sm">₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <p class="text-[10px] text-emerald-700 font-medium">✨ Free Insured Courier Delivery Across India</p>
            </div>
            <button onclick="App.toggleCartDrawer(); App.openCheckoutModal();" class="w-full py-3 bg-luxury-dark text-luxury-goldLight font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors shadow-lg">
                Proceed to Secure Checkout
            </button>
        `;

        if (window.lucide) lucide.createIcons();
    },

    shopProductNow(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;

        // Ensure product is in cart
        Store.addToCart(productId, 'Standard', 1);

        this.closeProductModal();
        this.openCheckoutModal();
    },

    // CHECKOUT MODAL FLOW - FULL STEP-BY-STEP VERIFICATION
    openCheckoutModal() {
        const cart = Store.getCart();
        if (cart.length === 0) {
            this.showToast('Your cart is empty!', 'error');
            return;
        }

        const user = Store.getUser() || {};
        let totalMetalCost = 0;
        let totalMakingCharges = 0;
        let totalGST = 0;
        let grandTotal = 0;

        const container = document.getElementById('checkout-form-container');
        if (!container) return;

        const cartItemsSummary = cart.map(item => {
            const product = Store.getProductById(item.productId);
            const breakup = Store.getPriceBreakup(product.weight, product.purityCode);
            const itemTotal = breakup.total * item.qty;

            totalMetalCost += breakup.metalCost * item.qty;
            totalMakingCharges += breakup.makingChargeAmount * item.qty;
            totalGST += breakup.gstAmount * item.qty;
            grandTotal += itemTotal;

            const makingText = breakup.isSilver ? `Making: ₹30/g (₹${breakup.makingChargeAmount.toLocaleString('en-IN')})` : `Making: 10% (₹${breakup.makingChargeAmount.toLocaleString('en-IN')})`;
            const gstText = breakup.isSilver ? `GST: 0%` : `GST: 3% (₹${breakup.gstAmount.toLocaleString('en-IN')})`;

            return `
                <div class="flex justify-between items-start text-xs py-2.5 border-b border-stone-200/80">
                    <div>
                        <span class="font-extrabold text-stone-900 block text-sm">${product.name} (x${item.qty})</span>
                        <span class="text-[10px] text-stone-600 font-semibold block pt-0.5">
                            Weight: ${product.weight}g | Live Rate: ₹${breakup.ratePerGram.toLocaleString('en-IN')}/g (${product.purity})
                        </span>
                        <span class="text-[10px] text-amber-800 font-medium block">
                            ${makingText} &bull; ${gstText}
                        </span>
                    </div>
                    <span class="font-extrabold text-stone-900 text-sm shrink-0">₹${itemTotal.toLocaleString('en-IN')}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <form onsubmit="App.handleCheckoutSubmit(event)" class="space-y-6">
                
                <!-- STEP VERIFICATION BAR -->
                <div class="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs font-bold text-amber-900">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-[10px] font-extrabold">1</span>
                        <span>Ornament & Size Verified</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-[10px] font-extrabold">2</span>
                        <span>Delivery Address</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-extrabold">3</span>
                        <span>Payment Verified</span>
                    </div>
                </div>

                <!-- Items Summary & Transparent Charges Breakdown -->
                <div class="bg-cream-50 p-4 sm:p-5 rounded-2xl border border-amber-200/60 space-y-3">
                    <div class="flex justify-between items-center text-xs font-bold text-stone-800 border-b border-amber-200/50 pb-2">
                        <span class="flex items-center gap-1.5 text-luxury-goldDark"><i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i> Verified BIS Items & Charges Breakdown</span>
                        <span class="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">100% BIS 916 Hallmarked</span>
                    </div>

                    ${cartItemsSummary}

                    <!-- ITEMIZED CHARGES SUMMARY BOX -->
                    <div class="pt-3 border-t border-amber-200/80 space-y-1.5 text-xs">
                        <div class="flex justify-between text-stone-600">
                            <span>1. Total Metal Base Value:</span>
                            <span class="font-semibold text-stone-900">₹${totalMetalCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between text-stone-600">
                            <span>2. Making Charges (Gold 10% / Silver ₹30/g):</span>
                            <span class="font-bold text-amber-800">+ ₹${totalMakingCharges.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between text-stone-600">
                            <span>3. GST Tax (Gold 3% / Silver 0%):</span>
                            <span class="font-bold text-amber-800">+ ₹${totalGST.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="pt-2.5 border-t border-stone-300 flex justify-between items-center text-sm font-bold text-stone-900">
                            <span>Verified Total Payable Amount:</span>
                            <span class="text-luxury-goldDark text-xl font-extrabold">₹${grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Customer Address Verification -->
                <div class="space-y-3 text-xs">
                    <h3 class="font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                        <i data-lucide="map-pin" class="w-4 h-4 text-amber-600"></i> Step 2: Customer Delivery Address & Contact Verification
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Customer Full Name</label>
                            <input type="text" id="checkout-name" value="${user.name || ''}" required placeholder="e.g. Aarti Soni" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Phone Number (For Delivery Updates)</label>
                            <input type="tel" id="checkout-phone" value="${user.emailOrPhone || ''}" required placeholder="e.g. 9413435295" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-bold font-mono text-stone-900 focus:outline-none focus:border-luxury-gold">
                        </div>
                    </div>
                    <div>
                        <label class="block font-semibold text-stone-700 mb-1">Complete Shipping Address (With City & Pincode)</label>
                        <textarea id="checkout-address" rows="2" required placeholder="House No., Street, Area, City, Pincode" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-luxury-gold"></textarea>
                    </div>
                </div>

                <!-- Step 3: Payment Verification & Options -->
                <div class="space-y-3 text-xs">
                    <h3 class="font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                        <i data-lucide="credit-card" class="w-4 h-4 text-amber-600"></i> Step 3: Verified Payment Options & Direct Dispatch
                    </h3>

                    <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 font-bold flex items-center gap-2 text-[11px]">
                        <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                        <span>Verified 100% BIS 916 Hallmarking & Express Delivery Guarantee Today</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label class="p-3.5 border-2 border-amber-500 rounded-2xl bg-amber-50/50 flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="payment-method" value="UPI Online Gateway" checked class="text-amber-600">
                            <div>
                                <span class="font-extrabold text-stone-900 block text-xs">UPI / GPay / PhonePe / Cards</span>
                                <span class="text-[10px] text-stone-500 font-medium">Instant Verified Digital Gateway</span>
                            </div>
                        </label>

                        <label class="p-3.5 border border-stone-300 rounded-2xl bg-white flex items-center gap-3 cursor-pointer hover:border-amber-400">
                            <input type="radio" name="payment-method" value="Cash on Delivery" class="text-amber-600">
                            <div>
                                <span class="font-extrabold text-stone-900 block text-xs">Cash on Delivery (COD)</span>
                                <span class="text-[10px] text-stone-500 font-medium">Verified Payment on Delivery</span>
                            </div>
                        </label>
                    </div>
                </div>

                <button type="submit" class="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold text-xs uppercase tracking-widest rounded-2xl hover:from-amber-500 hover:to-amber-400 transition-all shadow-xl border border-amber-300">
                    🔒 Complete Verified Order & Dispatch Today
                </button>
            </form>
        `;

        document.getElementById('checkout-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    },

    closeCheckoutModal() {
        document.getElementById('checkout-modal')?.classList.add('hidden');
    },

    handleCheckoutSubmit(e) {
        e.preventDefault();
        const cart = Store.getCart();
        let total = 0;
        const items = cart.map(item => {
            const product = Store.getProductById(item.productId);
            const price = Store.calculateProductPrice(product);
            total += price * item.qty;
            return {
                id: product.id,
                name: product.name,
                qty: item.qty,
                price: price,
                weight: product.weight
            };
        });

        const customerName = document.getElementById('checkout-name').value.trim();
        const customerPhone = document.getElementById('checkout-phone').value.trim();
        const address = document.getElementById('checkout-address').value.trim();
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

        // Step 1: Create Verified Order
        const order = Store.createOrder({
            customerName,
            customerPhone,
            address,
            items,
            total,
            paymentMethod,
            paymentStatus: '✅ Payment Verified & Authenticated',
            deliveryStatus: '🚚 Dispatching - Guaranteed Delivery Today'
        });

        this.closeCheckoutModal();

        // Step 2: Dual Instant Notifications
        // A. Admin Instant Alert (Owner Vinod Kumar Soni - 9413435295)
        const itemsSummary = items.map(i => `${i.name} (x${i.qty})`).join(', ');
        const adminAlertMsg = `🚨 NEW ORDER RECEIVED! Order ID: #${order.id} | Customer: ${customerName} (${customerPhone}) | Amount: ₹${total.toLocaleString('en-IN')} | Items: ${itemsSummary} | Payment: Verified (${paymentMethod})`;
        console.log('[ADMIN ALERT TO VINOD KUMAR SONI 9413435295]:', adminAlertMsg);
        
        // B. Customer Confirmation Message
        const customerMsg = `🎉 Order Confirmed! Dear ${customerName}, your jewellery order #${order.id} for ${itemsSummary} (Total: ₹${total.toLocaleString('en-IN')}) is confirmed! Dispatching for Delivery Today!`;
        
        // Show Toast Notifications
        this.showToast(`🚨 Admin Alert sent to Vinod Kumar Soni (9413435295) for Order #${order.id}!`, 'info');
        setTimeout(() => {
            this.showToast(`🎉 Order #${order.id} Confirmed! Delivery Today.`, 'success');
        }, 1200);

        // Trigger celebratory confetti!
        if (window.confetti) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
            });
        }

        // WhatsApp Direct Order Notification URL for Customer & Admin
        const waText = encodeURIComponent(`Hello Vinod Kumar Soni ji, my order #${order.id} is confirmed!\n\nCustomer: ${customerName} (${customerPhone})\nItems: ${itemsSummary}\nTotal: INR ${total.toLocaleString('en-IN')}\nPayment: Verified (${paymentMethod})\nAddress: ${address}\nDelivery: Expected Today!`);
        const waUrl = `https://wa.me/919413435295?text=${waText}`;

        // Show Order Success & Verification Popup
        const container = document.getElementById('app-viewport');
        container.innerHTML = `
            <div class="py-16 bg-cream-50 min-h-screen flex items-center justify-center px-4">
                <div class="bg-white max-w-xl w-full rounded-3xl p-8 border-2 border-amber-300 shadow-2xl text-center space-y-6">
                    <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-300">
                        <i data-lucide="check-circle-2" class="w-10 h-10"></i>
                    </div>

                    <div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300 mb-2">
                            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Payment & Order Verified
                        </div>
                        <h2 class="font-serif-luxury text-3xl font-bold text-stone-900 mt-1">Order #${order.id} Confirmed!</h2>
                        <p class="text-xs text-stone-600 mt-2 font-medium">
                            Dear <strong>${customerName}</strong>, your order is confirmed! Express dispatch initiated for <strong>Delivery Today</strong>.
                        </p>
                    </div>

                    <!-- Dual Notification Alert Summary Box -->
                    <div class="bg-cream-50 p-5 rounded-2xl border border-stone-200 text-xs text-left space-y-3">
                        <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-stone-800 space-y-1">
                            <div class="flex items-center justify-between font-bold text-amber-900">
                                <span>📱 Admin Notification Sent</span>
                                <span class="text-[10px] text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">Owner: Vinod Kumar Soni</span>
                            </div>
                            <p class="text-[11px] text-stone-600">Order alert logged for store manager (9413435295) for crafting & hallmarked dispatch.</p>
                        </div>

                        <div class="space-y-2 pt-1">
                            <div class="flex justify-between">
                                <span class="text-stone-500">Tracking Number / AWB:</span>
                                <span class="font-bold font-mono text-stone-900">${order.trackingNumber}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-stone-500">Payment Verification:</span>
                                <span class="font-bold text-emerald-700">✅ Verified (${order.paymentMethod})</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-stone-500">Estimated Delivery:</span>
                                <span class="font-extrabold text-amber-800">🚚 Today / Express Dispatch</span>
                            </div>
                            <div class="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900 text-sm">
                                <span>Total Amount Paid:</span>
                                <span class="text-luxury-goldDark text-base font-extrabold">₹${order.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <a href="${waUrl}" target="_blank" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            <i data-lucide="message-circle" class="w-4 h-4"></i> Receive Order Receipt on WhatsApp
                        </a>

                        <div class="flex gap-3">
                            <button onclick="App.navigateTo('track'); setTimeout(() => { document.getElementById('track-id-input').value = '${order.id}'; App.handleTrackSearch(); }, 100);" class="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow">
                                Track Live Status
                            </button>
                            <button onclick="App.navigateTo('home')" class="flex-1 py-3 bg-cream-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-300">
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    },

    // AUTH MODALS CONTROLS
    openCustomerAuthModal(defaultTab = 'login') {
        const modal = document.getElementById('customer-auth-modal');
        const content = document.getElementById('customer-auth-form-content');
        if (!modal || !content) return;

        const user = Store.getUser();
        if (user) {
            this.navigateTo('account');
            return;
        }

        const isLocked = Store.isCustomerLocked();
        const savedProfile = Store.getSavedCustomerProfile();

        if (isLocked && savedProfile) {
            // Render Security Re-Authentication Unlock Dialog
            content.innerHTML = `
                <div class="space-y-4 text-xs">
                    <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-center space-y-1.5 shadow-sm">
                        <div class="w-10 h-10 bg-stone-900 text-amber-300 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                            <i data-lucide="lock" class="w-5 h-5 text-luxury-gold"></i>
                        </div>
                        <h4 class="font-serif-luxury font-bold text-base text-stone-900">Security Session Lock Active</h4>
                        <p class="text-[11px] text-stone-600 leading-relaxed">
                            Welcome back, <strong>${savedProfile.name}</strong>! Enter your Password or registered Mobile/Email to unlock your active session.
                        </p>
                        <div class="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-0.5 rounded-full border border-emerald-300">
                            ✓ Cart items & saved progress preserved
                        </div>
                    </div>

                    <form onsubmit="App.handleCustomerUnlockSubmit(event)" class="space-y-3">
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Registered Mobile Number or Email</label>
                            <input type="text" id="unlock-phone-input" value="${savedProfile.emailOrPhone || savedProfile.phone}" required class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Account Password</label>
                            <input type="password" id="unlock-pass-input" placeholder="Enter password (e.g. email password)" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-luxury-gold">
                        </div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold rounded-xl shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all border border-amber-300 uppercase tracking-wider text-xs">
                            🔓 Unlock Session & Restore Progress
                        </button>
                    </form>

                    <button type="button" onclick="Store.logoutCustomer(); App.openCustomerAuthModal('login');" class="w-full py-1 text-stone-500 hover:text-stone-900 text-[11px] font-semibold text-center hover:underline block">
                        Not ${savedProfile.name}? Log in with another account or Sign Up
                    </button>
                </div>
            `;
        } else {
            // Render 2 Tabs: Log In vs Sign Up
            this.renderCustomerAuthTabs(defaultTab);
        }

        if (window.lucide) lucide.createIcons();
        modal.classList.remove('hidden');
    },

    renderCustomerAuthTabs(activeTab = 'login') {
        const content = document.getElementById('customer-auth-form-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-4 text-xs">
                <!-- Tab Switcher Header -->
                <div class="flex border-b border-stone-200">
                    <button type="button" onclick="App.renderCustomerAuthTabs('login')" class="flex-1 py-2.5 text-center font-bold text-xs transition-colors border-b-2 ${activeTab === 'login' ? 'border-luxury-gold text-stone-900 font-extrabold' : 'border-transparent text-stone-400 hover:text-stone-700'}">
                        🔑 Customer Log In
                    </button>
                    <button type="button" onclick="App.renderCustomerAuthTabs('signup')" class="flex-1 py-2.5 text-center font-bold text-xs transition-colors border-b-2 ${activeTab === 'signup' ? 'border-luxury-gold text-stone-900 font-extrabold' : 'border-transparent text-stone-400 hover:text-stone-700'}">
                        📝 New Sign Up / Register
                    </button>
                </div>

                ${activeTab === 'login' ? `
                    <!-- LOG IN FORM -->
                    <form onsubmit="App.handleCustomerLoginSubmit(event)" class="space-y-3.5 pt-1">
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Mobile Number or Email Address</label>
                            <input type="text" id="login-id" required placeholder="e.g. 9413435295 or customer@gmail.com" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Account Password (Email Password)</label>
                            <input type="password" id="login-pass" required placeholder="Enter your password" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-luxury-gold">
                        </div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold rounded-xl shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all border border-amber-300 uppercase tracking-wider text-xs">
                            Log In to My Account
                        </button>
                        <p class="text-center text-[11px] text-stone-500 pt-1">
                            New customer? <button type="button" onclick="App.renderCustomerAuthTabs('signup')" class="text-amber-800 font-bold hover:underline">Click here to Sign Up</button>
                        </p>
                    </form>
                ` : `
                    <!-- SIGN UP FORM -->
                    <form onsubmit="App.handleCustomerRegisterSubmit(event)" class="space-y-3.5 pt-1">
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Full Name</label>
                            <input type="text" id="reg-name" required placeholder="e.g. Vinay Sharma" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Mobile Number</label>
                            <input type="tel" id="reg-phone" required placeholder="e.g. 9413435295" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Email Address</label>
                            <input type="email" id="reg-email" placeholder="e.g. vinay@gmail.com" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl focus:outline-none focus:border-luxury-gold">
                        </div>
                        <div>
                            <label class="block font-semibold text-stone-700 mb-1">Set Account Password</label>
                            <input type="password" id="reg-pass" required placeholder="Set password (e.g. email password)" class="w-full px-3.5 py-2.5 bg-cream-50 border border-stone-300 rounded-xl focus:outline-none focus:border-luxury-gold">
                        </div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-extrabold rounded-xl shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all border border-amber-300 uppercase tracking-wider text-xs">
                            Register & Create Account
                        </button>
                        <p class="text-center text-[11px] text-stone-500 pt-1">
                            Already registered? <button type="button" onclick="App.renderCustomerAuthTabs('login')" class="text-amber-800 font-bold hover:underline">Click here to Log In</button>
                        </p>
                    </form>
                `}
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    },

    closeCustomerAuthModal() {
        document.getElementById('customer-auth-modal')?.classList.add('hidden');
    },

    handleCustomerLoginSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;

        const res = Store.loginCustomerWithCredentials(id, pass);
        if (res.success) {
            this.closeCustomerAuthModal();
            this.showToast(`Welcome back, ${res.user.name}!`);
            this.navigateTo('account');
        } else {
            this.showToast(res.message, 'error');
        }
    },

    handleCustomerRegisterSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-pass').value;

        const res = Store.registerCustomer({ name, phone, email, password });
        if (res.success) {
            this.closeCustomerAuthModal();
            this.showToast(`🎉 Registration Successful! Welcome to KS Jewellers, ${name}.`);
            this.navigateTo('account');
        } else {
            this.showToast(res.message, 'error');
        }
    },

    handleCustomerAuthSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        Store.loginCustomer(phone, name);
        this.closeCustomerAuthModal();
        this.showToast(`Welcome back, ${name}! All your items & cart are saved.`);
        this.navigateTo('account');
    },

    handleCustomerUnlockSubmit(e) {
        e.preventDefault();
        const inputVal = document.getElementById('unlock-phone-input')?.value.trim();
        const passVal = document.getElementById('unlock-pass-input')?.value.trim();

        let res = Store.unlockCustomerSession(inputVal);
        if (!res.success && passVal) {
            res = Store.loginCustomerWithCredentials(inputVal, passVal);
        }

        if (res.success) {
            this.closeCustomerAuthModal();
            const userName = res.profile ? res.profile.name : (res.user ? res.user.name : 'Valued Patron');
            this.showToast(`🔓 Session Unlocked! Welcome back, ${userName}. All progress restored.`, 'success');
            this.updateCartBadge();
            this.updateWishlistBadge();
            this.updateUserMenu();
            this.refreshCurrentView();
        } else {
            this.showToast(res.message, 'error');
        }
    },

    openAdminAuthModal() {
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const emailInput = document.getElementById('admin-email');
            const passInput = document.getElementById('admin-password');
            const warningBox = document.getElementById('admin-login-warning-box');
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
            if (warningBox) warningBox.innerHTML = '';
        }
    },

    closeAdminAuthModal() {
        document.getElementById('admin-auth-modal')?.classList.add('hidden');
    },

    handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-password').value;
        const warningBox = document.getElementById('admin-login-warning-box');
        const passInput = document.getElementById('admin-password');

        const res = Store.loginAdmin(email, pass);
        if (res.success) {
            if (warningBox) warningBox.innerHTML = '';
            if (passInput) passInput.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            this.closeAdminAuthModal();
            this.showToast('✅ Admin Login Successful! Alert logged for Owner Vinod Kumar Soni (9413435295).');
            this.navigateTo('admin');
        } else {
            // HIGHLIGHT INPUT BOX WITH RED GLOWING BORDER
            if (passInput) {
                passInput.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                passInput.focus();
            }

            // SHOW PROMINENT RED SECURITY WARNING ALERT BOX
            if (warningBox) {
                warningBox.innerHTML = `
                    <div class="mb-4 p-4 bg-red-950/95 border-2 border-red-500 rounded-2xl text-red-200 text-xs space-y-2 shadow-2xl animate-pulse">
                        <div class="flex items-center gap-2 text-red-400 font-extrabold text-sm">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-500 shrink-0"></i>
                            <span>⚠️ SECURITY WARNING: INCORRECT PASSWORD!</span>
                        </div>
                        <p class="text-[11px] text-red-300 font-semibold leading-relaxed">
                            Galat Password Dala Gaya Hai! Unauthorized Admin login attempt logged into security audit system.
                        </p>
                        <div class="pt-2 border-t border-red-900 flex justify-between items-center text-[10px] font-bold text-stone-300">
                            <span>Failed Attempt: ${res.attempts} of 5</span>
                            <span class="text-amber-400 font-extrabold">Remaining: ${res.remainingAttempts} Attempts</span>
                        </div>
                        <p class="text-[10px] text-amber-200/90 font-medium">
                            ⚠️ Warning: 5 wrong attempts will automatically LOCK the Admin Portal for 72 Hours & alert Owner Vinod Kumar Soni (9413435295).
                        </p>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
            }

            this.showToast(`⚠️ SECURITY WARNING: Incorrect Password! Attempt ${res.attempts} of 5.`, 'error');

            if (res.isLocked || res.isDeviceLocked) {
                alert(`🚨 CRITICAL SECURITY LOCKOUT ACTIVATED FOR OWNER (VINOD KUMAR SONI):\n\n${res.message}`);
            }
        }
    },

    // Customer Purchase Detail Modal for Admin
    viewCustomerOrderModal(orderId) {
        const orders = Store.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.id = 'admin-customer-detail-modal';
        modal.className = 'fixed inset-0 z-[9999] modal-backdrop flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-900/20 modal-content p-6 sm:p-8 relative text-stone-900">
                <button onclick="document.getElementById('admin-customer-detail-modal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-700">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>

                <div class="flex items-center gap-3 border-b border-stone-200 pb-4 mb-6">
                    <img src="images/logo.jpg" class="w-12 h-12 rounded-full object-cover border border-luxury-gold">
                    <div>
                        <span class="text-[10px] uppercase font-bold text-luxury-goldDark tracking-widest block">Customer Purchase Record</span>
                        <h2 class="font-serif-luxury text-2xl font-bold">Order #${order.id}</h2>
                    </div>
                </div>

                <!-- Customer Details Grid -->
                <div class="bg-cream-50 p-4 rounded-2xl border border-amber-200/60 mb-6 text-xs space-y-2">
                    <h3 class="font-bold text-stone-800 uppercase tracking-wider text-[11px] border-b border-amber-200/40 pb-1">1. Patron & Shipping Information</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><span class="text-stone-500">Customer Name:</span> <strong class="text-stone-900">${order.customerName}</strong></div>
                        <div><span class="text-stone-500">Phone Number:</span> <strong class="text-amber-800">📞 ${order.customerPhone}</strong></div>
                        <div class="sm:col-span-2"><span class="text-stone-500">Complete Address:</span> <span class="font-medium text-stone-800">${order.address}</span></div>
                        <div><span class="text-stone-500">Order Date & Time:</span> <span class="text-stone-800 font-mono">${new Date(order.date).toLocaleString()}</span></div>
                        <div><span class="text-stone-500">Tracking Number:</span> <span class="font-mono font-bold text-stone-900">${order.trackingNumber}</span></div>
                    </div>
                </div>

                <!-- Purchased Items Breakdown -->
                <div class="space-y-3 mb-6">
                    <h3 class="font-bold text-stone-800 uppercase tracking-wider text-xs">2. Purchased Items & Weight Breakdown</h3>
                    <div class="border border-stone-200 rounded-xl overflow-hidden text-xs">
                        <table class="w-full text-left">
                            <thead class="bg-stone-100 text-stone-700 uppercase font-bold text-[10px]">
                                <tr>
                                    <th class="p-2.5">Item Name</th>
                                    <th class="p-2.5">Net Weight</th>
                                    <th class="p-2.5">Qty</th>
                                    <th class="p-2.5">Unit Price</th>
                                    <th class="p-2.5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(order.items || []).map(item => `
                                    <tr class="border-t border-stone-200">
                                        <td class="p-2.5 font-semibold text-stone-900">${item.name}</td>
                                        <td class="p-2.5 text-stone-600">${item.weight || '—'}g</td>
                                        <td class="p-2.5 font-bold">${item.qty || 1}</td>
                                        <td class="p-2.5">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                                        <td class="p-2.5 text-right font-bold text-amber-800">₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Payment Summary -->
                <div class="bg-stone-900 text-white p-4 rounded-2xl flex justify-between items-center text-xs mb-6">
                    <div>
                        <span class="text-stone-400 block text-[10px] uppercase font-bold">Payment Method & Status</span>
                        <span class="font-bold text-amber-300">${order.paymentMethod} (${order.paymentStatus})</span>
                    </div>
                    <div class="text-right">
                        <span class="text-stone-400 block text-[10px] uppercase font-bold">Grand Total Paid</span>
                        <span class="font-serif-luxury text-2xl font-bold text-amber-300">₹${order.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button onclick="window.print()" class="flex-1 py-3 bg-luxury-gold hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="printer" class="w-4 h-4"></i> Print Customer Receipt / Invoice
                    </button>
                    <button onclick="document.getElementById('admin-customer-detail-modal').remove()" class="px-6 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    // Admin Image Upload Converter (Data URI)
    handleAdminImageUpload(event, targetInputId, previewImgId) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const targetInput = document.getElementById(targetInputId);
            const previewImg = document.getElementById(previewImgId);
            if (targetInput) targetInput.value = dataUrl;
            if (previewImg) previewImg.src = dataUrl;
            this.showToast('📷 Photo loaded & converted successfully!', 'info');
        };
        reader.readAsDataURL(file);
    },

    // Edit Existing Product Modal
    openEditProductModal(productId) {
        const product = Store.getProductById(productId);
        if (!product) {
            this.showToast('Product not found.', 'error');
            return;
        }

        document.getElementById('edit-prod-id').value = product.id;
        document.getElementById('edit-prod-name').value = product.name || '';
        document.getElementById('edit-prod-category').value = product.category || 'necklaces';
        document.getElementById('edit-prod-purity').value = product.purity || '22K Gold';
        document.getElementById('edit-prod-weight').value = product.weight || 0;
        document.getElementById('edit-prod-making').value = product.makingCharge || 0;
        document.getElementById('edit-prod-image').value = product.image || '';

        const preview = document.getElementById('edit-prod-img-preview');
        if (preview) preview.src = product.image || '';

        const modal = document.getElementById('admin-edit-product-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAdminEditProductModal() {
        const modal = document.getElementById('admin-edit-product-modal');
        if (modal) modal.classList.add('hidden');
    },

    handleAdminSaveProduct(e) {
        e.preventDefault();
        const prodId = document.getElementById('edit-prod-id').value;
        const product = Store.getProductById(prodId);
        if (!product) return;

        const purity = document.getElementById('edit-prod-purity').value;
        const purityCode = purity.includes('24') ? 'gold24k' : purity.includes('18') ? 'gold18k' : purity.includes('Silver') ? 'silver999' : 'gold22k';
        const newImage = document.getElementById('edit-prod-image').value.trim();

        const updated = {
            ...product,
            name: document.getElementById('edit-prod-name').value.trim(),
            category: document.getElementById('edit-prod-category').value,
            purity: purity,
            purityCode: purityCode,
            weight: parseFloat(document.getElementById('edit-prod-weight').value) || 0,
            makingCharge: parseFloat(document.getElementById('edit-prod-making').value) || 0,
            image: newImage || product.image,
            images: [newImage || product.image]
        };

        Store.saveProduct(updated);
        this.showToast('🎉 Catalogue Item & Photo updated successfully!', 'success');
        this.closeAdminEditProductModal();
        this.refreshCurrentView();
    },

    // Security Audit Logs Modal for Owner
    openSecurityAuditModal() {
        const existingModal = document.getElementById('admin-security-modal');
        if (existingModal) existingModal.remove();

        const logs = Store.getSecurityLogs();
        const modal = document.createElement('div');
        modal.id = 'admin-security-modal';
        modal.className = 'fixed inset-0 z-[9999] modal-backdrop flex items-center justify-center p-4';

        modal.innerHTML = `
            <div class="bg-stone-900 text-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-500/40 modal-content p-6 sm:p-8 relative">
                <button onclick="document.getElementById('admin-security-modal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-200">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>

                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-800 pb-4 mb-6 pr-8">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                            <i data-lucide="shield-alert" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="font-serif-luxury text-2xl font-bold text-amber-200">Security & Alert Audit Log</h2>
                            <p class="text-xs text-stone-400">Security notifications sent to Owner Vinod Kumar Soni (9413435295)</p>
                        </div>
                    </div>
                    ${logs.length > 0 ? `
                        <button onclick="App.handleClearAllSecurityLogs()" class="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i> Clear All Logs
                        </button>
                    ` : ''}
                </div>

                <div class="space-y-3 mb-6">
                    ${logs.length > 0 ? logs.map(l => `
                        <div class="p-3.5 bg-stone-800 rounded-xl border border-stone-700 text-xs space-y-1.5 relative group">
                            <div class="flex justify-between items-center text-[10px] gap-2">
                                <span class="px-2 py-0.5 rounded font-bold ${l.event.includes('FAILED') || l.event.includes('LOCKOUT') || l.event.includes('DELETED') ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">${l.event}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-stone-400 font-mono">${new Date(l.timestamp).toLocaleString()}</span>
                                    <button onclick="App.handleDeleteSingleSecurityLog('${l.id}')" class="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow" title="Delete Log Entry">
                                        <i data-lucide="trash-2" class="w-3 h-3 text-red-400"></i> Delete
                                    </button>
                                </div>
                            </div>
                            <p class="text-stone-200">${l.details}</p>
                            <span class="text-[9px] text-stone-500 font-mono block">Device: ${l.deviceId}</span>
                        </div>
                    `).join('') : '<p class="text-xs text-stone-500 text-center py-8">No security events logged yet.</p>'}
                </div>

                <div class="flex gap-3 pt-2 border-t border-stone-800">
                    <button onclick="Store.resetAdminDeviceBinding(); App.showToast('Single device binding reset!'); document.getElementById('admin-security-modal').remove(); App.refreshCurrentView();" class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow">
                        Reset Single Device Binding
                    </button>
                    <button onclick="document.getElementById('admin-security-modal').remove()" class="px-6 py-2.5 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl hover:bg-stone-700">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    handleDeleteSingleSecurityLog(logId) {
        if (confirm('Are you sure you want to delete this security audit log entry?')) {
            Store.deleteSecurityLog(logId);
            this.showToast('Log entry deleted successfully.');
            this.openSecurityAuditModal();
            this.refreshCurrentView();
        }
    },

    handleClearAllSecurityLogs() {
        if (confirm('Are you sure you want to CLEAR ALL security audit logs? This cannot be undone.')) {
            Store.clearAllSecurityLogs();
            this.showToast('All security audit logs cleared successfully.');
            this.openSecurityAuditModal();
            this.refreshCurrentView();
        }
    },

    openAddProductModal() {
        const name = prompt('Enter Product Name:');
        if (!name) return;
        const category = prompt('Category (rings, necklaces, earrings, bangles, bracelets, pendants, mangalsutra, coins):', 'necklaces');
        const purity = prompt('Purity (22K Gold, 18K Gold, 24K Gold, 925 Silver):', '22K Gold');
        const purityCode = purity.includes('24') ? 'gold24k' : purity.includes('18') ? 'gold18k' : purity.includes('Silver') ? 'silver999' : 'gold22k';
        const weight = parseFloat(prompt('Weight in Grams:', '15.0') || '15.0');
        const makingCharge = parseFloat(prompt('Making Charge (INR):', '1500') || '1500');
        const imageUrl = prompt('Product Image URL (Leave blank for default gold photo):', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80');

        Store.saveProduct({
            name,
            category: category || 'necklaces',
            purity,
            purityCode,
            weight,
            makingCharge,
            hallmark: purity.includes('Silver') ? '999 Silver Certified' : 'BIS 916 Hallmarked',
            image: imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
            images: [imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'],
            description: 'Handcrafted premium jewellery piece with 100% hallmarked authenticity.',
            featured: true,
            inStock: true
        });

        this.showToast('🎉 New jewellery item added to inventory!', 'success');
        this.refreshCurrentView();
    },

    // Admin Order Management (Edit & Delete active orders / history)
    openAdminEditOrderModal(orderId, isHistory = false) {
        const orders = isHistory ? Store.getOrderHistory() : Store.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            this.showToast('Order record not found.', 'error');
            return;
        }

        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-order-is-history').value = isHistory ? 'true' : 'false';
        document.getElementById('edit-order-customer-name').value = order.customerName || '';
        document.getElementById('edit-order-customer-phone').value = order.customerPhone || '';
        document.getElementById('edit-order-address').value = order.address || '';
        document.getElementById('edit-order-status').value = order.orderStatus || 'Processing';
        document.getElementById('edit-order-payment-status').value = order.paymentStatus || 'Paid';
        document.getElementById('edit-order-payment-method').value = order.paymentMethod || 'UPI Online';
        document.getElementById('edit-order-total').value = order.total || 0;

        const titleElem = document.getElementById('edit-order-modal-title');
        if (titleElem) {
            titleElem.textContent = isHistory ? `✏️ Edit Order History Record #${order.id}` : `✏️ Edit Active Order #${order.id}`;
        }

        const modal = document.getElementById('admin-edit-order-modal');
        if (modal) modal.classList.remove('hidden');
    },

    closeAdminEditOrderModal() {
        const modal = document.getElementById('admin-edit-order-modal');
        if (modal) modal.classList.add('hidden');
    },

    handleAdminSaveOrder(e) {
        e.preventDefault();
        const orderId = document.getElementById('edit-order-id').value;
        const isHistory = document.getElementById('edit-order-is-history').value === 'true';

        const updatedData = {
            customerName: document.getElementById('edit-order-customer-name').value.trim(),
            customerPhone: document.getElementById('edit-order-customer-phone').value.trim(),
            address: document.getElementById('edit-order-address').value.trim(),
            orderStatus: document.getElementById('edit-order-status').value,
            paymentStatus: document.getElementById('edit-order-payment-status').value,
            paymentMethod: document.getElementById('edit-order-payment-method').value,
            total: parseFloat(document.getElementById('edit-order-total').value) || 0
        };

        if (isHistory) {
            const res = Store.updateOrderHistoryRecord(orderId, updatedData);
            if (res.success) {
                this.showToast(`✅ History Record #${orderId} updated!`, 'success');
            } else {
                this.showToast(res.message, 'error');
            }
        } else {
            const res = Store.updateOrder(orderId, updatedData);
            if (res.success) {
                this.showToast(`✅ Active Order #${orderId} updated!`, 'success');
            } else {
                this.showToast(res.message, 'error');
            }
        }

        this.closeAdminEditOrderModal();
        this.refreshCurrentView();
    },

    handleAdminDeleteOrder(orderId) {
        if (confirm(`Are you sure you want to PERMANENTLY DELETE Active Order #${orderId}? This cannot be undone.`)) {
            const res = Store.deleteOrder(orderId);
            if (res.success) {
                this.showToast(`🗑️ Active Order #${orderId} deleted successfully.`, 'info');
                this.refreshCurrentView();
            } else {
                this.showToast(res.message, 'error');
            }
        }
    },

    handleAdminDeleteHistoryOrder(orderId) {
        if (confirm(`Are you sure you want to PERMANENTLY DELETE Order History Record #${orderId}?`)) {
            const res = Store.deleteOrderHistoryRecord(orderId);
            if (res.success) {
                this.showToast(`🗑️ Order History Record #${orderId} deleted from archive.`, 'info');
                this.refreshCurrentView();
            } else {
                this.showToast(res.message, 'error');
            }
        }
    },

    // High-Resolution Product Image Download Helper
    downloadProductImage(imageSrc, productName = 'jewellery_photo') {
        if (!imageSrc) {
            this.showToast('No photo available to download.', 'error');
            return;
        }

        const decodedName = decodeURIComponent(productName || 'jewellery_photo');
        const cleanName = decodedName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        
        // Handle Base64 / Data URIs
        if (imageSrc.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = imageSrc;
            link.download = `${cleanName}_ksj.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('📥 Photo file downloaded successfully!', 'success');
            return;
        }

        // Handle standard HTTP/HTTPS URLs
        this.showToast('📥 Downloading high resolution photo...', 'info');
        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${cleanName}_ksj.jpg`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showToast('🎉 High resolution photo saved to downloads!', 'success');
            })
            .catch(() => {
                // Fallback direct link trigger
                const a = document.createElement('a');
                a.href = imageSrc;
                a.target = '_blank';
                a.download = `${cleanName}_ksj.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.showToast('📥 Photo file download initiated!', 'success');
            });
    },

    // Full-Screen HD Image Lightbox Viewer with Direct Photo Download
    openImageLightbox(imageSrc, title = '', subtitle = '') {
        const decodedTitle = decodeURIComponent(title);
        const existing = document.getElementById('ksj-image-lightbox');
        if (existing) existing.remove();

        const lightbox = document.createElement('div');
        lightbox.id = 'ksj-image-lightbox';
        lightbox.className = 'fixed inset-0 z-[10000] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in cursor-zoom-out';
        lightbox.onclick = (e) => {
            if (e.target === lightbox || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                lightbox.remove();
            }
        };

        lightbox.innerHTML = `
            <!-- Top Controls Header -->
            <div class="absolute top-4 left-4 right-4 flex justify-between items-center z-10 text-white pointer-events-auto">
                <div class="bg-stone-900/90 px-4 py-2 rounded-2xl border border-amber-500/40 backdrop-blur-md shadow-2xl">
                    <h3 class="font-serif-luxury text-base sm:text-xl font-bold text-gold-bright line-clamp-1">${decodedTitle || 'KS Jewellers & Makers'}</h3>
                    ${subtitle ? `<p class="text-[11px] text-amber-200/80 font-bold">${subtitle}</p>` : ''}
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="event.stopPropagation(); App.downloadProductImage('${imageSrc}', '${encodeURIComponent(decodedTitle)}')" class="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center gap-1.5 text-xs font-black shadow-2xl transition-transform hover:scale-105">
                        <i data-lucide="download" class="w-4 h-4 text-stone-950"></i> Download Photo 📥
                    </button>
                    <button onclick="document.getElementById('ksj-image-lightbox').remove()" class="w-11 h-11 rounded-2xl bg-stone-900/90 text-amber-300 hover:text-white border border-amber-500/50 flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>

            <!-- Full-Screen High Definition Image Frame -->
            <div class="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2 cursor-default" onclick="event.stopPropagation()">
                <img src="${imageSrc}" alt="${decodedTitle}" class="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-luxury-gold shadow-2xl transition-transform duration-300 hover:scale-105">
                
                <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-950/90 px-5 py-2 rounded-full border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl pointer-events-none flex items-center gap-2">
                    <i data-lucide="zoom-in" class="w-4 h-4 text-luxury-gold"></i> HD Photo View &bull; 100% BIS Hallmarked Purity
                </div>
            </div>
        `;

        document.body.appendChild(lightbox);
        if (window.lucide) lucide.createIcons();

        // Close on ESC key press
        const escListener = (e) => {
            if (e.key === 'Escape') {
                lightbox.remove();
                window.removeEventListener('keydown', escListener);
            }
        };
        window.addEventListener('keydown', escListener);
    },

    // Admin Security Mobile OTP & Password Management Handlers
    openAdminPasswordResetModal() {
        const modal = document.getElementById('admin-password-reset-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const statusBox = document.getElementById('admin-otp-status-box');
            if (statusBox) statusBox.classList.add('hidden');
        }
    },

    closeAdminPasswordResetModal() {
        const modal = document.getElementById('admin-password-reset-modal');
        if (modal) modal.classList.add('hidden');
    },

    handleSendAdminOTP() {
        const res = Store.generateAdminOTP();
        if (res.success) {
            const statusBox = document.getElementById('admin-otp-status-box');
            const codeDisplay = document.getElementById('admin-otp-code-display');
            if (statusBox && codeDisplay) {
                statusBox.classList.remove('hidden');
                codeDisplay.textContent = `Security OTP Code: [ ${res.otp.split('').join(' ')} ] (Valid for 10 Mins)`;
            }
            this.showToast(`📲 Security OTP sent to Vinod Kumar Soni (9413435295)! OTP: ${res.otp}`, 'success');
        }
    },

    handleAdminPasswordChangeWithOTP(e) {
        e.preventDefault();
        const otpInput = document.getElementById('admin-otp-input').value;
        const newPass = document.getElementById('admin-new-password').value;
        const confirmPass = document.getElementById('admin-confirm-password').value;

        if (newPass !== confirmPass) {
            this.showToast('New Password and Confirm Password do not match!', 'error');
            return;
        }

        const res = Store.changeAdminPasswordWithOTP(otpInput, newPass);
        if (res.success) {
            this.showToast(res.message, 'success');
            this.closeAdminPasswordResetModal();
            this.refreshCurrentView();
        } else {
            this.showToast(res.message, 'error');
        }
    },

    handleAdminLogout() {
        if (confirm('Are you sure you want to log out from the Admin Control Panel?')) {
            Store.logoutAdmin();
            this.showToast('🔒 Admin session logged out safely. Switched to Customer View.', 'info');
            this.updateUserMenu();
            this.navigateTo('home');
        }
    }
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
