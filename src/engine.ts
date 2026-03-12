/** Apache Velocity: Velocity Engine | OWNER: vela | STATUS: READY */

import { VtlParser } from './parser/vtlParser.js';
import { cstToAst } from './parser/cstToAst.js';
import { VtlEvaluator, EvaluationContext } from './runtime/evaluator.js';
import { Template } from './template.js';
import { ResourceLoader, FileResourceLoader } from './resource/resourceLoader.js';
import { RuntimeConstants } from './runtime/runtimeConstants.js';
import { ParseErrorException, ResourceNotFoundException } from './errors.js';
import * as fs from 'fs';

export { ParseErrorException, ResourceNotFoundException, MethodInvocationException } from './errors.js';

/**
 * Space gobbling modes (matches Java RuntimeConstants.SpaceGobbling enum)
 */
export type SpaceGobblingMode = 'none' | 'bc' | 'lines' | 'structured';

/**
 * Configuration options for the VelocityEngine
 */
export interface VelocityEngineConfig {
  /** Enable debug mode for detailed parsing information */
  debugMode?: boolean;
  /** String interning for performance optimization */
  stringInterning?: boolean;
  /** Scope name for evaluate() calls */
  evaluateScopeName?: string;
  /** Custom application attributes */
  applicationAttributes?: Map<string, any>;
  /**
   * Space gobbling mode (default: 'lines')
   * - none: No space gobbling
   * - bc: Backward compatibility mode
   * - lines: Line directives gobble trailing newlines
   * - structured: Advanced structured gobbling
   */
  spaceGobbling?: SpaceGobblingMode;
  /** File resource loader paths */
  fileResourceLoaderPath?: string | string[];
  /** Enable file resource loader caching */
  fileResourceLoaderCache?: boolean;
  /** Default encoding for templates */
  inputEncoding?: string;
}

/**
 * VelocityEngine - TypeScript port of Apache Velocity Engine
 *
 * This class provides the main interface for rendering Velocity templates.
 * It follows the same architecture as the Java implementation, with a
 * RuntimeInstance-like internal configuration system.
 */
export class VelocityEngine {
  private parser: VtlParser;
  private config: VelocityEngineConfig;
  private properties: Map<string, any>;
  private initialized: boolean;
  private resourceLoaders: Map<string, ResourceLoader>;
  private templateCache: Map<string, Template>;
  private defaultEncoding: string;

  /**
   * Creates a new VelocityEngine instance
   * @param config Optional configuration object or properties file path
   */
  constructor(config?: VelocityEngineConfig | string) {
    // Handle string parameter (properties file path)
    if (typeof config === 'string') {
      this.config = {
        debugMode: false,
        stringInterning: false,
        evaluateScopeName: 'evaluate',
        spaceGobbling: 'lines',
        applicationAttributes: new Map(),
      };
      this.properties = new Map();
      this.initialized = false;
      this.resourceLoaders = new Map();
      this.templateCache = new Map();
      this.defaultEncoding = 'UTF-8';
      this.parser = new VtlParser(false);
      // Load properties from file
      this.setPropertiesFromFile(config);
    } else {
      this.config = {
        debugMode: false,
        stringInterning: false,
        evaluateScopeName: 'evaluate',
        spaceGobbling: 'lines', // Default to 'lines' mode like Java
        applicationAttributes: new Map(),
        inputEncoding: 'UTF-8',
        ...config
      };
      this.properties = new Map();
      this.initialized = false;
      this.resourceLoaders = new Map();
      this.templateCache = new Map();
      this.defaultEncoding = this.config.inputEncoding || 'UTF-8';
      this.parser = new VtlParser(this.config.debugMode || false);

      // If config has file resource loader path, set it up
      if (config?.fileResourceLoaderPath) {
        this.setProperty(RuntimeConstants.FILE_RESOURCE_LOADER_PATH, config.fileResourceLoaderPath);
      }
      if (config?.fileResourceLoaderCache !== undefined) {
        this.setProperty(RuntimeConstants.FILE_RESOURCE_LOADER_CACHE, config.fileResourceLoaderCache);
      }
    }
  }

