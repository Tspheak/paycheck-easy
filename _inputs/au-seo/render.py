from playwright.sync_api import sync_playwright
from PIL import Image
import glob
D='/workspace/paycheck-pocket/au-seo/'
names=['au-pay-calculator','au-weekly-pay','au-fortnightly-pay','au-hecs-help','au-super']
with sync_playwright() as p:
    b=p.chromium.launch()
    for n in names:
        for tag,vp,sc in (('phone',390,2),('laptop',1440,1)):
            pg=b.new_page(viewport={'width':vp,'height':900},device_scale_factor=sc)
            pg.goto('file://'+D+n+'.html'); pg.wait_for_load_state('networkidle')
            print(n,tag,'scrollW',pg.evaluate('document.documentElement.scrollWidth'))
            pg.screenshot(path=f'{D}{n}-{tag}.png',full_page=True); pg.close()
    b.close()
# contact sheet
ims=[]
for n in names:
    L=Image.open(D+n+'-laptop.png'); P=Image.open(D+n+'-phone.png')
    L=L.resize((480,int(L.height*480/L.width))); P=P.resize((150,int(P.height*150/P.width))); ims.append((L,P))
H=max(max(l.height,p.height) for l,p in ims)
sheet=Image.new('RGB',(5*660+20,H+40),'#F3F7F5')
for i,(l,p) in enumerate(ims):
    x=20+i*660; sheet.paste(l,(x,20)); sheet.paste(p,(x+490,20))
sheet.save(D+'overview.png'); print(sheet.size)
