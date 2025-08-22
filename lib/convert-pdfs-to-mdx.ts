import * as fs from 'fs'
import * as path from 'path'
import pdf from 'pdf-parse'
import * as dotenv from 'dotenv'

dotenv.config()

interface PDFMetadata {
  title: string
  pages: number
  info?: any
  metadata?: any
}

function cleanPDFText(text: string): string {
  // Remove excessive whitespace and clean up formatting
  let cleaned = text
    // Replace multiple spaces with single space
    .replace(/  +/g, ' ')
    // Replace multiple newlines with double newline for paragraphs
    .replace(/\n{3,}/g, '\n\n')
    // Remove page numbers that appear alone on a line (common pattern: just a number)
    .replace(/^\d+$/gm, '')
    // Remove common header/footer patterns
    .replace(/^Page \d+ of \d+$/gm, '')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove multiple consecutive blank lines again after line trimming
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return cleaned
}

function generateSlugFromFilename(filename: string): string {
  // Remove .pdf extension and clean the filename
  const baseName = path.basename(filename, '.pdf')
  
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  return `pdf-${slug}`
}

function formatTitle(filename: string): string {
  // Extract title from filename
  const baseName = path.basename(filename, '.pdf')
  
  // Replace underscores and hyphens with spaces, then title case
  const title = baseName
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\bEn\b/gi, 'EN') // Common abbreviations
    .replace(/\bPdf\b/gi, 'PDF')
    .replace(/\bHyrox\b/gi, 'HYROX')
  
  return title
}

function splitIntoSections(text: string, maxSectionLength: number = 3000): string[] {
  const sections: string[] = []
  const paragraphs = text.split('\n\n')
  
  let currentSection = ''
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit, start a new section
    if (currentSection.length > 0 && 
        currentSection.length + paragraph.length + 2 > maxSectionLength) {
      sections.push(currentSection.trim())
      currentSection = paragraph
    } else {
      currentSection += (currentSection ? '\n\n' : '') + paragraph
    }
  }
  
  // Add the last section if it has content
  if (currentSection.trim()) {
    sections.push(currentSection.trim())
  }
  
  return sections
}

async function convertPDFToMDX(pdfPath: string, outputDir: string): Promise<void> {
  try {
    console.log(`📖 Processing: ${path.basename(pdfPath)}`)
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath)
    
    // Parse the PDF
    const data = await pdf(dataBuffer)
    
    // Extract metadata
    const metadata: PDFMetadata = {
      title: formatTitle(pdfPath),
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata
    }
    
    // Clean the text content
    const cleanedText = cleanPDFText(data.text)
    
    // Skip if no meaningful content
    if (cleanedText.length < 100) {
      console.log(`⏭️  Skipped (too little content): ${path.basename(pdfPath)}`)
      return
    }
    
    // Split long documents into sections
    const sections = splitIntoSections(cleanedText)
    
    // Generate slug for the file
    const baseSlug = generateSlugFromFilename(pdfPath)
    
    // If the document is short enough, create a single file
    if (sections.length === 1) {
      const filename = `${baseSlug}.mdx`
      const mdxContent = createMDXContent(
        metadata.title,
        cleanedText,
        pdfPath,
        metadata
      )
      
      const outputPath = path.join(outputDir, filename)
      fs.writeFileSync(outputPath, mdxContent)
      console.log(`✅ Created: ${filename}`)
    } else {
      // For longer documents, create multiple files with section numbers
      for (let i = 0; i < sections.length; i++) {
        const filename = `${baseSlug}-part-${i + 1}.mdx`
        const sectionTitle = `${metadata.title} - Part ${i + 1} of ${sections.length}`
        
        const mdxContent = createMDXContent(
          sectionTitle,
          sections[i],
          pdfPath,
          metadata,
          i + 1,
          sections.length
        )
        
        const outputPath = path.join(outputDir, filename)
        fs.writeFileSync(outputPath, mdxContent)
        console.log(`✅ Created: ${filename}`)
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to process ${path.basename(pdfPath)}:`, error)
  }
}

function createMDXContent(
  title: string,
  content: string,
  sourcePath: string,
  metadata: PDFMetadata,
  part?: number,
  totalParts?: number
): string {
  const filename = path.basename(sourcePath)
  const description = part 
    ? `Part ${part} of ${totalParts} from ${filename} (${metadata.pages} pages total)`
    : `Content extracted from ${filename} (${metadata.pages} pages)`
  
  const mdxContent = `export const meta = {
  title: "${title.replace(/"/g, '\\"')}",
  description: "${description}",
  sourceFile: "${filename}",
  totalPages: ${metadata.pages},
  category: "pdf",${part ? `
  part: ${part},
  totalParts: ${totalParts},` : ''}
  extractedDate: "${new Date().toISOString()}"
}

# ${title}

*${description}*

${content}

---

*Source: ${filename}*
*Total Pages: ${metadata.pages}*${part ? `
*Part ${part} of ${totalParts}*` : ''}
*Extracted on: ${new Date().toISOString().split('T')[0]}*
`
  
  return mdxContent
}

async function convertAllPDFs() {
  console.log('🔄 Starting conversion of PDF files to MDX...')
  
  const pdfDir = path.join(process.cwd(), 'pages', 'docs', 'pdfs')
  const outputDir = path.join(process.cwd(), 'pages', 'docs', 'pdf-content')
  
  // Check if PDF directory exists
  if (!fs.existsSync(pdfDir)) {
    console.error(`❌ PDF directory not found: ${pdfDir}`)
    return
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Created output directory: ${outputDir}`)
  }
  
  // Get all PDF files
  const pdfFiles = fs.readdirSync(pdfDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
  
  if (pdfFiles.length === 0) {
    console.log('❌ No PDF files found in the directory')
    return
  }
  
  console.log(`📄 Found ${pdfFiles.length} PDF files to convert`)
  
  // Process each PDF
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfDir, pdfFile)
    await convertPDFToMDX(pdfPath, outputDir)
  }
  
  console.log('\n📊 Conversion complete!')
  console.log(`📁 MDX files saved to: ${outputDir}`)
  console.log('\n🎯 Next steps:')
  console.log('1. Review the generated MDX files in pages/docs/pdf-content/')
  console.log('2. Run "pnpm embeddings" to generate embeddings for the new content')
}

if (require.main === module) {
  convertAllPDFs().catch(console.error)
}

export { convertAllPDFs, convertPDFToMDX }