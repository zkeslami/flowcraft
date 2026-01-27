import { FlowExecution, ExecutionHistoryItem } from './execution-types';

// Current/most recent execution - running
export const currentExecution: FlowExecution = {
  id: 'exec-current',
  flowId: 'flow-invoice-001',
  flowName: 'Invoice Processing Workflow',
  status: 'running',
  startTime: new Date(Date.now() - 12000),
  triggeredBy: 'Manual Test',
  summary: {
    totalNodes: 6,
    completedNodes: 2,
    failedNodes: 0,
    pendingNodes: 3,
    runningNodes: 1,
  },
  spans: [
    {
      id: 'span-current-1',
      nodeId: '1',
      nodeName: 'Invoice Received',
      nodeType: 'trigger',
      status: 'success',
      startTime: new Date(Date.now() - 12000),
      endTime: new Date(Date.now() - 11000),
      duration: 1000,
      inputs: { source: 'email', invoiceId: 'INV-2024-001' },
      outputs: { invoiceData: { id: 'INV-2024-001', amount: 1250.00 } },
      logs: [
        { id: 'log-c1', timestamp: new Date(Date.now() - 12000), level: 'info', message: 'Invoice received from email' },
        { id: 'log-c2', timestamp: new Date(Date.now() - 11500), level: 'info', message: 'Invoice ID: INV-2024-001' },
      ],
      metrics: { cpuTime: 45, memoryUsage: 10 },
    },
    {
      id: 'span-current-2',
      nodeId: '2',
      nodeName: 'Extract Invoice Data',
      nodeType: 'agent',
      status: 'success',
      startTime: new Date(Date.now() - 11000),
      endTime: new Date(Date.now() - 7000),
      duration: 4000,
      inputs: { invoiceData: { id: 'INV-2024-001', amount: 1250.00 } },
      outputs: {
        extracted: {
          vendor: 'Acme Corp',
          amount: 1250.00,
          date: '2024-01-15',
          items: [{ description: 'Professional Services', amount: 1250.00 }]
        }
      },
      logs: [
        { id: 'log-c3', timestamp: new Date(Date.now() - 11000), level: 'info', message: 'Starting data extraction' },
        { id: 'log-c4', timestamp: new Date(Date.now() - 9000), level: 'debug', message: 'Processing invoice fields' },
        { id: 'log-c5', timestamp: new Date(Date.now() - 7000), level: 'info', message: 'Extraction completed' },
      ],
      metrics: { cpuTime: 180, memoryUsage: 52 },
      agentConfig: {
        systemPrompt: 'You are an invoice data extraction assistant. Extract structured data from invoice documents.',
        userPrompt: 'Extract vendor, amount, date, and line items from the following invoice: {{invoiceData}}',
        temperature: 0.2,
        maxTokens: 800,
        model: 'claude-sonnet-4-5',
        topP: 0.9,
      },
    },
    {
      id: 'span-current-3',
      nodeId: '3',
      nodeName: 'Validate Invoice',
      nodeType: 'agent',
      status: 'running',
      startTime: new Date(Date.now() - 7000),
      inputs: {
        extracted: {
          vendor: 'Acme Corp',
          amount: 1250.00,
          date: '2024-01-15',
        }
      },
      logs: [
        { id: 'log-c6', timestamp: new Date(Date.now() - 7000), level: 'info', message: 'Starting validation' },
        { id: 'log-c7', timestamp: new Date(Date.now() - 5000), level: 'debug', message: 'Checking vendor against database' },
        { id: 'log-c8', timestamp: new Date(Date.now() - 3000), level: 'debug', message: 'Validating amount against budget' },
      ],
      metrics: { cpuTime: 125, memoryUsage: 42 },
      agentConfig: {
        systemPrompt: 'You are an invoice validation assistant. Verify invoice data for accuracy and compliance.',
        userPrompt: 'Validate the following invoice data: {{extracted}}',
        temperature: 0.3,
        maxTokens: 600,
        model: 'gpt-4o',
      },
    },
  ],
};

