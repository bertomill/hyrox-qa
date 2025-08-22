import Firecrawl from '@mendable/firecrawl-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

async function crawlHyrox() {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    console.error('FIRECRAWL_API_KEY is not set in your environment variables')
    console.error('Please add FIRECRAWL_API_KEY to your .env file')
    console.error('Get your API key at https://www.firecrawl.dev/')
    process.exit(1)
  }

  const app = new Firecrawl({ apiKey })

  console.log('Starting crawl of hyrox.com...')
  
  try {
    const crawlResult = await app.crawl('https://hyrox.com', {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      },
      pollInterval: 2,
    })

    const outputDir = path.join(process.cwd(), 'data', 'hyrox-crawl')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputFile = path.join(outputDir, `hyrox-crawl-${timestamp}.json`)
    
    fs.writeFileSync(outputFile, JSON.stringify(crawlResult, null, 2))
    
    console.log(`✅ Crawl completed successfully!`)
    console.log(`📁 Results saved to: ${outputFile}`)
    console.log(`📊 Total pages crawled: ${crawlResult.data?.length || 0}`)
    
    if (crawlResult.data && crawlResult.data.length > 0) {
      console.log('\n📋 Sample of crawled URLs:')
      crawlResult.data.slice(0, 5).forEach((page: any) => {
        console.log(`  - ${page.sourceUrl || page.url}`)
      })
    }

    return crawlResult
  } catch (error) {
    console.error('❌ Error during crawl:', error)
    throw error
  }
}

if (require.main === module) {
  crawlHyrox().catch(console.error)
}

export { crawlHyrox }