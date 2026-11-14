const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const ai = ['cases/ai-knowledge-base-assistant/workflow.json', 'cases/ai-knowledge-base-assistant/workflow-ollama.json'];
const lead = 'cases/webhook-api-lead-routing/workflow.json';
const order = 'cases/workflow-troubleshooting/fixed-workflow.json';
const err = 'cases/ai-knowledge-base-assistant/error-workflow.json';
const load = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const node = (file, name) => load(file).nodes.find(n => n.name === name);
function run(file, name, input = {}, previous = {}) {
  const code = node(file, name)?.parameters.jsCode;
  assert.equal(typeof code, 'string', `missing Code node: ${name}`);
  const value = vm.runInNewContext(`(function(){${code}\n})()`, {
    $json: structuredClone(input),
    $: name => { assert.ok(Object.hasOwn(previous, name), `missing mock prior node ${name}`); return { item: { json: structuredClone(previous[name]) } }; },
  }, { timeout: 1000 });
  return JSON.parse(JSON.stringify(value[0].json));
}
const buildName = f => f.includes('ollama') ? 'FIVERR DEMO - Build Ollama Request' : 'Code - Build OpenAI Request';
const validateName = f => f.includes('ollama') ? 'FIVERR DEMO - Validate Citation' : 'Code - Validate Model Output';
const source = { matches: [{id: 'KB-001', title:'Opening hours', content:'Closed Sundays.'}], sessionId:'synthetic', kbVersion:'demo', locale:'en', message:'hours' };
const output = (f, out) => run(f, validateName(f), f.includes('ollama') ? {message:{content:JSON.stringify(out)}} : {choices:[{message:{content:JSON.stringify(out)}}]}, {[buildName(f)]:source});
const valid = {answer:'Closed on Sundays.', citations:['KB-001'], handoff:false, handoffReason:null};

test('F02 strict four-field model contract rejects malformed outputs without coercion or filtering', () => {
  for (const f of ai) {
    assert.equal(output(f, valid).status, 'answered');
    for (const bad of [null, [], {...valid, answer:{}}, {...valid, answer:' '}, {...valid, handoff:'true'}, {...valid, handoff:undefined}, {...valid, handoffReason:undefined}, {...valid, handoffReason:42}, {...valid, extra:true}, {...valid, citations:['KB-999','KB-001']}, {...valid, citations:[1]}, {...valid, citations:[]}, {...valid, answer:'word '.repeat(80)}, {...valid, handoff:true}, {...valid, handoffReason:'unexpected'}]) {
      assert.equal(output(f, bad).status, 'handoff', `${f}: ${JSON.stringify(bad)}`);
    }
    const request = run(f, buildName(f), source);
    const schema = f.includes('ollama') ? request.ollamaBody.format : request.openaiBody.response_format.json_schema?.schema;
    assert.equal(schema.type, 'object');
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required.slice().sort(), ['answer','citations','handoff','handoffReason'].sort());
    if (!f.includes('ollama')) assert.equal(request.openaiBody.response_format.json_schema.strict, true);
  }
});

const leadFixture = {leadId:'demo-1', name:'Demo', email:'demo@example.test', service:'automation', budget:1000};
test('F05 budget is finite nonnegative numeric EUR within one million, invalid leads reject locally', () => {
  for (const budget of ['abc','Infinity',Infinity,NaN,{},null,true,-20,1000001,'',undefined]) {
    const result = run(lead, 'Code - Validate Lead', {body:{...leadFixture,budget}});
    assert.equal(result.status, 'rejected', `budget ${String(budget)}`);
    assert.equal(result.reason, 'invalid_lead');
    assert.equal(result.lead, undefined);
  }
  for (const budget of [0,400,1000,1000000,'400']) assert.equal(run(lead, 'Code - Validate Lead', {body:{...leadFixture,budget}}).lead.budget, Number(budget));
  assert.equal(run(lead, 'Code - Validate Lead', {body:{}}).status,'rejected');
  assert.equal(load(lead).connections['Code - Validate Lead'].main[0][0].node,'IF - Valid Lead?');
  assert.equal(load(lead).connections['IF - Valid Lead?'].main[1][0].node,'Respond - Rejected');
});

const orderFixture = {orderId:'order-demo',customer:{email:'demo@example.test'},items:[{price:10,qty:2}]};
test('F06 orders require number price and quantity before any conversion', () => {
  for (const item of [{price:null,qty:true},{price:'',qty:1},{price:'10',qty:1},{price:10,qty:'2'},{price:0,qty:false},null,{}]) {
    assert.equal(run(order,'Code - Process Order',{body:{...orderFixture,items:[item]}}).status,'rejected',JSON.stringify(item));
  }
  assert.equal(run(order,'Code - Process Order',{body:{...orderFixture,items:[{price:0,qty:1}]}}).total,0);
  assert.equal(run(order,'Code - Process Order',{body:orderFixture}).total,20);
});

