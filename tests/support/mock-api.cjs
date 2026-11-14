// Synthetic-only, loopback-only mock. No AI or external API requests.
const http = require('node:http');
async function startMock({scenario='success',port=0}={}) {
  const events=[];
  const saved=new Set();
  const timers=new Set();
  const server=http.createServer(async(req,res)=>{
    const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
    if(req.url==='/slow') {
      const timer=setTimeout(()=>{timers.delete(timer);reply(503,{error:'synthetic timeout'});},1000);
      timers.add(timer);return;
    }
    if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
    try {
      let raw=''; for await(const chunk of req) { raw+=chunk; if(raw.length>16384)return reply(413,{error:'payload_too_large'}); }
      const body=JSON.parse(raw);
      if(req.url==='/enrich'&&typeof body?.leadId==='string'&&body.leadId) {
        events.push('/enrich');return reply(200,{companySize:'synthetic-small',region:'demo-EU'});
      }
      if(req.url==='/crm'&&typeof body?.lead_id==='string'&&body.lead_id) {
        events.push('/crm'); const ok=scenario!=='crm-reject'; if(ok)saved.add(body.lead_id);
        return reply(200,{saved:ok,leadId:body.lead_id,crmId:'crm-'+body.lead_id});
      }
      if(req.url==='/notify'&&typeof body?.leadId==='string'&&saved.has(body.leadId)&&typeof body.text==='string'&&body.channel==='sales-demo') {
        events.push('/notify');return reply(200,{sent:scenario!=='notify-reject',leadId:body.leadId,notificationId:'notification-'+body.leadId});
      }
      return reply(400,{error:'invalid_mock_contract'});
    }catch {reply(400,{error:'invalid_mock_payload'});}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {url:`http://127.0.0.1:${server.address().port}`,events,close:()=>new Promise((resolve,reject)=>{
    for(const timer of timers)clearTimeout(timer);
    server.close(error=>error?reject(error):resolve());server.closeAllConnections();
  })};
}
module.exports={startMock};
if(require.main===module) startMock({port:Number(process.env.PORT||8787)}).then(mock=>{
  console.log(`Synthetic mock API: ${mock.url} (POST /enrich, /crm, /notify)`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>mock.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error);process.exitCode=1;});
