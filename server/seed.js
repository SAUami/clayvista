require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const Blog = require('./models/Blog');
const Review = require('./models/Review');
const Order = require('./models/Order');
const Inventory = require('./models/Inventory');

const sampleCategories = [
  {
    name: 'Dinner Sets',
    slug: 'dinner-sets',
    description: 'Complete heirloom dinnerware sets crafted from high-fired porcelain and stoneware.',
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 1
  },
  {
    name: 'Tea Sets',
    slug: 'tea-sets',
    description: 'Delicate fine bone china teapots, strainers, and matching cup-and-saucer sets.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 2
  },
  {
    name: 'Coffee Mugs',
    slug: 'coffee-mugs',
    description: 'Wheel-thrown artisanal mugs featuring raw stoneware textures and reactive studio glazes.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 3
  },
  {
    name: 'Bowls',
    slug: 'bowls',
    description: 'Deep ramen bowls, cereal bowls, salad bowls, and handcrafted dipping saucers.',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 4
  },
  {
    name: 'Plates',
    slug: 'plates',
    description: 'Minimalist dinner plates, salad plates, and dessert platters with organic rim details.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 5
  },
  {
    name: 'Cups',
    slug: 'cups',
    description: 'Espresso cups, handle-less chawan tea cups, and tumblers in earthy natural clays.',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 6
  },
  {
    name: 'Serving Trays',
    slug: 'serving-trays',
    description: 'Large ceramic centerpieces, oval sharing platters, and grazing trays for entertaining.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 7
  },
  {
    name: 'Kitchen Accessories',
    slug: 'kitchen-accessories',
    description: 'Ceramic utensil crocks, olive oil pourers, butter bells, and salt cellars.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 8
  },
  {
    name: 'Ceramic Decor',
    slug: 'ceramic-decor',
    description: 'Sculptural vases, botanical planters, and incense holders celebrating raw earth.',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 9
  },
  {
    name: 'Gift Collection',
    slug: 'gift-collection',
    description: 'Curated gift hampers in custom wood boxes, perfect for weddings and housewarmings.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80',
    displayOrder: 10
  }
];

