import sys, zipfile, re, shutil
src=sys.argv[1]; tmp=src+'.tmp'
zin=zipfile.ZipFile(src); zout=zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED)
cnt={}
pat=re.compile(r'<w:r><w:fldChar w:fldCharType="begin"[^/]*/><w:instrText xml:space="preserve">SEQ (\w+)</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r>')
def rep(m):
    lab=m.group(1); cnt[lab]=cnt.get(lab,0)+1; n=cnt[lab]
    b='<w:rPr><w:b/><w:bCs/></w:rPr>'
    return (f'<w:r>{b}<w:fldChar w:fldCharType="begin"/></w:r><w:r>{b}<w:instrText xml:space="preserve"> SEQ {lab} \* ARABIC </w:instrText></w:r>'
            f'<w:r>{b}<w:fldChar w:fldCharType="separate"/></w:r><w:r>{b}<w:t>{n}</w:t></w:r><w:r>{b}<w:fldChar w:fldCharType="end"/></w:r>')
for it in zin.infolist():
    data=zin.read(it.filename)
    if it.filename=='word/document.xml':
        data=pat.sub(rep,data.decode('utf-8')).encode('utf-8')
    zout.writestr(it,data)
zout.close(); zin.close(); shutil.move(tmp,src); print(cnt)
