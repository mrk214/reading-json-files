import { useEffect, useMemo, useState } from 'react'
import ReactJsonView from '@microlink/react-json-view'

import type { ChapterItem, RedLetterWords, Version } from './types'
import type { ItemToPrint } from './dev.types'
import { CHAPTERS_TO_FIND } from './constants'

type Tab = 'text' | 'json'

// ─── Block Types ─────────────────────────────────────────────────────────────

/**
 * A renderable block representing either:
 * - A non-verse heading, section title, or label (always starts on its own line).
 * - A prose paragraph composed of one or more consecutive inline verses.
 */
type ChapterBlock =
  | {
      type: 'heading'
      item: ChapterItem
    }
  | {
      type: 'paragraph'
      verses: {
        item: ChapterItem
        showVerseNumber: boolean
      }[]
    }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable verse label.
 * - Single verse: "1"
 * - Grouped verses: "1-4"
 */
function getVerseLabel(verseNumbers: number[]): string {
  if (verseNumbers.length === 1) {
    return String(verseNumbers[0])
  }

  const first = verseNumbers[0]
  const last = verseNumbers[verseNumbers.length - 1]
  return `${first}-${last}`
}

/**
 * Checks whether the verse contains Red Letter Words (words spoken by Jesus).
 */
function hasRedLetterWords(rlwLines: RedLetterWords[][]): boolean {
  return rlwLines.length > 0
}

/**
 * Builds a boolean map indicating whether each item in `items` should display
 * its verse number.
 *
 * In some JSON sources, a verse can be split across multiple ChapterItems
 * (e.g. when an interlude or title interrupts the verse). In that situation,
 * only the first segment should display the verse number.
 */
function buildShowVerseNumberMap(items: ChapterItem[]): boolean[] {
  let lastVerseNumber = -1

  return items.map((item) => {
    if (item.type !== 'verse') {
      return false
    }

    const first = item.verse_numbers[0]
    const show = first !== lastVerseNumber

    if (show) {
      lastVerseNumber = first
    }

    return show
  })
}

/**
 * Groups flat ChapterItem elements into visual blocks according to Bible typography rules:
 *
 * 1. Non-verse items (section1, section2, heading1, heading2, label) are standalone
 *    blocks that each start on a new line.
 * 2. Verse items (type === 'verse') flow inline within a paragraph (<p>), UNLESS:
 *    - `np: true` is present on the item (New Paragraph marker in the JSON), which
 *      signals that this verse starts on a new line.
 *    - The verse immediately follows a non-verse item (like a heading or label).
 */
function groupChapterItems(items: ChapterItem[]): ChapterBlock[] {
  const showVerseNumberMap = buildShowVerseNumberMap(items)
  const blocks: ChapterBlock[] = []
  let currentParagraphVerses: {
    item: ChapterItem
    showVerseNumber: boolean
  }[] = []

  items.forEach((item, index) => {
    if (item.type !== 'verse') {
      // 1. Flush any pending verses into a paragraph before the heading
      if (currentParagraphVerses.length > 0) {
        blocks.push({ type: 'paragraph', verses: currentParagraphVerses })
        currentParagraphVerses = []
      }

      // 2. Headings and labels are standalone blocks
      blocks.push({ type: 'heading', item })
    } else {
      // 3. Verse item:
      // If `np` is true and we already have verses in the current paragraph,
      // end the current paragraph and start a new one.
      if (item.np && currentParagraphVerses.length > 0) {
        blocks.push({ type: 'paragraph', verses: currentParagraphVerses })
        currentParagraphVerses = []
      }

      currentParagraphVerses.push({
        item,
        showVerseNumber: showVerseNumberMap[index],
      })
    }
  })

  // Flush any remaining verses into the last paragraph
  if (currentParagraphVerses.length > 0) {
    blocks.push({ type: 'paragraph', verses: currentParagraphVerses })
  }

  return blocks
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-24 text-stone-400'>
      <div className='h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-500' />
      <span className='text-sm tracking-wide'>Loading chapters…</span>
    </div>
  )
}