const sampleProducts = [
  {
    name: 'Aura Matte Charcoal 16-Piece Dinner Set',
    slug: 'aura-matte-charcoal-16-piece-dinner-set',
    sku: 'CV-DS-101',
    shortDescription: 'Modern Nordic 16-piece dinner set with tactile satin-matte glaze and undulating rims.',
    description: 'The Aura Dinner Set transforms every dinner table into a high-end Michelin dining setting. Fired at 1280°C in atmospheric kilns, each plate features a subtle dark charcoal finish that allows vibrant food colors to pop. Includes 4 Dinner Plates, 4 Salad Plates, 4 Soup/Grain Bowls, and 4 Tumblers.',
    categorySlug: 'dinner-sets',
    price: 8499,
    discountPrice: 6999,
    stock: 24,
    material: 'Stoneware',
    color: 'Charcoal Black',
    finish: 'Matte Glaze',
    size: '16-Piece Set',
    dimensions: { height: 'Varies', diameter: '27 cm Dinner Plate', capacity: '550 ml Bowls', weight: '7.8 kg Total' },
    weight: '7.8 kg',
    images: [
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.9, count: 48 },
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: false,
    tags: ['dinner set', 'stoneware', 'charcoal', 'luxury tableware']
  },
  {
    name: 'Terracotta Dawn Artisan Tea Set with Infuser',
    slug: 'terracotta-dawn-artisan-tea-set',
    sku: 'CV-TS-202',
    shortDescription: 'Raw terracotta exterior with smooth cream glazed interior teapot and 4 teacups.',
    description: 'Inspired by age-old Indian earthen pottery and contemporary Scandinavian aesthetics, this tea set celebrates the tactile warmth of red terracotta clay while keeping functional surfaces sealed with food-safe porcelain glaze. Includes 850ml teapot with built-in stainless infuser and 4 handleless tasting cups.',
    categorySlug: 'tea-sets',
    price: 3499,
    discountPrice: 2899,
    stock: 18,
    material: 'Terracotta',
    color: 'Terracotta',
    finish: 'Raw Speckled',
    size: '5-Piece Set',
    dimensions: { height: '14 cm', diameter: '16 cm', capacity: '850 ml', weight: '1.9 kg' },
    weight: '1.9 kg',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.8, count: 32 },
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isNewArrival: true,
    tags: ['tea set', 'terracotta', 'artisanal', 'teapot']
  },
  {
    name: 'Kyoto Speckled Stoneware Coffee Mug (Set of 2)',
    slug: 'kyoto-speckled-stoneware-coffee-mug-pair',
    sku: 'CV-MG-303',
    shortDescription: 'Comfortable oversized ceramic mugs with natural iron flecks and ergonomic thumb rest.',
    description: 'Every Kyoto mug is hand-thrown on the potter’s wheel and finished with natural mineral-flecked cream glaze. Designed specifically for coffee purists and slow morning rituals, it keeps beverages hot longer due to thick stoneware walls. Holds 380ml comfortably.',
    categorySlug: 'coffee-mugs',
    price: 1499,
    discountPrice: 1199,
    stock: 45,
    material: 'Stoneware',
    color: 'Ivory White',
    finish: 'Raw Speckled',
    size: 'Pair (2 Mugs)',
    dimensions: { height: '9.5 cm', diameter: '8.8 cm', capacity: '380 ml', weight: '780g (Pair)' },
    weight: '780g',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 5.0, count: 87 },
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: false,
    tags: ['coffee mug', 'ceramic mug', 'stoneware', 'gift idea']
  },
  {
    name: 'Nordic Forest Deep Ceramic Ramen Bowl (Set of 2)',
    slug: 'nordic-forest-deep-ceramic-ramen-bowl-pair',
    sku: 'CV-BW-404',
    shortDescription: 'Deep curved stoneware bowls in reactive forest glaze with chopsticks notches.',
    description: 'Generously proportioned for noodle broths, hearty poke bowls, and grain salads. The rich reactive moss-green glaze transitions into deep emerald pooling at the bottom of the bowl. Highly scratch-resistant and thermal shock certified.',
    categorySlug: 'bowls',
    price: 1899,
    discountPrice: 1499,
    stock: 22,
    material: 'Ceramic',
    color: 'Sage Green',
    finish: 'Glossy Glaze',
    size: 'Pair (2 Bowls)',
    dimensions: { height: '9 cm', diameter: '20 cm', capacity: '950 ml', weight: '1.4 kg' },
    weight: '1.4 kg',
    images: [
      'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.7, count: 29 },
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: true,
    tags: ['ramen bowl', 'bowls', 'green ceramic', 'dining']
  },
  {
    name: 'Imperial Bone China Gilded 24-Piece Royal Dinner Set',
    slug: 'imperial-bone-china-gilded-24-piece-royal-dinner-set',
    sku: 'CV-DS-505',
    shortDescription: 'Translucent fine bone china accented with hand-applied 24K real gold rim lustre.',
    description: 'The pinnacle of luxury porcelain craftsmanship. Made from ultra-refined bone ash formulation that imparts exceptional translucency, high chip resistance, and feather-light elegance. Hand-painted with 24K pure gold delicate borders. Hand washing recommended for gold preservation.',
    categorySlug: 'dinner-sets',
    price: 24999,
    discountPrice: 19999,
    stock: 8,
    lowStockThreshold: 3,
    material: 'Bone China',
    color: 'Ivory White',
    finish: 'Glossy Glaze',
    size: '24-Piece Set',
    dimensions: { height: 'Various', diameter: '28 cm Master Plate', capacity: 'Various', weight: '11.5 kg Total' },
    weight: '11.5 kg',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 5.0, count: 19 },
    isFeatured: true,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: true,
    tags: ['bone china', 'luxury collection', 'royal dinner set', 'gold rim']
  },
  {
    name: 'Artisan Wave Scalloped Ceramic Serving Platter',
    slug: 'artisan-wave-scalloped-ceramic-serving-platter',
    sku: 'CV-TR-606',
    shortDescription: 'Organic fluted edge serving dish for roasted dishes, breads, and mezze feasts.',
    description: 'Hand-sculpted wave perimeter that catches the light beautifully on festive table settings. Perfect as a centrepiece dish for Thanksgiving, Diwali feasts, or weekend brunches. Oven safe up to 230°C.',
    categorySlug: 'serving-trays',
    price: 2299,
    discountPrice: 1799,
    stock: 15,
    material: 'Porcelain',
    color: 'Ivory White',
    finish: 'Satin Smooth',
    size: 'Large (36 cm)',
    dimensions: { height: '4 cm', diameter: '36 cm length', capacity: 'N/A', weight: '1.2 kg' },
    weight: '1.2 kg',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.8, count: 14 },
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: false,
    tags: ['serving platter', 'tray', 'entertaining', 'porcelain']
  },
  {
    name: 'Wabi-Sabi Hand-Carved Espresso Cups (Set of 4)',
    slug: 'wabi-sabi-hand-carved-espresso-cups-set-of-4',
    sku: 'CV-CP-707',
    shortDescription: 'Delightful 90ml tactile demitasse cups with fluted thumb facets.',
    description: 'Celebrate the Japanese philosophy of finding beauty in natural imperfections. Each cup is carved freehand before bisque firing, ensuring subtle individuality across the quartet. Beautifully stacked in a minimalist presentation box.',
    categorySlug: 'cups',
    price: 1599,
    discountPrice: 1299,
    stock: 30,
    material: 'Ceramic',
    color: 'Earthy Sand',
    finish: 'Hand-Carved',
    size: '4-Piece Set',
    dimensions: { height: '6 cm', diameter: '5.5 cm', capacity: '90 ml', weight: '540g Total' },
    weight: '540g',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.9, count: 38 },
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isNewArrival: true,
    tags: ['espresso', 'cups', 'ceramic', 'gift set']
  },
  {
    name: 'Minimalist Ceramic Oil Cruet & Vinegar Decanter',
    slug: 'minimalist-ceramic-oil-cruet-vinegar-decanter',
    sku: 'CV-KA-808',
    shortDescription: 'Pair of matte glaze dispensers with non-drip stainless weighted spouts.',
    description: 'Keep your countertop organized and elegant. The opaque ceramic protects cold-pressed olive oils and balsamic vinegars from light oxidation. Dishwasher safe body with easily removable silicone stopper pourer.',
    categorySlug: 'kitchen-accessories',
    price: 1699,
    discountPrice: 1399,
    stock: 19,
    material: 'Stoneware',
    color: 'Ivory White',
    finish: 'Matte Glaze',
    size: 'Pair (2 Cruets)',
    dimensions: { height: '18 cm', diameter: '7 cm', capacity: '450 ml each', weight: '890g' },
    weight: '890g',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: false,
    ratings: { average: 4.6, count: 18 },
    isFeatured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    tags: ['kitchen accessories', 'oil dispenser', 'stoneware']
  },
  {
    name: 'Fluted Ceramic Statement Vase in Raw Ochre',
    slug: 'fluted-ceramic-statement-vase-raw-ochre',
    sku: 'CV-DC-909',
    shortDescription: 'Sculptural architectural vase suitable for dried florals or fresh botanicals.',
    description: 'A striking focal piece for console tables and dinner spreads. The natural terracotta ochre is left unglazed on the exterior to preserve natural earthy touch while the interior is watertight glazed.',
    categorySlug: 'ceramic-decor',
    price: 2799,
    discountPrice: 2299,
    stock: 12,
    material: 'Terracotta',
    color: 'Terracotta',
    finish: 'Raw Speckled',
    size: '28 cm Tall',
    dimensions: { height: '28 cm', diameter: '14 cm', capacity: '1.8 L', weight: '1.6 kg' },
    weight: '1.6 kg',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.8, count: 21 },
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isNewArrival: true,
    tags: ['vase', 'decor', 'terracotta', 'living room']
  },
  {
    name: 'The Connoisseur Luxury Dinnerware Gift Hamper',
    slug: 'the-connoisseur-luxury-dinnerware-gift-hamper',
    sku: 'CV-GF-1010',
    shortDescription: 'Handmade wooden keepsake box with 2 artisanal mugs, 2 dessert plates, and artisan tea canister.',
    description: 'The ultimate bespoke wedding or housewarming gift. Features a hand-curated pair of Kyoto stoneware mugs, two wave dessert plates, ceramic honey pot with brass dipper, and premium whole-leaf Darjeeling tea packaged in raw linen.',
    categorySlug: 'gift-collection',
    price: 4999,
    discountPrice: 4299,
    stock: 14,
    material: 'Porcelain',
    color: 'Ivory White',
    finish: 'Satin Smooth',
    size: 'Luxury Hamper',
    dimensions: { height: '15 cm', diameter: '35 x 25 cm Box', capacity: 'N/A', weight: '3.4 kg' },
    weight: '3.4 kg',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 5.0, count: 27 },
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: false,
    tags: ['gift hamper', 'luxury', 'wedding gift', 'box set']
  },
  {
    name: 'Kyoto Hand-Carved Matcha Chawan Bowl',
    slug: 'kyoto-hand-carved-matcha-chawan-bowl',
    sku: 'CV-MC-1111',
    shortDescription: 'Traditional ceremonial tea ceremony whisking bowl with textured grip.',
    description: 'Designed in the spirit of traditional chanoyu tea culture. Wide rim allows the bamboo chasen to froth ceremonial grade matcha effortlessly, while the organic foot ring insulates hands from heat.',
    categorySlug: 'bowls',
    price: 1999,
    discountPrice: 1599,
    stock: 20,
    material: 'Ceramic',
    color: 'Sage Green',
    finish: 'Hand-Carved',
    size: 'Standard (450 ml)',
    dimensions: { height: '7.5 cm', diameter: '12.5 cm', capacity: '450 ml', weight: '420g' },
    weight: '420g',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.9, count: 16 },
    isFeatured: false,
    isBestSeller: true,
    isTrending: false,
    isNewArrival: true,
    tags: ['matcha bowl', 'chawan', 'japanese ceramics']
  },
  {
    name: 'Royal Cobalt & 24K Gold Bone China Teacup & Saucer',
    slug: 'royal-cobalt-24k-gold-bone-china-teacup-saucer',
    sku: 'CV-TC-1212',
    shortDescription: 'Ultra-thin translucent bone china cup and saucer with rich lapis lazuli glaze and pure gold filigree.',
    description: 'A regal teatime experience. The bone china formulation yields remarkable resonance and feather-light touch. Hand-burnished gold handle and filigree detailing.',
    categorySlug: 'tea-sets',
    price: 2499,
    discountPrice: 1999,
    stock: 16,
    material: 'Bone China',
    color: 'Cobalt Blue',
    finish: 'Glossy Glaze',
    size: 'Cup & Saucer Duo',
    dimensions: { height: '6.5 cm Cup', diameter: '15 cm Saucer', capacity: '220 ml', weight: '360g' },
    weight: '360g',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 5.0, count: 23 },
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isNewArrival: false,
    tags: ['bone china', 'teacup', 'gold filigree', 'royal']
  },
  {
    name: 'Satin Clay Artisan Terracotta Tumblers (Set of 4)',
    slug: 'satin-clay-artisan-terracotta-tumblers-set-of-4',
    sku: 'CV-TM-1313',
    shortDescription: 'Naturally cooling unglazed outer earthen tumblers for water, lassi, or mulled wines.',
    description: 'Reviving centuries-old Indian kulhad pottery into refined, durable modern tumblers. The exterior showcases rich raw terracotta clay while the inside is sealed with satin-smooth food-grade transparent glaze.',
    categorySlug: 'cups',
    price: 1399,
    discountPrice: 1099,
    stock: 35,
    material: 'Terracotta',
    color: 'Terracotta',
    finish: 'Raw Speckled',
    size: '4-Piece Set',
    dimensions: { height: '10 cm', diameter: '7 cm', capacity: '300 ml each', weight: '900g Total' },
    weight: '900g',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.8, count: 42 },
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    isNewArrival: true,
    tags: ['tumblers', 'terracotta cups', 'kulhad', 'sustainable']
  },
  {
    name: 'Artisan Ribbed Ceramic Botanical Planter with Saucer',
    slug: 'artisan-ribbed-ceramic-botanical-planter-saucer',
    sku: 'CV-PL-1414',
    shortDescription: 'Architectural ribbed stoneware indoor planter with drainage hole and matching drip saucer.',
    description: 'Elevate houseplants with sculptural earthen elegance. The matte stoneware finish balances lush green foliage, while the matching drainage dish protects polished wood furniture.',
    categorySlug: 'ceramic-decor',
    price: 2199,
    discountPrice: 1799,
    stock: 25,
    material: 'Stoneware',
    color: 'Ivory White',
    finish: 'Matte Glaze',
    size: 'Medium (18 cm)',
    dimensions: { height: '18 cm', diameter: '18 cm', capacity: '3.2 L', weight: '1.8 kg' },
    weight: '1.8 kg',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: true,
    ratings: { average: 4.7, count: 19 },
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    isNewArrival: false,
    tags: ['planter', 'decor', 'ceramic planter', 'living room']
  },
  {
    name: 'French Traditional Stoneware Butter Keeper (Butter Bell)',
    slug: 'french-traditional-stoneware-butter-keeper-bell',
    sku: 'CV-BB-1515',
    shortDescription: 'Keeps butter soft, spreadable, and naturally fresh on countertops using water seal technology.',
    description: 'No more tearing morning toast with cold refrigerated butter. Pack softened butter into the inverted bell and pour a splash of cold water into the crock base. The airtight water seal preserves freshness for up to 30 days.',
    categorySlug: 'kitchen-accessories',
    price: 1599,
    discountPrice: 1299,
    stock: 28,
    material: 'Stoneware',
    color: 'Earthy Sand',
    finish: 'Satin Smooth',
    size: 'Standard Crock',
    dimensions: { height: '11 cm', diameter: '10 cm', capacity: '1 Stick Butter (125g)', weight: '650g' },
    weight: '650g',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80'
    ],
    is360Available: false,
    ratings: { average: 4.9, count: 34 },
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    isNewArrival: true,
    tags: ['butter bell', 'kitchen', 'stoneware crock', 'french culinary']
  }
];

