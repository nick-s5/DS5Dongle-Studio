const fs=require('fs'), assert=require('assert');
const html=fs.readFileSync(process.argv[2]||'ds5-config-portal.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const cut=script.indexOf('\nrender();\nportalSelfCheck();');
const win={},doc={getElementById:()=>null,querySelector:()=>null,addEventListener(){}};
const P=new Function('window','document','navigator','setInterval',script.slice(0,cut)+`
 return {FIELDS,SECTIONS,STUDIO_GROUPS,config,studioSet,studioFormat,studioPreviewHTML,studioSectionHTML,studioMacroCardsHTML,studioMacroHTML};
`)(win,doc,{hid:{addEventListener(){}}},()=>0);
P.studioSet('haptics_gain',1.65);assert.equal(P.config.haptics_gain,1.65);
P.studioSet('haptics_gain',99);assert.equal(P.config.haptics_gain,2);
P.studioSet('auto_haptics_gain',-1);assert.equal(P.config.auto_haptics_gain,0);
P.studioSet('stick_mouse_deadzone',12.8);assert.equal(P.config.stick_mouse_deadzone,13);
P.studioSet('stick_mouse_deadzone','invalid');assert.equal(P.config.stick_mouse_deadzone,13);
assert.equal(win._dirty.haptics_gain,1);
assert.equal(P.config.at_strength,undefined,'other settings stay untouched');
const format=(key,n)=>P.studioFormat(P.FIELDS.find(f=>f[1]===key),n);
assert.equal(format('gyro_natural_x10',25),'2.5×');
assert.equal(format('effect_leak_max_burst',12),'60 ms');
assert.equal(format('effect_leak_max_burst',0),'Unlimited');
assert.equal(format('gyro_sens_y',0),'Match horizontal');
for(const [title,groups] of Object.entries(P.STUDIO_GROUPS)){
 const section=P.SECTIONS.find(s=>s.title===title),keys=groups.flatMap(g=>g[2]);
 assert.deepEqual([...keys].sort(),section.fields.map(f=>f[1]).sort(),title+' keeps every field exactly once');
 const markup=P.studioSectionHTML(section);
 assert.ok(markup.includes('type="range"'));
 assert.ok(!markup.includes('saveAll()'),'editing does not save automatically');
}
Object.assign(P.config,{auto_haptics_enable:1,auto_haptics_gain:90,mix_native_level:50});
assert.match(P.studioPreviewHTML('haptics'),/90%/);
Object.assign(P.config,{stick_mouse_curve:22,stick_mouse_deadzone:15});
assert.match(P.studioPreviewHTML('gyro'),/2.2× curve · 15% dead zone/);
const action='<select onchange="macroSetOutKind(0, +this.value)"><option>Keyboard</option></select>';
const labelled=P.studioMacroHTML(action);
assert.match(labelled,/aria-label="Macro 1 — Output type"/);
assert.match(labelled,/id="mc_/);
console.log('STUDIO TEST OK: numeric precision, bounds, units, groups, previews and macro labels');
