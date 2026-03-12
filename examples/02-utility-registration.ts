/**
 * Example 2: Utility Registration
 *
 * Demonstrates how to register utility classes, objects, and helper methods
 * in the VTL context (similar to Java's context.put()).
 * Run with: npm run example:utils
 */

import { VelocityEngine } from 'velocits';

// Define utility classes
class MathUtil {
  static add(a: number, b: number): number {
    return a + b;
  }

  static multiply(a: number, b: number): number {
    return a * b;
  }

  static max(...numbers: number[]): number {
    return Math.max(...numbers);
  }
}

class StringUtil {
  toUpper(str: string): string {
    return str.toUpperCase();
  }

  truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }

  reverse(str: string): string {
    return str.split('').reverse().join('');
  }
}

console.log('=== Utility Registration Examples ===\n');

const engine = new VelocityEngine();
engine.init();

// Example 1: Static utility class
console.log('1. Static Utility Class (like Java Math.class):');
const context1 = {
  MathUtil: MathUtil,
  x: 5,
  y: 10
};

const template1 = `
Result: $MathUtil.add($x, $y)
Max of 1, 5, 3: $MathUtil.max(1, 5, 3)
`.trim();

const result1 = engine.render(template1, context1);
console.log(result1);
console.log();

// Example 2: Instance-based utility object
console.log('2. Instance-Based Utility Object:');
const stringUtil = new StringUtil();
const context2 = {
  util: stringUtil,
  name: 'velocity'
};

const template2 = `
Upper: $util.toUpper($name)
Truncated: $util.truncate("This is a long text", 10)
Reversed: $util.reverse($name)
`.trim();

const result2 = engine.render(template2, context2);
console.log(result2);
console.log();

// Example 3: Custom utility object with inline functions
console.log('3. Custom Utility Object with Inline Functions:');
const util = {
  formatCurrency: (amount: number) => '$' + amount.toFixed(2),
  join: (arr: any[], separator: string) => arr.join(separator),
  isEven: (n: number) => n % 2 === 0
};

const context3 = {
  util: util,
  price: 42.50,
  items: ['apple', 'banana', 'cherry'],
  number: 4
};

const template3 = `
Price: $util.formatCurrency($price)
Items: $util.join($items, ", ")
Is $number even? $util.isEven($number)
`.trim();

const result3 = engine.render(template3, context3);
console.log(result3);
console.log();

// Example 4: Built-in JavaScript Math class
console.log('4. Built-in JavaScript Math Class:');
const context4 = {
  Math: Math
};

const template4 = `
ceil(2.3) = $Math.ceil(2.3)
floor(2.7) = $Math.floor(2.7)
round(2.5) = $Math.round(2.5)
sqrt(16) = $Math.sqrt(16)
`.trim();

const result4 = engine.render(template4, context4);
console.log(result4);
console.log();

// Example 5: Using utilities in loops and conditionals
console.log('5. Using Utilities in Loops and Conditionals:');
const context5 = {
  util: {
    isEven: (n: number) => n % 2 === 0,
    square: (n: number) => n * n
  },
  numbers: [1, 2, 3, 4, 5]
};

const template5 = `
#foreach($n in $numbers)
$n: #if($util.isEven($n))even, square = $util.square($n)#else odd#end
#end
`.trim();

const result5 = engine.render(template5, context5);
console.log(result5);
console.log();

console.log('=== All utility examples completed! ===');
