export const categories = [
  { name: "All", color: "bg-primary" },
  { name: "AI", color: "bg-purple-500" },
  { name: "Developers", color: "bg-blue-500" },
  { name: "News", color: "bg-green-500" },
  { name: "Partnerships", color: "bg-yellow-500" },
  { name: "Hackathon", color: "bg-red-500" },
  { name: "Grants", color: "bg-pink-500" },
]

export const blogPosts = [
  {
    id: 1,
    slug: "introducing-nexis-ai",
    title: "Introducing Nexis AI: The Future of Blockchain Intelligence",
    excerpt: "Discover how Nexis AI is revolutionizing blockchain technology with advanced artificial intelligence...",
    category: "AI",
    image: "/placeholder.svg?height=400&width=800",
    date: "2024-02-23",
    readTime: 5,
    featured: true,
  },
  // ... other blog posts
]

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

