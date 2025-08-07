# Server vs Client Components in Next.js

## Server Components

Server Components are best for displaying data with minimal interactivity.

### Example:

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <h1>Our Products</h1>
      {products.map((product) => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Use Cases:

- Product listings
- Blog posts
- Documentation pages
- Static content
- SEO-important pages

## Client Components

Client Components are best for interactive features that require client-side state and event handling.

### Example:

```typescript
"use client";
// app/cart/page.tsx
export default function ShoppingCart() {
  const [items, setItems] = useState([]);

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div>
      <h1>Your Cart</h1>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Use Cases:

- Shopping carts
- Forms
- Interactive dashboards
- Real-time features
- Anything with buttons/user input

## Rule of Thumb

- If it needs user interaction → Client Component
- If it just shows data → Server Component
