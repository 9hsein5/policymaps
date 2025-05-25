export class SmartSearchService {
  // Process natural language query into structured search parameters
  processNaturalLanguageQuery(query: string) {
    // Extract location information
    const locationMatch = query.match(/near|in|around|at\s+([a-zA-Z\s,]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : null;
    
    // Extract category information
    const categoryMatches = [
      { pattern: /health|healthcare|hospital|clinic/i, category: 'Health' },
      { pattern: /education|school|university|college/i, category: 'Education' },
      { pattern: /housing|home|apartment|residence/i, category: 'Housing' },
      { pattern: /economic|business|job|employment/i, category: 'Economic Opportunity' },
      { pattern: /population|demographic|people/i, category: 'Population' }
    ];
    
    const categories = categoryMatches
      .filter(match => match.pattern.test(query))
      .map(match => match.category);
    
    // Extract time-based filters
    const timeMatch = query.match(/from\s+(\d{4})|since\s+(\d{4})|before\s+(\d{4})|after\s+(\d{4})/i);
    const timeFilter = timeMatch ? timeMatch[0] : null;
    
    return {
      originalQuery: query,
      location,
      categories,
      timeFilter,
      // Clean query with entities removed for keyword search
      cleanQuery: this.cleanQuery(query)
    };
  }
  
  private cleanQuery(query: string): string {
    // Remove location phrases
    let clean = query.replace(/near|in|around|at\s+([a-zA-Z\s,]+)/i, '');
    
    // Remove time phrases
    clean = clean.replace(/from\s+(\d{4})|since\s+(\d{4})|before\s+(\d{4})|after\s+(\d{4})/i, '');
    
    // Trim and normalize whitespace
    return clean.replace(/\s+/g, ' ').trim();
  }
}