function VerseNumber({ label }: { label: string }) {
  return (
    <sup className='mr-1 font-mono text-[0.6rem] font-semibold text-stone-400 select-none'>
      {label}
    </sup>
  )
}

/**
 * Renders a single line of words that may include Red Letter Words (rlw).
 * Red-letter segments (words of Christ) are highlighted in red.
 */
function RedLetterLine({ sections }: { sections: RedLetterWords[] }) {
  return (
    <>
      {sections.map((section, i) => {
        // Separate sections with a space if the previous text does not already end with one
        const needsSpace =
          i < sections.length - 1 && !section.text.endsWith(' ')

        return (
          <span
            key={i}
            className={section.rl ? 'font-medium text-red-600' : undefined}
          >
            {section.text}
            {needsSpace ? ' ' : ''}
          </span>
        )
      })}
    </>
  )
}

/**
 * Renders a verse item inline.
 * - Displays the verse number if `showVerseNumber` is true.
 * - Handles both plain text `lines` and red-letter words (`rlw_lines`).
 * - If `lines > 1` or `rlw_lines > 1`, each item in the array represents
 *   a distinct poetic or formatted line, separated by `<br />`.
 */
function VerseItem({
  item,
  showVerseNumber,
}: {
  item: ChapterItem
  showVerseNumber: boolean
}) {
  const verseLabel = getVerseLabel(item.verse_numbers)
  const useRlw = hasRedLetterWords(item.rlw_lines)

  return (
    <span className='inline'>
      {showVerseNumber && <VerseNumber label={verseLabel} />}
      {useRlw
        ? item.rlw_lines.map((rlwLine, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              <RedLetterLine sections={rlwLine} />
            </span>
          ))
        : item.lines.map((lineText, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              {lineText}
            </span>
          ))}
    </span>
  )
}

/**
 * Renders non-verse structural elements (section titles, headings, labels).
 * Each type maps to an appropriate typographic weight and heading tag.
 */
function HeadingBlock({ item }: { item: ChapterItem }) {
  const text = item.lines[0]

  switch (item.type) {
    case 'section1':
      return (
        <h2 className='pt-2 text-sm font-black uppercase tracking-widest text-stone-800 first:pt-0'>
          {text}
        </h2>
      )
    case 'section2':
      return (
        <h3 className='pt-2 text-sm font-extrabold uppercase tracking-wide text-stone-800 first:pt-0'>
          {text}
        </h3>
      )
    case 'heading1':
      return (
        <h4 className='pt-1 text-xs font-bold text-stone-600 first:pt-0'>
          {text}
        </h4>
      )
    case 'heading2':
      return (
        <h5 className='pt-1 text-xs font-semibold text-stone-500 first:pt-0'>
          {text}
        </h5>
      )
    case 'label':
      return <p className='text-xs italic text-stone-400'>{text}</p>
    default:
      return null
  }
}

/**
 * Renders a paragraph containing one or more inline verses.
 * Consecutive verses flow inline together separated by a single space.
 */
function ParagraphBlock({
  verses,
}: {
  verses: { item: ChapterItem; showVerseNumber: boolean }[]
}) {
  return (
    <p className='text-xs leading-relaxed text-stone-700'>
      {verses.map(({ item, showVerseNumber }, i) => (
        <span key={i}>
          {i > 0 && ' '}
          <VerseItem item={item} showVerseNumber={showVerseNumber} />
        </span>
      ))}
    </p>
  )
}

