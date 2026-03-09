/** Apache Velocity: Lexer Tokens | OWNER: vela | STATUS: READY */

import { createToken, TokenType, Lexer } from 'chevrotain';
// Category for any token that can be treated as plain template text
// This includes TemplateText, Whitespace, and also NumberLiteral/Identifier when in text context
export const AnyTextFragment = createToken({ name: 'AnyTextFragment', pattern: Lexer.NA });

// Literals
// String literals: double-quoted or single-quoted
// Double-quoted: "..." with escaped quotes and backslashes
// Single-quoted: '...' with escaped quotes and backslashes
// Note: Single-quoted strings can contain unescaped double quotes, and vice versa
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: {
    exec: (text: string, startOffset: number) => {
      const len = text.length;
      if (startOffset >= len) return null;

      const startChar = text.charCodeAt(startOffset);
      const isDouble = startChar === 34; // "
      const isSingle = startChar === 39; // '

      if (!isDouble && !isSingle) return null;

      // Only match string literals in expression contexts (inside directives, ${...}, etc.)
      // In template text, quotes are just literal characters
      if (!isInExpressionContext(text, startOffset)) return null;
      
      const quoteChar = isDouble ? '"' : "'";
      let i = startOffset + 1;
      let hasLineBreaks = false;
      
      while (i < len) {
        const ch = text[i];
        if (ch === '\\') {
          // Escape sequence - skip next character
          i += 2;
          continue;
        }
        if (ch === quoteChar) {
          // Found closing quote
          i++;
          break;
        }
        // Check for line breaks in string
        if (ch === '\n' || ch === '\r') {
          hasLineBreaks = true;
        }
        i++;
      }
      
      if (i > startOffset + 1) {
        const image = text.slice(startOffset, i);
        const matched = [image] as unknown as RegExpExecArray;
        matched.index = startOffset;
        matched.input = text;
        (matched as any).hasLineBreaks = hasLineBreaks;
        return matched;
      }
      return null;
    }
  },
  line_breaks: true, // Strings can contain line breaks
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
  categories: [AnyTextFragment], // Can be part of text when not in expression context
});

export const BooleanLiteral = createToken({
  name: 'BooleanLiteral',
  pattern: /\b(true|false)\b/,
  categories: [AnyTextFragment], // Can be part of text when not in expression context
});

export const NullLiteral = createToken({
  name: 'NullLiteral',
  pattern: /\bnull\b/,
});

// Identifiers and references
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
  categories: [AnyTextFragment],
});

// Escaped reference: \$variable or \\$variable, \\\$variable, etc.
// Matches: (pairs of \\)* followed by \$ followed by identifier
export const EscapedReference = createToken({
  name: 'EscapedReference',
  pattern: /(?:\\\\)*\\(?:\$!?[a-zA-Z_$][a-zA-Z0-9_$]*|\$\{[^}]+\})/,
  line_breaks: false,
  categories: [AnyTextFragment], // Treat as text in template output
});

export const DollarRef = createToken({
  name: 'DollarRef',
  pattern: /\$[a-zA-Z_$][a-zA-Z0-9_$]*/,
});

export const QuietRef = createToken({
  name: 'QuietRef',
  pattern: /\$![a-zA-Z_$][a-zA-Z0-9_$]*/,
});

// Keywords
// Note: "in" keyword for #foreach is handled specially to avoid matching in regular text
// We match it as Identifier "in" between two whitespace/newline tokens in the foreach context
export const InKeyword = createToken({
  name: 'InKeyword',
  pattern: /\s+in\s+/,
  line_breaks: false,
  // Don't make this a category of AnyTextFragment to avoid breaking text like "text in middle"
});


// Interpolation
export const InterpStart = createToken({
  name: 'InterpStart',
  pattern: /\$\{/,
});


// Punctuation
export const LCurly = createToken({
  name: 'LCurly',
  pattern: /\{/,
  categories: [AnyTextFragment],
});

export const RCurly = createToken({
  name: 'RCurly',
  pattern: /\}/,
  categories: [AnyTextFragment],
});

export const LParen = createToken({
  name: 'LParen',
  pattern: /\(/,
  categories: [AnyTextFragment], // Can be part of text in template context
});

export const RParen = createToken({
  name: 'RParen',
  pattern: /\)/,
  categories: [AnyTextFragment], // Can be part of text in template context
});

export const LBracket = createToken({
  name: 'LBracket',
  pattern: /\[/,
  categories: [AnyTextFragment],
});

export const RBracket = createToken({
  name: 'RBracket',
  pattern: /\]/,
  categories: [AnyTextFragment],
});

export const Dot = createToken({
  name: 'Dot',
  pattern: /\./,

});

export const Comma = createToken({
  name: 'Comma',
  pattern: /,/,
  categories: [AnyTextFragment],
});

export const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
  categories: [AnyTextFragment],
});