const sampleCoupons = [
  {
    code: 'WELCOME15',
    description: 'Welcome bonus for new pottery lovers: 15% off first order',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 1499,
    maxDiscountAmount: 1500,
    usageLimit: 2000,
    isActive: true
  },
  {
    code: 'CLAY10',
    description: 'Artisanal savings: 10% off storewide',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 999,
    maxDiscountAmount: 1000,
    usageLimit: 5000,
    isActive: true
  },
  {
    code: 'FESTIVE500',
    description: 'Flat ₹500 discount on heirloom dining sets above ₹3999',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 3999,
    maxDiscountAmount: 500,
    usageLimit: 1000,
    isActive: true
  }
];

const sampleBlogs = [
  {
    title: 'The Art of Kiln Firing: Why 1280°C Matters in Ceramic Tableware',
    slug: 'the-art-of-kiln-firing-why-1280c-matters',
    excerpt: 'Discover how high firing temperatures vitrify natural clay, making it chip-resistant, microwave-safe, and 100% non-porous.',
    content: `
      <p>In the world of ceramic dinnerware, temperature is the defining bridge between fragile decorative pottery and resilient tableware that lasts generations.</p>
      <h3>What is Vitrification?</h3>
      <p>When clay minerals are fired beyond 1200°C, the silica and feldspar within melt into a dense glass matrix. This process, known as vitrification, closes all microscopic pores in the clay body. Liquid absorption drops to below 0.5%, meaning grease, sauces, and bacteria can never penetrate beneath the glaze.</p>
      <h3>Stoneware vs. Earthenware</h3>
      <p>Standard terracotta or low-fired earthenware is typically fired around 900°C–1050°C. While charming, it remains porous unless heavily glazed, and is prone to thermal cracking. At ClayVista, our stoneware and porcelain lines are subjected to dual firings reaching 1280°C, delivering restaurant-grade durability with everyday warmth.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    author: 'Master Ceramicist Vikram Sen',
    category: 'Ceramic Care & Table Styling',
    tags: ['craftsmanship', 'kiln firing', 'tableware', 'ceramics'],
    readTime: '4 min read'
  },
  {
    title: '5 Golden Rules for Styling an Intimate Dinner Table',
    slug: '5-golden-rules-for-styling-an-intimate-dinner-table',
    excerpt: 'Elevate your hosting with textured linen, organic ceramic plates, ambient taper candles, and seasonal botanicals.',
    content: `
      <p>A memorable dinner is as much about the tactile ambience of the table as the flavours on the plate. Here are 5 ways to curate a warm, luxurious setting.</p>
      <h3>1. Embrace Layered Textures</h3>
      <p>Contrast matte ceramic dinner plates with a raw linen runner and ribbed glassware. The interplay between glossy wine goblets and earth-toned plates brings sensory depth.</p>
      <h3>2. Keep Floral Arrangements Low</h3>
      <p>Eye contact is essential for connection. Opt for low ceramic bud vases rather than towering bouquets so conversation flows unimpeded across the table.</p>
      <h3>3. Warm Taper Candles</h3>
      <p>Nothing flatters ceramic glazes quite like living candlelight. Use unbleached beeswax tapers placed at staggered heights.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=80',
    author: 'Aanya Mathur, Table Stylist',
    category: 'Table Styling & Entertaining',
    tags: ['table decor', 'styling', 'hosting', 'dinner party'],
    readTime: '5 min read'
  },
  {
    title: 'Caring for Fine Porcelain & Bone China: A Lifetime Guide',
    slug: 'caring-for-fine-porcelain-bone-china-guide',
    excerpt: 'Essential tips to prevent thermal shock, avoid detergent clouding, and protect metallic gold lustre on heirloom crockery.',
    content: `
      <p>Properly cared for, porcelain is practically eternal. Here is how to keep your ClayVista dinnerware in immaculate condition.</p>
      <h3>Avoid Extreme Thermal Shock</h3>
      <p>Never take a ceramic baker or serving dish straight from a freezing refrigerator into a preheated 200°C oven. Allow the dish to reach room temperature for 15 minutes before applying heat.</p>
      <h3>Precious Metal Trims</h3>
      <p>Plates with 24K gold or platinum leaf should never be placed in a microwave oven, as the metal will spark. Wash gold-gilded pieces with mild soap and soft cotton sponges.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
    author: 'ClayVista Care Concierge',
    category: 'Ceramic Care & Table Styling',
    tags: ['care guide', 'bone china', 'porcelain', 'dish maintenance'],
    readTime: '3 min read'
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting ClayVista database seeding...');

    // Clean existing seed collections
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();
    await Blog.deleteMany();
    await Review.deleteMany();
    await Inventory.deleteMany();

    // 1. Create or ensure Admin & Demo Customer
    let admin = await User.findOne({ email: 'admin@clayvista.com' });
    if (!admin) {
      admin = await User.create({
        name: 'ClayVista Master Admin',
        email: 'admin@clayvista.com',
        password: 'Admin@12345',
        phone: '+91 81786 64347',
        role: 'admin'
      });
      console.log('✔ Admin account created: admin@clayvista.com (Password: Admin@12345)');
    }

    let customer = await User.findOne({ email: 'customer@clayvista.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Priya Sharma',
        email: 'customer@clayvista.com',
        password: 'Customer@12345',
        phone: '+91 98111 22334',
        role: 'customer',
        addresses: [
          {
            name: 'Priya Sharma',
            phone: '+91 98111 22334',
            street: '402, Lotus Greens, Sector 78',
            city: 'Noida',
            state: 'Uttar Pradesh',
            pincode: '201301',
            country: 'India',
            isDefault: true
          }
        ]
      });
      console.log('✔ Customer account created: customer@clayvista.com (Password: Customer@12345)');
    }

    // 2. Insert Categories
    const insertedCategories = await Category.insertMany(sampleCategories);
    console.log(`✔ Inserted ${insertedCategories.length} categories.`);

    const categoryMap = {};
    insertedCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // 3. Insert Products
    const productsToInsert = sampleProducts.map((p) => ({
      ...p,
      category: categoryMap[p.categorySlug] || insertedCategories[0]._id
    }));

    const insertedProducts = await Product.insertMany(productsToInsert);
    console.log(`✔ Inserted ${insertedProducts.length} premium ceramic products.`);

    // 4. Create initial inventory logs
    for (const prod of insertedProducts) {
      await Inventory.create({
        product: prod._id,
        changeType: 'initial',
        quantityDelta: prod.stock,
        previousStock: 0,
        newStock: prod.stock,
        notes: 'Initial seed stock'
      });
    }

    // 5. Insert Sample Reviews for first 3 products
    if (insertedProducts.length >= 3) {
      await Review.create({
        product: insertedProducts[0]._id,
        userName: 'Aditya Oberoi',
        userEmail: 'aditya@example.com',
        rating: 5,
        title: 'Exquisite weight and glaze quality',
        comment: 'Received the 16-piece Charcoal set yesterday. Packaging was impenetrable, zero breakage. The matte texture feels astonishingly premium in hand.',
        isVerifiedPurchase: true,
        isApproved: true
      });

      await Review.create({
        product: insertedProducts[0]._id,
        userName: 'Meera Singhania',
        userEmail: 'meera@example.com',
        rating: 5,
        title: 'Michelin restaurant feel at home',
        comment: 'Our guests could not stop complimenting these plates. Very easy to wash in dishwasher, no scratches so far.',
        isVerifiedPurchase: true,
        isApproved: true
      });

      await Review.create({
        product: insertedProducts[2]._id,
        userName: 'Kabir Varma',
        userEmail: 'kabir@example.com',
        rating: 5,
        title: 'Perfect morning mug',
        comment: 'The thumb rest on the Kyoto mug is genius ergonomics. Beautiful iron flecks in the cream glaze.',
        isVerifiedPurchase: true,
        isApproved: true
      });
    }

    // 6. Insert Coupons
    await Coupon.insertMany(sampleCoupons);
    console.log(`✔ Inserted ${sampleCoupons.length} promotional coupons.`);

    // 7. Insert Blogs
    await Blog.insertMany(sampleBlogs);
    console.log(`✔ Inserted ${sampleBlogs.length} editorial blog articles.`);

    // 8. Create a sample initial order for testing order tracking and invoices
    const sampleOrderNumber = 'CV-2026-894120';
    const existingOrder = await Order.findOne({ orderNumber: sampleOrderNumber });
    if (!existingOrder && insertedProducts.length > 0) {
      const p1 = insertedProducts[0];
      const p2 = insertedProducts[2];
      const itemSubtotal = p1.discountPrice + p2.discountPrice;
      const taxGst = Math.round(itemSubtotal * 0.18);
      const grandTotal = itemSubtotal + taxGst;

      await Order.create({
        orderNumber: sampleOrderNumber,
        user: customer._id,
        customerDetails: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          shippingAddress: customer.addresses[0]
        },
        orderItems: [
          {
            product: p1._id,
            name: p1.name,
            image: p1.images[0],
            price: p1.discountPrice,
            quantity: 1,
            total: p1.discountPrice
          },
          {
            product: p2._id,
            name: p2.name,
            image: p2.images[0],
            price: p2.discountPrice,
            quantity: 1,
            total: p2.discountPrice
          }
        ],
        subtotal: itemSubtotal,
        taxGst,
        shippingFee: 0,
        discountAmount: 0,
        grandTotal,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'shipped',
        invoiceNumber: `INV-${sampleOrderNumber}`,
        courier: {
          name: 'BlueDart Luxury Fragile Cargo',
          trackingNumber: 'BD-847291039IN',
          trackingUrl: 'https://bluedart.com'
        },
        trackingHistory: [
          {
            status: 'placed',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            note: 'Order placed by customer.',
            location: 'ClayVista Online Store'
          },
          {
            status: 'processing',
            timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
            note: 'Hand-inspected for micro-cracks and packaged in foam crates.',
            location: 'Master Pottery Studio, Khurja'
          },
          {
            status: 'shipped',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            note: 'In transit via BlueDart Fragile Cargo. AWB: BD-847291039IN',
            location: 'Delhi Regional Logistics Hub'
          }
        ]
      });
      console.log(`✔ Sample demonstration order created: ${sampleOrderNumber}`);
    }

    console.log('✨ ClayVista database seeding successfully completed!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// Export or run standalone
if (require.main === module) {
  const { connectDB } = require('./config/db');
  connectDB().then(async () => {
    await seedData();
    process.exit(0);
  });
}

module.exports = seedData;
