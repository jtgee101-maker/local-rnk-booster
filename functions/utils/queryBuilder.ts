/**
 * Query Builder Utility for LocalRnk
 * Provides standardized pagination, sorting, filtering, and projection
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 1 | -1;
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  dateRange?: {
    field: string;
    start?: Date;
    end?: Date;
  };
}

export interface QueryOptions extends PaginationOptions, SortOptions, FilterOptions {
  projection?: Record<string, 0 | 1>;
  populate?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class QueryBuilder {
  private query: any = {};
  private sort: any = {};
  private projection: any = {};
  private pagination: { skip: number; limit: number } = { skip: 0, limit: 50 };

  /**
   * Build filter query from options
   */
  static buildFilter(options: FilterOptions): any {
    const query: any = {};

    // Text search across multiple fields
    if (options.search && options.searchFields?.length) {
      query.$or = options.searchFields.map(field => ({
        [field]: { $regex: options.search, $options: 'i' }
      }));
    }

    // Apply specific filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = value;
        }
      }
    }

    // Date range filtering
    if (options.dateRange) {
      const { field, start, end } = options.dateRange;
      query[field] = {};
      if (start) query[field].$gte = start;
      if (end) query[field].$lte = end;
    }

    return query;
  }

  /**
   * Build sort object from options
   */
  static buildSort(options: SortOptions): any {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const order = sortOrder === 'asc' || sortOrder === 1 ? 1 : -1;
    return { [sortBy]: order };
  }

  /**
   * Build pagination from options
   */
  static buildPagination(options: PaginationOptions): { skip: number; limit: number } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = options.skip !== undefined ? options.skip : (page - 1) * limit;
    return { skip, limit };
  }

  /**
   * Build optimized projection to reduce data transfer
   */
  static buildProjection(fields?: string[] | Record<string, 0 | 1>): any {
    if (!fields) return {};
    
    if (Array.isArray(fields)) {
      const projection: Record<string, 1> = {};
      for (const field of fields) {
        projection[field] = 1;
      }
      return projection;
    }
    
    return fields;
  }

  /**
   * Build exclusion projection (fields to exclude)
   */
  static buildExclusionProjection(fields: string[]): Record<string, 0> {
    const projection: Record<string, 0> = {};
    for (const field of fields) {
      projection[field] = 0;
    }
    return projection;
  }

  /**
   * Execute paginated query
   */
  static async executePaginated<T>(
    collection: any,
    options: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const filter = this.buildFilter(options);
    const sort = this.buildSort(options);
    const { skip, limit } = this.buildPagination(options);
    const projection = this.buildProjection(options.projection);

    // Execute count and find in parallel
    const [data, totalCount] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .project(projection)
        .toArray(),
      collection.countDocuments(filter)
    ]);

    const page = options.page || 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Build aggregation pipeline with optimization hints
   */
  static buildAggregationPipeline(
    matchStage: any,
    options: {
      groupBy?: string;
      aggregations?: Record<string, any>;
      sort?: any;
      limit?: number;
      skip?: number;
      lookup?: any[];
      unwind?: string[];
      project?: any;
    }
  ): any[] {
    const pipeline: any[] = [];

    // Match stage first for index usage
    if (matchStage && Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Lookups before grouping
    if (options.lookup) {
      pipeline.push(...options.lookup);
    }

    // Unwind if needed
    if (options.unwind) {
      for (const field of options.unwind) {
        pipeline.push({ $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: true } });
      }
    }

    // Group stage
    if (options.groupBy) {
      const groupStage: any = {
        _id: `$${options.groupBy}`
      };
      
      if (options.aggregations) {
        Object.assign(groupStage, options.aggregations);
      }
      
      pipeline.push({ $group: groupStage });
    }

    // Sort
    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }

    // Skip
    if (options.skip) {
      pipeline.push({ $skip: options.skip });
    }

    // Limit
    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }

    // Final projection
    if (options.project) {
      pipeline.push({ $project: options.project });
    }

    return pipeline;
  }

  /**
   * Create index hint for query optimization
   */
  static getIndexHint(collection: string, query: any): string | object | null {
    const hints: Record<string, any> = {
      users: {
        email: { email: 1 },
        role: { role: 1 },
        tenant: { tenantId: 1 },
        email_role: { email: 1, role: 1 },
        tenant_role: { tenantId: 1, role: 1 },
        created: { createdAt: -1 }
      },
      tenants: {
        status: { status: 1 },
        plan: { plan: 1 },
        domain: { domain: 1 },
        status_plan: { status: 1, plan: 1 }
      },
      orders: {
        user: { userId: 1 },
        status: { status: 1 },
        created: { createdAt: -1 },
        user_status: { userId: 1, status: 1 },
        status_created: { status: 1, createdAt: -1 }
      },
      leads: {
        status: { status: 1 },
        score: { score: -1 },
        source: { source: 1 },
        assigned: { assignedTo: 1 },
        status_score: { status: 1, score: -1 }
      },
      campaigns: {
        status: { status: 1 },
        dates: { startDate: 1, endDate: 1 },
        status_dates: { status: 1, startDate: 1 }
      },
      reviews: {
        business: { businessId: 1 },
        rating: { rating: -1 },
        date: { date: -1 },
        business_rating: { businessId: 1, rating: -1 }
      },
      errorLogs: {
        timestamp: { timestamp: -1 },
        severity: { severity: 1 },
        type: { type: 1 },
        severity_timestamp: { severity: 1, timestamp: -1 }
      }
    };

    const collectionHints = hints[collection];
    if (!collectionHints) return null;

    // Find matching hint based on query fields
    const queryFields = Object.keys(query);
    
    for (const [hintName, hint] of Object.entries(collectionHints)) {
      const hintFields = Object.keys(hint);
      if (hintFields.every(f => queryFields.includes(f))) {
        return hint;
      }
    }

    return null;
  }
}

// Preset query builders for common operations
export const presetQueries = {
  /**
   * Active users query
   */
  activeUsers: (days: number = 30) => ({
    lastLoginAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }),

  /**
   * Date range query
   */
  dateRange: (field: string, start?: Date, end?: Date) => {
    const query: any = {};
    if (start || end) {
      query[field] = {};
      if (start) query[field].$gte = start;
      if (end) query[field].$lte = end;
    }
    return query;
  },

  /**
   * Text search query
   */
  textSearch: (fields: string[], search: string) => ({
    $or: fields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }))
  }),

  /**
   * Status query with optional date range
   */
  statusWithDateRange: (status: string, dateField: string = 'createdAt', days?: number) => {
    const query: any = { status };
    if (days) {
      query[dateField] = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    return query;
  }
};

// Pagination helpers
export const pagination = {
  /**
   * Calculate skip value
   */
  skip: (page: number, limit: number): number => (page - 1) * limit,

  /**
   * Calculate total pages
   */
  totalPages: (total: number, limit: number): number => Math.ceil(total / limit),

  /**
   * Validate and normalize options
   */
  normalize: (options: PaginationOptions): { page: number; limit: number; skip: number } => {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = options.skip !== undefined ? options.skip : (page - 1) * limit;
    return { page, limit, skip };
  }
};

export default QueryBuilder;
