const defaults={level:'max',autoConfirm:true,legitimateInterest:true,notifications:false,localHistory:true,disabledHosts:[]};
const ids=['level','autoConfirm','legitimateInterest','notifications','localHistory'];
let settings=defaults;
async function init(){
  const stored=await chrome.storage.local.get(['settings','history']);
  settings={...defaults,...stored.settings};
  for(const id of ids){const el=document.getElementById(id); if(el.type==='checkbox')el.checked=!!settings[id]; else el.value=settings[id];
    el.addEventListener('change',async()=>{settings[id]=el.type==='checkbox'?el.checked:el.value;await chrome.storage.local.set({settings});document.getElementById('status').textContent='Zapisano ustawienia';});}
  render(stored.history || []);
}
function render(history){const ul=document.getElementById('history');ul.replaceChildren();
  if(!history.length){const li=document.createElement('li');li.textContent='Brak zapisanych działań';ul.append(li);return}
  for(const h of history.slice(0,15)){const li=document.createElement('li');li.textContent=`${h.host} · ${h.status} (${h.adapter})`;ul.append(li)}
}
document.getElementById('clear').addEventListener('click',async()=>{await chrome.storage.local.set({history:[]});render([])});
init();
