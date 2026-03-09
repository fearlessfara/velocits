/**
 * Unit Tests: Directives
 * Tests #set, #if, #foreach, #break, #stop, #macro
 */

import { VelocityEngine } from '../../src/engine.js';

let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual: any, expected: any, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function test(name: string, fn: () => void): void {
  process.stdout.write(`  ${name} ... `);
  try {
    fn();
    console.log('✓');
    testsPassed++;
  } catch (error) {
    console.log('✗');
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
    testsFailed++;
  }
}

console.log('\n=== Directives Unit Tests ===\n');

// Test Suite 1: #set Directive
console.log('#set Directive:');

test('should set variable to string', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#set($name = "John")$name', {});
  assertEqual(result, 'John', 'Should set and output string');
});

test('should set variable to number', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#set($count = 42)$count', {});
  assertEqual(result, '42', 'Should set and output number');
});

test('should set variable to expression', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#set($sum = 5 + 10)$sum', {});
  assertEqual(result, '15', 'Should evaluate expression');
});

test('should set variable from another variable', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#set($b = $a)$b', { a: 'test' });
  assertEqual(result, 'test', 'Should copy variable');
});

test('should set variable to array', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#set($arr = [1, 2, 3])$arr.size()', {});
  assertEqual(result, '3', 'Should set array');
});

// Test Suite 2: #if Directive
console.log('\n#if Directive:');

test('should execute if block when true', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if(true)yes#end', {});
  assertEqual(result, 'yes', 'Should execute if block');
});

test('should skip if block when false', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if(false)yes#end', {});
  assertEqual(result, '', 'Should skip if block');
});

test('should execute else block', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if(false)yes#else no#end', {});
  assertEqual(result, ' no', 'Should execute else block');
});

test('should execute elseif block', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if(false)a#elseif(true)b#else c#end', {});
  assertEqual(result, 'b', 'Should execute elseif block');
});

test('should evaluate variable in condition', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if($flag)yes#end', { flag: true });
  assertEqual(result, 'yes', 'Should evaluate variable');
});

test('should treat undefined as false', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if($missing)yes#else no#end', {});
  assertEqual(result, ' no', 'Should treat undefined as false');
});

test('should evaluate comparison in condition', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#if($x > 5)yes#else no#end', { x: 10 });
  assertEqual(result, 'yes', 'Should evaluate comparison');
});

// Test Suite 3: #foreach Directive
console.log('\n#foreach Directive:');

test('should iterate over array', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)$item#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: ['a', 'b', 'c'] });
  assertEqual(result, 'a, b, c', 'Should iterate array');
});

test('should provide $foreach.index', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)$foreach.index#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: ['a', 'b', 'c'] });
  assertEqual(result, '0, 1, 2', 'Should provide index');
});

test('should provide $foreach.count', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)$foreach.count#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: ['a', 'b', 'c'] });
  assertEqual(result, '1, 2, 3', 'Should provide count');
});

test('should provide $foreach.first', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)#if($foreach.first)FIRST: #end$item#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: ['a', 'b'] });
  assertEqual(result, 'FIRST: a, b', 'Should detect first item');
});

test('should provide $foreach.last', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)$item#if($foreach.last)!#end#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: ['a', 'b'] });
  assertEqual(result, 'a, b!', 'Should detect last item');
});

test('should handle empty array with #else', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($item in $items)$item#else empty#end';
  const result = engine.render(template, { items: [] });
  assertEqual(result, ' empty', 'Should execute else for empty array');
});

test('should iterate in nested foreach (simplified)', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in $outer)#foreach($j in $inner)x#end#end';
  const context = { outer: [1, 2], inner: ['a', 'b'] };
  const result = engine.render(template, context);
  assertEqual(result, 'xxxx', 'Should iterate nested loops');
});

// Test Suite 4: #break Directive
console.log('\n#break Directive:');

test('should break from foreach loop', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in $items)$i#if($i == 2)#break#end#if($foreach.hasNext), #end#end';
  const result = engine.render(template, { items: [1, 2, 3, 4] });
  assertEqual(result, '1, 2', 'Should break at 2');
});

