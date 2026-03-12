/**
 * Example 5: Configuration File Generation
 *
 * Demonstrates generating configuration files (nginx, docker, k8s, etc.)
 * using VTL templates. Useful for DevOps and deployment automation.
 * Run with: npm run example:config
 */

import { VelocityEngine } from 'velocits';

console.log('=== Configuration File Generation Examples ===\n');

const engine = new VelocityEngine();

// Example 1: Nginx Configuration
console.log('1. Nginx Configuration:');
const nginxTemplate = `
# Nginx configuration for $app.name
# Generated: $timestamp

upstream backend {
#foreach($server in $backend.servers)
    server $server.host:$server.port#if($server.weight) weight=$server.weight#end;
#end
}

server {
    listen $server.port;
    server_name $server.domain;

#if($ssl.enabled)
    # SSL Configuration
    listen 443 ssl http2;
    ssl_certificate $ssl.certPath;
    ssl_certificate_key $ssl.keyPath;
    ssl_protocols TLSv1.2 TLSv1.3;
#end

    # Security headers
#foreach($header in $security.headers)
    add_header $header.name "$header.value" always;
#end

    # Locations
#foreach($location in $locations)
    location $location.path {
#if($location.proxy)
        proxy_pass http://backend;
        proxy_set_header Host $$host;
        proxy_set_header X-Real-IP $$remote_addr;
#end
#if($location.cache)
        expires $location.cacheTime;
        add_header Cache-Control "public";
#end
    }
#end

    # Error pages
#foreach($error in $errorPages)
    error_page $error.code $error.page;
#end

    # Access log
    access_log /var/log/nginx/$app.name-access.log;
    error_log /var/log/nginx/$app.name-error.log;
}
`.trim();

const nginxContext = {
  timestamp: new Date().toISOString(),
  app: {
    name: 'my-app'
  },
  server: {
    port: 80,
    domain: 'example.com'
  },
  ssl: {
    enabled: true,
    certPath: '/etc/ssl/certs/example.com.crt',
    keyPath: '/etc/ssl/private/example.com.key'
  },
  backend: {
    servers: [
      { host: '10.0.1.10', port: 8080, weight: 3 },
      { host: '10.0.1.11', port: 8080, weight: 2 },
      { host: '10.0.1.12', port: 8080, weight: 1 }
    ]
  },
  security: {
    headers: [
      { name: 'X-Frame-Options', value: 'DENY' },
      { name: 'X-Content-Type-Options', value: 'nosniff' },
      { name: 'X-XSS-Protection', value: '1; mode=block' }
    ]
  },
  locations: [
    { path: '/', proxy: true },
    { path: '/static/', cache: true, cacheTime: '30d' },
    { path: '/api/', proxy: true }
  ],
  errorPages: [
    { code: 404, page: '/404.html' },
    { code: 500, page: '/50x.html' }
  ]
};

const nginxConfig = engine.render(nginxTemplate, nginxContext);
console.log(nginxConfig);
console.log('\n' + '='.repeat(70) + '\n');

// Example 2: Docker Compose Configuration
console.log('2. Docker Compose Configuration:');
const dockerComposeTemplate = `
version: $version

services:
#foreach($service in $services)
  $service.name:
#if($service.image)
    image: $service.image
#end
#if($service.build)
    build:
      context: $service.build.context
      dockerfile: $service.build.dockerfile
#end
#if($service.ports && $service.ports.size() > 0)
    ports:
#foreach($port in $service.ports)
      - $port.host:$port.container
#end
#end
#if($service.environment && $service.environment.size() > 0)
    environment:
#foreach($env in $service.environment.entrySet())
      - $env.key=$env.value
#end
#end
#if($service.volumes && $service.volumes.size() > 0)
    volumes:
#foreach($volume in $service.volumes)
      - $volume
#end
#end
#if($service.depends_on && $service.depends_on.size() > 0)
    depends_on:
#foreach($dep in $service.depends_on)
      - $dep
#end
#end
#if($service.networks && $service.networks.size() > 0)
    networks:
#foreach($network in $service.networks)
      - $network
#end
#end

#end
#if($networks && $networks.size() > 0)
networks:
#foreach($network in $networks.entrySet())
  $network.key:
    driver: $network.value.driver
#end
#end

#if($volumes && $volumes.size() > 0)
volumes:
#foreach($volume in $volumes)
  $volume:
#end
#end
`.trim();

