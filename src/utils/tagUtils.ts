/**
 * Extract unique tags from an array of cases
 * @param cases Array of cases with tags property
 * @returns Array of unique tags sorted alphabetically
 */
export const extractUniqueTags = (cases: { tags: string[] | string }[]): string[] => {
  const allTags = new Set<string>();
  
  cases.forEach(caseItem => {
    let tagsList: string[] = [];
    
    if (typeof caseItem.tags === 'string') {
      try {
        const parsedTags = JSON.parse(caseItem.tags);
        tagsList = Array.isArray(parsedTags) ? parsedTags : [];
      } catch (error) {
        console.error('Error parsing tags:', error);
        tagsList = [];
      }
    } else if (Array.isArray(caseItem.tags)) {
      tagsList = caseItem.tags;
    }
    
    tagsList.forEach(tag => allTags.add(tag));
  });
  
  return Array.from(allTags).sort();
};
