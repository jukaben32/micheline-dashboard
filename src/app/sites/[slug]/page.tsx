import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { siteThemeStyle } from '@/lib/site-theme'
import SitePage from '@/components/site/SitePage'
import type { SiteContent } from '@/types/site'

export const dynamic = 'force-dynamic'

async function getSiteContent(slug: string): Promise<SiteContent | null> {
  const supabase = createAdminClient()

  const { data: business } = await supabase
    .from('business')
    .select('id, slug, name, phone')
    .eq('slug', slug)
    .maybeSingle()
  if (!business) return null

  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('business_id', business.id)
    .maybeSingle()
  if (!website || !website.is_published) return null

  const [
    { data: highlights },
    { data: locations },
    { data: testimonials },
    { data: services },
    { data: stylists },
    { data: products },
  ] = await Promise.all([
    supabase.from('website_highlights').select('*').eq('business_id', business.id).order('sort_order'),
    supabase.from('website_locations').select('*').eq('business_id', business.id).order('sort_order'),
    supabase.from('website_testimonials').select('*').eq('business_id', business.id).order('sort_order'),
    supabase.from('services').select('id, name, duration_min, price, category').eq('business_id', business.id).eq('is_active', true).order('price'),
    supabase.from('stylists').select('id, full_name, specialty, photo_url').eq('business_id', business.id).eq('is_active', true),
    supabase.from('products').select('id, name, type, description, brand, price, stock').eq('business_id', business.id).eq('is_active', true).order('name'),
  ])

  return {
    business,
    website,
    highlights: highlights ?? [],
    locations: locations ?? [],
    testimonials: testimonials ?? [],
    services: services ?? [],
    stylists: stylists ?? [],
    products: products ?? [],
  }
}

export default async function PublicSitePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const content = await getSiteContent(slug)
  if (!content) notFound()

  return (
    <div className="site-root" style={siteThemeStyle(content.website)}>
      <SitePage content={content} />
    </div>
  )
}
