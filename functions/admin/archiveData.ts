/**
 * Data Archiving Strategy for LocalRnk
 * 
 * Policies:
 * - Audit logs: Archive after 90 days, delete after 2 years
 * - Notifications: Archive after 30 days, delete after 1 year  
 * - Error logs: Delete after 90 days (TTL index)
 * - User sessions: Delete after 30 days of inactivity
 * - Soft deletes: Keep for 30 days then hard delete
 * 
 * Compliance: GDPR, CCPA ready
 */

interface ArchiveConfig {
  sourceCollection: string;
  archiveCollection: string;
  retentionDays: number;
  dateField: string;
  archiveAfterDays: number;
  hardDeleteAfterDays: number;
  batchSize: number;
  complianceFields?: string[]; // Fields to anonymize
}

interface ArchiveResult {
  sourceCollection: string;
  archived: number;
  deleted: number;
  failed: number;
  errors: string[];
}

interface ArchiveStats {
  collection: string;
  totalDocuments: number;
  eligibleForArchive: number;
  eligibleForDelete: number;
  storageSize: number;
}

class DataArchiver {
  private db: any;
  private archiveDb: any; // Separate archive database connection

  constructor(db: any, archiveDb?: any) {
    this.db = db;
    this.archiveDb = archiveDb || db; // Can be same db with archive_ prefix
  }

  /**
   * Default archive configurations
   */
  static readonly DEFAULT_CONFIGS: ArchiveConfig[] = [
    {
      sourceCollection: 'adminLogs',
      archiveCollection: 'archived_adminLogs',
      retentionDays: 730, // 2 years
      dateField: 'timestamp',
      archiveAfterDays: 90,
      hardDeleteAfterDays: 730,
      batchSize: 1000,
      complianceFields: ['adminId', 'ipAddress']
    },
    {
      sourceCollection: 'activityLogs',
      archiveCollection: 'archived_activityLogs',
      retentionDays: 365,
      dateField: 'timestamp',
      archiveAfterDays: 90,
      hardDeleteAfterDays: 365,
      batchSize: 1000,
      complianceFields: ['userId', 'ipAddress', 'userAgent']
    },
    {
      sourceCollection: 'notifications',
      archiveCollection: 'archived_notifications',
      retentionDays: 365,
      dateField: 'createdAt',
      archiveAfterDays: 30,
      hardDeleteAfterDays: 365,
      batchSize: 5000
    },
    {
      sourceCollection: 'emailLogs',
      archiveCollection: 'archived_emailLogs',
      retentionDays: 180,
      dateField: 'sentAt',
      archiveAfterDays: 60,
      hardDeleteAfterDays: 180,
      batchSize: 2000,
      complianceFields: ['recipient', 'metadata.ipAddress']
    },
    {
      sourceCollection: 'userSessions',
      archiveCollection: 'archived_userSessions',
      retentionDays: 90,
      dateField: 'lastActivityAt',
      archiveAfterDays: 30,
      hardDeleteAfterDays: 90,
      batchSize: 1000,
      complianceFields: ['ipAddress', 'userAgent']
    },
    {
      sourceCollection: 'requestLogs',
      archiveCollection: 'archived_requestLogs',
      retentionDays: 90,
      dateField: 'timestamp',
      archiveAfterDays: 30,
      hardDeleteAfterDays: 90,
      batchSize: 5000,
      complianceFields: ['ipAddress', 'userId']
    }
  ];

  /**
   * Run archiving for all configured collections
   */
  async archiveAll(dryRun: boolean = false): Promise<{
    results: ArchiveResult[];
    summary: {
      totalArchived: number;
      totalDeleted: number;
      totalFailed: number;
    }
  }> {
    const results: ArchiveResult[] = [];

    for (const config of DataArchiver.DEFAULT_CONFIGS) {
      try {
        const result = await this.archiveCollection(config, dryRun);
        results.push(result);
      } catch (error) {
        results.push({
          sourceCollection: config.sourceCollection,
          archived: 0,
          deleted: 0,
          failed: 0,
          errors: [error.message]
        });
      }
    }

    return {
      results,
      summary: {
        totalArchived: results.reduce((sum, r) => sum + r.archived, 0),
        totalDeleted: results.reduce((sum, r) => sum + r.deleted, 0),
        totalFailed: results.reduce((sum, r) => sum + r.failed, 0)
      }
    };
  }

