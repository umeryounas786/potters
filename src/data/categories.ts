export type Category = {
  title: string;
  slug: string;
  imageSrc: string;
  imageAlt: string;
  description?: string;
  href: string;
};

export const CATEGORIES: Category[] = [
  {
    title: "Plates And Platters",
    slug: "plates-platters",
    imageSrc: "/assets/images/categories/plates-platters-blue-felicity-round-platter-large-15596838191186.jpg",
    imageAlt: "Plates And Platters",
    description: "Plates and Platters That Bring Style to Your Table. Handcrafted with care, these plates blend timeless blue pottery artistry with everyday functionality.",
    href: "/collections/plates-platters",
  },
  {
    title: "Ceramic Blue Pottery Karahi",
    slug: "ceramic-blue-pottery-karahies",
    imageSrc: "/assets/images/categories/D0453E57-1942-4EA4-8395-DA41254D1258.jpg",
    imageAlt: "Blue Pottery Karahi",
    description: "Blue Pottery Karahi Designs That Add Tradition to Every Table. Serve your favourite dishes in authentic Multani style.",
    href: "/collections/ceramic-blue-pottery-karahies",
  },
  {
    title: "Blue Pottery Tea Sets",
    slug: "tea-sets-blue-pottery",
    imageSrc: "/assets/images/categories/3B66C377-5B60-4ED3-8CCE-C46DAD6A69CE.jpg",
    imageAlt: "Multani Blue Pottery Tea Sets",
    description: "Unique Designs for Your Perfect Tea Time. Exquisite tea sets that make every cup a ritual.",
    href: "/collections/tea-sets-blue-pottery",
  },
  {
    title: "Bowls",
    slug: "bowls",
    imageSrc: "/assets/images/bowls/DC6527A9-AC61-44B0-B6FB-E21BDCB1F8C3.jpg",
    imageAlt: "Multani Blue Pottery Ceramic Bowls",
    description: "Handcrafted Ceramic Bowls for Every Meal. Bring charm to your table with our stunning range of bowls.",
    href: "/collections/bowls",
  },
  {
    title: "Serving Dishes",
    slug: "serving-dishes",
    imageSrc: "/assets/images/serving-dishes/ceramics-blue-felicity-flat-dish-28259862872146.jpg",
    imageAlt: "Blue Pottery Serving Dishes",
    description: "Serving Dishes That Add Warmth to Every Meal. Present your meals beautifully with our artisan serving collection.",
    href: "/collections/serving-dishes",
  },
  {
    title: "Table Decoration",
    slug: "table-decoration",
    imageSrc: "/assets/images/categories/ceramics-blue-felicity-big-planter-28311809851474.jpg",
    imageAlt: "Table Decoration",
    description: "Decorate your table with stunning hand-painted blue pottery pieces that captivate every guest.",
    href: "/collections/table-decoration",
  },
];

export const TABLEWARE_SUBCATEGORIES = [
  { label: "Dinner Sets",                 slug: "dinner-sets",                 count: 8,  priceRange: "Rs. 19,999 – 79,999" },
  { label: "Tea Sets",                    slug: "tea-sets-blue-pottery",       count: 12, priceRange: "Rs. 5,999 – 22,999" },
  { label: "Serving Dishes",              slug: "serving-dishes",              count: 66, priceRange: "Rs. 3,999 – 7,999" },
  { label: "Plates & Platters",           slug: "plates-platters",             count: 22, priceRange: "Rs. 1,199 – 7,499" },
  { label: "Bowls",                       slug: "bowls",                       count: 33, priceRange: "Rs. 3,099 – 6,999" },
  { label: "Blue Pottery",                slug: "blue-pottery",                count: null, priceRange: null },
  { label: "Karahi Handies & Cover Pots", slug: "ceramic-blue-pottery-karahies", count: 19, priceRange: "Rs. 2,499 – 4,999" },
  { label: "Pottery Jars",                slug: "pottery-jars",                count: 22, priceRange: "Rs. 1,499 – 3,499" },
  { label: "Tea Mugs",                    slug: "tea-mugs",                    count: 8,  priceRange: "Rs. 1,199 – 4,499" },
  { label: "Tea Coasters",                slug: "tea-coasters",                count: 3,  priceRange: "Rs. 1,999" },
];

export const DECOR_SUBCATEGORIES = [
  { label: "Planters",         slug: "planters",         count: 5,  priceRange: "Rs. 2,999 – 4,499" },
  { label: "Vases",            slug: "vases",            count: 16, priceRange: "Rs. 1,499 – 6,499" },
  { label: "Aromatic Warmers", slug: "aromatic-warmers", count: 2,  priceRange: "Rs. 1,999" },
  { label: "Table Decoration", slug: "table-decoration", count: 14, priceRange: "Rs. 999 – 8,499" },
  { label: "Lamps",            slug: "lamps",            count: 7,  priceRange: "Rs. 4,999 – 8,499" },
];

export const DESIGN_FAMILY = [
  { label: "Blue Felicity",   slug: "blue-felicity",   count: 48, priceRange: "Rs. 999 – 54,999", imageSrc: "/assets/images/categories/92E23449-F06B-4E48-9E2A-4A3E774D1C31.jpg",  showBadge: true,  primaryIconSrc: "https://c.animaapp.com/mmu1yta2SFboEj/assets/icon-26.svg" },
  { label: "Blue Pattern",    slug: "blue-pattern",    count: 12, priceRange: "Rs. 999 – 49,999", imageSrc: "/assets/images/categories/9D75AF63-BA51-4C72-B4FA-0E6E29989D7E.jpg",  showBadge: true,  primaryIconSrc: "https://c.animaapp.com/mmu1yta2SFboEj/assets/icon-26.svg" },
  { label: "Tranquility",     slug: "tranquility",     count: 28, priceRange: "Rs. 999 – 47,999", imageSrc: "/assets/images/categories/ceramics-tranquility-ceramic-karahi-set-of-2-28259109765202.jpg",  showBadge: false, primaryIconSrc: "https://c.animaapp.com/mmu1yta2SFboEj/assets/icon-25.svg" },
  { label: "Serina",          slug: "serina",          count: 45, priceRange: "Rs. 1,999 – 47,999", imageSrc: "/assets/images/categories/IMG_5174.png",  showBadge: false, primaryIconSrc: "" },
  { label: "Blue Flower",     slug: "blue-flower",     count: 26, priceRange: "Rs. 999 – 19,999", imageSrc: "/assets/images/categories/679AE592-578A-40F8-8C64-4F0DFEAB3759.jpg",  showBadge: true,  primaryIconSrc: "https://c.animaapp.com/mmu1yta2SFboEj/assets/icon-26.svg" },
  { label: "Blue Celico",     slug: "blue-celico",     count: 12, priceRange: "Rs. 1,199 – 4,999", imageSrc: "/assets/images/categories/IMG_4472.png",  showBadge: false, primaryIconSrc: "" },
  { label: "Spring Pattern",  slug: "spring-pattern",  count: 2,  priceRange: "Rs. 3,999 – 4,499", imageSrc: "/assets/images/categories/2575C463-27DA-4695-BE89-6C70D3E4A85A.jpg",  showBadge: false, primaryIconSrc: "" },
  { label: "Slightly Broken", slug: "slightly-broken", count: 0,  priceRange: null,               imageSrc: "/assets/images/bowls/ceramics-jungle-flower-serving-bowl-28259226845266.jpg",  showBadge: false, primaryIconSrc: "" },
];