  /**
   * Initialize the engine (for compatibility with Java API)
   * Can be called with no parameters, a properties file path, or a properties Map
   */
  init(propertiesOrPath?: Map<string, any> | string): void {
    if (propertiesOrPath) {
      if (typeof propertiesOrPath === 'string') {
        this.setPropertiesFromFile(propertiesOrPath);
      } else {
        this.setProperties(propertiesOrPath);
      }
    }

    // Initialize default file resource loader if paths are configured
    const fileLoaderPath = this.getProperty(RuntimeConstants.FILE_RESOURCE_LOADER_PATH);
    if (fileLoaderPath) {
      this.initializeFileResourceLoader();
    }

    this.initialized = true;
  }

  /**
   * Reset the engine instance
   */
  reset(): void {
    this.initialized = false;
    this.properties.clear();
    this.resourceLoaders.clear();
    this.templateCache.clear();
    this.parser = new VtlParser(this.config.debugMode || false);
  }

  /**
   * Initialize the default file resource loader
   * @private
   */
  private initializeFileResourceLoader(): void {
    const loader = new FileResourceLoader();
    const loaderConfig = new Map<string, any>();

    // Get paths
    const paths = this.getProperty(RuntimeConstants.FILE_RESOURCE_LOADER_PATH);
    if (paths) {
      loaderConfig.set('path', paths);
    }

    // Get cache setting
    const cache = this.getProperty(RuntimeConstants.FILE_RESOURCE_LOADER_CACHE);
    if (cache !== undefined) {
      loaderConfig.set('cache', cache);
    }

    // Get encoding
    loaderConfig.set('encoding', this.defaultEncoding);

    loader.init(loaderConfig);
    this.resourceLoaders.set('file', loader);
  }

  /**
   * Set a runtime property
   * @param key Property key
   * @param value Property value
   */
  setProperty(key: string, value: any): void {
    this.properties.set(key, value);
  }

  /**
   * Get a runtime property
   * @param key Property key
   * @returns Property value or undefined
   */
  getProperty(key: string): any {
    return this.properties.get(key);
  }

  /**
   * Clear a runtime property
   * @param key Property key
   */
  clearProperty(key: string): void {
    this.properties.delete(key);
  }

