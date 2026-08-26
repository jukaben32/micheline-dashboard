'use client'

import AppShell from '@/components/AppShell'
import WebsiteEditor from '@/components/WebsiteEditor'

export default function WebsitePage() {
  return (
    <AppShell titulo="Mi sitio web">
      <WebsiteEditor />
    </AppShell>
  )
}