// Previous successful execution
export const successfulExecution: FlowExecution = {
  id: 'exec-001',
  flowId: 'flow-invoice-001',
  flowName: 'Invoice Processing Workflow',
  status: 'success',
  startTime: new Date(Date.now() - 3600000),
  endTime: new Date(Date.now() - 3545000),
  duration: 55000,
  triggeredBy: 'Manual Trigger',
  summary: {
    totalNodes: 6,
    completedNodes: 6,
    failedNodes: 0,
    pendingNodes: 0,
    runningNodes: 0,
  },
  spans: [
    {
      id: 'span-1',
      nodeId: '1',
      nodeName: 'Invoice Received',
      nodeType: 'trigger',
      status: 'success',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 3599000),
      duration: 1000,
      inputs: { source: 'api', invoiceId: 'INV-2024-002' },
      outputs: { invoiceData: { id: 'INV-2024-002', amount: 2450.00 } },
      logs: [
        { id: 'log-1', timestamp: new Date(Date.now() - 3600000), level: 'info', message: 'Invoice received from API' },
        { id: 'log-2', timestamp: new Date(Date.now() - 3599500), level: 'info', message: 'Invoice ID: INV-2024-002' },
      ],
      metrics: { cpuTime: 50, memoryUsage: 12 },
    },
    {
      id: 'span-2',
      nodeId: '2',
      nodeName: 'Extract Invoice Data',
      nodeType: 'agent',
      status: 'success',
      startTime: new Date(Date.now() - 3599000),
      endTime: new Date(Date.now() - 3590000),
      duration: 9000,
      inputs: { invoiceData: { id: 'INV-2024-002', amount: 2450.00 } },
      outputs: {
        extracted: {
          vendor: 'Tech Solutions Ltd',
          amount: 2450.00,
          date: '2024-01-14',
          items: [
            { description: 'Software License', amount: 1200.00 },
            { description: 'Support & Maintenance', amount: 1250.00 }
          ]
        }
      },
      logs: [
        { id: 'log-3', timestamp: new Date(Date.now() - 3599000), level: 'info', message: 'Starting data extraction' },
        { id: 'log-4', timestamp: new Date(Date.now() - 3595000), level: 'debug', message: 'Processing invoice fields' },
        { id: 'log-5', timestamp: new Date(Date.now() - 3590000), level: 'info', message: 'Extraction completed successfully' },
      ],
      metrics: { cpuTime: 220, memoryUsage: 68 },
      agentConfig: {
        systemPrompt: 'You are an invoice data extraction assistant. Extract structured data from invoice documents.',
        userPrompt: 'Extract vendor, amount, date, and line items from the following invoice: {{invoiceData}}',
        temperature: 0.2,
        maxTokens: 800,
        model: 'claude-sonnet-4-5',
        topP: 0.9,
      },
      children: [
        {
          id: 'span-2-1',
          nodeId: '2-child-1',
          nodeName: 'Parse Invoice Fields',
          nodeType: 'parsing',
          status: 'success',
          startTime: new Date(Date.now() - 3598000),
          endTime: new Date(Date.now() - 3594000),
          duration: 4000,
          inputs: { document: 'invoice-pdf' },
          outputs: { fields: ['vendor', 'amount', 'date', 'items'] },
          logs: [
            { id: 'log-2-1', timestamp: new Date(Date.now() - 3598000), level: 'info', message: 'Parsing invoice document' },
          ],
          metrics: { cpuTime: 110, memoryUsage: 34 },
        },
        {
          id: 'span-2-2',
          nodeId: '2-child-2',
          nodeName: 'Structure Data',
          nodeType: 'transformation',
          status: 'success',
          startTime: new Date(Date.now() - 3594000),
          endTime: new Date(Date.now() - 3591000),
          duration: 3000,
          inputs: { fields: ['vendor', 'amount', 'date', 'items'] },
          outputs: { structured: true },
          logs: [
            { id: 'log-2-2', timestamp: new Date(Date.now() - 3594000), level: 'info', message: 'Structuring extracted data' },
          ],
          metrics: { cpuTime: 80, memoryUsage: 28 },
        },
      ],
    },
    {
      id: 'span-3',
      nodeId: '3',
      nodeName: 'Validate Invoice',
      nodeType: 'agent',
      status: 'success',
      startTime: new Date(Date.now() - 3590000),
      endTime: new Date(Date.now() - 3575000),
      duration: 15000,
      inputs: {
        extracted: {
          vendor: 'Tech Solutions Ltd',
          amount: 2450.00,
          date: '2024-01-14',
        }
      },
      outputs: {
        isValid: true,
        checks: {
          vendorExists: true,
          amountValid: true,
          dateValid: true,
          budgetApproved: true
        }
      },
      logs: [
        { id: 'log-6', timestamp: new Date(Date.now() - 3590000), level: 'info', message: 'Starting validation' },
        { id: 'log-7', timestamp: new Date(Date.now() - 3585000), level: 'debug', message: 'Checking vendor against database' },
        { id: 'log-8', timestamp: new Date(Date.now() - 3580000), level: 'debug', message: 'Validating amount against budget' },
        { id: 'log-9', timestamp: new Date(Date.now() - 3575000), level: 'info', message: 'All validation checks passed' },
      ],
      metrics: { cpuTime: 280, memoryUsage: 92 },
      agentConfig: {
        systemPrompt: 'You are an invoice validation assistant. Verify invoice data for accuracy and compliance.',
        userPrompt: 'Validate the following invoice data: {{extracted}}',
        temperature: 0.3,
        maxTokens: 600,
        model: 'gpt-4o',
      },
      children: [
        {
          id: 'span-3-1',
          nodeId: '3-child-1',
          nodeName: 'Vendor Lookup',
          nodeType: 'database',
          status: 'success',
          startTime: new Date(Date.now() - 3589000),
          endTime: new Date(Date.now() - 3585000),
          duration: 4000,
          inputs: { vendor: 'Tech Solutions Ltd' },
          outputs: { found: true, vendorId: 'VND-456' },
          logs: [
            { id: 'log-3-1', timestamp: new Date(Date.now() - 3589000), level: 'info', message: 'Looking up vendor in database' },
          ],
          metrics: { cpuTime: 120, memoryUsage: 40 },
        },
        {
          id: 'span-3-2',
          nodeId: '3-child-2',
          nodeName: 'Budget Check',
          nodeType: 'validation',
          status: 'success',
          startTime: new Date(Date.now() - 3585000),
          endTime: new Date(Date.now() - 3578000),
          duration: 7000,
          inputs: { amount: 2450.00, department: 'IT' },
          outputs: { approved: true, remainingBudget: 47550.00 },
          logs: [
            { id: 'log-3-2', timestamp: new Date(Date.now() - 3585000), level: 'info', message: 'Checking budget allocation' },
          ],
          metrics: { cpuTime: 140, memoryUsage: 48 },
        },
      ],
    },
    {
      id: 'span-4',
      nodeId: '4',
      nodeName: 'Route for Approval',
      nodeType: 'action',
      status: 'success',
      startTime: new Date(Date.now() - 3575000),
      endTime: new Date(Date.now() - 3560000),
      duration: 15000,
      inputs: {
        invoiceData: { vendor: 'Tech Solutions Ltd', amount: 2450.00 },
        validationResult: { isValid: true }
      },
      outputs: {
        approver: 'manager@company.com',
        priority: 'normal',
        ticketId: 'APR-789'
      },
      logs: [
        { id: 'log-10', timestamp: new Date(Date.now() - 3575000), level: 'info', message: 'Determining approval route' },
        { id: 'log-11', timestamp: new Date(Date.now() - 3565000), level: 'info', message: 'Assigned to manager@company.com' },
        { id: 'log-12', timestamp: new Date(Date.now() - 3560000), level: 'info', message: 'Approval ticket created: APR-789' },
      ],
      metrics: { cpuTime: 150, memoryUsage: 55 },
    },
    {
      id: 'span-5',
      nodeId: '5',
      nodeName: 'Send Notification',
      nodeType: 'notification',
      status: 'success',
      startTime: new Date(Date.now() - 3560000),
      endTime: new Date(Date.now() - 3550000),
      duration: 10000,
      inputs: {
        recipient: 'manager@company.com',
        subject: 'Invoice Approval Required',
        invoiceId: 'INV-2024-002'
      },
      outputs: {
        sent: true,
        messageId: 'msg-abc123'
      },
      logs: [
        { id: 'log-13', timestamp: new Date(Date.now() - 3560000), level: 'info', message: 'Preparing notification email' },
        { id: 'log-14', timestamp: new Date(Date.now() - 3555000), level: 'info', message: 'Sending to manager@company.com' },
        { id: 'log-15', timestamp: new Date(Date.now() - 3550000), level: 'info', message: 'Notification sent successfully' },
      ],
      metrics: { cpuTime: 80, memoryUsage: 25 },
    },
    {
      id: 'span-6',
      nodeId: '6',
      nodeName: 'Complete',
      nodeType: 'end',
      status: 'success',
      startTime: new Date(Date.now() - 3550000),
      endTime: new Date(Date.now() - 3545000),
      duration: 5000,
      inputs: { status: 'pending_approval', ticketId: 'APR-789' },
      outputs: { result: 'Invoice processing completed - awaiting approval' },
      logs: [
        { id: 'log-16', timestamp: new Date(Date.now() - 3550000), level: 'info', message: 'Finalizing workflow' },
        { id: 'log-17', timestamp: new Date(Date.now() - 3545000), level: 'info', message: 'Workflow completed successfully' },
      ],
      metrics: { cpuTime: 40, memoryUsage: 15 },
    },
  ],
};