  /**
   * Add a runtime property (appends to existing value if it's an array)
   * @param key Property key
   * @param value Property value
   */
  addProperty(key: string, value: any): void {
    const existing = this.properties.get(key);

    if (existing !== undefined) {
      // If existing value is an array, append to it
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        // Convert to array
        this.properties.set(key, [existing, value]);
      }
    } else {
      this.properties.set(key, value);
    }
  }

  /**
   * Set an entire configuration at once from a Map
   * @param configuration Properties map
   */
  setProperties(configuration: Map<string, any>): void {
    for (const [key, value] of configuration) {
      this.setProperty(key, value);
    }
  }

  /**
   * Set properties from a properties file
   * @param propsFilename Path to properties file
   */
  setPropertiesFromFile(propsFilename: string): void {
    try {
      const content = fs.readFileSync(propsFilename, 'utf-8');
      const properties = this.parsePropertiesFile(content);
      this.setProperties(properties);
    } catch (error) {
      throw new Error(`Failed to load properties from ${propsFilename}: ${error}`);
    }
  }

  /**
   * Parse a .properties file content
   * @private
   */
  private parsePropertiesFile(content: string): Map<string, any> {
    const properties = new Map<string, any>();
    const lines = content.split('\n');

    for (let line of lines) {
      line = line.trim();

      // Skip comments and empty lines
      if (line.startsWith('#') || line.startsWith('!') || line.length === 0) {
        continue;
      }

      // Find the separator (= or :)
      const separatorIndex = line.search(/[=:]/);
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.substring(0, separatorIndex).trim();
      let value: any = line.substring(separatorIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }

      // Try to parse boolean and number values
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }

      properties.set(key, value);
    }

    return properties;
  }

  /**
   * Set application attribute (for cross-component communication)
   * @param key Attribute key
   * @param value Attribute value
   */
  setApplicationAttribute(key: string, value: any): void {
    this.config.applicationAttributes?.set(key, value);
  }

  /**
   * Get application attribute
   * @param key Attribute key
   * @returns Attribute value or undefined
   */
  getApplicationAttribute(key: string): any {
    return this.config.applicationAttributes?.get(key);
  }

  /**
   * Main rendering method - evaluates a template string with the given context
   *
   * @param template The VTL template string to render
   * @param context Context object containing variables for template evaluation
   * @returns Rendered output string
   * @throws ParseErrorException if template parsing fails
   * @throws MethodInvocationException if method invocation fails during evaluation
   */
  render(template: string, context: EvaluationContext = {}): string {
    const result = this.evaluate(context, template);
    return typeof result === 'string' ? result : '';
  }

  /**
   * Evaluates a template string with the given context (Java API compatible)
   *
   * @param context Context object containing data for rendering
   * @param template The VTL template string to evaluate
   * @param logTag Optional tag for logging (for compatibility, currently unused)
   * @param outputCallback Optional callback for streaming output (Writer equivalent)
   * @returns Rendered output string (or true if callback provided)
   * @throws ParseErrorException if template parsing fails
   */
  evaluate(context: EvaluationContext, template: string, _logTag?: string, outputCallback?: (chunk: string) => void): string | boolean {
    try {
      // Auto-initialize if needed (like Java implementation)
      if (!this.initialized) {
        this.init();
      }

      // Parse the template
      const parseResult = this.parser.parse(template);

      // Check for fatal parse errors
      // Note: Chevrotain may accumulate errors from backtracking attempts in OR rules,
      // but if a CST was successfully generated, the parse succeeded
      if (!parseResult.cst) {
        if (parseResult.errors && parseResult.errors.length > 0) {
          const errorMessages = parseResult.errors.map((e: any) => e.message).join('; ');
          throw new ParseErrorException(`Template parsing failed: ${errorMessages}`);
        }
        throw new ParseErrorException('Failed to parse template');
      }

      const ast = cstToAst(parseResult.cst, this.config.spaceGobbling || 'lines');

      // Evaluate the template
      const evaluator = new VtlEvaluator(context, this.config.spaceGobbling || 'lines');
      const output = evaluator.evaluateTemplate(ast);

      // If callback provided (Writer-style), call it with output and return true
      if (outputCallback) {
        outputCallback(output);
        return true;
      }

      return output;
    } catch (error) {
      if (error instanceof ParseErrorException) {
        throw error;
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Evaluates a template from a readable stream (Reader equivalent)
   * @param context Context object
   * @param templateContent Template content (can be string or async function returning string)
   * @param logTag Optional log tag
   * @param outputCallback Optional callback for streaming output
   * @returns Rendered output string or true if callback provided
   */
  async evaluateReader(
    context: EvaluationContext,
    templateContent: string | (() => Promise<string>),
    logTag?: string,
    outputCallback?: (chunk: string) => void
  ): Promise<string | boolean> {
    // If templateContent is a function, call it to get the content
    const content = typeof templateContent === 'function' ? await templateContent() : templateContent;
    return this.evaluate(context, content, logTag, outputCallback);
  }

  /**
   * Get a template from the resource loader (synchronous)
   * @param name Template name/path
   * @param encoding Optional character encoding (defaults to configured encoding)
   * @returns Template object
   * @throws ResourceNotFoundException if template not found
   * @throws ParseErrorException if template cannot be parsed
   */
  getTemplate(name: string, encoding?: string): Template {
    // Auto-initialize if needed
    if (!this.initialized) {
      this.init();
    }

    const enc = encoding || this.defaultEncoding;
    const cacheKey = `${name}:${enc}`;

    // Check cache
    const cached = this.templateCache.get(cacheKey);
    if (cached && cached.isProcessed()) {
      // Check if we should use cached version
      const loader = this.getResourceLoaderForTemplate(name);
      if (loader && loader.isCachingEnabled()) {
        return cached;
      }
    }

    // Load and parse the template
    const template = new Template(name, enc, this.config.spaceGobbling || 'lines');
    const loader = this.getResourceLoaderForTemplate(name);

    if (!loader) {
      throw new ResourceNotFoundException(`No resource loader found for template: ${name}`);
    }

    template.setResourceLoader(loader);
    template.processSync();

    // Cache the template if caching is enabled
    if (loader.isCachingEnabled()) {
      this.templateCache.set(cacheKey, template);
    }

    return template;
  }

  /**
   * Get a template from the resource loader (asynchronous)
   * @param name Template name/path
   * @param encoding Optional character encoding
   * @returns Promise resolving to Template object
   */
  async getTemplateAsync(name: string, encoding?: string): Promise<Template> {
    // Auto-initialize if needed
    if (!this.initialized) {
      this.init();
    }

    const enc = encoding || this.defaultEncoding;
    const cacheKey = `${name}:${enc}`;

    // Check cache
    const cached = this.templateCache.get(cacheKey);
    if (cached && cached.isProcessed()) {
      const loader = this.getResourceLoaderForTemplate(name);
      if (loader && loader.isCachingEnabled()) {
        return cached;
      }
    }

    // Load and parse the template
    const template = new Template(name, enc, this.config.spaceGobbling || 'lines');
    const loader = this.getResourceLoaderForTemplate(name);

    if (!loader) {
      throw new ResourceNotFoundException(`No resource loader found for template: ${name}`);
    }

    template.setResourceLoader(loader);
    await template.process();

    // Cache the template if caching is enabled
    if (loader.isCachingEnabled()) {
      this.templateCache.set(cacheKey, template);
    }

    return template;
  }

  /**
   * Merge a template file with context
   * @param templateName Template file name/path
   * @param encoding Character encoding
   * @param context Context object
   * @returns Rendered output string
   * @throws ResourceNotFoundException if template not found
   * @throws ParseErrorException if template cannot be parsed
   */
  mergeTemplate(templateName: string, encoding: string | null, context: EvaluationContext): string;
  mergeTemplate(templateName: string, context: EvaluationContext): string;
  mergeTemplate(template: string, contextOrEncoding?: EvaluationContext | string | null, maybeContext?: EvaluationContext): string {
    // Handle overloaded signatures
    let templateName: string;
    let encoding: string | null = null;
    let context: EvaluationContext = {};

    if (typeof contextOrEncoding === 'string' || contextOrEncoding === null) {
      // mergeTemplate(templateName, encoding, context)
      templateName = template;
      encoding = contextOrEncoding;
      context = maybeContext || {};
    } else if (typeof contextOrEncoding === 'object') {
      // mergeTemplate(templateName, context)
      templateName = template;
      context = contextOrEncoding;
    } else {
      // Fallback: treat as string template (backward compatibility)
      return this.render(template, {});
    }

    // Check if this is a file template or string template
    // If there's a file resource loader and the template exists, use getTemplate
    if (this.resourceExists(templateName)) {
      const tmpl = this.getTemplate(templateName, encoding || undefined);
      return tmpl.merge(context);
    } else {
      // Treat as string template
      return this.render(templateName, context);
    }
  }

  /**
   * Check if a resource exists
   * @param resourceName Resource name/path
   * @returns true if resource exists, false otherwise
   */
  resourceExists(resourceName: string): boolean {
    // Auto-initialize if needed
    if (!this.initialized) {
      this.init();
    }

    const loader = this.getResourceLoaderForTemplate(resourceName);
    if (!loader) {
      return false;
    }

    return loader.resourceExists(resourceName);
  }

  /**
   * Get the appropriate resource loader for a template
   * @private
   */
  private getResourceLoaderForTemplate(_name: string): ResourceLoader | null {
    // For now, just return the file loader if it exists
    // In a full implementation, this would check multiple loaders
    return this.resourceLoaders.get('file') || null;
  }

  /**
   * Add a resource loader
   * @param name Loader name
   * @param loader ResourceLoader instance
   */
  addResourceLoader(name: string, loader: ResourceLoader): void {
    this.resourceLoaders.set(name, loader);
  }

  /**
   * Get a resource loader by name
   * @param name Loader name
   * @returns ResourceLoader instance or null
   */
  getResourceLoader(name: string): ResourceLoader | null {
    return this.resourceLoaders.get(name) || null;
  }
}

/**
 * Convenience function for simple template rendering
 * @param template VTL template string
 * @param context Context object with variables
 * @param debugMode Enable debug mode
 * @returns Rendered output string
 */
export function renderTemplate(template: string, context: EvaluationContext = {}, debugMode: boolean = false): string {
  const engine = new VelocityEngine({ debugMode });
  return engine.render(template, context);
}
