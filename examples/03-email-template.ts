/**
 * Example 3: Email Template Generation
 *
 * Demonstrates generating formatted email content using VTL.
 * Real-world use case for welcome emails, notifications, etc.
 * Run with: npm run example:email
 */

import { VelocityEngine } from 'velocits';

console.log('=== Email Template Examples ===\n');

const engine = new VelocityEngine();

// Utility helpers for emails
const emailUtil = {
  formatDate: (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};

// Example 1: Welcome Email
console.log('1. Welcome Email:');
const welcomeTemplate = `
Subject: Welcome to $product!

Dear $user.name,

Thank you for signing up for $product! We're excited to have you on board.

Your account details:
- Email: $user.email
- Account Type: #if($user.isPremium)Premium#else Free#end
- Member Since: $util.formatDate($user.joinDate)

#if($user.isPremium)
As a Premium member, you have access to:
#foreach($feature in $premiumFeatures)
  • $feature
#end
#else
Upgrade to Premium to unlock exclusive features!
#end

Get started by visiting: $appUrl

Best regards,
The $product Team
`.trim();

const welcomeContext = {
  product: 'VelociTS',
  appUrl: 'https://app.velocits.com',
  user: {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    isPremium: true,
    joinDate: new Date('2024-01-15')
  },
  premiumFeatures: [
    'Unlimited projects',
    'Priority support',
    'Advanced analytics',
    'Custom branding'
  ],
  util: emailUtil
};

const welcomeEmail = engine.render(welcomeTemplate, welcomeContext);
console.log(welcomeEmail);
console.log('\n' + '='.repeat(70) + '\n');

// Example 2: Order Confirmation Email
console.log('2. Order Confirmation Email:');
const orderTemplate = `
Subject: Order Confirmation - Order #$order.id

Hi $customer.name,

Thank you for your order! We've received your payment and are processing your order.

Order Details:
- Order Number: #$order.id
- Date: $util.formatDate($order.date)
- Status: $order.status

Items:
#foreach($item in $order.items)
$foreach.count. $item.name
   Quantity: $item.quantity
   Price: $util.formatCurrency($item.price)
   Subtotal: $util.formatCurrency($item.quantity * $item.price)
#end

#set($subtotal = 0)
#foreach($item in $order.items)
#set($subtotal = $subtotal + ($item.quantity * $item.price))
#end
#set($tax = $subtotal * 0.08)
#set($shipping = 9.99)
#set($total = $subtotal + $tax + $shipping)

Order Summary:
- Subtotal: $util.formatCurrency($subtotal)
- Tax (8%): $util.formatCurrency($tax)
- Shipping: $util.formatCurrency($shipping)
- Total: $util.formatCurrency($total)

Shipping Address:
$customer.address.street
$customer.address.city, $customer.address.state $customer.address.zip

We'll send you a tracking number once your order ships!

Questions? Reply to this email or visit our Help Center.

Best regards,
Customer Service Team
`.trim();

const orderContext = {
  customer: {
    name: 'Bob Smith',
    address: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102'
    }
  },
  order: {
    id: '12345',
    date: new Date(),
    status: 'Processing',
    items: [
      { name: 'Wireless Headphones', quantity: 1, price: 79.99 },
      { name: 'USB-C Cable (3-pack)', quantity: 2, price: 15.99 },
      { name: 'Phone Case', quantity: 1, price: 24.99 }
    ]
  },
  util: emailUtil
};

const orderEmail = engine.render(orderTemplate, orderContext);
console.log(orderEmail);
console.log('\n' + '='.repeat(70) + '\n');

// Example 3: Password Reset Email
console.log('3. Password Reset Email:');
const resetTemplate = `
Subject: Reset Your Password

Hello $user.name,

We received a request to reset your password for your account ($user.email).

Click the link below to reset your password:
$resetUrl?token=$resetToken

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.
Your password will remain unchanged.

For security:
- Never share your password with anyone
- Use a unique password for each account
- Enable two-factor authentication if available

Need help? Contact us at support@example.com

Security Team
`.trim();

const resetContext = {
  user: {
    name: 'Charlie Brown',
    email: 'charlie@example.com'
  },
  resetUrl: 'https://app.example.com/reset-password',
  resetToken: 'abc123xyz789'
};

const resetEmail = engine.render(resetTemplate, resetContext);
console.log(resetEmail);
console.log('\n' + '='.repeat(70) + '\n');

console.log('=== All email examples completed! ===');
