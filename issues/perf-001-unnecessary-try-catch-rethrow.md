# Issue: Remove unnecessary try-catch blocks that only re-throw errors

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | N/A (general anti-pattern) |
| **Priority** | MEDIUM |
| **Impact** | Code noise, unnecessary stack trace additions, no error transformation |
| **Affected Files** | `app/src/application-services/*/get-*.ts` |

## Problem Description

Multiple query service files contain try-catch blocks that catch errors only to immediately re-throw them without any transformation, logging, or handling. These patterns add code noise and serve no purpose.

### Current Code

**get-articles.ts (lines 91-93):**
```tsx
} catch (error) {
    throw error;
}
```

**get-articles.ts (lines 111-115):**
```tsx
try {
    return await articlesQueryRepository.count(userId, status);
} catch (error) {
    throw error;
}
```

**get-books.ts (lines 75-77, 91-96, 143-145):**
```tsx
} catch (error) {
    throw error;
}
```

**get-images.ts (lines 48-52, 88-90):**
```tsx
} catch (error) {
    throw error;
}
```

**get-notes.ts (lines 76-78, 92-96, 141-145):**
```tsx
} catch (error) {
    throw error;
}
```

### Issues

1. `catch (error) { throw error; }` is functionally identical to not having try-catch at all
2. Adds unnecessary code noise and cognitive overhead
3. May slightly modify stack traces without providing any benefit
4. Inconsistent with `_getCategories` in get-articles.ts which actually handles errors properly

## Proposed Solution

Remove the unnecessary try-catch blocks entirely. Errors will naturally propagate to callers.

Note: `_getCategories` in get-articles.ts is correctly handling errors by dispatching an event and returning a fallback - this should NOT be changed.

### Refactored Code

**Before:**
```tsx
const _getArticlesCount = async (
    userId: UserId,
    status: Status,
): Promise<number> => {
    "use cache";
    cacheTag(buildCountCacheTag("articles", status, userId));
    try {
        return await articlesQueryRepository.count(userId, status);
    } catch (error) {
        throw error;
    }
};
```

**After:**
```tsx
const _getArticlesCount = async (
    userId: UserId,
    status: Status,
): Promise<number> => {
    "use cache";
    cacheTag(buildCountCacheTag("articles", status, userId));
    return await articlesQueryRepository.count(userId, status);
};
```

## Implementation Steps

1. [ ] Remove try-catch in `_getArticles` (get-articles.ts:62-93)
2. [ ] Remove try-catch in `_getArticlesCount` (get-articles.ts:111-115)
3. [ ] Remove try-catch in `_getBooks` (get-books.ts:53-77)
4. [ ] Remove try-catch in `_getBooksCount` (get-books.ts:91-96)
5. [ ] Remove try-catch in `getBookByISBN` (get-books.ts:140-145)
6. [ ] Remove try-catch in `_getImagesCount` (get-images.ts:48-52)
7. [ ] Remove try-catch in `_getImages` (get-images.ts:71-90)
8. [ ] Remove try-catch in `_getNotes` (get-notes.ts:55-78)
9. [ ] Remove try-catch in `_getNotesCount` (get-notes.ts:92-96)
10. [ ] Remove try-catch in `getNoteByTitle` (get-notes.ts:141-146)

## Related Patterns

- Keep the error handling in `_getCategories` (get-articles.ts:126-146) as it properly handles errors with event dispatch and fallback return