test('should handle foreach with conditional', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in [1,2,3])$i#if($i == 2)!#end#end';
  const result = engine.render(template, {});
  assertEqual(result, '12!3', 'Should handle conditional in loop');
});

// Test Suite 5: #stop Directive
console.log('\n#stop Directive:');

test('should stop template rendering', () => {
  const engine = new VelocityEngine();
  const result = engine.render('before#stop\nafter', {});
  assertEqual(result, 'before\n', 'Should stop at #stop');
});

test('should stop in foreach loop', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in $items)$i#if($i == 2)#stop#end#if($foreach.hasNext), #end#end\nafter';
  const result = engine.render(template, { items: [1, 2, 3] });
  assertEqual(result, '1, 2', 'Should stop in loop');
});

// Test Suite 6: #macro Directive
console.log('\n#macro Directive:');

test('should define and call simple macro', () => {
  const engine = new VelocityEngine();
  const template = '#macro(hello)Hello!#end#hello()';
  const result = engine.render(template, {});
  assertEqual(result, 'Hello!', 'Should call macro');
});

test('should define macro with parameter', () => {
  const engine = new VelocityEngine();
  const template = '#macro(greet $name)Hello, $name!#end#greet("World")';
  const result = engine.render(template, {});
  assertEqual(result, 'Hello, World!', 'Should pass parameter');
});

test('should define macro with multiple parameters', () => {
  const engine = new VelocityEngine();
  const template = '#macro(add $a $b)$a + $b = #set($sum = $a + $b)$sum#end#add(5, 10)';
  const result = engine.render(template, {});
  assertEqual(result, '5 + 10 = 15', 'Should handle multiple parameters');
});

test('should call macro multiple times', () => {
  const engine = new VelocityEngine();
  const template = '#macro(star)*#end#star()#star()#star()';
  const result = engine.render(template, {});
  assertEqual(result, '***', 'Should call macro multiple times');
});

test('should isolate macro scope', () => {
  const engine = new VelocityEngine();
  const template = '#macro(test)#set($x = 10)$x#end#test()- $x';
  const result = engine.render(template, { x: 5 });
  assertEqual(result, '10- 5', 'Should isolate macro scope');
});

// Test Suite 7: Directive Nesting
console.log('\nDirective Nesting:');

test('should nest if inside foreach', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in $items)#if($i % 2 == 0)$i#end#end';
  const result = engine.render(template, { items: [1, 2, 3, 4] });
  assertEqual(result, '24', 'Should filter even numbers');
});

test('should nest foreach inside if', () => {
  const engine = new VelocityEngine();
  const template = '#if($show)#foreach($i in [1,2,3])$i#end#end';
  const result = engine.render(template, { show: true });
  assertEqual(result, '123', 'Should nest foreach in if');
});

test('should nest set inside foreach', () => {
  const engine = new VelocityEngine();
  const template = '#foreach($i in [1,2,3])#set($x = $i * 2)$x#if($foreach.hasNext), #end#end';
  const result = engine.render(template, {});
  assertEqual(result, '2, 4, 6', 'Should set variable in loop');
});

// Test Suite 8: Standalone Hash as Literal Text
console.log('\nStandalone Hash as Literal Text:');

test('hash in HTML tag: <th>#</th> should render as literal text', () => {
  const engine = new VelocityEngine();
  const result = engine.render('<th>#</th>', {});
  assertEqual(result, '<th>#</th>', 'Standalone # in HTML should be literal text');
});

test('hash before angle bracket: #< some text should render as literal text', () => {
  const engine = new VelocityEngine();
  const result = engine.render('#< some text', {});
  assertEqual(result, '#< some text', 'Hash followed by < should be literal text');
});

test('hash at end of template: value is # should render as literal text', () => {
  const engine = new VelocityEngine();
  const result = engine.render('value is #', {});
  assertEqual(result, 'value is #', 'Hash at end of template should be literal text');
});

test('hash followed by space should render as literal text', () => {
  const engine = new VelocityEngine();
  const result = engine.render('# followed by space', {});
  assertEqual(result, '# followed by space', 'Hash followed by space should be literal text');
});

// Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('='.repeat(50) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}, 100);
