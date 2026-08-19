const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ---- In-memory "database" of products ----
const products = [
  { id: 1, name: "Wireless Headphones", price: 59.99, category: "Electronics", emoji: "🎧", stock: 24 },
  { id: 2, name: "Smart Watch", price: 129.99, category: "Electronics", emoji: "⌚", stock: 12 },
  { id: 3, name: "Running Shoes", price: 74.5, category: "Footwear", emoji: "👟", stock: 40 },
  { id: 4, name: "Coffee Maker", price: 45.0, category: "Home", emoji: "☕", stock: 18 },
  { id: 5, name: "Backpack", price: 39.99, category: "Accessories", emoji: "🎒", stock: 30 },
  { id: 6, name: "Desk Lamp", price: 22.99, category: "Home", emoji: "💡", stock: 50 },
  { id: 7, name: "Bluetooth Speaker", price: 34.99, category: "Electronics", emoji: "🔊", stock: 16 },
  { id: 8, name: "Yoga Mat", price: 19.99, category: "Fitness", emoji: "🧘", stock: 60 },
];

// ---- Routes ----
app.get("/", (req, res) => {
  res.render("index", { products });
});

app.get("/product/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).render("404");
  res.render("product", { product });
});

// Simple health check endpoint — useful for load balancers / deployment checks
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

// JSON API (handy for testing the deployed pipeline with curl)
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(PORT, () => {
  console.log(`🚀 E-commerce app running on port ${PORT}`);
});