export const Semicolon = createToken({
  name: 'Semicolon',
  pattern: /;/,

});

// Operators
export const Assign = createToken({
  name: 'Assign',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '=') return null;
      // Only match = if we're in an expression context
      // Note: = is special in #set($x = ...) but should still only match in parens
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['='] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

/**
 * Helper function to determine if we're in an expression context
 * (inside directive parentheses, ${...} braces, or [...] array literals)
 *
 * Expression contexts are:
 * - Inside ( ) of directives: #set(...), #if(...), #foreach(...)
 * - Inside ${ } braces
 * - Inside [ ] array literals
 *
 * @param text Full input text
 * @param offset Current lexer offset
 * @returns true if in expression context, false if in template text context
 */
function isInExpressionContext(text: string, offset: number): boolean {
  // Count unclosed delimiters by scanning backwards
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let stringChar: string | null = null;
  let seenDirectiveOrRefOnLine = false;

  const DEBUG = false; // Set to true for debugging
  if (DEBUG) console.log(`\n=== Checking context at offset ${offset}, char: '${text[offset]}'`);

  // Scan backwards from current position
  for (let i = offset - 1; i >= 0; i--) {
    const ch = text[i];
    if (DEBUG) console.log(`  i=${i}, ch='${ch}', paren=${parenDepth}, seen=${seenDirectiveOrRefOnLine}`);

    // Handle strings - operators inside strings are not expression operators
    if (ch === '"' || ch === "'") {
      if (!inString) {
        inString = true;
        stringChar = ch;
      } else if (ch === stringChar && text[i - 1] !== '\\') {
        inString = false;
        stringChar = null;
      }
      continue;
    }

    if (inString) continue;

    // Track if we see # or $ on the current line
    if (ch === '#' && (i === 0 || text[i - 1] !== '\\')) {
      seenDirectiveOrRefOnLine = true;
    }
    if (ch === '$') {
      seenDirectiveOrRefOnLine = true;
    }

    // Track delimiter depth
    if (ch === ')') parenDepth++;
    else if (ch === '(') parenDepth--;
    else if (ch === '}') braceDepth++;
    else if (ch === '{') braceDepth--;
    else if (ch === ']') bracketDepth++;
    else if (ch === '[') bracketDepth--;

    // If we find an unclosed delimiter, check if we're in an actual expression
    // Only count it if we've seen a directive (#) or reference ($) on this line
    if ((parenDepth < 0 || braceDepth < 0 || bracketDepth < 0) && seenDirectiveOrRefOnLine) {
      return true;
    }

    // If we hit a newline
    if (ch === '\n' || ch === '\r') {
      // Reset the flag for the previous line
      // But DON'T return false here - we need to continue scanning to check if we're
      // in a multiline expression (unclosed delimiter from previous line)
      seenDirectiveOrRefOnLine = false;
    }
  }

  return false;
}

export const Plus = createToken({
  name: 'Plus',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '+') return null;
      // Only match + if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['+'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Minus = createToken({
  name: 'Minus',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '-') return null;
      // Only match - if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['-'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Star = createToken({
  name: 'Star',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '*') return null;
      // Only match * if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['*'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Slash = createToken({
  name: 'Slash',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '/') return null;
      // Only match / if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['/'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Mod = createToken({
  name: 'Mod',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '%') return null;
      // Only match % if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['%'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Question = createToken({
  name: 'Question',
  pattern: /\?/,

});

