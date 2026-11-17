import sys,os,glob,numpy as np
from PIL import Image,ImageFilter
from rembg import remove,new_session
A=new_session('isnet-general-use');B=new_session('u2net_human_seg')
def cut(src):
    im=Image.open(src).convert('RGB');w,h=im.size
    ma=np.asarray(remove(im,session=A,only_mask=True).convert('L')).astype(np.float32)
    mb=np.asarray(remove(im,session=B,only_mask=True).convert('L')).astype(np.float32)
    # объединение: isnet точнее по волосам, human_seg не теряет белую форму на белом фоне (берём его только ниже подбородка — в нижних 45 %)
    yy=np.linspace(0,1,h)[:,None];wb=np.clip((yy-.50)/.10,0,1)
    m=np.maximum(ma,mb*wb)
    M=Image.fromarray(m.astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    Al=np.clip((np.asarray(M).astype(np.float32)/255-.12)/.80,0,1)
    C=np.asarray(im).astype(np.float32);a3=np.maximum(Al,.08)[...,None]
    F=np.clip((C-(1-a3)*255)/a3,0,255);C=np.where(Al[...,None]<.98,F,C)
    # плечи уходят за рамку фото: по бокам плавно растворяем (иначе видна прямая вертикальная обрезка)
    x=np.linspace(0,1,w)[None,:];ramp=np.clip(np.minimum(x,1-x)/.13,0,1);ramp=ramp*ramp*(3-2*ramp)
    Al=Al*ramp
    return Image.fromarray(np.dstack([C,Al*255]).astype(np.uint8),'RGBA')
if __name__=='__main__':
    k,n=int(sys.argv[1]),int(sys.argv[2]);R='/home/user/sevasonyshahmatov-collab.github.io/draft/hockey/data/kph/'
    ids=sorted(f[:-5] for f in os.listdir(R) if f.endswith('.webp'))
    for i,d in enumerate(ids):
        if i%n!=k:continue
        s=[p for p in (f'all/{d}.jpg',f'all/r_{d}.jpg') if os.path.exists(p) and os.path.getsize(p)>2000]
        if not s:print('nosrc',d,flush=True);continue
        try:cut(s[0]).save(R+d+'.webp',quality=86,method=6)
        except Exception as e:print('err',d,e,flush=True)
    print('done',k)
