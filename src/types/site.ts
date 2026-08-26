// Tipos compartidos por la landing publica (/sites/[slug]) y su editor.

export type Business = {
  id: string
  slug: string
  name: string
  phone: string | null
}

export type Website = {
  business_id: string
  is_published: boolean
  site_title: string | null
  tagline: string | null
  hero_title: string | null
  hero_subtitle: string | null
  hero_cta_label: string | null
  about_text: string | null
  primary_color: string
  secondary_color: string
  dark_color: string
  bg_color: string
  border_color: string
  muted_color: string
  font_choice: string
  whatsapp_number: string | null
  phone: string | null
  social_instagram: string | null
  social_facebook: string | null
  social_tiktok: string | null
}

export type Highlight = {
  id: string
  sort_order: number
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  badge_label: string | null
  size: 'lg' | 'md' | 'sm'
}

export type SiteLocation = {
  id: string
  sort_order: number
  name: string
  badge_label: string | null
  schedule_weekday: string | null
  schedule_sunday: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  is_dark: boolean
}

export type Testimonial = {
  id: string
  sort_order: number
  author_name: string
  author_location: string | null
  quote: string
  rating: number
}

export type Service = {
  id: string
  name: string
  duration_min: number
  price: number
  category: string | null
}

export type Stylist = {
  id: string
  full_name: string
  specialty: string | null
  photo_url: string | null
}

export type Product = {
  id: string
  name: string
  type: string | null
  description: string | null
  brand: string | null
  price: number
  stock: number
}

export type SiteContent = {
  business: Business
  website: Website
  highlights: Highlight[]
  locations: SiteLocation[]
  testimonials: Testimonial[]
  services: Service[]
  stylists: Stylist[]
  products: Product[]
}