// Previous failed execution
export const failedExecution: FlowExecution = {
  id: 'exec-002',
  flowId: 'flow-invoice-001',
  flowName: 'Invoice Processing Workflow',
  status: 'error',
  startTime: new Date(Date.now() - 7200000),
  endTime: new Date(Date.now() - 7180000),
  duration: 20000,
  triggeredBy: 'API Trigger',
  summary: {
    totalNodes: 6,
    completedNodes: 2,
    failedNodes: 1,
    pendingNodes: 3,
    runningNodes: 0,
  },
  spans: [
    {
      id: 'span-f1',
      nodeId: '1',
      nodeName: 'Invoice Received',
      nodeType: 'trigger',
      status: 'success',
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 7199000),
      duration: 1000,
      inputs: { source: 'webhook', invoiceId: 'INV-2024-003' },
      outputs: { invoiceData: { id: 'INV-2024-003', amount: 15750.00 } },
      logs: [
        { id: 'log-f1', timestamp: new Date(Date.now() - 7200000), level: 'info', message: 'Invoice received from webhook' },
        { id: 'log-f2', timestamp: new Date(Date.now() - 7199500), level: 'info', message: 'Invoice ID: INV-2024-003' },
      ],
      metrics: { cpuTime: 55, memoryUsage: 14 },
    },
    {
      id: 'span-f2',
      nodeId: '2',
      nodeName: 'Extract Invoice Data',
      nodeType: 'agent',
      status: 'success',
      startTime: new Date(Date.now() - 7199000),
      endTime: new Date(Date.now() - 7190000),
      duration: 9000,
      inputs: { invoiceData: { id: 'INV-2024-003', amount: 15750.00 } },
      outputs: {
        extracted: {
          vendor: 'Global Supplies Inc',
          amount: 15750.00,
          date: '2024-01-10',
          items: [
            { description: 'Office Equipment', amount: 15750.00 }
          ]
        }
      },
      logs: [
        { id: 'log-f3', timestamp: new Date(Date.now() - 7199000), level: 'info', message: 'Starting data extraction' },
        { id: 'log-f4', timestamp: new Date(Date.now() - 7195000), level: 'debug', message: 'Processing invoice fields' },
        { id: 'log-f5', timestamp: new Date(Date.now() - 7190000), level: 'info', message: 'Extraction completed' },
      ],
      metrics: { cpuTime: 210, memoryUsage: 65 },
      agentConfig: {
        systemPrompt: 'You are an invoice data extraction assistant. Extract structured data from invoice documents.',
        userPrompt: 'Extract vendor, amount, date, and line items from the following invoice: {{invoiceData}}',
        temperature: 0.2,
        maxTokens: 800,
        model: 'claude-sonnet-4-5',
      },
    },
    {
      id: 'span-f3',
      nodeId: '3',
      nodeName: 'Validate Invoice',
      nodeType: 'agent',
      status: 'error',
      startTime: new Date(Date.now() - 7190000),
      endTime: new Date(Date.now() - 7180000),
      duration: 10000,
      inputs: {
        extracted: {
          vendor: 'Global Supplies Inc',
          amount: 15750.00,
          date: '2024-01-10',
        }
      },
      outputs: {
        error: 'Budget validation failed',
        checks: {
          vendorExists: true,
          amountValid: true,
          dateValid: true,
          budgetApproved: false
        }
      },
      logs: [
        { id: 'log-f6', timestamp: new Date(Date.now() - 7190000), level: 'info', message: 'Starting validation' },
        { id: 'log-f7', timestamp: new Date(Date.now() - 7185000), level: 'debug', message: 'Checking vendor against database' },
        { id: 'log-f8', timestamp: new Date(Date.now() - 7182000), level: 'warn', message: 'Budget exceeded for this amount' },
        { id: 'log-f9', timestamp: new Date(Date.now() - 7180000), level: 'error', message: 'Validation failed: Amount exceeds available budget' },
      ],
      metrics: { cpuTime: 180, memoryUsage: 75, retryCount: 2 },
      agentConfig: {
        systemPrompt: 'You are an invoice validation assistant. Verify invoice data for accuracy and compliance.',
        userPrompt: 'Validate the following invoice data: {{extracted}}',
        temperature: 0.3,
        maxTokens: 600,
        model: 'gpt-4o',
      },
    },
  ],
};