  /**
   * Archive a specific collection
   */
  async archiveCollection(config: ArchiveConfig, dryRun: boolean = false): Promise<ArchiveResult> {
    const result: ArchiveResult = {
      sourceCollection: config.sourceCollection,
      archived: 0,
      deleted: 0,
      failed: 0,
      errors: []
    };

    const source = this.db.collections[config.sourceCollection];
    const archive = this.archiveDb.collections[config.archiveCollection];

    if (!source) {
      result.errors.push(`Source collection '${config.sourceCollection}' not found`);
      return result;
    }

    const now = new Date();
    const archiveThreshold = new Date(now.getTime() - config.archiveAfterDays * 24 * 60 * 60 * 1000);
    const deleteThreshold = new Date(now.getTime() - config.hardDeleteAfterDays * 24 * 60 * 60 * 1000);

    try {
      // Find documents eligible for archiving
      const archiveQuery = {
        [config.dateField]: { $lt: archiveThreshold },
        _archived: { $ne: true }
      };

      let hasMore = true;
      while (hasMore) {
        const docs = await source
          .find(archiveQuery)
          .limit(config.batchSize)
          .toArray();

        if (docs.length === 0) {
          hasMore = false;
          break;
        }

        for (const doc of docs) {
          try {
            if (!dryRun) {
              // Anonymize compliance fields
              const archivedDoc = this.anonymizeFields(doc, config.complianceFields);
              archivedDoc._archived = true;
              archivedDoc._archivedAt = new Date();
              archivedDoc._originalCollection = config.sourceCollection;

              // Insert to archive
              await archive.insertOne(archivedDoc);

              // Mark as archived in source (soft archive)
              await source.updateOne(
                { _id: doc._id },
                { 
                  $set: { 
                    _archived: true, 
                    _archivedAt: new Date() 
                  },
                  $unset: { 
                    // Remove heavy fields to save space
                    ...config.complianceFields?.reduce((acc, f) => ({ ...acc, [f]: 1 }), {})
                  }
                }
              );
            }
            result.archived++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to archive doc ${doc._id}: ${error.message}`);
          }
        }
      }

      // Hard delete old archived documents
      const deleteQuery = {
        _archived: true,
        [config.dateField]: { $lt: deleteThreshold }
      };

      if (!dryRun) {
        const deleteResult = await source.deleteMany(deleteQuery);
        result.deleted = deleteResult.deletedCount || 0;
      } else {
        const count = await source.countDocuments(deleteQuery);
        console.log(`[DRY RUN] Would delete ${count} documents from ${config.sourceCollection}`);
      }
    } catch (error) {
      result.errors.push(`Archive operation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Anonymize sensitive fields for compliance
   */
  private anonymizeFields(doc: any, fields?: string[]): any {
    if (!fields || fields.length === 0) return doc;

    const anonymized = { ...doc };
    
    for (const field of fields) {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        let current = anonymized;
        for (let i = 0; i < parts.length - 1; i++) {
          if (current[parts[i]]) {
            current = current[parts[i]];
          } else {
            break;
          }
        }
        const lastPart = parts[parts.length - 1];
        if (current[lastPart]) {
          current[lastPart] = '[ANONYMIZED]';
        }
      } else if (anonymized[field]) {
        anonymized[field] = '[ANONYMIZED]';
      }
    }

    return anonymized;
  }

  /**
   * Get archiving statistics
   */
  async getStats(): Promise<ArchiveStats[]> {
    const stats: ArchiveStats[] = [];

    for (const config of DataArchiver.DEFAULT_CONFIGS) {
      try {
        const collection = this.db.collections[config.sourceCollection];
        if (!collection) continue;

        const now = new Date();
        const archiveThreshold = new Date(now.getTime() - config.archiveAfterDays * 24 * 60 * 60 * 1000);
        const deleteThreshold = new Date(now.getTime() - config.hardDeleteAfterDays * 24 * 60 * 60 * 1000);

        const [
          totalDocuments,
          eligibleForArchive,
          eligibleForDelete,
          storageStats
        ] = await Promise.all([
          collection.countDocuments(),
          collection.countDocuments({
            [config.dateField]: { $lt: archiveThreshold },
            _archived: { $ne: true }
          }),
          collection.countDocuments({
            _archived: true,
            [config.dateField]: { $lt: deleteThreshold }
          }),
          collection.stats?.() || Promise.resolve({ storageSize: 0 })
        ]);

        stats.push({
          collection: config.sourceCollection,
          totalDocuments,
          eligibleForArchive,
          eligibleForDelete,
          storageSize: storageStats.storageSize || 0
        });
      } catch (error) {
        console.error(`Failed to get stats for ${config.sourceCollection}:`, error);
      }
    }

    return stats;
  }

  /**
   * Handle soft deletes with delayed hard deletion
   */
  async processSoftDeletes(collectionName: string, daysUntilHardDelete: number = 30): Promise<{
    softDeleted: number;
    hardDeleted: number;
  }> {
    const collection = this.db.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const deleteThreshold = new Date(Date.now() - daysUntilHardDelete * 24 * 60 * 60 * 1000);

    // Count soft deleted items
    const softDeleted = await collection.countDocuments({
      deletedAt: { $exists: true },
      _hardDeleted: { $ne: true }
    });

    // Hard delete old soft-deleted items
    const result = await collection.deleteMany({
      deletedAt: { $lt: deleteThreshold },
      _hardDeleted: { $ne: true }
    });

    return {
      softDeleted,
      hardDeleted: result.deletedCount || 0
    };
  }

  /**
   * Restore archived document
   */
  async restoreDocument(collectionName: string, documentId: string): Promise<boolean> {
    const config = DataArchiver.DEFAULT_CONFIGS.find(c => c.sourceCollection === collectionName);
    if (!config) {
      throw new Error(`No archive config found for collection '${collectionName}'`);
    }

    const archive = this.archiveDb.collections[config.archiveCollection];
    const source = this.db.collections[collectionName];

    // Find in archive
    const archivedDoc = await archive.findOne({ 
      _id: documentId,
      _originalCollection: collectionName 
    });

    if (!archivedDoc) {
      throw new Error('Archived document not found');
    }

    // Remove archive metadata
    delete archivedDoc._archived;
    delete archivedDoc._archivedAt;
    delete archivedDoc._originalCollection;

    // Restore to source
    await source.insertOne(archivedDoc);

    // Remove from archive
    await archive.deleteOne({ _id: documentId });

    return true;
  }
}

interface ArchiveRequest {
  data?: {
    dryRun?: boolean;
    action?: 'archive' | 'stats' | 'restore';
    collection?: string | null;
    documentId?: string | null;
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
 * Base44 function handler for data archiving
 */
export async function runDataArchiving(request: ArchiveRequest) {
  const {
    dryRun = true,
    action = 'archive',
    collection = null,
    documentId = null
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

  const archiver = new DataArchiver(base44.db);

  try {
    switch (action) {
      case 'archive': {
        if (collection) {
          const config = DataArchiver.DEFAULT_CONFIGS.find(c => c.sourceCollection === collection);
          if (!config) {
            return { success: false, error: `Unknown collection: ${collection}` };
          }
          const result = await archiver.archiveCollection(config, dryRun);
          return { success: true, data: { dryRun, result } };
        }
        
        const results = await archiver.archiveAll(dryRun);
        return { success: true, data: { dryRun, ...results } };
      }

      case 'stats': {
        const stats = await archiver.getStats();
        return { success: true, data: { stats } };
      }

      case 'restore': {
        if (!collection || !documentId) {
          return {
            success: false,
            error: 'Collection and documentId required for restore'
          };
        }
        await archiver.restoreDocument(collection, documentId);
        return { success: true, data: { restored: true } };
      }

      case 'softdelete': {
        if (!collection) {
          return { success: false, error: 'Collection required for soft delete processing' };
        }
        const result = await archiver.processSoftDeletes(collection);
        return { success: true, data: result };
      }

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default DataArchiver;