test('F07 orders use bounded safe integer cents and reject overflow or subcent prices', () => {
  for (const items of [[{price:1e308,qty:2}],[{price:1.005,qty:1}],[{price:1,qty:Number.MAX_SAFE_INTEGER}],[{price:1,qty:1.5}],Array(101).fill({price:1,qty:1}),Array(100).fill({price:1e12,qty:1}),[{price:1e12,qty:10000}]]) {
    assert.equal(run(order,'Code - Process Order',{body:{...orderFixture,items}}).status,'rejected');
  }
  const result = run(order,'Code - Process Order',{body:{...orderFixture,items:[{price:0.1,qty:1},{price:0.2,qty:1},{price:19.99,qty:3}]}});
  assert.equal(result.totalCents,6027);
  assert.equal(result.total,60.27);
});

test('F08 error metadata whitelist preserves known nested type but no arbitrary strings', () => {
  const secret='Synthetic patient Demo; token=DEMO_ONLY';
  for (const input of [{execution:{id:secret,error:{name:'TimeoutError',message:secret}},workflow:{name:secret,id:secret}}, {error:{name:'TimeoutError',message:secret}}, {trigger:{error:{name:'TimeoutError',message:secret}}}]) {
    const result=run(err,'Code - Sanitize Error Metadata',input);
    assert.equal(result.errorType,'TimeoutError');
    assert.deepEqual(Object.keys(result).sort(),['timestamp','errorType'].sort());
    assert.ok(!JSON.stringify(result).includes(secret));
  }
  assert.equal(run(err,'Code - Sanitize Error Metadata',{error:{name:secret,message:secret}}).errorType,'WorkflowError');
});

test('F09 HTTP error output statically reaches a controlled current-webhook response', () => {
  for (const f of ai) {
    const http=load(f).nodes.find(n=>n.type==='n8n-nodes-base.httpRequest');
    assert.equal(http.onError,'continueErrorOutput');
    assert.equal(load(f).connections[http.name].main[1][0].node,'Code - HTTP Failure Handoff');
    assert.equal(load(f).connections['Code - HTTP Failure Handoff'].main[0][0].node,'Respond to Webhook - AI');
    for(const input of [{error:'synthetic token=DEMO_ONLY'},{error:{name:'TimeoutError',message:'synthetic patient'}},{message:'raw upstream'},{}]) {
      const result=run(f,'Code - HTTP Failure Handoff',input);
      assert.equal(result.status,'handoff'); assert.equal(result.handoff,true);
      assert.equal(result.handoffReason,'upstream_unavailable');
      assert.deepEqual(result.citations,[]);
      assert.ok(!JSON.stringify(result).includes('DEMO_ONLY'));
      assert.ok(!JSON.stringify(result).includes('synthetic patient'));
    }
  }
});

const built = {crmRow:{lead_id:'demo-1',priority:'high'},alert:{leadId:'demo-1',channel:'sales-demo',text:'synthetic'}};
const crmAck = {saved:true,leadId:'demo-1',crmId:'crm-demo-1'};
const notifyAck = {sent:true,leadId:'demo-1',notificationId:'notification-demo-1'};
test('F04 success requires matching explicit CRM and notify acknowledgements in a sequential graph', () => {
  const previous={'Code - Build CRM and Alert':built};
  assert.throws(()=>run(lead,'Code - Result',{},previous));
  for(const ack of [{}, {...crmAck,saved:false}, {...crmAck,leadId:'other'}, {...crmAck,crmId:''}, {...crmAck,saved:'true'}]) assert.throws(()=>run(lead,'Code - Verify CRM',ack,previous));
  const verified=run(lead,'Code - Verify CRM',crmAck,previous);
  for(const ack of [{}, {...notifyAck,sent:false}, {...notifyAck,leadId:'other'}, {...notifyAck,notificationId:''}]) assert.throws(()=>run(lead,'Code - Result',ack,{...previous,'Code - Verify CRM':verified}));
  const success=run(lead,'Code - Result',notifyAck,{...previous,'Code - Verify CRM':verified});
  assert.equal(success.status,'processed'); assert.equal(success.crmSaved,true); assert.equal(success.notificationSent,true);
  const c=load(lead).connections;
  for(const [from,to] of [['Code - Build CRM and Alert','HTTP - Save CRM Row'],['HTTP - Save CRM Row','Code - Verify CRM'],['Code - Verify CRM','HTTP - Send Alert'],['HTTP - Send Alert','Code - Result'],['Code - Result','Respond - Success']]) assert.deepEqual(c[from].main,[[{node:to,type:'main',index:0}]]);
});

