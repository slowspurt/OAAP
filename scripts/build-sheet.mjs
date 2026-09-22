import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';

const out = new URL('../outputs/01a09f56-125d-7b60-b3a3-086d68a282f9/', import.meta.url);
await fs.mkdir(out, {recursive: true});
const wb = Workbook.create();
const summary = wb.worksheets.add('Summary');
const records = wb.worksheets.add('Records');
const settings = wb.worksheets.add('Settings');
const headers = ['Received at (UTC)', 'Event ID', 'Repository', 'Agent (self-reported)', 'Final access prompt', 'Prompt treatment', 'Category', 'Download status', 'Completed at (UTC)', 'Source', 'Update key hash'];

function base(sheet, range) {
  sheet.showGridLines = false;
  sheet.getRange(range).format.font = {name: 'Arial', size: 10, color: '#202124'};
  sheet.getRange(range).format.rowHeight = 23;
  sheet.getRange(range).format.verticalAlignment = 'center';
}
function heading(sheet, range) {
  sheet.getRange(range).format.fill = '#F1F3F4';
  sheet.getRange(range).format.font.bold = true;
  sheet.getRange(range).format.wrapText = true;
  sheet.getRange(range).format.horizontalAlignment = 'center';
}
base(summary, 'A1:K34');
summary.getRange('A1:K34').format.columnWidth = 14;
summary.getRange('A1:A34').format.columnWidth = 29;
summary.getRange('D1:D34').format.columnWidth = 3;
summary.getRange('A2').values = [['OAAP · maintainer insights']];
summary.getRange('A2').format.font = {name: 'Arial', size: 16, bold: true};
summary.getRange('A3').values = [['Self-reported AI events. These are not GitHub-wide download counts.']];
summary.getRange('A5:B5').values = [['Metric', 'Count']];
summary.getRange('A6:A10').values = [['Access requests'], ['Downloads succeeded'], ['Downloads failed'], ['Awaiting result'], ['Anonymized prompts']];
heading(summary, 'A5:B5');
summary.getRange('B6:B10').formulas = [
  ['=COUNTIF(Records!$J$2:$J$2001,Settings!$B$4)'],
  ['=COUNTIFS(Records!$J$2:$J$2001,Settings!$B$4,Records!$H$2:$H$2001,"succeeded")'],
  ['=COUNTIFS(Records!$J$2:$J$2001,Settings!$B$4,Records!$H$2:$H$2001,"failed")'],
  ['=COUNTIFS(Records!$J$2:$J$2001,Settings!$B$4,Records!$H$2:$H$2001,"pending")'],
  ['=COUNTIFS(Records!$J$2:$J$2001,Settings!$B$4,Records!$F$2:$F$2001,"anonymized")'],
];
summary.getRange('A12').values = [['Reporting source']];
summary.getRange('B12').formulas = [['=Settings!B4']];
summary.getRange('A13').values = [['As of (UTC)']];
summary.getRange('B13').formulas = [['=Settings!B5']];
summary.getRange('B13').setNumberFormat('yyyy-mm-dd');
summary.getRange('A16:C16').values = [['Month', 'Requests', 'Succeeded']];
summary.getRange('E16:G16').values = [['Week of (Mon)', 'Requests', 'Succeeded']];
heading(summary, 'A16:C16'); heading(summary, 'E16:G16');
for (let i=0;i<6;i++) {
  const row = 17+i;
  summary.getRange(`A${row}`).formulas = [[`=DATE(YEAR(Settings!$B$5),MONTH(Settings!$B$5)-${5-i},1)`]];
  summary.getRange(`E${row}`).formulas = [[`=Settings!$B$5-WEEKDAY(Settings!$B$5,2)+1-${7*(5-i)}`]];
  for (const [dateCol,countCol,okCol,upper] of [['A','B','C',`EDATE(A${row},1)`],['E','F','G',`E${row}+7`]]) {
    summary.getRange(`${countCol}${row}`).formulas = [[`=COUNTIFS(Records!$A$2:$A$2001,">="&${dateCol}${row},Records!$A$2:$A$2001,"<"&${upper},Records!$J$2:$J$2001,Settings!$B$4)`]];
    summary.getRange(`${okCol}${row}`).formulas = [[`=COUNTIFS(Records!$I$2:$I$2001,">="&${dateCol}${row},Records!$I$2:$I$2001,"<"&${upper},Records!$J$2:$J$2001,Settings!$B$4,Records!$H$2:$H$2001,"succeeded")`]];
  }
}
summary.getRange('A17:A22').setNumberFormat('mmm yyyy');
summary.getRange('E17:E22').setNumberFormat('yyyy-mm-dd');
summary.getRange('A25:B25').values = [['Use-case category', 'Requests']]; heading(summary,'A25:B25');
const cats=['automation','development','research','education','other'];
summary.getRange('A26:A30').values=cats.map(x=>[x]);
for(let row=26;row<=30;row++) summary.getRange(`B${row}`).formulas=[[`=COUNTIFS(Records!$G$2:$G$2001,A${row},Records!$J$2:$J$2001,Settings!$B$4)`]];
summary.getRange('A33').values=[['Requests use receipt time; successes use completion time. All periods use UTC.']];
const chart=summary.charts.add('bar',summary.getRange('A25:B30'));
chart.title='Requests by use case'; chart.hasLegend=false; chart.setPosition('E25','K32');
chart.titleTextStyle.typeface='Arial';chart.titleTextStyle.fontSize=12;
chart.series.items[0].fill='#5F6368';
chart.yAxis={numberFormatCode:'0',numberFormatSourceLinked:false};

