import sys,io,numpy as np
from PIL import Image,ImageFilter
from rembg import remove,new_session
S=new_session('isnet-general-use')
def cut(src):
    im=Image.open(src).convert('RGB')
    a=remove(im,session=S,only_mask=True).convert('L')
    A=np.asarray(a).astype(np.float32)/255
    # лёгкое сжатие маски внутрь: убираем белую кайму
    A=np.asarray(Image.fromarray((A*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))).astype(np.float32)/255
    A=np.clip((A-.12)/.80,0,1)
    C=np.asarray(im).astype(np.float32)
    # убрать примесь белого фона из полупрозрачных пикселей: obs=a*F+(1-a)*255
    a3=np.maximum(A,.08)[...,None]
    F=np.clip((C-(1-a3)*255)/a3,0,255)
    m=(A[...,None]<.98)
    C=np.where(m,F,C)
    out=np.dstack([C,A*255]).astype(np.uint8)
    return Image.fromarray(out,'RGBA')
if __name__=='__main__':
    for f in sys.argv[1:]:
        o=cut(f);o.save(f.replace('src/','out/').replace('.jpg','.webp'),quality=88,method=6)