test('F10 F11 localhost mock contract drives real workflow Code and HTTP body expressions (not n8n E2E)', async () => {
  assert.ok(fs.existsSync(path.join(__dirname,'support/mock-api.cjs')), 'runnable local mock API is missing');
  const { startMock } = require('./support/mock-api.cjs');
  async function execute(mock) {
    let data={body:leadFixture}; const previous={};
    for(const name of ['Code - Validate Lead','HTTP - Enrich Lead','Code - Build CRM and Alert','HTTP - Save CRM Row','Code - Verify CRM','HTTP - Send Alert','Code - Result']) {
      const n=node(lead,name);
      if(n.type==='n8n-nodes-base.code') data=run(lead,name,data,previous);
      else {
        const expression=n.parameters.body.replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '');
        const body=vm.runInNewContext(expression,{$json:data,$:name=>({item:{json:previous[name]}})},{timeout:1000});
        const response=await fetch(mock.url+new URL(n.parameters.url).pathname,{method:n.parameters.method,headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(2000)});
        assert.ok(response.ok); data=await response.json();
      }
      previous[name]=data;
    }
    return data;
  }
  for(const scenario of ['success','crm-reject','notify-reject']) {
    const mock=await startMock({scenario});
    try {
      if(scenario==='success') assert.equal((await execute(mock)).status,'processed');
      else await assert.rejects(execute(mock), /acknowledgement invalid/);
      assert.deepEqual(mock.events,scenario==='crm-reject'?['/enrich','/crm']:['/enrich','/crm','/notify']);
    } finally {await mock.close();}
  }
  const mock=await startMock();
  try {
    for(const f of ai) {
      await assert.rejects(fetch(mock.url+'/slow',{signal:AbortSignal.timeout(30)}));
      assert.equal(run(f,'Code - HTTP Failure Handoff',{error:'TimeoutError'}).handoffReason,'upstream_unavailable');
    }
    assert.equal((await fetch(mock.url+'/crm',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,400);
  } finally {await mock.close();}
});

test('F03 citation allow-list is not semantic fact checking', () => {
  for(const f of ai) assert.equal(output(f,{...valid,answer:'The clinic opens at 03:00 on Sunday.'}).status,'answered');
});

test('F03 F10 F11 documentation limits claims and supplies exact runnable setup', () => {
  const read=p=>fs.readFileSync(path.join(root,p),'utf8');
  const docs=read('cases/ai-knowledge-base-assistant/README.md');
  for(const text of ['not fact checking','not medical triage','Authorization','Bearer','host.docker.internal','qwen3:8b','continueErrorOutput','errorWorkflow','not n8n E2E']) assert.ok(docs.includes(text),text);
  const main=read('README.md');
  for(const text of ['node --test tests/regression.test.cjs','broken-workflow.json','fixed-workflow.json','No n8n runtime version has been verified']) assert.ok(main.includes(text),text);
  const leads=read('cases/webhook-api-lead-routing/README.md');
  for(const text of ['node tests/support/mock-api.cjs','saved','crmId','notificationId','idempotency']) assert.ok(leads.includes(text),text);
});

test('existing controls: exported JSON, Code syntax, inactive topology, intentionally broken input', () => {
  const files=[...ai,lead,order,err,'cases/workflow-troubleshooting/broken-workflow.json'];
  for(const file of files) {
    const w=load(file); assert.equal(w.active,false);
    const names=w.nodes.map(n=>n.name);assert.equal(new Set(names).size,names.length);
    for(const [name,connection] of Object.entries(w.connections)) {
      assert.ok(names.includes(name));
      for(const outputs of Object.values(connection)) for(const edges of outputs) for(const edge of edges) assert.ok(names.includes(edge.node));
    }
    for(const n of w.nodes) if(n.parameters.jsCode) new vm.Script(`(function(){${n.parameters.jsCode}\n})`);
  }
  assert.throws(()=>run('cases/workflow-troubleshooting/broken-workflow.json','Code - Process Order',{body:{}}),/email/);
  assert.equal(run(order,'Code - Process Order',{body:{}}).reason,'invalid_email');
  for(const f of ai)assert.equal(run(f,'Code - Retrieve KB',{message:''}).handoffReason,'invalid_input');
});

test('F01 emergency examples outrank length and FAQ routing in both exports', () => {
  for (const f of ai) for (const message of ["I can't breathe. What are your opening hours?", 'I can’t breathe', 'Ich kann nicht atmen', 'Я не можу дихати', 'difficulty breathing ' + 'hours '.repeat(100), 'hours '.repeat(100)+'Я не можу дихати']) {
    const result = run(f, 'Code - Retrieve KB', {message});
    assert.equal(result.handoffReason, 'emergency', `${f}: ${message}`);
    assert.equal(result.route, 'handoff');
  }
});
