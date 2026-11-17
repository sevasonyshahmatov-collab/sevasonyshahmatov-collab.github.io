import json,os,re,subprocess,sys
sys.path.insert(0,'/home/user/khl_probe')
from cut import cut
R='/home/user/sevasonyshahmatov-collab.github.io/draft/hockey/data/'
ids=set()
for f in ('plite_khl.json','lgp_khl.json','khl_players.json'):
    s=open(R+f,encoding='utf-8').read()
    ids|=set(re.findall(r'khl\.ru\\?/img\\?/teamplayers_db\\?/(\d+)\\?/(\d+)\.jpg',s))
print(len(ids),flush=True)
os.makedirs('all',exist_ok=True);ok={}
for n,(a,b) in enumerate(sorted(ids)):
    src=f'all/{a}_{b}.jpg';dst=R+f'kph/{a}_{b}.webp'
    if not os.path.exists(dst):
        for s in ('360','320'):
            c=subprocess.run(['curl','-sS','-m','25','-A','Mozilla/5.0','-o',src,'-w','%{http_code}',f'https://img.khl.ru/teamplayers/{a}/{b}/{s}.jpg'],capture_output=True,text=True).stdout
            if c=='200':break
        else:
            print('miss',a,b,c,flush=True);continue
        try:cut(src).save(dst,quality=86,method=6)
        except Exception as e:print('err',a,b,e,flush=True);continue
    ok[f'{a}_{b}']=1
    if n%50==0:print(n,flush=True)
json.dump(ok,open(R+'kph/index.json','w'),separators=(',',':'))
open(R+'kph/index.js','w').write('window.JV_KPH_IDX='+json.dumps(ok,separators=(',',':'))+';')
print('done',len(ok))