function NoticePanel({ notices }: { notices: string[] }) {
  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3'>
      <p className='mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700'>
        <span>⚠</span>
        <span>Dev notice — check the JSON</span>
      </p>
      <ul className='space-y-1'>
        {notices.map((notice, i) => (
          <li key={i} className='flex gap-2 text-xs text-amber-800'>
            <span className='mt-px shrink-0 text-amber-500'>›</span>
            <span>{notice}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChapterCard({ item }: { item: ItemToPrint }) {
  const { version, chapter, notice } = item
  const [activeTab, setActiveTab] = useState<Tab>('text')

  // Group the flat list of chapter items into logical blocks (headings and verse paragraphs)
  const blocks = useMemo(
    () => groupChapterItems(chapter.items),
    [chapter.items],
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'text', label: 'Biblical text' },
    { id: 'json', label: 'JSON source' },
  ]

  return (
    <article className='overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm'>
      {/* ── Card header: developer metadata ── */}
      <header className='border-b border-stone-100 bg-stone-50 px-4 py-3 sm:px-5'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-sm font-bold text-stone-800'>
              {chapter.human}
            </h2>
            <p className='mt-0.5 text-xs text-stone-500'>
              <span className='font-mono text-stone-400'>{chapter.usfm}</span>
              {' · '}
              {version.local_title}{' '}
              <span className='font-mono text-stone-400'>
                ({version.local_abbreviation})
              </span>
              {' · '}
              {version.language.local_name}
            </p>
          </div>
          <span className='rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-mono text-stone-400'>
            {version.language.language_tag}
          </span>
        </div>
      </header>

      <div className='px-4 py-4 sm:px-5'>
        {/* ── Dev notices (outside tabs) ── */}
        {notice.length > 0 && (
          <div className='mb-4'>
            <NoticePanel notices={notice} />
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className='mb-3 flex gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                activeTab === tab.id
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Biblical text ── */}
        {activeTab === 'text' && (
          <div className='space-y-3 rounded-lg border border-stone-100 bg-stone-50/60 px-4 py-4'>
            {blocks.map((block, i) =>
              block.type === 'heading' ? (
                <HeadingBlock key={i} item={block.item} />
              ) : (
                <ParagraphBlock key={i} verses={block.verses} />
              ),
            )}
          </div>
        )}

        {/* ── Tab: JSON source ── */}
        {activeTab === 'json' && (
          <ReactJsonView
            src={chapter.items}
            name={null}
            theme='google'
            displayArrayKey={false}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
          />
        )}
      </div>
    </article>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [loading, setLoading] = useState(true)
  const [itemsToPrint, setItemsToPrint] = useState<ItemToPrint[]>([])

  useEffect(() => {
    const getData = async () => {
      try {
        // Fetch all sample chapters in parallel for faster initial loading
        const fetchedItems = await Promise.all(
          CHAPTERS_TO_FIND.map(async (chapterToFind) => {
            const response = await fetch(chapterToFind.bookUrl)
            const version: Version = await response.json()

            const bookUsfm = chapterToFind.chapterUsfm.split('.')[0]
            const book = version.books.find((b) => b.usfm === bookUsfm)
            const foundChapter = book?.chapters.find(
              (c) => c.usfm === chapterToFind.chapterUsfm,
            )

            if (!foundChapter) {
              return null
            }

            return {
              version,
              chapter: foundChapter,
              notice: chapterToFind.notice,
            }
          }),
        )

        setItemsToPrint(
          fetchedItems.filter((item): item is ItemToPrint => item !== null),
        )
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, [])

  return (
    <div className='min-h-screen bg-stone-100'>
      {/* ── Page header ── */}
      <header className='border-b border-stone-200 bg-white px-4 py-5 sm:px-6'>
        <div className='mx-auto max-w-2xl'>
          <div className='flex items-start justify-between gap-4'>
            <h1 className='text-lg font-bold text-stone-800'>
              Reading JSON files
            </h1>
            <a
              href='https://github.com/mrk214/reading-json-files'
              target='_blank'
              rel='noreferrer'
              className='shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700'
            >
              GitHub ↗
            </a>
          </div>
          <p className='mt-1.5 text-xs text-stone-500'>
            This website is an example implementation, and its code was written
            by an AI.
          </p>

          <p className='mt-1.5 text-xs text-stone-500'>
            Each card below renders a Bible chapter fetched from the data.
          </p>

          <p className='mt-1.5 text-xs text-stone-500'>
            The chapters shown were deliberately chosen — each one illustrates a
            specific structural difference in the JSON that is worth paying
            attention to. The amber panels point out exactly what to look for
            directly in the JSON source.
          </p>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6'>
        {loading ? (
          <Loader />
        ) : (
          <div className='flex flex-col gap-6'>
            {itemsToPrint.map((item, i) => (
              <ChapterCard key={i} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
