/**
 * Smart Hiring Assessment Service
 * 
 * This service intelligently chooses between OpenAI-powered assessment
 * and rule-based assessment based on configuration and availability.
 */

class SmartHiringAssessmentService {
  constructor() {
    // Load assessment services
    this.openAIService = require('./openAIHiringAssessmentService');
    this.ruleBasedService = require('./aiHiringAssessmentService');
    
    // Configuration
    this.config = {
      // Primary assessment method: 'openai' or 'rule-based'
      primaryMethod: process.env.ASSESSMENT_METHOD || 'openai',
      
      // Whether to use fallback if primary fails
      useFallback: process.env.USE_ASSESSMENT_FALLBACK !== 'false',
      
      // OpenAI specific settings
      openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES) || 2
      },
      
      // Rule-based specific settings
      ruleBased: {
        enabled: true, // Always available as fallback
        weights: {
          skills: 0.30,
          experience: 0.25,
          assessments: 0.20,
          reliability: 0.15,
          creditScore: 0.10
        }
      }
    };

    console.log(`🤖 Smart Assessment Service initialized:`);
    console.log(`   Primary Method: ${this.config.primaryMethod}`);
    console.log(`   OpenAI Available: ${this.config.openai.enabled}`);
    console.log(`   Fallback Enabled: ${this.config.useFallback}`);
  }

  /**
   * Main assessment function that intelligently chooses the best method
   * @param {String} seekerId - ID of the job seeker
   * @param {String} jobId - ID of the job being applied for
   * @returns {Object} - Assessment result with recommendation
   */
  async assessCandidate(seekerId, jobId) {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Smart Assessment: Starting analysis for candidate ${seekerId}`);
      
      // Determine which assessment method to use
      const method = this.determineAssessmentMethod();
      console.log(`📊 Using assessment method: ${method}`);
      
      let result;
      
      if (method === 'openai') {
        result = await this.runOpenAIAssessment(seekerId, jobId);
      } else {
        result = await this.runRuleBasedAssessment(seekerId, jobId);
      }
      
      // Add metadata about the assessment method used
      result.assessment.method_used = method;
      result.assessment.processing_time_ms = Date.now() - startTime;
      result.assessment.service_version = '2.0-smart';
      
      console.log(`✅ Smart Assessment Complete: ${result.assessment.recommendation} (${result.assessment.total_score}%) via ${method}`);
      return result;
      
    } catch (error) {
      console.error('❌ Smart Assessment failed:', error.message);
      
      // If we haven't tried fallback yet, try it
      if (this.config.useFallback && !error.isFallbackAttempt) {
        console.log('🔄 Attempting fallback assessment method...');
        return await this.runFallbackAssessment(seekerId, jobId);
      }
      
      throw error;
    }
  }

  /**
   * Determine which assessment method to use based on configuration and availability
   */
  determineAssessmentMethod() {
    // If primary method is OpenAI and it's available, use it
    if (this.config.primaryMethod === 'openai' && this.config.openai.enabled) {
      return 'openai';
    }
    
    // If primary method is rule-based, use it
    if (this.config.primaryMethod === 'rule-based') {
      return 'rule-based';
    }
    
    // If OpenAI is not available but was requested, fall back to rule-based
    if (this.config.primaryMethod === 'openai' && !this.config.openai.enabled) {
      console.log('⚠️ OpenAI requested but not available, using rule-based assessment');
      return 'rule-based';
    }
    
    // Default to rule-based
    return 'rule-based';
  }

  /**
   * Run OpenAI-powered assessment
   */
  async runOpenAIAssessment(seekerId, jobId) {
    try {
      return await this.openAIService.assessCandidate(seekerId, jobId);
    } catch (error) {
      console.error('OpenAI assessment failed:', error.message);
      
      if (this.config.useFallback) {
        console.log('🔄 OpenAI failed, falling back to rule-based assessment');
        return await this.runRuleBasedAssessment(seekerId, jobId, true);
      }
      
      throw error;
    }
  }

  /**
   * Run rule-based assessment
   */
  async runRuleBasedAssessment(seekerId, jobId, isFallback = false) {
    try {
      const result = await this.ruleBasedService.assessCandidate(seekerId, jobId);
      
      if (isFallback) {
        result.assessment.method_used = 'rule-based-fallback';
        result.assessment.fallback_reason = 'OpenAI assessment failed';
      }
      
      return result;
    } catch (error) {
      if (isFallback) {
        error.isFallbackAttempt = true;
      }
      throw error;
    }
  }

  /**
   * Run fallback assessment when primary method fails
   */
  async runFallbackAssessment(seekerId, jobId) {
    const fallbackMethod = this.config.primaryMethod === 'openai' ? 'rule-based' : 'openai';
    
    console.log(`🔄 Running fallback assessment using: ${fallbackMethod}`);
    
    if (fallbackMethod === 'openai' && this.config.openai.enabled) {
      return await this.runOpenAIAssessment(seekerId, jobId);
    } else {
      return await this.runRuleBasedAssessment(seekerId, jobId, true);
    }
  }

  /**
   * Get assessment service status and configuration
   */
  getServiceStatus() {
    return {
      status: 'active',
      primary_method: this.config.primaryMethod,
      openai: {
        available: this.config.openai.enabled,
        model: this.config.openai.model
      },
      rule_based: {
        available: this.config.ruleBased.enabled
      },
      fallback_enabled: this.config.useFallback,
      version: '2.0-smart'
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 Assessment service configuration updated:', this.config);
  }
}

module.exports = new SmartHiringAssessmentService();