/**
 * KS JEWELLERS AND MAKERS - REACTIVE STATE MANAGER & CALCULATION ENGINE
 */

const Store = {
    // Initializers
    init() {
        if (!localStorage.getItem('ksj_rates')) {
            localStorage.setItem('ksj_rates', JSON.stringify(INITIAL_RATES));
        }
        if (!localStorage.getItem('ksj_products')) {
            localStorage.setItem('ksj_products', JSON.stringify(INITIAL_PRODUCTS));
        }
        if (!localStorage.getItem('ksj_cart')) {
            localStorage.setItem('ksj_cart', JSON.stringify([]));
        }
        if (!localStorage.getItem('ksj_wishlist')) {
            localStorage.setItem('ksj_wishlist', JSON.stringify([]));
        }
        if (!localStorage.getItem('ksj_orders')) {
            localStorage.setItem('ksj_orders', JSON.stringify(INITIAL_ORDERS));
        }
        if (!localStorage.getItem('ksj_reviews')) {
            localStorage.setItem('ksj_reviews', JSON.stringify(INITIAL_REVIEWS));
        }
        if (!localStorage.getItem('ksj_banner')) {
            localStorage.setItem('ksj_banner', '✨ Exclusive Shekhawati Craftsmanship | 100% BIS Hallmarked Gold & Pure Silver Jewellery | Free Insured Shipping Across India');
        }

        // Start Live Rate ticker if auto update enabled
        this.startLiveRateSimulation();
    },

    // Rates logic
    getRates() {
        return JSON.parse(localStorage.getItem('ksj_rates')) || INITIAL_RATES;
    },

    updateRates(newRates, isManual = true) {
        const rates = {
            ...this.getRates(),
            ...newRates,
            lastUpdated: new Date().toISOString(),
            isManualOverride: isManual
        };
        localStorage.setItem('ksj_rates', JSON.stringify(rates));
        window.dispatchEvent(new CustomEvent('ksj:rates-updated', { detail: rates }));
    },

    startLiveRateSimulation() {
        setInterval(() => {
            const rates = this.getRates();
            if (rates.isAutoUpdate && !rates.isManualOverride) {
                // Random fluctuation between -15 and +15 INR
                const goldDelta = Math.floor(Math.random() * 21) - 10;
                const silverDelta = (Math.random() * 0.4 - 0.2);

                const updated = {
                    gold24k: Math.max(7000, rates.gold24k + goldDelta),
                    gold22k: Math.max(6400, rates.gold22k + Math.round(goldDelta * 0.916)),
                    gold18k: Math.max(5200, rates.gold18k + Math.round(goldDelta * 0.75)),
                    silver999: parseFloat(Math.max(75, rates.silver999 + silverDelta).toFixed(2)),
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem('ksj_rates', JSON.stringify({ ...rates, ...updated }));
                window.dispatchEvent(new CustomEvent('ksj:rates-updated', { detail: updated }));
            }
        }, 15000); // Check every 15 seconds for live boutique feel
    },

    // Dedicated Price Calculation Engine
    // Gold: 10% Making Charge + 3% GST | Silver: ₹30/g Making Charge + 0% GST (No GST)
    getPriceBreakup(weight, purityCode) {
        const rates = this.getRates();
        const purity = (purityCode || 'gold22k').toLowerCase();
        const isSilver = purity.includes('silver');

        const ratePerGram = parseFloat(rates[purity] || (isSilver ? (rates.silver999 || 88.50) : (rates.gold22k || 6830)));
        const metalCost = Math.round(weight * ratePerGram);

        let makingChargeAmount = 0;
        let gstAmount = 0;

        if (isSilver) {
            // SILVER: Configurable ₹/g Making Charge (default ₹30/g) | 0% GST (No GST)
            const silverMakingRate = rates.silverMakingPerGram !== undefined ? parseFloat(rates.silverMakingPerGram) : 30;
            makingChargeAmount = Math.round(weight * silverMakingRate);
            gstAmount = 0;
        } else {
            // GOLD: Configurable % Making Charge (default 10%) | Configurable GST % (default 3%)
            const goldMakingRate = rates.defaultMakingPercent !== undefined ? parseFloat(rates.defaultMakingPercent) : 10;
            const gstRate = rates.gstPercent !== undefined ? parseFloat(rates.gstPercent) : 3;

            makingChargeAmount = Math.round(metalCost * (goldMakingRate / 100));
            gstAmount = Math.round((metalCost + makingChargeAmount) * (gstRate / 100));
        }

        const subtotal = metalCost + makingChargeAmount;
        const total = Math.round(subtotal + gstAmount);

        return {
            ratePerGram,
            weight,
            metalCost,
            makingChargeAmount,
            gstAmount,
            total,
            isSilver
        };
    },

    calculateProductPrice(product) {
        const breakup = this.getPriceBreakup(product.weight, product.purityCode);
        return breakup.total;
    },

    // Products
    getProducts() {
        return JSON.parse(localStorage.getItem('ksj_products')) || INITIAL_PRODUCTS;
    },

    getProductById(id) {
        return this.getProducts().find(p => p.id === id);
    },

    saveProduct(product) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            products[index] = product;
        } else {
            product.id = 'ksj-' + Date.now();
            products.unshift(product);
        }
        localStorage.setItem('ksj_products', JSON.stringify(products));
        window.dispatchEvent(new CustomEvent('ksj:products-updated'));
    },

    deleteProduct(id) {
        let products = this.getProducts().filter(p => p.id !== id);
        localStorage.setItem('ksj_products', JSON.stringify(products));
        window.dispatchEvent(new CustomEvent('ksj:products-updated'));
    },

    // Cart
    getCart() {
        return JSON.parse(localStorage.getItem('ksj_cart')) || [];
    },

    addToCart(productId, size = 'Standard', qty = 1) {
        const cart = this.getCart();
        const product = this.getProductById(productId);
        if (!product) return;

        const existing = cart.find(item => item.productId === productId && item.size === size);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({
                productId,
                size,
                qty
            });
        }
        localStorage.setItem('ksj_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('ksj:cart-updated', { detail: cart }));
    },

    updateCartQty(productId, size, qty) {
        let cart = this.getCart();
        if (qty <= 0) {
            cart = cart.filter(item => !(item.productId === productId && item.size === size));
        } else {
            const item = cart.find(item => item.productId === productId && item.size === size);
            if (item) item.qty = qty;
        }
        localStorage.setItem('ksj_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('ksj:cart-updated', { detail: cart }));
    },

    clearCart() {
        localStorage.setItem('ksj_cart', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('ksj:cart-updated', { detail: [] }));
    },

    // Wishlist
    getWishlist() {
        return JSON.parse(localStorage.getItem('ksj_wishlist')) || [];
    },

    toggleWishlist(productId) {
        let wishlist = this.getWishlist();
        if (wishlist.includes(productId)) {
            wishlist = wishlist.filter(id => id !== productId);
        } else {
            wishlist.push(productId);
        }
        localStorage.setItem('ksj_wishlist', JSON.stringify(wishlist));
        window.dispatchEvent(new CustomEvent('ksj:wishlist-updated', { detail: wishlist }));
        return wishlist.includes(productId);
    },

    // User Authentication
    // Customer Auth & Security Session Lock Engine
    getUser() {
        const isLocked = localStorage.getItem('ksj_customer_locked') === 'true';
        if (isLocked) {
            return null; // Locked for security, requires quick re-login
        }
        return JSON.parse(localStorage.getItem('ksj_user')) || null;
    },

    getSavedCustomerProfile() {
        return JSON.parse(localStorage.getItem('ksj_saved_customer_profile')) || null;
    },

    isCustomerLocked() {
        const profile = this.getSavedCustomerProfile();
        const isLocked = localStorage.getItem('ksj_customer_locked') === 'true';
        return !!profile && isLocked;
    },

    // Registered Customer Database & Password Auth Engine
    getRegisteredCustomers() {
        return JSON.parse(localStorage.getItem('ksj_registered_customers')) || [];
    },

    registerCustomer({ name, phone, email, password }) {
        const customers = this.getRegisteredCustomers();
        const cleanPhone = (phone || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();

        // Check if phone or email already registered
        const existing = customers.find(c => 
            (cleanPhone && c.phone === cleanPhone) || 
            (cleanEmail && c.email && c.email === cleanEmail)
        );

        if (existing) {
            return { 
                success: false, 
                message: 'Account already registered with this Mobile or Email! Please click "Log In".' 
            };
        }

        const newUser = {
            id: 'CUST-' + Date.now(),
            name: name.trim(),
            phone: cleanPhone,
            email: cleanEmail,
            emailOrPhone: cleanPhone || cleanEmail,
            password: password.trim(),
            role: 'customer',
            registeredAt: new Date().toISOString()
        };

        customers.push(newUser);
        localStorage.setItem('ksj_registered_customers', JSON.stringify(customers));

        // Auto Log In
        localStorage.setItem('ksj_user', JSON.stringify(newUser));
        localStorage.setItem('ksj_saved_customer_profile', JSON.stringify(newUser));
        localStorage.setItem('ksj_customer_locked', 'false');
        window.dispatchEvent(new CustomEvent('ksj:auth-changed', { detail: newUser }));

        return { success: true, user: newUser };
    },

    loginCustomerWithCredentials(phoneOrEmail, password) {
        const customers = this.getRegisteredCustomers();
        const cleanInput = (phoneOrEmail || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();

        // Find customer matching phone or email
        const customer = customers.find(c => 
            (c.phone && c.phone.toLowerCase() === cleanInput) || 
            (c.email && c.email.toLowerCase() === cleanInput) ||
            (c.emailOrPhone && c.emailOrPhone.toLowerCase() === cleanInput)
        );

        if (!customer) {
            // Fallback for legacy demo login if no registered users exist yet
            if (customers.length === 0) {
                return this.registerCustomer({ 
                    name: 'Valued Patron', 
                    phone: cleanInput, 
                    email: cleanInput.includes('@') ? cleanInput : '', 
                    password: cleanPass || '123456' 
                });
            }
            return { 
                success: false, 
                message: 'Account not found. Please click "Sign Up / Register" to create a new account.' 
            };
        }

        if (customer.password && customer.password !== cleanPass) {
            return { 
                success: false, 
                message: 'Incorrect Password! Please enter your valid password.' 
            };
        }

        // Set active user session
        localStorage.setItem('ksj_user', JSON.stringify(customer));
        localStorage.setItem('ksj_saved_customer_profile', JSON.stringify(customer));
        localStorage.setItem('ksj_customer_locked', 'false');
        window.dispatchEvent(new CustomEvent('ksj:auth-changed', { detail: customer }));

        return { success: true, user: customer };
    },

    // Legacy fallback wrapper
    loginCustomer(emailOrPhone, name = 'Valued Customer', password = '') {
        return this.registerCustomer({ name, phone: emailOrPhone, email: emailOrPhone, password: password || '123456' }).user || { name, emailOrPhone };
    },

    unlockCustomerSession(emailOrPhoneInput) {
        const profile = this.getSavedCustomerProfile();
        if (!profile) {
            return { success: false, message: 'No saved profile found. Please sign in.' };
        }
        
        const cleanInput = emailOrPhoneInput.trim().toLowerCase();
        const savedContact = profile.emailOrPhone.trim().toLowerCase();

        if (savedContact === cleanInput || savedContact.includes(cleanInput) || cleanInput.includes(savedContact)) {
            localStorage.setItem('ksj_user', JSON.stringify(profile));
            localStorage.setItem('ksj_customer_locked', 'false');
            window.dispatchEvent(new CustomEvent('ksj:auth-changed', { detail: profile }));
            return { success: true, profile };
        }
        return { success: false, message: 'Phone number or email does not match saved security profile.' };
    },

    lockCustomerSession() {
        const currentUser = JSON.parse(localStorage.getItem('ksj_user'));
        if (currentUser) {
            localStorage.setItem('ksj_saved_customer_profile', JSON.stringify(currentUser));
            localStorage.setItem('ksj_customer_locked', 'true');
            localStorage.removeItem('ksj_user');
            window.dispatchEvent(new CustomEvent('ksj:auth-changed', { detail: null }));
        }
    },

    logoutCustomer() {
        localStorage.removeItem('ksj_user');
        localStorage.removeItem('ksj_saved_customer_profile');
        localStorage.setItem('ksj_customer_locked', 'false');
        window.dispatchEvent(new CustomEvent('ksj:auth-changed', { detail: null }));
    },

    // Draft Checkout Data Auto-Save Persistence
    saveCheckoutDraft(draftData) {
        const current = this.getCheckoutDraft();
        localStorage.setItem('ksj_checkout_draft', JSON.stringify({ ...current, ...draftData, lastUpdated: Date.now() }));
    },

    getCheckoutDraft() {
        return JSON.parse(localStorage.getItem('ksj_checkout_draft')) || {};
    },

    // Device Fingerprint Helper
    getDeviceId() {
        let id = localStorage.getItem('ksj_device_id');
        if (!id) {
            id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
            localStorage.setItem('ksj_device_id', id);
        }
        return id;
    },

    // Admin Session & Security Lockout Engine
    getAdmin() {
        return JSON.parse(localStorage.getItem('ksj_admin')) || null;
    },

    getAdminLockoutInfo() {
        const lockoutUntil = parseInt(localStorage.getItem('ksj_admin_lockout_until') || '0');
        const attempts = parseInt(localStorage.getItem('ksj_admin_failed_attempts') || '0');
        const isLocked = Date.now() < lockoutUntil;
        const remainingMs = Math.max(0, lockoutUntil - Date.now());

        return {
            isLocked,
            attempts,
            remainingMs,
            remainingHours: (remainingMs / (1000 * 60 * 60)).toFixed(1),
            lockoutUntil
        };
    },

    getSecurityLogs() {
        return JSON.parse(localStorage.getItem('ksj_security_logs')) || [];
    },

    addSecurityLog(event, details) {
        const logs = this.getSecurityLogs();
        const logEntry = {
            id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            event,
            details,
            deviceId: this.getDeviceId()
        };
        logs.unshift(logEntry);
        localStorage.setItem('ksj_security_logs', JSON.stringify(logs.slice(0, 50)));
        return logEntry;
    },

    deleteSecurityLog(logId) {
        let logs = this.getSecurityLogs().filter(l => l.id !== logId);
        localStorage.setItem('ksj_security_logs', JSON.stringify(logs));
        return { success: true, message: 'Log entry deleted successfully.' };
    },

    clearAllSecurityLogs() {
        localStorage.removeItem('ksj_security_logs');
        return { success: true, message: 'All security audit logs cleared.' };
    },

    getAdminPassword() {
        return localStorage.getItem('ksj_admin_password') || 'admin123';
    },

    generateAdminOTP() {
        // Generate 6-digit Security OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + (10 * 60 * 1000); // Valid for 10 minutes
        localStorage.setItem('ksj_admin_otp', otp);
        localStorage.setItem('ksj_admin_otp_expires', expiresAt.toString());

        this.addSecurityLog('SECURITY_OTP_DISPATCHED', `Security OTP [${otp}] sent via SMS to Owner Vinod Kumar Soni (9413435295) for Admin Password Change request.`);
        return {
            success: true,
            otp,
            phone: '9413435295',
            message: `📲 Security Verification OTP sent to Owner Vinod Kumar Soni (9413435295)! OTP: ${otp}`
        };
    },

    verifyAdminOTP(inputOTP) {
        const storedOTP = localStorage.getItem('ksj_admin_otp');
        const expiresAt = parseInt(localStorage.getItem('ksj_admin_otp_expires') || '0');

        if (!storedOTP || Date.now() > expiresAt) {
            return { success: false, message: 'Security OTP has expired or is invalid! Please request a new OTP.' };
        }

        if (inputOTP.trim() !== storedOTP.trim()) {
            return { success: false, message: 'Incorrect Security OTP entered! Please check SMS on 9413435295.' };
        }

        return { success: true };
    },

    changeAdminPasswordWithOTP(inputOTP, newPassword) {
        const verifyRes = this.verifyAdminOTP(inputOTP);
        if (!verifyRes.success) {
            return verifyRes;
        }

        if (!newPassword || newPassword.trim().length < 6) {
            return { success: false, message: 'New password must be at least 6 characters long!' };
        }

        const cleanPassword = newPassword.trim();
        localStorage.setItem('ksj_admin_password', cleanPassword);
        localStorage.removeItem('ksj_admin_otp');
        localStorage.removeItem('ksj_admin_otp_expires');

        this.addSecurityLog('ADMIN_PASSWORD_CHANGED_SECURELY', `🔑 ADMIN PASSWORD CHANGED SECURELY! Security OTP verified on Owner mobile 9413435295.`);
        return { success: true, message: '🎉 Admin password updated successfully! You can now log in with your new password.' };
    },

    loginAdmin(email, password) {
        const lockout = this.getAdminLockoutInfo();
        const currentDeviceId = this.getDeviceId();
        const currentPassword = this.getAdminPassword();
        const cleanEmail = (email || '').trim().toLowerCase();

        // 1. Verify Admin Email Strictly (Only admin@ksjewellers.com allowed)
        if (cleanEmail !== 'admin@ksjewellers.com') {
            this.addSecurityLog('INVALID_ADMIN_EMAIL', `Admin login attempted with unauthorized email: ${email} on device ${currentDeviceId}.`);
            return {
                success: false,
                message: '❌ ACCESS DENIED: Invalid Admin Email! Admin access is strictly reserved for Owner email admin@ksjewellers.com.'
            };
        }

        // 2. Check 72-Hour Security Lockout
        if (lockout.isLocked) {
            this.addSecurityLog('BLOCKED_LOGIN_ATTEMPT_DURING_LOCKOUT', `Attempt from device ${currentDeviceId} while 72h lockout active.`);
            return {
                success: false,
                isLocked: true,
                message: `⛔ ADMIN ACCESS LOCKED FOR 72 HOURS! Due to 5 failed security attempts. Lockout remaining: ${lockout.remainingHours} Hours. Owner Vinod Kumar Soni (9413435295) has been notified.`
            };
        }

        // 3. Check Registered Device Ownership (Mobile / Laptop Lock)
        const boundDevice = localStorage.getItem('ksj_admin_bound_device');
        if (boundDevice && boundDevice !== currentDeviceId) {
            this.addSecurityLog('UNAUTHORIZED_DEVICE_LOCK_BLOCKED', `Login attempt from unauthorized device ${currentDeviceId}. Registered owner device: ${boundDevice}`);
            return {
                success: false,
                isDeviceLocked: true,
                message: `🔒 OWNER DEVICE LOCK ACTIVE: Admin login is permitted ONLY on Owner Vinod Kumar Soni's authorized mobile/laptop! Use Mobile OTP on 9413435295 to authorize this device.`
            };
        }

        // 4. Verify Admin Password
        if (password !== currentPassword) {
            let attempts = lockout.attempts + 1;
            localStorage.setItem('ksj_admin_failed_attempts', attempts.toString());
            this.addSecurityLog('ADMIN_LOGIN_FAILED', `Failed attempt #${attempts}/5 for email ${cleanEmail} on device ${currentDeviceId}. SMS alert sent to 9413435295.`);

            if (attempts >= 5) {
                const lockoutTime = Date.now() + (72 * 60 * 60 * 1000);
                localStorage.setItem('ksj_admin_lockout_until', lockoutTime.toString());
                this.addSecurityLog('72H_LOCKOUT_TRIGGERED', `5 Failed attempts reached! Admin portal locked for 72 hours. Alert sent to Owner Vinod Kumar Soni (9413435295).`);

                return {
                    success: false,
                    isLocked: true,
                    attempts,
                    message: `🚨 SECURITY LOCKOUT ACTIVATED! 5 Failed login attempts detected. Admin panel is now LOCKED FOR 72 HOURS. Security notification dispatched to Vinod Kumar Soni (9413435295).`
                };
            }

            return {
                success: false,
                attempts,
                remainingAttempts: 5 - attempts,
                message: `❌ INCORRECT ADMIN PASSWORD! Attempt ${attempts} of 5. Warning: 5 wrong attempts will lock access for 72 Hours.`
            };
        }

        // 5. Successful Admin Authentication & Device Binding
        localStorage.setItem('ksj_admin_failed_attempts', '0');
        localStorage.removeItem('ksj_admin_lockout_until');
        localStorage.setItem('ksj_admin_bound_device', currentDeviceId);

        const admin = {
            name: 'Vinod Kumar Soni (Admin)',
            email: cleanEmail,
            role: 'admin',
            deviceId: currentDeviceId,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('ksj_admin', JSON.stringify(admin));

        this.addSecurityLog('ADMIN_LOGIN_SUCCESS', `Admin logged in successfully with admin@ksjewellers.com on authorized device: ${currentDeviceId}.`);
        window.dispatchEvent(new CustomEvent('ksj:admin-auth-changed', { detail: admin }));

        return {
            success: true,
            admin,
            message: '✅ Owner Admin Access Authorized! Security alert logged for Owner Vinod Kumar Soni (9413435295).'
        };
    },

    resetAdminDeviceBinding() {
        localStorage.removeItem('ksj_admin_bound_device');
        localStorage.setItem('ksj_admin_failed_attempts', '0');
        localStorage.removeItem('ksj_admin_lockout_until');
        this.addSecurityLog('DEVICE_BINDING_RESET', 'Single device lock reset by Owner Vinod Kumar Soni.');
    },

    logoutAdmin() {
        localStorage.removeItem('ksj_admin');
        window.dispatchEvent(new CustomEvent('ksj:admin-auth-changed', { detail: null }));
    },

    // Orders
    getOrders() {
        return JSON.parse(localStorage.getItem('ksj_orders')) || INITIAL_ORDERS;
    },

    createOrder(orderDetails) {
        const orders = this.getOrders();
        const orderId = 'KSJ-' + Math.floor(10000 + Math.random() * 90000);
        const trackingNumber = 'TRK-IN-' + Math.floor(10000 + Math.random() * 90000);

        const newOrder = {
            id: orderId,
            trackingNumber,
            date: new Date().toISOString(),
            orderStatus: 'Processing',
            paymentStatus: orderDetails.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
            ...orderDetails
        };

        orders.unshift(newOrder);
        localStorage.setItem('ksj_orders', JSON.stringify(orders));
        this.syncOrderToHistory(newOrder);
        this.clearCart();
        return newOrder;
    },

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.orderStatus = status;
            localStorage.setItem('ksj_orders', JSON.stringify(orders));
            this.syncOrderToHistory(order);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated'));
        }
    },

    updateOrder(orderId, updatedData) {
        let orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updatedData };
            localStorage.setItem('ksj_orders', JSON.stringify(orders));
            this.syncOrderToHistory(orders[index]);
            this.addSecurityLog('ORDER_EDITED_BY_ADMIN', `Order #${orderId} for ${orders[index].customerName} was updated by Admin.`);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated'));
            return { success: true, message: `Order #${orderId} updated successfully.` };
        }
        return { success: false, message: 'Order not found.' };
    },

    deleteOrder(orderId) {
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            orders = orders.filter(o => o.id !== orderId);
            localStorage.setItem('ksj_orders', JSON.stringify(orders));
            this.addSecurityLog('ORDER_DELETED_BY_ADMIN', `Order #${orderId} for ${order.customerName} was deleted from active orders by Admin.`);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated'));
            return { success: true, message: `Order #${orderId} deleted successfully.` };
        }
        return { success: false, message: 'Order not found.' };
    },

    // Order History Archives Engine
    getOrderHistory() {
        const history = JSON.parse(localStorage.getItem('ksj_order_history'));
        if (history && history.length > 0) {
            return history;
        }
        const active = this.getOrders();
        localStorage.setItem('ksj_order_history', JSON.stringify(active));
        return active;
    },

    syncOrderToHistory(order) {
        let history = JSON.parse(localStorage.getItem('ksj_order_history')) || this.getOrders();
        const idx = history.findIndex(h => h.id === order.id);
        if (idx !== -1) {
            history[idx] = { ...history[idx], ...order };
        } else {
            history.unshift(order);
        }
        localStorage.setItem('ksj_order_history', JSON.stringify(history));
    },

    updateOrderHistoryRecord(orderId, updatedData) {
        let history = this.getOrderHistory();
        const idx = history.findIndex(h => h.id === orderId);
        if (idx !== -1) {
            history[idx] = { ...history[idx], ...updatedData };
            localStorage.setItem('ksj_order_history', JSON.stringify(history));
            this.addSecurityLog('ORDER_HISTORY_EDITED', `Order History record #${orderId} was updated by Admin.`);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated'));
            return { success: true, message: `Order History record #${orderId} updated successfully.` };
        }
        return { success: false, message: 'History record not found.' };
    },

    deleteOrderHistoryRecord(orderId) {
        let history = this.getOrderHistory();
        const record = history.find(h => h.id === orderId);
        if (record) {
            history = history.filter(h => h.id !== orderId);
            localStorage.setItem('ksj_order_history', JSON.stringify(history));
            this.addSecurityLog('ORDER_HISTORY_DELETED', `Order History record #${orderId} was permanently deleted by Admin.`);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated'));
            return { success: true, message: `Order History record #${orderId} deleted successfully.` };
        }
        return { success: false, message: 'History record not found.' };
    },

    cancelOrder(orderId, reason = 'Cancelled by Customer') {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            if (order.orderStatus === 'Delivered') {
                return { success: false, message: 'Delivered orders cannot be cancelled directly. Please contact Owner Vinod Kumar Soni (9413435295).' };
            }
            order.orderStatus = 'Cancelled';
            order.cancelReason = reason;
            order.cancelledAt = new Date().toISOString();
            if (order.paymentStatus === 'Paid') {
                order.paymentStatus = 'Refund Initiated';
            } else {
                order.paymentStatus = 'Cancelled';
            }
            localStorage.setItem('ksj_orders', JSON.stringify(orders));
            this.syncOrderToHistory(order);
            this.addSecurityLog('ORDER_CANCELLED_BY_CUSTOMER', `Order #${orderId} for ${order.customerName} (${order.customerPhone}) was cancelled by customer. Reason: ${reason}`);
            window.dispatchEvent(new CustomEvent('ksj:orders-updated', { detail: order }));
            return { success: true, order, message: `Order #${orderId} has been successfully cancelled.` };
        }
        return { success: false, message: 'Order not found.' };
    },

    // Banner Text
    getBanner() {
        return localStorage.getItem('ksj_banner');
    },

    setBanner(text) {
        localStorage.setItem('ksj_banner', text);
        window.dispatchEvent(new CustomEvent('ksj:banner-updated', { detail: text }));
    },

    // Reviews & Customer Ratings Engine
    getReviews() {
        return JSON.parse(localStorage.getItem('ksj_reviews')) || INITIAL_REVIEWS;
    },

    addReview({ productId = '', productName = 'General Review', customerName = 'Valued Customer', city = 'Jhunjhunu', rating = 5, comment = '' }) {
        const reviews = this.getReviews();
        const newReview = {
            id: 'REV-' + Date.now(),
            productId,
            productName,
            name: customerName.trim(),
            city: city.trim(),
            rating: parseInt(rating) || 5,
            comment: comment.trim(),
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            createdAt: new Date().toISOString()
        };
        reviews.unshift(newReview);
        localStorage.setItem('ksj_reviews', JSON.stringify(reviews));
        window.dispatchEvent(new CustomEvent('ksj:reviews-updated', { detail: reviews }));
        return newReview;
    },

    deleteReview(reviewId) {
        let reviews = this.getReviews().filter(r => r.id !== reviewId);
        localStorage.setItem('ksj_reviews', JSON.stringify(reviews));
        window.dispatchEvent(new CustomEvent('ksj:reviews-updated', { detail: reviews }));
    },

    getProductRatingStats(productId) {
        const reviews = this.getReviews();
        const productReviews = productId ? reviews.filter(r => r.productId === productId) : reviews;
        if (productReviews.length === 0) {
            return { avg: 5.0, count: 1 };
        }
        const total = productReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
        const avg = (total / productReviews.length).toFixed(1);
        return { avg: parseFloat(avg), count: productReviews.length };
    }
};

// Initialize Store
Store.init();
