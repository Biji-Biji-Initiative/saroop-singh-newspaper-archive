/**
 * Comprehensive Audit Trail Logger
 * Provides full JSON logging for all restoration operations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AuditLogger {
  constructor() {
    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'adk-restoration' },
      transports: [
        // Error log
        new winston.transports.File({ 
          filename: path.join(__dirname, '../..', 'logs', 'error.log'), 
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5
        }),
        // Combined log
        new winston.transports.File({ 
          filename: path.join(__dirname, '../..', 'logs', 'combined.log'),
          maxsize: 5242880,
          maxFiles: 10
        }),
        // Audit trail log (detailed)
        new winston.transports.File({
          filename: path.join(__dirname, '../..', 'logs', 'audit.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 20
        })
      ]
    });

    // Console logging for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }

    // Audit configuration
    this.auditDir = path.join(__dirname, '../..', 'audit');
    this.sessionAudits = new Map(); // sessionId -> audit entries
    this.initializeAuditDirectory();
  }

  async initializeAuditDirectory() {
    try {
      await fs.mkdir(this.auditDir, { recursive: true });
      await fs.mkdir(path.join(__dirname, '../..', 'logs'), { recursive: true });
    } catch (error) {
      console.error('Failed to initialize audit directories:', error);
    }
  }

  /**
   * Log session start
   */
  async logSessionStart(sessionId, sessionData) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'session_start',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        photoRecordId: sessionData.photoRecordId,
        workflowId: sessionData.workflowId,
        mode: sessionData.mode,
        startTime: sessionData.startTime,
        configuration: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development',
          geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        }
      },
      metadata: {
        version: '1.0',
        source: 'orchestrator'
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Session started', {
      eventType: 'session_start',
      sessionId: sessionId,
      photoRecordId: sessionData.photoRecordId
    });
  }

  /**
   * Log analysis step
   */
  async logAnalysisStep(sessionId, analysisInput, analysisResult, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'analysis_step',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        input: {
          imageMetadata: {
            hasImageData: !!analysisInput.imageData,
            imageSize: analysisInput.imageData ? Buffer.byteLength(analysisInput.imageData, 'base64') : 0
          },
          parameters: analysisInput.parameters || {}
        },
        result: analysisResult,
        performance: {
          processingTime: metadata.processingTime,
          modelUsed: metadata.modelUsed,
          temperature: metadata.temperature,
          tokenUsage: metadata.tokenUsage
        }
      },
      metadata: {
        step: 'analysis',
        agent: 'AnalysisAgent',
        success: !!analysisResult && !metadata.error,
        error: metadata.error?.message
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Analysis step completed', {
      eventType: 'analysis_step',
      sessionId: sessionId,
      success: auditEntry.metadata.success,
      processingTime: metadata.processingTime
    });
  }

  /**
   * Log planning step
   */
  async logPlanningStep(sessionId, planInput, planResult, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'planning_step',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        input: {
          analysis: planInput.analysis,
          mode: planInput.mode,
          constraints: planInput.constraints || {}
        },
        result: planResult,
        decisionProcess: {
          strategy: planResult.strategy,
          reasoning: planResult.reasoning,
          riskAssessment: planResult.riskLevel,
          estimatedSteps: planResult.estimatedSteps
        },
        performance: {
          processingTime: metadata.processingTime,
          modelUsed: metadata.modelUsed,
          temperature: metadata.temperature
        }
      },
      metadata: {
        step: 'planning',
        agent: 'PlannerAgent',
        success: !!planResult && !metadata.error,
        error: metadata.error?.message
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Planning step completed', {
      eventType: 'planning_step',
      sessionId: sessionId,
      strategy: planResult.strategy,
      stepsPlanned: planResult.steps?.length || 0,
      success: auditEntry.metadata.success
    });
  }

  /**
   * Log individual edit step
   */
  async logEditStep(sessionId, stepData, stepResult, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'edit_step',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        step: {
          stepNumber: stepData.stepNumber,
          action: stepData.action,
          prompt: stepData.prompt,
          temperature: stepData.temperature,
          expectedOutcome: stepData.expectedOutcome
        },
        input: {
          hasImageData: !!metadata.inputImageData,
          imageSize: metadata.inputImageData ? Buffer.byteLength(metadata.inputImageData, 'base64') : 0
        },
        result: {
          success: stepResult.success,
          imageGenerated: stepResult.imageGenerated,
          improvements: stepResult.improvements,
          nextStepRecommended: stepResult.nextStepRecommended,
          notes: stepResult.notes,
          hasOutputImage: !!metadata.outputImageData,
          outputImageSize: metadata.outputImageData ? Buffer.byteLength(metadata.outputImageData, 'base64') : 0
        },
        performance: {
          processingTime: stepResult.metadata?.processingTime,
          modelUsed: stepResult.metadata?.modelUsed,
          temperature: stepResult.metadata?.temperature,
          retryCount: metadata.retryCount || 0
        },
        qualityMetrics: metadata.qualityMetrics || {}
      },
      metadata: {
        step: 'editing',
        agent: 'EditorAgent',
        success: stepResult.success,
        stepNumber: stepData.stepNumber,
        action: stepData.action,
        error: metadata.error?.message
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Edit step completed', {
      eventType: 'edit_step',
      sessionId: sessionId,
      stepNumber: stepData.stepNumber,
      action: stepData.action,
      success: stepResult.success,
      processingTime: stepResult.metadata?.processingTime
    });
  }

  /**
   * Log validation step
   */
  async logValidationStep(sessionId, validationInput, validationResult, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'validation_step',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        input: {
          hasOriginalImage: !!validationInput.originalImageData,
          hasRestoredImage: !!validationInput.restoredImageData,
          plan: validationInput.plan,
          originalImageSize: validationInput.originalImageData ? Buffer.byteLength(validationInput.originalImageData, 'base64') : 0,
          restoredImageSize: validationInput.restoredImageData ? Buffer.byteLength(validationInput.restoredImageData, 'base64') : 0
        },
        result: validationResult,
        qualityAnalysis: {
          overallScore: validationResult.overallScore,
          criteriaBreakdown: validationResult.criteria,
          issues: validationResult.issues,
          recommendation: validationResult.recommendation,
          confidence: validationResult.confidence
        },
        performance: {
          processingTime: metadata.processingTime,
          modelUsed: metadata.modelUsed,
          thresholdsUsed: validationResult.validationMetadata?.thresholdsUsed
        }
      },
      metadata: {
        step: 'validation',
        agent: 'ValidatorAgent', 
        success: !!validationResult && !metadata.error,
        qualityScore: validationResult.overallScore,
        recommendation: validationResult.recommendation,
        error: metadata.error?.message
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Validation step completed', {
      eventType: 'validation_step',
      sessionId: sessionId,
      qualityScore: validationResult.overallScore,
      recommendation: validationResult.recommendation,
      issuesFound: validationResult.issues?.length || 0,
      success: auditEntry.metadata.success
    });
  }

  /**
   * Log retry attempt
   */
  async logRetryAttempt(sessionId, retryData, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'retry_attempt',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        retryInfo: {
          attempt: retryData.attempt,
          maxAttempts: retryData.maxAttempts,
          reasons: retryData.reasons,
          previousScore: retryData.previousScore
        },
        adjustments: {
          parameterChanges: retryData.parameterChanges,
          planModifications: retryData.planModifications,
          strategicChanges: retryData.strategicChanges
        },
        trigger: {
          validationResult: retryData.validationResult,
          autoRetryDecision: retryData.autoRetryDecision
        }
      },
      metadata: {
        step: 'retry',
        agent: 'AutoRetryManager',
        retryAttempt: retryData.attempt,
        retryReasons: retryData.reasons,
        adjustmentStrategy: metadata.adjustmentStrategy
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    this.logger.info('Retry attempt initiated', {
      eventType: 'retry_attempt',
      sessionId: sessionId,
      attempt: retryData.attempt,
      reasons: retryData.reasons,
      previousScore: retryData.previousScore
    });
  }

  /**
   * Log session completion
   */
  async logSessionComplete(sessionId, sessionResult, sessionData) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'session_complete',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      data: {
        result: {
          success: sessionResult.success,
          finalStatus: sessionData.status,
          qualityScore: sessionResult.qualityScore,
          recommendation: sessionResult.recommendation,
          resultUrl: sessionResult.resultUrl,
          error: sessionResult.error
        },
        metrics: {
          totalTime: sessionResult.metrics?.totalTime,
          stepsCompleted: sessionResult.metrics?.stepsCompleted,
          stepsTotal: sessionResult.metrics?.stepsTotal,
          successRate: sessionResult.metrics?.successRate,
          retryCount: sessionData.retryCount || 0
        },
        finalState: {
          analysisComplete: !!sessionData.results?.analysis,
          planComplete: !!sessionData.results?.plan,
          editsComplete: sessionData.results?.edits?.length > 0,
          validationComplete: !!sessionData.results?.validation
        }
      },
      metadata: {
        step: 'completion',
        agent: 'OrchestratorAgent',
        success: sessionResult.success,
        endTime: Date.now()
      }
    };

    await this.writeAuditEntry(auditEntry);
    this.addToSessionAudit(sessionId, auditEntry);

    // Write complete session audit
    await this.writeSessionAudit(sessionId);

    this.logger.info('Session completed', {
      eventType: 'session_complete',
      sessionId: sessionId,
      success: sessionResult.success,
      qualityScore: sessionResult.qualityScore,
      totalTime: sessionResult.metrics?.totalTime
    });
  }

  /**
   * Log system events
   */
  async logSystemEvent(eventType, data, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      metadata: {
        ...metadata,
        system: true,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    await this.writeAuditEntry(auditEntry);

    this.logger.info('System event', {
      eventType: eventType,
      ...metadata
    });
  }

  /**
   * Log API calls and responses
   */
  async logApiCall(apiType, endpoint, request, response, metadata = {}) {
    const auditEntry = {
      eventId: uuidv4(),
      eventType: 'api_call',
      timestamp: new Date().toISOString(),
      data: {
        api: {
          type: apiType,
          endpoint: endpoint,
          method: request.method || 'POST'
        },
        request: {
          hasBody: !!request.body,
          bodySize: request.body ? JSON.stringify(request.body).length : 0,
          headers: this.sanitizeHeaders(request.headers),
          parameters: request.parameters || {}
        },
        response: {
          statusCode: response.statusCode,
          success: response.success,
          hasBody: !!response.body,
          bodySize: response.body ? JSON.stringify(response.body).length : 0,
          error: response.error?.message
        },
        performance: {
          responseTime: metadata.responseTime,
          retryCount: metadata.retryCount || 0,
          rateLimitDelay: metadata.rateLimitDelay
        }
      },
      metadata: {
        api: apiType,
        endpoint: endpoint,
        success: response.success,
        sessionId: metadata.sessionId
      }
    };

    await this.writeAuditEntry(auditEntry);

    this.logger.info('API call', {
      eventType: 'api_call',
      api: apiType,
      endpoint: endpoint,
      success: response.success,
      responseTime: metadata.responseTime
    });
  }

  /**
   * Write audit entry to file
   */
  async writeAuditEntry(auditEntry) {
    try {
      // Write to Winston audit log
      this.logger.info('Audit entry', auditEntry);

      // Also write to structured audit files (daily files)
      const date = new Date().toISOString().split('T')[0];
      const auditFile = path.join(this.auditDir, `audit_${date}.jsonl`);
      
      const auditLine = JSON.stringify(auditEntry) + '\n';
      await fs.appendFile(auditFile, auditLine);

    } catch (error) {
      console.error('Failed to write audit entry:', error);
    }
  }

  /**
   * Add entry to session-specific audit trail
   */
  addToSessionAudit(sessionId, auditEntry) {
    if (!this.sessionAudits.has(sessionId)) {
      this.sessionAudits.set(sessionId, []);
    }
    this.sessionAudits.get(sessionId).push(auditEntry);
  }

  /**
   * Write complete session audit to file
   */
  async writeSessionAudit(sessionId) {
    try {
      const sessionEntries = this.sessionAudits.get(sessionId) || [];
      const sessionAuditFile = path.join(this.auditDir, 'sessions', `${sessionId}.json`);
      
      // Ensure session directory exists
      await fs.mkdir(path.dirname(sessionAuditFile), { recursive: true });

      const sessionAudit = {
        sessionId: sessionId,
        startTime: sessionEntries[0]?.timestamp,
        endTime: sessionEntries[sessionEntries.length - 1]?.timestamp,
        totalEvents: sessionEntries.length,
        events: sessionEntries,
        summary: this.generateSessionSummary(sessionEntries)
      };

      await fs.writeFile(sessionAuditFile, JSON.stringify(sessionAudit, null, 2));

      // Clean up from memory
      this.sessionAudits.delete(sessionId);

    } catch (error) {
      console.error(`Failed to write session audit for ${sessionId}:`, error);
    }
  }

  /**
   * Generate session summary from audit entries
   */
  generateSessionSummary(entries) {
    const summary = {
      totalEvents: entries.length,
      eventTypes: {},
      performance: {},
      quality: {},
      errors: []
    };

    let totalProcessingTime = 0;
    let stepsCompleted = 0;
    let finalQualityScore = null;

    for (const entry of entries) {
      // Count event types
      summary.eventTypes[entry.eventType] = (summary.eventTypes[entry.eventType] || 0) + 1;

      // Track performance
      if (entry.data.performance?.processingTime) {
        totalProcessingTime += entry.data.performance.processingTime;
      }

      // Track steps
      if (entry.eventType === 'edit_step' && entry.metadata.success) {
        stepsCompleted++;
      }

      // Track quality
      if (entry.eventType === 'validation_step' && entry.data.result?.overallScore) {
        finalQualityScore = entry.data.result.overallScore;
      }

      // Track errors
      if (entry.metadata.error) {
        summary.errors.push({
          eventType: entry.eventType,
          timestamp: entry.timestamp,
          error: entry.metadata.error
        });
      }
    }

    summary.performance.totalProcessingTime = totalProcessingTime;
    summary.performance.stepsCompleted = stepsCompleted;
    summary.quality.finalScore = finalQualityScore;

    return summary;
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(query) {
    // This would implement audit log querying functionality
    // For now, return placeholder
    return {
      message: 'Audit log querying not yet implemented',
      query: query
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats() {
    try {
      const auditFiles = await fs.readdir(this.auditDir);
      const logFiles = auditFiles.filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'));
      
      const stats = {
        totalFiles: logFiles.length,
        activeSessions: this.sessionAudits.size,
        oldestLog: null,
        newestLog: null,
        totalSize: 0
      };

      for (const file of logFiles) {
        const filePath = path.join(this.auditDir, file);
        const fileStat = await fs.stat(filePath);
        stats.totalSize += fileStat.size;

        const date = file.replace('audit_', '').replace('.jsonl', '');
        if (!stats.oldestLog || date < stats.oldestLog) {
          stats.oldestLog = date;
        }
        if (!stats.newestLog || date > stats.newestLog) {
          stats.newestLog = date;
        }
      }

      return stats;

    } catch (error) {
      this.logger.error('Failed to get audit stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'cookie'];
    
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Clean up old audit files
   */
  async cleanupAuditFiles(maxAgeDays = 30) {
    try {
      this.logger.info(`Starting audit file cleanup (max age: ${maxAgeDays} days)`);
      
      const auditFiles = await fs.readdir(this.auditDir);
      const cutoffDate = new Date(Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000));
      
      let deletedCount = 0;

      for (const file of auditFiles) {
        if (file.startsWith('audit_') && file.endsWith('.jsonl')) {
          const dateStr = file.replace('audit_', '').replace('.jsonl', '');
          const fileDate = new Date(dateStr);
          
          if (fileDate < cutoffDate) {
            try {
              await fs.unlink(path.join(this.auditDir, file));
              deletedCount++;
            } catch (error) {
              this.logger.warn(`Failed to delete old audit file ${file}: ${error.message}`);
            }
          }
        }
      }

      this.logger.info(`Audit cleanup completed: ${deletedCount} files deleted`);
      return deletedCount;

    } catch (error) {
      this.logger.error('Audit cleanup failed:', error);
      throw error;
    }
  }
}
