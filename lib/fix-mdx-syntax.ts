import * as fs from 'fs'
import * as path from 'path'

function fixMDXSyntax(content: string): string {
  // Remove standalone <> tags that aren't part of JSX fragments
  let fixed = content
    // Remove empty <> tags on their own lines
    .replace(/^<>\s*$/gm, '')
    // Remove <> at the end of lines
    .replace(/<>\s*$/gm, '')
    // Remove </> at the end of lines
    .replace(/<\/>\s*$/gm, '')
    // Fix common HTML entities that might cause issues
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Remove any remaining standalone angle brackets that might be mistaken for JSX
    .replace(/^\s*<\s*$/gm, '')
    .replace(/^\s*>\s*$/gm, '')
  
  return fixed
}

async function fixAllMDXFiles() {
  console.log('🔧 Fixing MDX syntax issues...')
  
  const directories = [
    path.join(process.cwd(), 'pages', 'docs', 'hyrox'),
    path.join(process.cwd(), 'pages', 'docs', 'pdf-content')
  ]
  
  let totalFixed = 0
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⏭️  Skipping non-existent directory: ${dir}`)
      continue
    }
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'))
    console.log(`📁 Checking ${files.length} files in ${path.basename(dir)}...`)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const fixed = fixMDXSyntax(content)
      
      if (content !== fixed) {
        fs.writeFileSync(filePath, fixed)
        console.log(`  ✅ Fixed: ${file}`)
        totalFixed++
      }
    }
  }
  
  console.log(`\n🎯 Fixed ${totalFixed} files with MDX syntax issues`)
}

if (require.main === module) {
  fixAllMDXFiles().catch(console.error)
}

export { fixMDXSyntax, fixAllMDXFiles }