/**
 * Example 4: Report Generation
 *
 * Demonstrates generating formatted reports and documents using VTL.
 * Useful for sales reports, analytics, summaries, etc.
 * Run with: npm run example:report
 */

import { VelocityEngine } from 'velocits';

console.log('=== Report Generation Examples ===\n');

const engine = new VelocityEngine();

// Report utilities
const reportUtil = {
  formatPercent: (value: number) => {
    return (value * 100).toFixed(1) + '%';
  },
  formatNumber: (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  },
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },
  getDaysInMonth: (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  }
};

// Example 1: Sales Report
console.log('1. Monthly Sales Report:');
const salesTemplate = `
╔═══════════════════════════════════════════════════════════╗
║           MONTHLY SALES REPORT - $report.month $report.year            ║
╚═══════════════════════════════════════════════════════════╝

SUMMARY
-------
Total Revenue: $util.formatCurrency($metrics.totalRevenue)
Total Orders: $util.formatNumber($metrics.totalOrders)
Average Order Value: $util.formatCurrency($metrics.avgOrderValue)
#set($growth = ($metrics.growthRate - 1))
Growth vs Last Month: #if($growth >= 0)+#end$util.formatPercent($growth)

TOP PRODUCTS
------------
#foreach($product in $topProducts)
$foreach.count. $product.name
   Units Sold: $util.formatNumber($product.unitsSold)
   Revenue: $util.formatCurrency($product.revenue)
#end

SALES BY CATEGORY
-----------------
#foreach($category in $salesByCategory)
$category.name: $util.formatCurrency($category.revenue) ($util.formatPercent($category.percentOfTotal))
#end

SALES BY REGION
---------------
#foreach($region in $salesByRegion)
$region.name:#set($padding = 15 - $region.name.length())#foreach($i in [1..$padding]) #end$util.formatCurrency($region.revenue)
#end

PERFORMANCE INDICATORS
----------------------
#if($metrics.growthRate > 1.1)
✓ Excellent growth! Sales up by more than 10%
#elseif($metrics.growthRate > 1.0)
✓ Positive growth trend
#else
⚠ Sales declined - review strategy
#end

#if($metrics.avgOrderValue > 100)
✓ High average order value
#else
⚠ Consider upselling strategies
#end

Generated: $report.generatedDate
`.trim();

const salesContext = {
  report: {
    month: 'January',
    year: 2024,
    generatedDate: new Date().toLocaleString()
  },
  metrics: {
    totalRevenue: 1250000,
    totalOrders: 8540,
    avgOrderValue: 146.37,
    growthRate: 1.15 // 15% growth
  },
  topProducts: [
    { name: 'Premium Subscription', unitsSold: 1240, revenue: 148800 },
    { name: 'Enterprise License', unitsSold: 85, revenue: 425000 },
    { name: 'Professional Tools', unitsSold: 2100, revenue: 105000 }
  ],
  salesByCategory: [
    { name: 'Software', revenue: 850000, percentOfTotal: 0.68 },
    { name: 'Services', revenue: 250000, percentOfTotal: 0.20 },
    { name: 'Support', revenue: 150000, percentOfTotal: 0.12 }
  ],
  salesByRegion: [
    { name: 'North America', revenue: 650000 },
    { name: 'Europe', revenue: 380000 },
    { name: 'Asia Pacific', revenue: 180000 },
    { name: 'Other', revenue: 40000 }
  ],
  util: reportUtil
};

const salesReport = engine.render(salesTemplate, salesContext);
console.log(salesReport);
console.log('\n' + '='.repeat(70) + '\n');

// Example 2: User Activity Report
console.log('2. User Activity Report:');
const activityTemplate = `
USER ACTIVITY REPORT
====================
Period: $report.startDate to $report.endDate

ACTIVE USERS
------------
#set($totalUsers = 0)
#foreach($tier in $userTiers)
#set($totalUsers = $totalUsers + $tier.count)
#end

Total Active Users: $util.formatNumber($totalUsers)

Breakdown by Tier:
#foreach($tier in $userTiers)
  $tier.name: $util.formatNumber($tier.count) ($util.formatPercent($tier.count / $totalUsers))
#end

TOP ACTIVITIES
--------------
#foreach($activity in $topActivities)
$foreach.count. $activity.name - $util.formatNumber($activity.count) times
#end

ENGAGEMENT METRICS
------------------
Average Session Duration: $metrics.avgSessionMinutes minutes
Daily Active Users: $util.formatNumber($metrics.dailyActiveUsers)
Weekly Active Users: $util.formatNumber($metrics.weeklyActiveUsers)
Retention Rate: $util.formatPercent($metrics.retentionRate)

ALERTS
------
#if($metrics.retentionRate < 0.7)
⚠ WARNING: Retention rate below 70%
#end
#if($metrics.dailyActiveUsers < $metrics.weeklyActiveUsers * 0.3)
⚠ WARNING: Low daily engagement
#end
#if($metrics.avgSessionMinutes < 10)
⚠ WARNING: Sessions shorter than expected
#end
`.trim();

const activityContext = {
  report: {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  userTiers: [
    { name: 'Free', count: 45230 },
    { name: 'Pro', count: 8540 },
    { name: 'Enterprise', count: 450 }
  ],
  topActivities: [
    { name: 'Login', count: 125400 },
    { name: 'Create Project', count: 18230 },
    { name: 'Upload File', count: 45600 },
    { name: 'Share Document', count: 12340 },
    { name: 'Export Data', count: 8920 }
  ],
  metrics: {
    avgSessionMinutes: 18.5,
    dailyActiveUsers: 15420,
    weeklyActiveUsers: 38200,
    retentionRate: 0.78
  },
  util: reportUtil
};

const activityReport = engine.render(activityTemplate, activityContext);
console.log(activityReport);
console.log('\n' + '='.repeat(70) + '\n');

console.log('=== All report examples completed! ===');
