/**
 * KS JEWELLERS AND MAKERS - INITIAL DATASTORE
 * Business: KS Jewellers and Makers
 * Owner: Vinod Kumar Soni
 * Contact: 9413435295
 * Address: B-171, Indira Nagar, Mandawa Moad, Jhunjhunu, Rajasthan
 */

const INITIAL_RATES = {
    gold24k: 7450, // per gram in INR
    gold22k: 6830, // per gram in INR
    gold18k: 5580, // per gram in INR
    silver999: 88.50, // per gram in INR
    defaultMakingPercent: 10, // Gold Making Charge in %
    silverMakingPerGram: 30, // Silver Making Charge in ₹/g
    gstPercent: 3, // Standard Govt GST in %
    lastUpdated: new Date().toISOString(),
    isAutoUpdate: true,
    isManualOverride: false
};

const CATEGORIES = [
    { id: 'all', name: 'All Collections', icon: 'sparkles' },
    { id: 'necklaces', name: 'Necklaces & Sets', icon: 'gem' },
    { id: 'rings', name: 'Rings', icon: 'circle-dot' },
    { id: 'earrings', name: 'Earrings & Jhumkas', icon: 'sun' },
    { id: 'bangles', name: 'Bangles & Kadas', icon: 'disc' },
    { id: 'bracelets', name: 'Bracelets & Anklets', icon: 'shield' },
    { id: 'pendants', name: 'Pendants', icon: 'heart' },
    { id: 'mangalsutra', name: 'Mangalsutra', icon: 'infinity' },
    { id: 'coins', name: 'Gold & Silver Coins', icon: 'coins' }
];

