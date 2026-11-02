export const categories = [
  { name: "Laptops", icon: "laptop", count: "Explore laptops" },
  { name: "Smartphones", icon: "phone", count: "Explore phones" },
  { name: "Smart Watches", icon: "watch", count: "Explore watches" },
  { name: "Accessories", icon: "headphones", count: "Explore accessories" },
];

export const products = [
  { id: 1, name: "Premium Business Laptop", category: "Laptops", price: 65000, oldPrice: 72000, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80" },
  { id: 2, name: "Latest Smartphone", category: "Smartphones", price: 45000, oldPrice: 49000, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80" },
  { id: 3, name: "Premium Smart Watch", category: "Smart Watches", price: 4500, oldPrice: 5900, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" },
  { id: 4, name: "Wireless Headphones", category: "Accessories", price: 2900, oldPrice: 3500, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
];

export const formatPrice = (value) =>
  "৳" + Number(value).toLocaleString("en-BD");
