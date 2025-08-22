import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

interface CrawledPage {
  markdown: string
  metadata: {
    sourceURL?: string
    url?: string
    title?: string
    description?: string
    ogDescription?: string
    publishedTime?: string
    modifiedTime?: string
    [key: string]: any
  }
}

interface CrawlResult {
  data: CrawledPage[]
  [key: string]: any
}

function cleanMarkdown(markdown: string): string {
  // Remove cookie consent banners and privacy preference sections
  const lines = markdown.split('\n')
  const filteredLines: string[] = []
  let inPrivacySection = false
  let skipNextEmptyLine = false
  
  for (const line of lines) {
    // Skip lines that are part of cookie/privacy consent
    if (line.includes('Skip to consent choices') || 
        line.includes('Privacy preferences') ||
        line.includes('We use cookies and similar technologies') ||
        line.includes('The data processing may take place with your consent') ||
        line.includes('Some services process personal data in unsecure third countries') ||
        line.includes('You are under 16 years old? Then you cannot consent') ||
        line.includes('Privacy policy') && line.includes('Legal Notice') ||
        line.includes('WordPress Cookie Plugin') ||
        line.includes('Accept all') && line.includes('Continue without consent') ||
        (line.trim() === 'Essential' || line.trim() === 'Functional' || line.trim() === 'Marketing')) {
      inPrivacySection = true
      skipNextEmptyLine = true
      continue
    }
    
    // Skip GDPR references
    if (line.includes('Art. 49 (1) (a) GDPR')) {
      continue
    }
    
    // Check if we've moved past the privacy section
    if (inPrivacySection) {
      // Look for actual content markers to exit privacy section
      if (line.startsWith('#') || line.startsWith('##') || 
          (line.trim() !== '' && !line.includes('consent') && !line.includes('privacy'))) {
        inPrivacySection = false
        // Don't skip this line if it's actual content
        if (!line.includes('Essential') && !line.includes('Functional') && !line.includes('Marketing')) {
          filteredLines.push(line)
        }
      }
      continue
    }
    
    // Skip empty lines immediately after privacy section
    if (skipNextEmptyLine && line.trim() === '') {
      skipNextEmptyLine = false
      continue
    }
    
    if (!inPrivacySection) {
      filteredLines.push(line)
    }
  }
  
  // Join lines and clean up excessive whitespace
  let cleaned = filteredLines.join('\n')
  
  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // Trim whitespace
  cleaned = cleaned.trim()
  
  return cleaned
}

function generateSlug(url: string): string {
  try {
    const urlObj = new URL(url)
    let pathname = urlObj.pathname
    
    // Remove trailing slash
    pathname = pathname.replace(/\/$/, '')
    
    // If it's the homepage, use 'home'
    if (pathname === '' || pathname === '/') {
      return 'hyrox-home'
    }
    
    // Remove leading slash and replace remaining slashes with hyphens
    pathname = pathname.replace(/^\//, '').replace(/\//g, '-')
    
    // Clean up the slug
    pathname = pathname
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    // Prefix with hyrox to avoid conflicts
    return `hyrox-${pathname}`
  } catch (e) {
    // Fallback for invalid URLs
    return `hyrox-page-${Date.now()}`
  }
}

function createMdxContent(page: CrawledPage, index: number): { filename: string; content: string } {
  const url = page.metadata.sourceURL || page.metadata.url || ''
  const title = page.metadata.title || `Hyrox Page ${index + 1}`
  const description = page.metadata.description || page.metadata.ogDescription || ''
  const publishedDate = page.metadata.publishedTime || page.metadata.modifiedTime || new Date().toISOString()
  
  const cleanedMarkdown = cleanMarkdown(page.markdown)
  
  // Skip pages with no meaningful content after cleaning
  if (cleanedMarkdown.length < 50) {
    return { filename: '', content: '' }
  }
  
  const slug = generateSlug(url)
  const filename = `${slug}.mdx`
  
  // Create MDX content with metadata
  const mdxContent = `export const meta = {
  title: "${title.replace(/"/g, '\\"')}",
  description: "${description.replace(/"/g, '\\"')}",
  sourceUrl: "${url}",
  publishedDate: "${publishedDate}",
  category: "hyrox"
}

# ${title}

${description ? `*${description}*\n\n` : ''}${cleanedMarkdown}

---

*Source: [${url}](${url})*
*Crawled on: ${new Date().toISOString().split('T')[0]}*
`

  return { filename, content: mdxContent }
}

async function convertHyroxToMdx() {
  console.log('🔄 Starting conversion of Hyrox crawl data to MDX files...')
  
  // Find the most recent crawl file
  const crawlDir = path.join(process.cwd(), 'data', 'hyrox-crawl')
  
  if (!fs.existsSync(crawlDir)) {
    console.error('❌ No crawl data directory found at:', crawlDir)
    return
  }
  
  const files = fs.readdirSync(crawlDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
  
  if (files.length === 0) {
    console.error('❌ No crawl data files found')
    return
  }
  
  const latestFile = files[0]
  console.log(`📖 Reading crawl data from: ${latestFile}`)
  
  const crawlDataPath = path.join(crawlDir, latestFile)
  const rawData = fs.readFileSync(crawlDataPath, 'utf8')
  const crawlData: CrawlResult = JSON.parse(rawData)
  
  if (!crawlData.data || crawlData.data.length === 0) {
    console.error('❌ No pages found in crawl data')
    return
  }
  
  console.log(`📄 Found ${crawlData.data.length} pages to convert`)
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'pages', 'docs', 'hyrox')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Created output directory: ${outputDir}`)
  }
  
  // Convert each page to MDX
  let successCount = 0
  let skipCount = 0
  
  for (let i = 0; i < crawlData.data.length; i++) {
    const page = crawlData.data[i]
    const { filename, content } = createMdxContent(page, i)
    
    if (!filename || !content) {
      skipCount++
      continue
    }
    
    const outputPath = path.join(outputDir, filename)
    
    try {
      fs.writeFileSync(outputPath, content)
      successCount++
      console.log(`✅ Created: ${filename}`)
    } catch (error) {
      console.error(`❌ Failed to write ${filename}:`, error)
    }
  }
  
  console.log('\n📊 Conversion Summary:')
  console.log(`✅ Successfully converted: ${successCount} pages`)
  console.log(`⏭️  Skipped (too little content): ${skipCount} pages`)
  console.log(`📁 MDX files saved to: ${outputDir}`)
  console.log('\n🎯 Next steps:')
  console.log('1. Review the generated MDX files in pages/docs/hyrox/')
  console.log('2. Run "pnpm embeddings" to generate embeddings for the new content')
}

if (require.main === module) {
  convertHyroxToMdx().catch(console.error)
}

export { convertHyroxToMdx }