// Execution history items
export const mockExecutionHistory: ExecutionHistoryItem[] = [
  {
    id: 'exec-current',
    flowId: 'flow-invoice-001',
    status: 'running',
    startTime: new Date(Date.now() - 8000),
    triggeredBy: 'Manual Test',
    stepsCount: 3
  },
  {
    id: 'exec-001',
    flowId: 'flow-invoice-001',
    status: 'success',
    startTime: new Date(Date.now() - 3600000),
    duration: 55000,
    triggeredBy: 'Manual Trigger',
    stepsCount: 6
  },
  {
    id: 'exec-002',
    flowId: 'flow-invoice-001',
    status: 'error',
    startTime: new Date(Date.now() - 7200000),
    duration: 20000,
    triggeredBy: 'API Trigger',
    stepsCount: 3
  },
  {
    id: 'exec-003',
    flowId: 'flow-invoice-001',
    status: 'success',
    startTime: new Date(Date.now() - 86400000),
    duration: 52000,
    triggeredBy: 'Schedule',
    stepsCount: 6
  },
  {
    id: 'exec-004',
    flowId: 'flow-invoice-001',
    status: 'success',
    startTime: new Date(Date.now() - 172800000),
    duration: 48000,
    triggeredBy: 'Webhook',
    stepsCount: 6
  },
  {
    id: 'exec-005',
    flowId: 'flow-invoice-001',
    status: 'error',
    startTime: new Date(Date.now() - 259200000),
    duration: 18000,
    triggeredBy: 'API Trigger',
    stepsCount: 2
  },
  {
    id: 'exec-006',
    flowId: 'flow-invoice-001',
    status: 'success',
    startTime: new Date(Date.now() - 345600000),
    duration: 51000,
    triggeredBy: 'Manual Trigger',
    stepsCount: 6
  },
  {
    id: 'exec-007',
    flowId: 'flow-invoice-001',
    status: 'success',
    startTime: new Date(Date.now() - 432000000),
    duration: 49000,
    triggeredBy: 'Schedule',
    stepsCount: 6
  },
];

// Map execution IDs to full execution objects
export const executionMap: Record<string, FlowExecution> = {
  'exec-current': currentExecution,
  'exec-001': successfulExecution,
  'exec-002': failedExecution,
};