const INITIAL_PRODUCTS = [
    {
        id: 'ksj-100a',
        name: 'Royal Rajasthani Gold Hamel Set',
        category: 'necklaces',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 42.0,
        makingCharge: 4200,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Authentic 22K 916 BIS Hallmarked Rajasthani Hamel set. Handcrafted with 40 Years of Master Expertise by Vinod Kumar Soni in Jhunjhunu.',
        featured: true,
        inStock: true,
        stockCount: 4,
        sizes: ['Standard Adjustable Cord']
    },
    {
        id: 'ksj-100b',
        name: 'Authentic Shekhawati Gold Tevata Necklace',
        category: 'necklaces',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 36.5,
        makingCharge: 3800,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Traditional Shekhawati 22K BIS 916 Hallmarked Tevata necklace set with exquisite Kundan & ruby work. Hand-forged by Vinod Kumar Soni (40 Years Experience).',
        featured: true,
        inStock: true,
        stockCount: 5,
        sizes: ['Standard Adjustable Cord']
    },
    {
        id: 'ksj-101',
        name: 'Royal Kundan Bridal Choker Set',
        category: 'necklaces',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 48.5, // in grams
        makingCharge: 4500, // INR fixed
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Exquisite handcrafted bridal choker featuring intricate antique Kundan work, semi-precious emerald drops, and 22K 916 BIS hallmarked yellow gold. Crafted in Rajasthan by master artisans.',
        featured: true,
        inStock: true,
        stockCount: 3,
        sizes: ['Standard Adjustable Cord']
    },
    {
        id: 'ksj-102',
        name: 'Solitaire Accent Halo Diamond Ring',
        category: 'rings',
        purity: '18K Gold',
        purityCode: 'gold18k',
        weight: 5.2,
        makingCharge: 1800,
        hallmark: 'BIS 750 Hallmarked & IGI Certified',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'A timeless 18K yellow gold band crowned with a brilliant VVS-EF lab certified solitaire diamond surrounded by a delicate pave gold halo.',
        featured: true,
        inStock: true,
        stockCount: 8,
        sizes: ['12 (16.5mm)', '14 (17.3mm)', '16 (18.1mm)', '18 (18.9mm)']
    },
    {
        id: 'ksj-103',
        name: 'Vintage Nakshi Temple Work Bangle Pair',
        category: 'bangles',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 32.0,
        makingCharge: 3200,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Heavy solid 22K gold bangles featuring handcrafted divine Nakshi floral engravings. Designed for festive celebrations and heritage heirlooms.',
        featured: true,
        inStock: true,
        stockCount: 5,
        sizes: ['2.4 (Small)', '2.6 (Medium)', '2.8 (Large)']
    },
    {
        id: 'ksj-104',
        name: 'Antique Floral Jhumka Earrings with Pearls',
        category: 'earrings',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 16.8,
        makingCharge: 1900,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Traditional 22K gold Jhumkas adorned with delicate Basra seed pearl tassels and hand-carved floral studs.',
        featured: true,
        inStock: true,
        stockCount: 6,
        sizes: ['One Size']
    },
    {
        id: 'ksj-105',
        name: 'Minimalist Diamond Pendant with 18K Gold Chain',
        category: 'pendants',
        purity: '18K Gold',
        purityCode: 'gold18k',
        weight: 4.1,
        makingCharge: 1200,
        hallmark: 'BIS 750 Hallmarked',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Sleek geometric pendant suspended on an 18K solid gold box chain. Perfect for modern everyday luxury.',
        featured: false,
        inStock: true,
        stockCount: 12,
        sizes: ['16 inch chain', '18 inch chain']
    },
    {
        id: 'ksj-106',
        name: 'Traditional Royal Maharashtrian Mangalsutra',
        category: 'mangalsutra',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 14.5,
        makingCharge: 1600,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Double black bead chain featuring handcrafted 22K gold Wati pendant cup symbols. Sacred craftsmanship meeting modern durability.',
        featured: true,
        inStock: true,
        stockCount: 7,
        sizes: ['18 inch', '22 inch']
    },
    {
        id: 'ksj-107',
        name: '24K Solid Laxmi Ganesh Gold Coin (10 Grams)',
        category: 'coins',
        purity: '24K Gold',
        purityCode: 'gold24k',
        weight: 10.0,
        makingCharge: 450,
        hallmark: '999 Fine Pure Gold Certified',
        image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Tamper-proof Swiss card packed 10g 24K (999.9) pure gold coin featuring embossed Goddess Laxmi and Lord Ganesh blessing figures.',
        featured: true,
        inStock: true,
        stockCount: 25,
        sizes: ['10 Grams Standard']
    },
    {
        id: 'ksj-108',
        name: 'Layered Natural Pearl & 22K Gold Rani Haar',
        category: 'necklaces',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 28.4,
        makingCharge: 2800,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Regal multi-strand freshwater pearl necklace with solid 22K carved gold spacers and vintage side brooch motif.',
        featured: false,
        inStock: true,
        stockCount: 4,
        sizes: ['Standard Length']
    },
    {
        id: 'ksj-109',
        name: 'Lightweight Daily Wear Textured Gold Men\'s Kada',
        category: 'bracelets',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 18.2,
        makingCharge: 1700,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Sleek satin-finish 22K solid gold kada for men with inner bevel comfort fitting.',
        featured: false,
        inStock: true,
        stockCount: 9,
        sizes: ['2.6 (2.37 inch)', '2.8 (2.50 inch)']
    },
    {
        id: 'ksj-110',
        name: 'Emerald Cut Ruby & Gold Chandelier Studs',
        category: 'earrings',
        purity: '18K Gold',
        purityCode: 'gold18k',
        weight: 6.4,
        makingCharge: 1100,
        hallmark: 'BIS 750 Hallmarked',
        image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Captivating synthetic ruby centerstones set in 18K yellow gold prong settings with screw back security posts.',
        featured: false,
        inStock: true,
        stockCount: 11,
        sizes: ['Screw Back']
    },
    {
        id: 'ksj-111',
        name: 'Royal Rajputi Gold Aad Choker (Jhunjhunu Special)',
        category: 'necklaces',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 55.0,
        makingCharge: 5800,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Authentic Shekhawati Shekhawati heritage Rajputi Aad necklace crafted with pure 22K gold foil sheet work and traditional Meenakari colors.',
        featured: true,
        inStock: true,
        stockCount: 2,
        sizes: ['Standard Shekhawati Fit']
    },
    {
        id: 'ksj-112',
        name: '999 Pure Silver Auspicious Laxmi Coin (50 Grams)',
        category: 'coins',
        purity: '925 Silver',
        purityCode: 'silver999',
        weight: 50.0,
        makingCharge: 250,
        hallmark: '999 Pure Silver Certified',
        image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Pure 999 sterling silver bar/coin ideal for Diwali puja, gifting, and silver investment. Comes in velvet presentation box.',
        featured: false,
        inStock: true,
        stockCount: 30,
        sizes: ['50 Grams']
    },
    {
        id: 'ksj-113',
        name: 'Chiseled 925 Sterling Silver Bridal Payal Pair',
        category: 'bracelets',
        purity: '925 Silver',
        purityCode: 'silver999',
        weight: 85.0,
        makingCharge: 650,
        hallmark: '925 Silver Hallmarked',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Intricately handcrafted solid silver anklets with tinkling ghungroo bells and anti-tarnish protective coating.',
        featured: false,
        inStock: true,
        stockCount: 15,
        sizes: ['10 inch standard length']
    },
    {
        id: 'ksj-114',
        name: 'Rose Gold Infinity Diamond Solitaire Ring',
        category: 'rings',
        purity: '18K Gold',
        purityCode: 'gold18k',
        weight: 3.8,
        makingCharge: 950,
        hallmark: 'BIS 750 Hallmarked',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Modern 18K rose gold continuous twist infinity motif ring embellished with sparkly accent stones.',
        featured: false,
        inStock: true,
        stockCount: 10,
        sizes: ['11', '13', '15', '17']
    },
    {
        id: 'ksj-115',
        name: 'Traditional Meenakari Peacock Gold Pendant',
        category: 'pendants',
        purity: '22K Gold',
        purityCode: 'gold22k',
        weight: 9.6,
        makingCharge: 1250,
        hallmark: 'BIS 916 Hallmarked',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80'
        ],
        description: 'Colorful hand-enameled peacock design pendant in 22K gold featuring cobalt blue and ruby red enamel fill.',
        featured: false,
        inStock: true,
        stockCount: 8,
        sizes: ['Pendant Only']
    }
];

