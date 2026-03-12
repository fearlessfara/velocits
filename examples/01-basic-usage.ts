/**
 * Example 1: Basic VTL Usage
 *
 * Demonstrates simple variable interpolation, conditionals, and loops.
 * Run with: npm run example:basic
 */

import { VelocityEngine } from 'velocits';

console.log('=== Basic VTL Usage Examples ===\n');

const engine = new VelocityEngine();

// Example 1: Simple variable interpolation
console.log('1. Simple Variable Interpolation:');
const template1 = 'Hello, $name! Welcome to $product!';
const context1 = { name: 'Alice', product: 'VelociTS' };
const result1 = engine.render(template1, context1);
console.log(`   Template: ${template1}`);
console.log(`   Output: ${result1}\n`);

// Example 2: Conditionals
console.log('2. Conditionals (#if/#else):');
const template2 = `
#if($age >= 18)
You are an adult.
#else
You are a minor.
#end
`.trim();
const context2 = { age: 25 };
const result2 = engine.render(template2, context2);
console.log(`   Context: { age: ${context2.age} }`);
console.log(`   Output: ${result2}\n`);

// Example 3: Loops
console.log('3. Loops (#foreach):');
const template3 = `
Shopping List:
#foreach($item in $items)
  - $item
#end
`.trim();
const context3 = { items: ['Apples', 'Bananas', 'Oranges'] };
const result3 = engine.render(template3, context3);
console.log(`   Output:\n${result3}\n`);

// Example 4: Loop with index
console.log('4. Loop with Index ($foreach.count):');
const template4 = `
#foreach($item in $items)
$foreach.count. $item
#end
`.trim();
const result4 = engine.render(template4, context3);
console.log(`   Output:\n${result4}\n`);

// Example 5: Nested properties
console.log('5. Nested Properties:');
const template5 = '$user.name lives in $user.address.city';
const context5 = {
  user: {
    name: 'Bob',
    address: { city: 'San Francisco', state: 'CA' }
  }
};
const result5 = engine.render(template5, context5);
console.log(`   Output: ${result5}\n`);

// Example 6: Method calls
console.log('6. Method Calls:');
const template6 = 'Name in uppercase: $name.toUpperCase()';
const context6 = { name: 'john' };
const result6 = engine.render(template6, context6);
console.log(`   Output: ${result6}\n`);

// Example 7: #set directive
console.log('7. Variable Assignment (#set):');
const template7 = `
#set($total = $price * $quantity)
#set($tax = $total * 0.08)
#set($grandTotal = $total + $tax)
Price: $$price x $quantity = $$total
Tax (8%): $$tax
Grand Total: $$grandTotal
`.trim();
const context7 = { price: 29.99, quantity: 3 };
const result7 = engine.render(template7, context7);
console.log(`   Output:\n${result7}\n`);

// Example 8: Quiet references
console.log('8. Quiet References ($!missing):');
const template8 = 'Regular: $missing | Quiet: $!missing | Done';
const context8 = {};
const result8 = engine.render(template8, context8);
console.log(`   Output: ${result8}\n`);

console.log('=== All basic examples completed! ===');
