var superagent = require('superagent');
let fs = require('fs');
async function request(
  url,
  method,
  params,
  data,
  header = {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    Host: 'tieba.baidu.com',
    Referer: 'http://tieba.baidu.com/i/i/my_reply',
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
    Cookie:
      'TIEBAUID=dcc2ac800571594551dd48c7; TIEBA_USERTYPE=16f2e80dcd2029986c894073; BAIDUID=AD6781581D34263BD39A6C551826B981:FG=1; BIDUPSID=AD6781581D34263BD39A6C551826B981; PSTM=1586229129; UUAP_P_TOKEN=PT-460089515812048897-a5cupsduha-uuap; BSG_B_TOKEN=Qyp4NgtRopU6DGlFT0atQy95xK8f3pwyPcJQ69BrzTYpJVzsXZ4VcvMYRUKcAtkIKAx4MORrRmdSwhkefEq4j6u8NdIaUvW/a54sOgksjxE=; BDUSS=VSS3I4cnNtN0piVU5idTdVdHQxd3hkUjh2cThqZ0U0bWpXaU04c1hvc3dHc2xlSVFBQUFBJCQAAAAAAAAAAAEAAAAa19taUTEyNzczNDE5NzkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCNoV4wjaFedT; STOKEN=c038a3cd612ccc05c1052ba9bca3e8e046b07b6c88f48243c306fc4da7bd9432; bdshare_firstime=1587970408079; delPer=0; st_key_id=17; beecap_prod=201vijjdqdvrtjp3d3g7pjopa2; noah_magic_user_name=wangzhijun_cd; USER_NOAH=wangzhijun_cd; NOAH_VERSION=1; EXPIRE_NOAH=1588730876; SIG_NOAH=cb8c90037ce2e36f21fbc46fde947cef; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; wise_device=0; Hm_lvt_98b9d8c2fd6608d564bf2ac2ae642948=1587969797,1587970409,1588041203,1588140978; 1524356890_FRSVideoUploadTip=1; BDRCVFR[crKvfqdHttR]=mbxnW11j9Dfmh7GuZR8mvqV; st_data=da636b31bde3d32213db9f72d1874a951a0e25a27196176314b2c54d4873746facc9341b814ea1bd876e9b3b30aa6b3a8631925397f74b3890127f0dcadd534b685fbc99e6892058333d4854645bda24ade97d5b874095a81e36041a201f61c9d29ac5e952d973d94f650c66889f00f9ef0e5c7dec3483e33f52d5561b228673844c554d62754efb5e6a85cdb51f776f; st_sign=0ac02921; MCITY=-%3A; PSINO=5; H_PS_PSSID=1462_31123_21108_31424_31342_30903_31271_31464_31228_30823_31163_31475; RT="z=1&dm=baidu.com&si=w19rnr393ig&ss=k9kwdpyh&sl=1b&tt=6rx&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=870kj"; Hm_lpvt_98b9d8c2fd6608d564bf2ac2ae642948=1588151905',
  }
) {
  return superagent(method, url).query(params).send(data).set(header);
}
module.exports = {
  request,
};
