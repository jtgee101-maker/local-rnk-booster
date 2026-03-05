/**
 * Database Index Migration Script
 * Applies optimized indexes to all collections
 * 
 * Usage:
 *   - Run in base44 function environment
 *   - Can be run incrementally or as full migration
 * 
 * Options:
 *   - dryRun: Preview changes without applying
 *   - collections: Only migrate specific collections
 *   - dropExisting: Drop and recreate existing indexes
 */

import { allIndexes, getIndexCreationOrder, IndexDefinition } from '../utils/indexDefinitions';

interface MigrationOptions {
  dryRun?: boolean;
  collections?: string[];
  dropExisting?: boolean;
  background?: boolean;
}

interface MigrationResult {
  success: boolean;
  collection: string;
  indexesCreated: string[];
  indexesFailed: { name: string; error: string }[];
  indexesSkipped: string[];
}

class IndexMigration {
  private db: any;
  private results: MigrationResult[] = [];

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Run full index migration
   */
  async migrate(options: MigrationOptions = {}): Promise<{
    success: boolean;
    results: MigrationResult[];
    summary: {
      totalCollections: number;
      totalIndexesCreated: number;
      totalIndexesFailed: number;
      totalIndexesSkipped: number;
    }
  }> {
    const indexesToApply = options.collections
      ? allIndexes.filter(idx => options.collections?.includes(idx.collection))
      : allIndexes;

    // Group by collection
    const byCollection = this.groupByCollection(indexesToApply);
    const creationOrder = getIndexCreationOrder();

    // Process collections in order
    for (const collectionName of creationOrder) {
      if (byCollection[collectionName]) {
        const result = await this.migrateCollection(
          collectionName,
          byCollection[collectionName],
          options
        );
        this.results.push(result);
      }
    }

    // Process any remaining collections not in order
    for (const [collectionName, indexes] of Object.entries(byCollection)) {
      if (!creationOrder.includes(collectionName)) {
        const result = await this.migrateCollection(collectionName, indexes, options);
        this.results.push(result);
      }
    }

    return {
      success: this.results.every(r => r.success),
      results: this.results,
      summary: this.generateSummary()
    };
  }

  /**
   * Migrate a single collection
   */
  private async migrateCollection(
    collectionName: string,
    indexes: IndexDefinition[],
    options: MigrationOptions
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      collection: collectionName,
      indexesCreated: [],
      indexesFailed: [],
      indexesSkipped: []
    };

    try {
      const collection = this.db.collections[collectionName];
      
      if (!collection) {
        console.warn(`Collection '${collectionName}' not found, skipping...`);
        result.indexesSkipped.push(...indexes.map(i => i.name));
        return result;
      }

      // Get existing indexes
      const existingIndexes = await collection.indexes?.() || [];
      const existingNames = new Set(existingIndexes.map((idx: any) => idx.name));

      for (const indexDef of indexes) {
        try {
          // Check if index already exists
          if (existingNames.has(indexDef.name)) {
            if (options.dropExisting) {
              if (!options.dryRun) {
                await collection.dropIndex(indexDef.name);
              }
              // Index dropped (or would be dropped in dry-run)
            } else {
              result.indexesSkipped.push(indexDef.name);
              // Index already exists, skipping
              continue;
            }
          }

          // Apply index options
          const indexOptions = {
            name: indexDef.name,
            background: options.background !== false,
            ...indexDef.options
          };

          if (options.dryRun) {
            // Would create index in dry-run mode
            result.indexesCreated.push(indexDef.name);
          } else {
            // Create the index
            await collection.createIndex(indexDef.keys, indexOptions);
            result.indexesCreated.push(indexDef.name);
          }
        } catch (error) {
          console.error(`Failed to create index ${indexDef.name}:`, error);
          result.indexesFailed.push({
            name: indexDef.name,
            error: error.message || 'Unknown error'
          });
        }
      }

      result.success = result.indexesFailed.length === 0;
    } catch (error) {
      console.error(`Failed to migrate collection ${collectionName}:`, error);
      result.success = false;
    }