const INITIAL_REVIEWS = [
    {
        name: 'Rajesh Sharma',
        city: 'Jhunjhunu, Rajasthan',
        rating: 5,
        comment: 'Vinod Kumar Soni ji provides complete transparency in gold weight and making charges. Bought a 22K bridal set for my daughter. 100% BIS hallmarked and trusted shop!',
        date: '12 Aug 2026'
    },
    {
        name: 'Priya Kanwar',
        city: 'Jaipur, Rajasthan',
        rating: 5,
        comment: 'Ordered custom Rajputi Aad choker. The craftsmanship and gold finish were unbelievable! Online rate update and WhatsApp support made buying so easy.',
        date: '02 Aug 2026'
    },
    {
        name: 'Vikram Singh',
        city: 'Sikar, Rajasthan',
        rating: 5,
        comment: 'Best rates in Mandawa Moad area. The live gold rate tracker on website is accurate and the price breakup is clear down to the GST.',
        date: '28 Jul 2026'
    }
];

const INITIAL_ORDERS = [
    {
        id: 'KSJ-89412',
        customerName: 'Aarti Soni',
        customerPhone: '9829100000',
        customerEmail: 'aarti@example.com',
        address: 'B-42, Near Water Tank, Mandawa Moad, Jhunjhunu',
        items: [
            { id: 'ksj-104', name: 'Antique Floral Jhumka Earrings with Pearls', qty: 1, price: 118430, weight: 16.8 }
        ],
        total: 118430,
        paymentMethod: 'UPI Online',
        paymentStatus: 'Paid',
        orderStatus: 'Processing',
        date: '2026-08-20T14:30:00Z',
        trackingNumber: 'TRK-IN-98124'
    },
    {
        id: 'KSJ-89413',
        customerName: 'Mahendra Jangid',
        customerPhone: '9414000000',
        customerEmail: 'mahendra@example.com',
        address: '15, Indira Nagar, Jhunjhunu',
        items: [
            { id: 'ksj-107', name: '24K Solid Laxmi Ganesh Gold Coin (10 Grams)', qty: 2, price: 154400, weight: 20.0 }
        ],
        total: 154400,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
        orderStatus: 'Shipped',
        date: '2026-08-19T11:15:00Z',
        trackingNumber: 'TRK-IN-98125'
    }
];