const dockerContext = {
  version: '3.8',
  services: [
    {
      name: 'web',
      image: 'nginx:alpine',
      ports: [
        { host: '80', container: '80' },
        { host: '443', container: '443' }
      ],
      volumes: [
        './nginx.conf:/etc/nginx/nginx.conf:ro',
        './html:/usr/share/nginx/html:ro'
      ],
      networks: ['frontend'],
      depends_on: ['app']
    },
    {
      name: 'app',
      build: {
        context: '.',
        dockerfile: 'Dockerfile'
      },
      environment: {
        'NODE_ENV': 'production',
        'DB_HOST': 'db',
        'REDIS_HOST': 'redis'
      },
      ports: [
        { host: '3000', container: '3000' }
      ],
      networks: ['frontend', 'backend'],
      depends_on: ['db', 'redis']
    },
    {
      name: 'db',
      image: 'postgres:15-alpine',
      environment: {
        'POSTGRES_DB': 'myapp',
        'POSTGRES_USER': 'appuser',
        'POSTGRES_PASSWORD': 'secret'
      },
      volumes: ['db-data:/var/lib/postgresql/data'],
      networks: ['backend']
    },
    {
      name: 'redis',
      image: 'redis:7-alpine',
      networks: ['backend']
    }
  ],
  networks: {
    'frontend': { driver: 'bridge' },
    'backend': { driver: 'bridge' }
  },
  volumes: ['db-data']
};

const dockerCompose = engine.render(dockerComposeTemplate, dockerContext);
console.log(dockerCompose);
console.log('\n' + '='.repeat(70) + '\n');

// Example 3: GitHub Actions Workflow
console.log('3. GitHub Actions Workflow:');
const githubActionsTemplate = `
name: $workflow.name

on:
#foreach($trigger in $workflow.triggers)
  $trigger:
#end

jobs:
#foreach($job in $jobs)
  $job.name:
    runs-on: $job.runsOn
#if($job.strategy)
    strategy:
      matrix:
#foreach($matrix in $job.strategy.matrix.entrySet())
        $matrix.key: [#foreach($val in $matrix.value)$val#if($foreach.hasNext), #end#end]
#end
#end
    steps:
#foreach($step in $job.steps)
      - name: $step.name
#if($step.uses)
        uses: $step.uses
#end
#if($step.run)
        run: |
          $step.run
#end
#if($step.with)
        with:
#foreach($param in $step.with.entrySet())
          $param.key: $param.value
#end
#end
#end

#end
`.trim();

const githubContext = {
  workflow: {
    name: 'CI/CD Pipeline',
    triggers: ['push', 'pull_request']
  },
  jobs: [
    {
      name: 'test',
      runsOn: 'ubuntu-latest',
      strategy: {
        matrix: {
          'node-version': ['16.x', '18.x', '20.x']
        }
      },
      steps: [
        { name: 'Checkout code', uses: 'actions/checkout@v3' },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '${{ matrix.node-version }}'
          }
        },
        { name: 'Install dependencies', run: 'npm ci' },
        { name: 'Run tests', run: 'npm test' },
        { name: 'Run linter', run: 'npm run lint' }
      ]
    },
    {
      name: 'build',
      runsOn: 'ubuntu-latest',
      steps: [
        { name: 'Checkout code', uses: 'actions/checkout@v3' },
        { name: 'Build application', run: 'npm run build' },
        { name: 'Upload artifacts', uses: 'actions/upload-artifact@v3', with: { 'name': 'dist', 'path': 'dist/' } }
      ]
    }
  ]
};

const githubWorkflow = engine.render(githubActionsTemplate, githubContext);
console.log(githubWorkflow);
console.log('\n' + '='.repeat(70) + '\n');

console.log('=== All configuration examples completed! ===');
