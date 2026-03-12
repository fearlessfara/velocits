/** Apache Velocity: Template | OWNER: vela | STATUS: READY */

import { VtlParser } from './parser/vtlParser.js';
import { cstToAst } from './parser/cstToAst.js';
import { VtlEvaluator, EvaluationContext } from './runtime/evaluator.js';
import { ResourceLoader } from './resource/resourceLoader.js';
import { ParseErrorException, ResourceNotFoundException, MethodInvocationException } from './errors.js';
import type { SpaceGobblingMode } from './engine.js';

/**
 * Template resource type
 */
export const RESOURCE_TEMPLATE = 'template';

/**
 * Template class - represents a parsed Velocity template
 * Port of org.apache.velocity.Template from Java implementation
 */
export class Template {
  private name: string;
  private encoding: string;
  private resourceLoader: ResourceLoader | null = null;
  private data: any = null;
  private lastModified: number = 0;
  private spaceGobbling: SpaceGobblingMode;
  private parser: VtlParser;
  private errorCondition: Error | null = null;

  /**
   * Creates a new Template instance
   * @param name Template name/path
   * @param encoding Character encoding
   * @param spaceGobbling Space gobbling mode
   */
  constructor(name: string, encoding: string = 'UTF-8', spaceGobbling: SpaceGobblingMode = 'lines') {
    this.name = name;
    this.encoding = encoding;
    this.spaceGobbling = spaceGobbling;
    this.parser = new VtlParser(false);
  }

  /**
   * Get the template name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the encoding
   */
  getEncoding(): string {
    return this.encoding;
  }

  /**
   * Set the resource loader
   */
  setResourceLoader(loader: ResourceLoader): void {
    this.resourceLoader = loader;
  }

  /**
   * Get the last modified time
   */
  getLastModified(): number {
    return this.lastModified;
  }

  /**
   * Process the template - load and parse it
   */
  async process(): Promise<boolean> {
    this.data = null;
    this.errorCondition = null;

    if (!this.resourceLoader) {
      this.errorCondition = new ResourceNotFoundException(`No resource loader configured for template: ${this.name}`);
      throw this.errorCondition;
    }

    try {
      // Load the template content
      const content = await this.resourceLoader.getResourceAsString(this.name, this.encoding);

      // Update last modified time
      this.lastModified = this.resourceLoader.getLastModified(this.name);

      // Parse the template
      const parseResult = this.parser.parse(content);

      // Check for fatal parse errors
      if (!parseResult.cst) {
        if (parseResult.errors && parseResult.errors.length > 0) {
          const errorMessages = parseResult.errors.map((e: any) => e.message).join('; ');
          throw new ParseErrorException(`Template parsing failed for ${this.name}: ${errorMessages}`);
        }
        throw new ParseErrorException(`Failed to parse template: ${this.name}`);
      }

      // Convert CST to AST
      this.data = cstToAst(parseResult.cst, this.spaceGobbling);

      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ParseErrorException) {
        this.errorCondition = error;
        throw error;
      }
      this.errorCondition = error instanceof Error ? error : new Error(String(error));
      throw this.errorCondition;
    }
  }

  /**
   * Process the template synchronously
   */
  processSync(): boolean {
    this.data = null;
    this.errorCondition = null;

    if (!this.resourceLoader) {
      this.errorCondition = new ResourceNotFoundException(`No resource loader configured for template: ${this.name}`);
      throw this.errorCondition;
    }

    try {
      // Load the template content
      const content = this.resourceLoader.getResourceAsStringSync(this.name, this.encoding);

      // Update last modified time
      this.lastModified = this.resourceLoader.getLastModified(this.name);

      // Parse the template
      const parseResult = this.parser.parse(content);

      // Check for fatal parse errors
      if (!parseResult.cst) {
        if (parseResult.errors && parseResult.errors.length > 0) {
          const errorMessages = parseResult.errors.map((e: any) => e.message).join('; ');
          throw new ParseErrorException(`Template parsing failed for ${this.name}: ${errorMessages}`);
        }
        throw new ParseErrorException(`Failed to parse template: ${this.name}`);
      }

      // Convert CST to AST
      this.data = cstToAst(parseResult.cst, this.spaceGobbling);

      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ParseErrorException) {
        this.errorCondition = error;
        throw error;
      }
      this.errorCondition = error instanceof Error ? error : new Error(String(error));
      throw this.errorCondition;
    }
  }

  /**
   * Merge the template with a context to produce output
   * @param context Context object containing data for rendering
   * @returns Rendered output string
   */
  merge(context: EvaluationContext = {}): string {
    if (this.errorCondition) {
      throw this.errorCondition;
    }

    if (!this.data) {
      throw new Error(`Template ${this.name} has not been processed`);
    }

    try {
      // Evaluate the template
      const evaluator = new VtlEvaluator(context, this.spaceGobbling);
      const output = evaluator.evaluateTemplate(this.data);

      return output;
    } catch (error) {
      if (error instanceof MethodInvocationException || error instanceof ParseErrorException) {
        throw error;
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Check if the template has been parsed successfully
   */
  isProcessed(): boolean {
    return this.data !== null && this.errorCondition === null;
  }

  /**
   * Get the parsed AST data (for internal use)
   */
  getData(): any {
    return this.data;
  }
}