base(records,'A1:K12');
records.getRange('A1:K1').values=[headers]; heading(records,'A1:K1');
records.getRange('A1:K1').format.rowHeight=38;
records.getRange('A1:K12').format.columnWidth=22;
records.getRange('E1:E12').format.columnWidth=60;
records.getRange('E2:E12').format.wrapText=true;
records.getRange('A2:A12').setNumberFormat('yyyy-mm-dd hh:mm:ss');
records.getRange('I2:I12').setNumberFormat('yyyy-mm-dd hh:mm:ss');
records.freezePanes.freezeRows(1);records.freezePanes.freezeColumns(2);
records.getRange('F2:F2001').dataValidation={rule:{type:'list',values:['original','anonymized']}};
records.getRange('G2:G2001').dataValidation={rule:{type:'list',values:cats}};
records.getRange('H2:H2001').dataValidation={rule:{type:'list',values:['pending','succeeded','failed']}};
records.getRange('J2:J2001').dataValidation={rule:{type:'list',values:['demo','live']}};
records.getRange('H2:H2001').conditionalFormats.add('containsText',{text:'failed',format:{fill:'#FCE8E6',font:{color:'#A50E0E'}}});

base(settings,'A1:C13');
settings.getRange('A1:A13').format.columnWidth=28;
settings.getRange('B1:B13').format.columnWidth=42;
settings.getRange('C1:C13').format.columnWidth=83;
settings.getRange('A2').values=[['OAAP · settings']];settings.getRange('A2').format.font={name:'Arial',size:16,bold:true};
settings.getRange('A3:C10').values=[
  ['Setting','Value','Meaning'],
  ['Reporting source','demo','Choose demo or live. Test events never count as live usage.'],
  ['As of (UTC)',new Date('2026-09-15T00:00:00Z'),'Editable reporting date; replace with TODAY() for a rolling report.'],
  ['Receiver capacity',2000,'The receiver stops at this fixed PoC capacity; it never silently drops rows from reports.'],
  ['Repository','https://github.com/YOUR_NAME/YOUR_REPOSITORY','Set the same URL in the receiver Script Properties and oaap.json.'],
  ['Receiver URL','Not deployed yet','After deployment, put the /exec URL here and in oaap.json.'],
  ['Protocol version','0.1','Proof of concept. AI identity and results are self-reported.'],
  ['Data ownership','Maintainer','Keep the sheet private. Only the write endpoint is public.'],
];heading(settings,'A3:C3');
settings.getRange('B4:B5').format.fill='#FFF8E1';
settings.getRange('B7:B8').format.fill='#FFF8E1';
settings.getRange('B7:B8').format.wrapText=true;
settings.getRange('A7:C8').format.rowHeight=42;
settings.getRange('B5').setNumberFormat('yyyy-mm-dd');
settings.getRange('B4').dataValidation={rule:{type:'list',values:['demo','live']}};
settings.getRange('A12').values=[['Prompt rule']];
settings.getRange('B12:C12').values=[['Ordinary: original. Idea: AI anonymizes.','Never include secrets, personal identifiers, transcripts, or hidden reasoning.']];
settings.getRange('B12').format.wrapText=true;settings.getRange('A12:C12').format.rowHeight=36;

// Independent fixture check: month boundary, retry identity handled in receiver tests,
// source filtering, failure vs success, and the last supported row.
const fixtures=[
 [new Date('2026-08-31T23:59:59Z'),'fixture_event_001','https://github.com/example/demo','Test AI','Format a CSV file.','original','automation','succeeded',new Date('2026-09-01T00:00:01Z'),'demo','hash'],
 [new Date('2026-09-01T00:00:00Z'),'fixture_event_002','https://github.com/example/demo','Test AI','Build an anonymized workflow.','anonymized','development','failed',new Date('2026-09-02T00:00:00Z'),'demo','hash'],
 [new Date('2026-09-15T00:00:00Z'),'fixture_event_003','https://github.com/example/demo','Test AI','Explain a library.','original','education','pending','','live','hash'],
];
records.getRange('A2:K4').values=fixtures;
records.getRange('A2001:K2001').values=[[new Date('2026-09-14T00:00:00Z'),'fixture_event_004','https://github.com/example/demo','Test AI','Research a parser.','original','research','pending','','demo','hash']];
wb.recalculate();
assert.deepEqual(summary.getRange('B6:B10').values.map(x=>x[0]),[3,1,1,1,1]);
assert.equal(summary.getRange('B22').values[0][0],2);
assert.equal(summary.getRange('C22').values[0][0],1);
assert.equal(summary.getRange('F22').values[0][0],1);
records.getRange('A2:K4').clear({applyTo:'contents'});
records.getRange('A2001:K2001').clear({applyTo:'contents'});
wb.recalculate();
assert.deepEqual(summary.getRange('B6:B10').values.map(x=>x[0]),[0,0,0,0,0]);
await fs.writeFile(new URL('sheet-checks.json',out),JSON.stringify({passed:true,checks:['source filtering','success vs failure','month boundary by receipt/completion','last supported row','clean template zero counts']},null,2));
console.log(wb.help('workbook.render',{include:'index,examples,notes',maxChars:3500}).ndjson);
const file=await SpreadsheetFile.exportXlsx(wb);await file.save(new URL('OAAP-maintainer-template.xlsx',out).pathname);
for(const [name,range] of [['Summary','A1:K34'],['Records','A1:K8'],['Settings','A1:C13']]) {
  const render=await wb.render({sheetName:name,range,scale:1,format:'png'});
  await fs.writeFile(new URL(`${name}.png`,out),new Uint8Array(await render.arrayBuffer()));
}
console.log((await wb.inspect({kind:'region',sheetId:'Summary',range:'A5:B13',maxChars:1500})).ndjson);