export const Not = createToken({
  name: 'Not',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '!') return null;
      // Don't match ! if followed by = (that's part of !=)
      if (text[offset + 1] === '=') return null;
      // Only match ! if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['!'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const And = createToken({
  name: 'And',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '&&') return null;
      // Only match && if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['&&'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Or = createToken({
  name: 'Or',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '||') return null;
      // Only match || if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['||'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Eq = createToken({
  name: 'Eq',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '==') return null;
      // Only match == if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['=='] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Ne = createToken({
  name: 'Ne',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '!=') return null;
      // Only match != if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['!='] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Lt = createToken({
  name: 'Lt',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '<') return null;
      // Only match < if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['<'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Le = createToken({
  name: 'Le',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '<=') return null;
      // Only match <= if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['<='] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Gt = createToken({
  name: 'Gt',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text[offset] !== '>') return null;
      // Only match > if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['>'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Ge = createToken({
  name: 'Ge',
  pattern: {
    exec: (text: string, offset: number) => {
      if (text.substr(offset, 2) !== '>=') return null;
      // Only match >= if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['>='] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const Range = createToken({
  name: 'Range',
  pattern: /\.\./,
});

// Word-form comparison operators (must check expression context)
export const EqWord = createToken({
  name: 'EqWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "eq" as a whole word
      if (text.substr(offset, 2) !== 'eq') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['eq'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const NeWord = createToken({
  name: 'NeWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "ne" as a whole word
      if (text.substr(offset, 2) !== 'ne') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['ne'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const GtWord = createToken({
  name: 'GtWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "gt" as a whole word
      if (text.substr(offset, 2) !== 'gt') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['gt'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const GeWord = createToken({
  name: 'GeWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "ge" as a whole word
      if (text.substr(offset, 2) !== 'ge') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['ge'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const LtWord = createToken({
  name: 'LtWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "lt" as a whole word
      if (text.substr(offset, 2) !== 'lt') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['lt'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const LeWord = createToken({
  name: 'LeWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "le" as a whole word
      if (text.substr(offset, 2) !== 'le') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['le'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

// Word-form logical operators
export const AndWord = createToken({
  name: 'AndWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "and" as a whole word
      if (text.substr(offset, 3) !== 'and') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 3];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['and'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const OrWord = createToken({
  name: 'OrWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "or" as a whole word
      if (text.substr(offset, 2) !== 'or') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 2];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['or'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

export const NotWord = createToken({
  name: 'NotWord',
  pattern: {
    exec: (text: string, offset: number) => {
      // Check for "not" as a whole word
      if (text.substr(offset, 3) !== 'not') return null;
      // Must be followed by non-identifier character
      const nextChar = text[offset + 3];
      if (nextChar && /[a-zA-Z0-9_$]/.test(nextChar)) return null;
      // Only match if we're in an expression context
      if (!isInExpressionContext(text, offset)) return null;
      const result = ['not'] as unknown as RegExpExecArray;
      result.index = offset;
      result.input = text;
      return result;
    }
  },
  line_breaks: false,
});

// Escaped directives (must come before individual directive tokens)
// Matches patterns like \#end, \#if, \#set, etc.
// Pattern: optional double-escapes + backslash + # + directive name
export const EscapedDirective = createToken({
  name: 'EscapedDirective',
  pattern: /(?:\\\\)*\\#(?:if|elseif|else|end|set|foreach|break|stop|macro|evaluate|parse|include)\b/,
  line_breaks: false,
  categories: [AnyTextFragment], // Treat as text in template output
});

// Directives
export const Hash = createToken({
  name: 'Hash',
  pattern: /#/,
  // Treat stray '#' as text so it can appear inside template text segments.
  // Real directives/comments (#if, ##, #* *#) will still win due to earlier, longer tokens.
  categories: [AnyTextFragment],
});

// Individual directive tokens
export const IfDirective = createToken({
  name: 'IfDirective',
  pattern: /#if\b/,
});

export const ElseIfDirective = createToken({
  name: 'ElseIfDirective',
  pattern: /#elseif\b/,
});

export const ElseDirective = createToken({
  name: 'ElseDirective',
  pattern: /#else\b/,
});

export const SetDirective = createToken({
  name: 'SetDirective',
  pattern: /#set\b/,
});

export const ForEachDirective = createToken({
  name: 'ForEachDirective',
  pattern: /#foreach\b/,
});

export const BreakDirective = createToken({
  name: 'BreakDirective',
  pattern: /#break\b/,
});

export const StopDirective = createToken({
  name: 'StopDirective',
  pattern: /#stop\b/,
});

export const MacroDirective = createToken({
  name: 'MacroDirective',
  pattern: /#macro\b/,
});

// Macro invocation: #macroName (must come after directive keywords to avoid conflicts)
export const MacroInvocationStart = createToken({
  name: 'MacroInvocationStart',
  pattern: /#[a-zA-Z_][a-zA-Z0-9_]*/,
  // This will match #<identifier>, but directive keywords like #if, #macro will match first
  // because they are defined earlier in the token list
});

export const EvaluateDirective = createToken({
  name: 'EvaluateDirective',
  pattern: /#evaluate\b/,
});

export const ParseDirective = createToken({
  name: 'ParseDirective',
  pattern: /#parse\b/,
});

export const IncludeDirective = createToken({
  name: 'IncludeDirective',
  pattern: /#include\b/,
});

export const EndDirective = createToken({
  name: 'EndDirective',
  pattern: /#end\b/,
});

// Note: a generic Directive token is unnecessary when using specific ones

// Comments - these should be SKIPPED (not included in output)
// Line comments: ## ... until end of line (INCLUDING the newline)
// Per Java Parser.jjt line 1126: SINGLE_LINE_COMMENT includes the newline
export const LineComment = createToken({
  name: 'LineComment',
  pattern: /##[^\r\n]*(\r\n|\r|\n)?/,
  line_breaks: true, // Changed to true since we consume the newline
  group: Lexer.SKIPPED, // Skip comments - they don't appear in output
});

// Block comments: #* ... *#
export const BlockComment = createToken({
  name: 'BlockComment',
  pattern: /#\*[\s\S]*?\*#/,
  line_breaks: true,
  group: Lexer.SKIPPED, // Skip comments - they don't appear in output
});

// Template text token (custom pattern): consume until next '#' or '$'
// but DO NOT start immediately after code-leading characters.
export const TemplateText = createToken({
  name: 'TemplateText',
  pattern: {
    exec: (text: string, startOffset: number) => {
      const len = text.length;
      if (startOffset >= len) return null;

      // current char cannot start with '#' or '$'
      // Newlines can be part of TemplateText, so don't exclude them here
      const c0 = text.charCodeAt(startOffset);
      if (c0 === 35 /*#*/ || c0 === 36 /*$*/) return null;

      // Check if this is an escaped directive (e.g., \#end should be literal text)
      // If previous char is backslash, this might be escaped - but we still want to capture it as text
      if (startOffset > 0) {
        const p = text.charCodeAt(startOffset - 1);
        // If previous is backslash, the # or $ is escaped and should be part of text
        if (p === 92 /*\*/) {
          // This is escaped - include it in text (the backslash will be handled separately or included)
          // Actually, the backslash might have been consumed already, so we should start from before it
          // But for now, let's just allow TemplateText to start here
        } else {
          // Check if previous char was part of a variable reference (letter, digit, underscore, or $)
          const isAfterVarRef = (p >= 48 && p <= 57) || // 0-9
                                (p >= 65 && p <= 90) || // A-Z
                                (p >= 97 && p <= 122) || // a-z
                                p === 95 || // _
                                p === 36; // $
          // $ . ( [ { ! = < > + - * / % ? : & | ,
          // Only block if it's a code-leading char AND not after a variable reference
          if (!isAfterVarRef && (p===36||p===46||p===40||p===91||p===123||p===33||p===61||p===60||p===62||p===43||p===45||p===42||p===47||p===37||p===63||p===58||p===38||p===124||p===44)) {
            return null;
          }
        }
      }

      // scan forward until next '#', '$', '=', '\', or structural characters
      // Include spaces, tabs, and newlines in the text (they're part of the template output)
      // Note: Parentheses, brackets, and braces can be part of text, so we only stop
      // at them if they're immediately followed by something that looks like an expression
      let i = startOffset;
      while (i < len) {
        const ch = text.charCodeAt(i);
        // Stop at backslash if it precedes # or $ (escaped directive/reference pattern)
        if (ch === 92 /*\*/ && i + 1 < len) {
          const nextCh = text.charCodeAt(i + 1);
          if (nextCh === 35 /*#*/ || nextCh === 36 /*$*/ || nextCh === 92 /*\*/) {
            // This might be start of escaped directive like \#end or escaped reference like \$price
            // Let EscapedDirective or EscapedReference token match instead
            break;
          }
        }
        // Always stop at: # $ [ ] ( ) { }
        // These are all special characters in Velocity and should be their own tokens
        // Note: = is no longer in this list because it's now context-aware and only
        // matches in expression contexts. In template text, = is just a regular character.
        // Note: Quotes (' ") are NOT in this list because they're just literal characters
        // in template text. StringLiteral token will match them only in expression contexts.
        if (ch === 35 || ch === 36 ||
            ch === 91 || ch === 93 || ch === 40 || ch === 41 || ch === 123 || ch === 125) {
          break;
        }
        // Stop at comma only if it's not followed by space (likely part of expression)
        if (ch === 44) { // comma
          // Check if next char is space - if so, include comma and space in text
          if (i + 1 < len && text.charCodeAt(i + 1) === 32) {
            // Include comma and space, then stop
            i += 2;
            break;
          } else {
            // Comma not followed by space, likely expression context
            break;
          }
        }
        i++;
      }
      
      // Don't trim trailing spaces - they're part of the template output
      if (i === startOffset) return null;

      const image = text.slice(startOffset, i);

      // If the matched text is only whitespace (spaces/tabs, no newlines),
      // return null to let the Whitespace token match instead
      // This ensures proper whitespace handling after directives
      if (/^[ \t]+$/.test(image)) {
        return null;
      }

      const matched = [image] as unknown as RegExpExecArray;
      matched.index = startOffset;
      matched.input = text;
      return matched;
    }
  },
  categories: [AnyTextFragment],
  line_breaks: true, // TemplateText can contain newlines
});

// Whitespace and text
// Note: Whitespace is treated as text in template contexts
// In Java, WHITESPACE is a real token that can be captured for space gobbling
export const Whitespace = createToken({
  name: 'Whitespace',
  pattern: /[ \t]+/,
  categories: [AnyTextFragment], // Treat as text so it's preserved
});

// Newlines: treat as text fragments so they're included in template output
export const Newline = createToken({
  name: 'Newline',
  pattern: /\r?\n/,
  line_breaks: true,
  categories: [AnyTextFragment], // Treat as text in template contexts
});

// Token list in proper order (longer before shorter, keywords before Identifier)
export const allTokens: TokenType[] = [
  // Comments first (highest priority)
  LineComment,
  BlockComment,

  // Interpolation must win before other '$' tokens
  InterpStart,

  // Escaped directives must come before individual directive tokens
  EscapedDirective,

  // Individual directive tokens
  IfDirective,
  ElseIfDirective,
  ElseDirective,
  SetDirective,
  ForEachDirective,
  BreakDirective,
  StopDirective,
  MacroDirective,
  EvaluateDirective,
  ParseDirective,
  IncludeDirective,
  EndDirective,

  // Macro invocations (must come after directive keywords)
  MacroInvocationStart,

  // References (escaped references must come before regular references)
  EscapedReference,
  QuietRef,
  DollarRef,

  // String literals
  StringLiteral,

  // Numbers and booleans
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,

  // Word-form operators (must come before Identifier to avoid being matched as identifiers)
  // Longer words first
  AndWord,
  NotWord,
  EqWord,
  NeWord,
  GtWord,
  GeWord,
  LtWord,
  LeWord,
  OrWord,

  // Symbol operators (longer first)
  Le,
  Ge,
  Eq,
  Ne,
  And,
  Or,

  // Single character operators
  Plus,
  Minus,
  Star,
  Slash,
  Mod,
  Not,
  Lt,
  Gt,
  Assign,
  Question,
  Range,

  // Punctuation
  LCurly,
  RCurly,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Dot,
  Comma,
  Colon,
  Semicolon,
  Hash,

  // Whitespace and Newline must come before TemplateText to ensure proper tokenization
  // This allows directives to have spaces and newlines between keywords and parentheses
  Whitespace,
  Newline,

  // Template text must come after whitespace/newline but before other text-like tokens
  TemplateText,

  // Identifiers (after keywords)
  Identifier,

  // InKeyword comes after TemplateText to avoid matching " in " in regular text
  // It will still match in directive/expression contexts where TemplateText doesn't apply
  InKeyword,

  // Categories
  AnyTextFragment,
];

// Create the lexer
export const createLexer = () => {
  return new Lexer(allTokens);
};

