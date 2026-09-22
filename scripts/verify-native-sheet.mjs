import fs from 'node:fs/promises';
import {FileBlob,Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const out=new URL('../outputs/01a09f56-125d-7b60-b3a3-086d68a282f9/',import.meta.url);
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(new URL('native-export.xlsx',out).pathname));
for(const [name,range] of [['Summary','A1:K34'],['Records','A1:K8'],['Settings','A1:C13']]) {
 const preview=await wb.render({sheetName:name,range,scale:1,format:'png'});
 await fs.writeFile(new URL(`native-${name}.png`,out),new Uint8Array(await preview.arrayBuffer()));
}
console.log((await wb.inspect({kind:'region',sheetId:'Summary',range:'A5:B13',maxChars:1500})).ndjson);