    return result;
  }

  /**
   * Group indexes by collection
   */
  private groupByCollection(indexes: IndexDefinition[]): Record<string, IndexDefinition[]> {
    const grouped: Record<string, IndexDefinition[]> = {};
    
    for (const index of indexes) {
      if (!grouped[index.collection]) {
        grouped[index.collection] = [];
      }
      grouped[index.collection].push(index);
    }
    
    return grouped;
  }

  /**
   * Generate migration summary
   */
  private generateSummary() {
    return {
      totalCollections: this.results.length,
      totalIndexesCreated: this.results.reduce((sum, r) => sum + r.indexesCreated.length, 0),
      totalIndexesFailed: this.results.reduce((sum, r) => sum + r.indexesFailed.length, 0),
      totalIndexesSkipped: this.results.reduce((sum, r) => sum + r.indexesSkipped.length, 0)
    };
  }

  /**
   * Verify indexes exist and are being used
   */
  async verifyIndexes(collectionName?: string): Promise<{
    collection: string;
    expected: string[];
    actual: string[];
    missing: string[];
    extra: string[];
  }[]> {
    const results = [];
    const collections = collectionName 
      ? [collectionName]
      : [...new Set(allIndexes.map(i => i.collection))];

    for (const collName of collections) {
      const expected = allIndexes
        .filter(i => i.collection === collName)
        .map(i => i.name);

      try {
        const collection = this.db.collections[collName];
        const actualIndexes = collection 
          ? await collection.indexes?.() || []
          : [];
        const actual = actualIndexes.map((idx: any) => idx.name);

        results.push({
          collection: collName,
          expected,
          actual,
          missing: expected.filter(e => !actual.includes(e)),
          extra: actual.filter(a => !expected.includes(a) && a !== '_id_')
        });
      } catch (error) {
        results.push({
          collection: collName,
          expected,
          actual: [],
          missing: expected,
          extra: []
        });
      }
    }

    return results;
  }

  /**
   * Drop all custom indexes (use with caution!)
   */
  async dropAllIndexes(excludeSystem: boolean = true): Promise<{
    collection: string;
    dropped: string[];
    errors: string[];
  }[]> {
    const results = [];
    const collections = [...new Set(allIndexes.map(i => i.collection))];

    for (const collName of collections) {
      const dropped: string[] = [];
      const errors: string[] = [];

      try {
        const collection = this.db.collections[collName];
        if (!collection) continue;

        const indexes = await collection.indexes?.() || [];
        
        for (const index of indexes) {
          // Skip system index on _id
          if (excludeSystem && index.name === '_id_') continue;

          try {
            await collection.dropIndex(index.name);
            dropped.push(index.name);
          } catch (error) {
            errors.push(`Failed to drop ${index.name}: ${error.message}`);
          }
        }

        results.push({ collection: collName, dropped, errors });
      } catch (error) {
        results.push({
          collection: collName,
          dropped,
          errors: [...errors, error.message]
        });
      }
    }

    return results;
  }
}

interface IndexMigrationRequest {
  data?: {
    dryRun?: boolean;
    collections?: string[] | null;
    dropExisting?: boolean;
    background?: boolean;
    action?: 'migrate' | 'verify' | 'drop';
  };
  user?: {
    role: string;
  };
  base44?: {
    db: {
      collections: Record<string, unknown>;
    };
  };
}

/**
 * Base44 function handler for running migrations
 */
export async function runIndexMigration(request: IndexMigrationRequest) {
  const { 
    dryRun = false, 
    collections = null, 
    dropExisting = false,
    background = true,
    action = 'migrate'
  } = request.data || {};

  // Verify admin access
  const currentUser = request.user;
  if (!currentUser || !['admin', 'super-admin'].includes(currentUser.role)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const base44 = request.base44;
  if (!base44) {
    return {
      success: false,
      error: 'Base44 client not available'
    };
  }

  const migrator = new IndexMigration(base44.db);

  try {
    switch (action) {
      case 'migrate': {
        const result = await migrator.migrate({
          dryRun,
          collections: collections || undefined,
          dropExisting,
          background
        });

        return {
          success: result.success,
          data: {
            dryRun,
            ...result
          }
        };
      }

      case 'verify': {
        const verification = await migrator.verifyIndexes(collections?.[0]);
        return {
          success: true,
          data: { verification }
        };
      }

      case 'drop': {
        if (!dropExisting) {
          return {
            success: false,
            error: 'Must set dropExisting: true to drop indexes'
          };
        }
        const dropped = await migrator.dropAllIndexes();
        return {
          success: true,
          data: { dropped }
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Migration failed'
    };
  }
}

export default IndexMigration;
