// Node.js >= v22.13.1
// Tested on Linux and macOS. Not tested on Windows.

import fs from 'node:fs'
import path from 'node:path'
import { isNonEmptyArray } from 'ramda-adjunct'

import { Book } from '@/types'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const README_PATH = path.join(__dirname, '..', 'README.md')

const writeFile = async (filePath: string, data: string) => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, data, 'utf8')
}

const CHAPTERS_TO_PRINT = [
  {
    bookUrl:
      'https://jsckdm.github.io/bible-data-en-eng/data/en___eng/NLT/PSA.json',
    chapterUsfm: 'PSA.3',
    separatedLines: true,
    notice: [
      '- **The first line at the beginning of the chapter, before verse 1.**',
      '- **Each verse is separated into multiple lines.**',
    ],
  },
  {
    bookUrl:
      'https://jsckdm.github.io/bible-data-en-eng/data/en___eng/NLT/SNG.json',
    chapterUsfm: 'SNG.1',
    separatedLines: true,
    notice: [
      '- **Verse 4 has two titles within its lines.**',
      '- **The number of verse 4 is shown only at the beginning of the verse.**',
      '- **Each verse is separated into multiple lines.**',
    ],
  },
  {
    bookUrl:
      'https://jsckdm.github.io/bible-data-en-eng/data/en___eng/NLT/REV.json',
    chapterUsfm: 'REV.22',
    separatedLines: true,
    notice: [
      '- **In this chapter, all verses are in a single line,**',
      '  **except for verse 20, which is split into two lines.**',
      '- **There are red letter words (although, due to the way**',
      `  **GitHub displays markdown, I couldn't make them appear in red)**`,
      '  **in verses: 7, 12, 13, 16, 20.**',
      '- **In verse 20, there are only two lines,**',
      '  **but only part of the first line is in red letter words.**',
    ],
  },
  {
    bookUrl:
      'https://jsckdm.github.io/bible-data-es-spa/data/es___spa/TLA/1CH.json',
    chapterUsfm: '1CH.1',
    separatedLines: false,
    notice: [
      '- **For this chapter, each verse is displayed in a single line,**',
      '  **regardless of whether the data is separated into multiple lines.**',
      '- **There are several grouped verses.**',
      '- **The grouped verses 1-4 and 28-33 not only are grouped**',
      '  **but also have titles in between.**',
    ],
  },
]

const main = async (): Promise<void> => {
  let markdown: string = ''
  let lastVerseNumber: number = -1

  markdown += '# This README was generated using code\n\n'
  markdown +=
    'Check the `src/index.ts` file and the `start` script in the `package.json` file.\n\n'
  markdown +=
    'Also, check the `source JSON files` to see how the data is structured and then transformed.\n\n'

  for (const ctp of CHAPTERS_TO_PRINT) {
    const { bookUrl, chapterUsfm, separatedLines, notice } = ctp

    const response = await fetch(bookUrl)
    const book: Book = await response.json()

    const chapter = book.chapters.find((c) => c.chapter_usfm === chapterUsfm)

    if (!chapter) {
      throw new Error(
        `Chapter '${chapterUsfm}' not found in '${book.book_usfm}'`,
      )
    }

    markdown += '---\n\n'
    markdown += '> [!IMPORTANT]\n'
    markdown += '>\n'
    markdown += `> **${chapter.current.human} - (${chapter.chapter_usfm})**\n`
    markdown += '>\n'
    markdown += `> **${book.local_title} - (${book.local_abbreviation})**\n`
    markdown += '>\n'
    markdown += `> **Separated lines: ${separatedLines ? 'YES' : 'NO'}**\n`
    markdown += '>\n'
    markdown += `> **Notice:**\n`
    markdown += '>\n'
    notice.forEach((n) => {
      markdown += `> ${n}\n>\n`
    })
    markdown += '\n'

    chapter.items.forEach((chapterItem) => {
      if (chapterItem.type === 'verse') {
        if (
          typeof chapterItem.verse_numbers[0] === 'number' &&
          chapterItem.verse_numbers[0] !== lastVerseNumber
        ) {
          if (chapterItem.verse_numbers.length > 1) {
            const firstVerse = chapterItem.verse_numbers[0]
            const lastVerse =
              chapterItem.verse_numbers[chapterItem.verse_numbers.length - 1]
            markdown += '`' + firstVerse + '-' + lastVerse + '` '
          } else {
            markdown += '`' + chapterItem.verse_numbers[0] + '` '
          }

          lastVerseNumber = chapterItem.verse_numbers[0]
        }

        const joinWith = separatedLines ? '\n\n' : ' '

        if (isNonEmptyArray(chapterItem.rlw_lines)) {
          const lines: string[] = chapterItem.rlw_lines.map((rlwLine) => {
            let line: string = ''

            rlwLine.forEach((rlwSection) => {
              if (rlwSection.rl) {
                line +=
                  '<span style="color:red;">**`' +
                  rlwSection.text +
                  '`**</span> '
              } else {
                line += `${rlwSection.text} `
              }
            })

            return line.trim()
          })

          markdown += `${lines.join(joinWith)}\n\n`
        } else {
          markdown += `${chapterItem.lines.join(joinWith)}\n\n`
        }
      } else {
        if (chapterItem.type === 'section1') {
          markdown += `# ${chapterItem.lines[0]}\n\n`
        }
        if (chapterItem.type === 'section2') {
          markdown += `## ${chapterItem.lines[0]}\n\n`
        }
        if (chapterItem.type === 'heading1') {
          markdown += `### ${chapterItem.lines[0]}\n\n`
        }
        if (chapterItem.type === 'heading2') {
          markdown += `#### ${chapterItem.lines[0]}\n\n`
        }
        if (chapterItem.type === 'label') {
          markdown += `*${chapterItem.lines[0]}*\n\n`
        }
      }
    })

    markdown += '\n'
    lastVerseNumber = -1
  }

  await writeFile(README_PATH, markdown)
  console.info(`Done! Check the 'README.md' file.`)
}

await main()
