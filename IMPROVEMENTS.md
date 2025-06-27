# Strapi MCP v0.2.1 - Article Creation Improvements

## Problem Solved

**Issue**: LLMs consistently failed when creating articles through MCP due to unclear field names and validation errors. Common problems included:
- Using `coverImage` instead of `cover` 
- Placing SEO fields at root level instead of in `blocks` array
- Exceeding description character limits
- No clear guidance on correct structure

## Solution Implemented

### 1. Enhanced Method Descriptions

**`create_entry` method** now includes:
- Detailed article structure example
- Clear field name corrections (`cover` not `coverImage`)
- SEO block structure explanation  
- Character limit warnings

**`get_entries` method** now emphasizes:
- Using `populate="*"` to see full structure
- Specific examples for articles

### 2. New Method: `get_article_structure_example`

This method provides:
- Complete example based on real article structure
- Template for correct data format
- Field explanations and validation rules
- Comparison between correct and incorrect approaches

### 3. Built-in Validation

Added validation in `createEntry` function for articles:
- **`coverImage` detection**: Clear error pointing to use `cover` instead
- **Description length check**: Enforces 80-character limit with exact count
- **SEO field detection**: Redirects to use `blocks` array structure
- **Helpful error messages**: Each error includes exact fix instructions

### 4. Comprehensive Documentation

Created `docs/article-creation-guide.md` with:
- Before/after examples of common mistakes
- Step-by-step usage instructions
- Tips specifically for LLM usage
- Complete working examples

## Technical Implementation

### Code Changes

1. **Enhanced tool descriptions** with embedded examples
2. **New function `getArticleStructureExample()`** that:
   - Fetches real article with `populate="*"`
   - Creates template based on actual structure
   - Provides fallback template if no articles exist
3. **Validation logic** in `createEntry()` with specific error messages
4. **Method registration** and handler for new tool

### Testing Results

All validation scenarios tested successfully:
- ✅ `coverImage` field rejected with helpful error
- ✅ Long descriptions rejected with character count
- ✅ SEO fields in wrong place rejected with solution
- ✅ Correct article structure creates successfully

## Benefits

### For Users
- **No more trial and error** - clear guidance from the start
- **Immediate feedback** - validation errors include exact fixes
- **Real examples** - based on actual Strapi structure

### For LLMs
- **Detailed method descriptions** reduce guesswork
- **Structure examples** provide copy-paste templates
- **Validation errors** teach correct patterns
- **Consistent success** in article creation

## Usage Examples

### Get Structure Help
```javascript
// New method to understand article structure
get_article_structure_example()
```

### View Real Articles  
```javascript
// See actual structure with all relations
get_entries('api::articles.articles', '{"populate": "*"}')
```

### Create Article Correctly
```javascript
create_entry('api::articles.articles', {
  title: "My Article",
  description: "Short description under 80 chars",
  slug: "my-article", 
  content: "<p>Content</p>",
  author: 1,
  cover: 14,  // NOT coverImage!
  publishedAt: null,
  blocks: [{   // SEO goes here, not at root level
    __component: "shared.seo",
    metaTitle: "SEO Title",
    metaDescription: "SEO Description", 
    keyWords: "keywords, here"
  }]
})
```

## Result

**Before**: Article creation consistently failed with cryptic validation errors
**After**: Article creation succeeds reliably with clear guidance and helpful error messages

The MCP server now provides the information and validation needed for LLMs to create articles successfully on the first try. 