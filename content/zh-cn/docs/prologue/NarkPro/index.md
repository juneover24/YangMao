---
title: "安装NarkPro"
description: "安装NarkPro"
lead: "安装NarkPro"
date: 2020-11-16T13:59:39+01:00
lastmod: 2020-11-16T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 20
toc: true
---

## 准备

如果你还未进入[NarkPro群组](https://t.me/NolanNark) 请前往群组获取门票。

授权 找 @NolanNarkbot  点击start

群里先发送

```bash
/narksq@NolanNarkbot
```

再发送

```bash
/check@NolanNarkbot
```

再找 @NolanNarkbot拿到授权

{{% notice info %}}
请保护好自己的许可。不要外传
许可与TG绑定！！！！！
{{% /notice %}}

## 安装NarkPro

如果你已经安装了docker

```bash
sudo docker run -id \
--name pro -p 5016:5016 \
-v /opt/NarkPro:/app/Data \
-e Prolic=第2步获取的Proid \
-e User=自定义管理帐号 \
-e Pwd=自定义管理密码(八位以上包含大小写字母、数字或特殊字符) \
-e ServerProxy=这里填写反代地址 \
--restart=always \
--privileged=true \
nolanhzy/pro:latest
```

反代地址

```bash
https://naizi.lolkda.top
```

```bash
http://ark.yanyuwangluo.cn:1200
```

```bash
http://ark.jdddns.tk
```

### 登陆

管理员路径： http://127.0.0.1:5016/#/admin  进入管理界面

### 配置页面

进入配置页面，修改管理员账号密码，填写RabbitToken，修改对应配置

### ServerHost

可用ServerHost（选择能用的即可）:

```bash
log.madrabbit.eu.org
```

```bash
62.204.54.137:4566 
```

(雪老板提供)

```bash
mr.yanyuwangluo.cn:1202
```

 (烟雨提供)

### 转换Cron

转换Cron(每4个小时一次)，请打开右侧按钮再修改！！！！

```bash
0 */4 * * *
```

### 同步CK

同步CK(每2个小时一次)，请打开右侧按钮再修改！！！！

```bash
0 */2 * * *
```

### WXPUSHER_APP_TOKEN

WXPUSHER_APP_TOKEN

全局配置的WxPusher:[https://wxpusher.zjiecode.com/admin/main/app/appToken](https://t.me/RabbitOneA)

### WXPUSHER_UID

WXPUSHER_UID

全局配置的WXuuid:[https://wxpusher.zjiecode.com/admin/main/app/appFollow](https://t.me/RabbitOneA) 微信扫码 然后在微信找

### 容器管理中的WxPusher

WxPusher

全局配置的WxPusher:[https://wxpusher.zjiecode.com/admin/main/app/appToken](https://t.me/RabbitOneA)
