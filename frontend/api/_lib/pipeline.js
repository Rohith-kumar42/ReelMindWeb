import { scrapeInstagram } from './scraper/instagram.js'
import { scrapeLink } from './scraper/link.js'
import { generateEmbedding } from './ai/embedder.js'
import { classifyContent } from './ai/classifier.js'
import { checkDuplicate } from './ai/dedup.js'
import { supabaseAdmin } from './supabase.js'

const CATEGORY_COLORS = ['#4442a8', '#2f8a6b', '#c6533c', '#b7791f', '#3a6ea5', '#8b5a2b']

export class DuplicateContentError extends Error {
  constructor(existingItem) {
    super('Already saved')
    this.code = 'DUPLICATE_CONTENT'
    this.existingItem = existingItem
  }
}

function buildContext(reelData, linkData, notes = '') {
  return [
    reelData?.title,
    reelData?.caption,
    reelData?.description,
    linkData?.title,
    linkData?.description,
    notes,
  ].filter(Boolean).join('\n\n').slice(0, 30000)
}

function slugIcon(name = '') {
  const lower = name.toLowerCase()
  if (lower.includes('ai')) return 'sparkles'
  if (lower.includes('design')) return 'palette'
  if (lower.includes('market')) return 'megaphone'
  if (lower.includes('develop')) return 'code'
  return 'bookmark'
}

async function getOrCreateCategory(name, userId) {
  const categoryName = name || 'Resources'

  const { data: existing, error: findError } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', categoryName)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing

  const color = CATEGORY_COLORS[Math.abs(categoryName.length) % CATEGORY_COLORS.length]
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ user_id: userId, name: categoryName, color, icon: slugIcon(categoryName) })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function createContent(payload, userId) {
  const { data, error } = await supabaseAdmin
    .from('content_items')
    .insert({
      user_id: userId,
      category_id: payload.category.id,
      reel_url: payload.reelUrl,
      link_url: payload.linkUrl || null,
      title: payload.title,
      summary: payload.summary,
      notes: payload.notes || null,
      thumbnail_url: payload.thumbnail_url || null,
      content_type: payload.content_type,
      tags: payload.tags,
      confidence: payload.confidence,
      embedding: payload.embedding,
      is_favorite: false,
      view_count: 0,
    })
    .select('*, categories(*)')
    .single()

  if (error) throw error
  return data
}

export async function runPipeline({ reelUrl, linkUrl, notes = '', title: titleOverride, summary: summaryOverride, save = false, userId }) {
  if (!reelUrl || !reelUrl.startsWith('http')) {
    const err = new Error('A valid reel URL is required.')
    err.status = 400
    throw err
  }

  const reelData = await scrapeInstagram(reelUrl)
  const linkData = linkUrl ? await scrapeLink(linkUrl) : null
  const context = buildContext(reelData, linkData, notes)
  const embedding = await generateEmbedding(context)
  const duplicate = await checkDuplicate(embedding, userId)
  if (duplicate.isDuplicate) throw new DuplicateContentError(duplicate.existingItem)

  const classification = await classifyContent(context)
  const title = titleOverride || reelData?.title || linkData?.title || 'Untitled save'
  const summary = summaryOverride || reelData?.description || linkData?.description || context.slice(0, 220) || 'No summary available yet.'
  const thumbnail_url = reelData?.thumbnail_url || linkData?.thumbnail_url || null

  const preview = {
    reelUrl,
    linkUrl: linkUrl || null,
    notes,
    title,
    summary,
    thumbnail_url,
    reel: reelData,
    link: linkData,
    category: classification.category,
    subcategory: classification.subcategory,
    content_type: classification.content_type,
    tags: classification.tags,
    confidence: classification.confidence,
  }

  if (!save) return { preview, duplicate: false }

  const category = await getOrCreateCategory(classification.category, userId)
  const item = await createContent({ ...preview, category, embedding }, userId)

  return { item, preview, duplicate: false }
}
